
-- ============================================================
-- HypeData — initial schema
-- ============================================================

-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        public.app_role NOT NULL DEFAULT 'user',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Promote helper (run from SQL editor: SELECT public.promote_to_admin('you@example.com');)
CREATE OR REPLACE FUNCTION public.promote_to_admin(_email TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE _uid UUID;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE email = _email;
  IF _uid IS NULL THEN RAISE EXCEPTION 'No user with email %', _email; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
END $$;

-- ============================================================
-- Profiles
-- ============================================================
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  phone       TEXT,
  email       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- Wallets
-- ============================================================
CREATE TABLE public.wallets (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance     NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency    TEXT NOT NULL DEFAULT 'NGN',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own wallet" ON public.wallets FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- PINs (hashed)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.user_pins (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash         TEXT NOT NULL,
  failed_attempts  INT  NOT NULL DEFAULT 0,
  locked_until     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_pins TO authenticated;
GRANT ALL ON public.user_pins TO service_role;
ALTER TABLE public.user_pins ENABLE ROW LEVEL SECURITY;
-- read access only via server functions; SELECT policy lets client check pin_set state
CREATE POLICY "read own pin meta" ON public.user_pins FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- Transactions
-- ============================================================
CREATE TYPE public.txn_type   AS ENUM ('airtime','data','wallet_funding','refund','adjustment');
CREATE TYPE public.txn_status AS ENUM ('pending','success','failed','reversed');

CREATE TABLE public.transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            public.txn_type NOT NULL,
  status          public.txn_status NOT NULL DEFAULT 'pending',
  amount          NUMERIC(14,2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'NGN',
  reference       TEXT UNIQUE NOT NULL,
  provider        TEXT,                       -- 'vtpass','paystack','manual'
  provider_ref    TEXT,
  network         TEXT,                       -- mtn,glo,airtel,9mobile
  recipient       TEXT,                       -- phone number for airtime/data
  plan_code       TEXT,                       -- VTpass variation_code
  plan_label      TEXT,
  meta            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX transactions_user_created_idx ON public.transactions (user_id, created_at DESC);
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own txns" ON public.transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- VTpass request logs (admin debugging)
-- ============================================================
CREATE TABLE public.vtpass_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint      TEXT NOT NULL,
  request_body  JSONB,
  response_body JSONB,
  http_status   INT,
  reference     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vtpass_logs TO authenticated;
GRANT ALL  ON public.vtpass_logs TO service_role;
ALTER TABLE public.vtpass_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read vtpass logs" ON public.vtpass_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- Paystack funding intents (idempotent webhook target)
-- ============================================================
CREATE TABLE public.funding_intents (
  reference     TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount        NUMERIC(14,2) NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending|success|failed
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ
);
GRANT SELECT ON public.funding_intents TO authenticated;
GRANT ALL ON public.funding_intents TO service_role;
ALTER TABLE public.funding_intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own intents" ON public.funding_intents FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- Wallet credit / debit RPCs (atomic, used by server functions)
-- ============================================================
CREATE OR REPLACE FUNCTION public.credit_wallet(_user_id UUID, _amount NUMERIC)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _new NUMERIC;
BEGIN
  IF _amount <= 0 THEN RAISE EXCEPTION 'amount must be > 0'; END IF;
  INSERT INTO public.wallets (user_id, balance) VALUES (_user_id, _amount)
    ON CONFLICT (user_id) DO UPDATE SET balance = wallets.balance + EXCLUDED.balance, updated_at = now()
  RETURNING balance INTO _new;
  RETURN _new;
END $$;

CREATE OR REPLACE FUNCTION public.debit_wallet(_user_id UUID, _amount NUMERIC)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _new NUMERIC;
BEGIN
  IF _amount <= 0 THEN RAISE EXCEPTION 'amount must be > 0'; END IF;
  UPDATE public.wallets SET balance = balance - _amount, updated_at = now()
    WHERE user_id = _user_id AND balance >= _amount
    RETURNING balance INTO _new;
  IF _new IS NULL THEN RAISE EXCEPTION 'insufficient_balance'; END IF;
  RETURN _new;
END $$;

-- ============================================================
-- New-user trigger: create profile, wallet, default role
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (NEW.id, NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
          NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.wallets (user_id, balance) VALUES (NEW.id, 0)
    ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER user_pins_set_updated_at BEFORE UPDATE ON public.user_pins
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER transactions_set_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
