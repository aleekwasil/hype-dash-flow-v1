
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.promote_to_admin(TEXT)         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.credit_wallet(UUID, NUMERIC)   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.debit_wallet(UUID, NUMERIC)    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at()            FROM PUBLIC, anon, authenticated;
