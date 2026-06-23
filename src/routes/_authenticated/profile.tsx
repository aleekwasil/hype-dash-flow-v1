import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Shield, LogOut } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, updateProfile, isAdmin } from "@/lib/profile.functions";
import { hasPin } from "@/lib/pin.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — HypeData" }] }),
  component: Profile,
});

function Profile() {
  const g = useServerFn(getProfile);
  const u = useServerFn(updateProfile);
  const h = useServerFn(hasPin);
  const a = useServerFn(isAdmin);

  const profile = useQuery({ queryKey: ["profile"], queryFn: () => g() });
  const pin = useQuery({ queryKey: ["hasPin"], queryFn: () => h() });
  const admin = useQuery({ queryKey: ["isAdmin"], queryFn: () => a() });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (profile.data) {
      setFullName(profile.data.full_name ?? "");
      setPhone(profile.data.phone ?? "");
    }
  }, [profile.data]);

  const mutation = useMutation({
    mutationFn: () => u({ data: { full_name: fullName, phone } }),
    onSuccess: () => toast.success("Profile updated"),
    onError: (e: any) => toast.error(e?.message ?? "Update failed"),
  });

  return (
    <AppShell title="Profile">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-5">
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={profile.data?.email ?? ""} disabled />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? "Saving…" : "Save changes"}
        </Button>
      </form>

      <div className="mt-6 space-y-2">
        <Link to="/pin" className="flex items-center justify-between rounded-xl border border-border/50 bg-card/50 p-4">
          <div>
            <p className="font-medium">Transaction PIN</p>
            <p className="text-xs text-muted-foreground">{pin.data?.hasPin ? "Change your 4-digit PIN" : "Set your 4-digit PIN"}</p>
          </div>
          <span className="text-xs text-primary">{pin.data?.hasPin ? "Change" : "Set up"} →</span>
        </Link>

        {admin.data?.isAdmin && (
          <div className="rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm">
            <p className="font-medium text-accent">Admin access</p>
            <p className="text-xs text-muted-foreground">You have admin privileges. Admin dashboard coming soon.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
