import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { hasPin, setPin, changePin } from "@/lib/pin.functions";

export const Route = createFileRoute("/_authenticated/pin")({
  head: () => ({ meta: [{ title: "Transaction PIN — HypeData" }] }),
  component: PinPage,
});

function PinPage() {
  const qc = useQueryClient();
  const h = useServerFn(hasPin);
  const s = useServerFn(setPin);
  const c = useServerFn(changePin);
  const pin = useQuery({ queryKey: ["hasPin"], queryFn: () => h() });

  const [oldPin, setOld] = useState("");
  const [newPin, setNew] = useState("");
  const [confirm, setConfirm] = useState("");

  const setMut = useMutation({
    mutationFn: () => s({ data: { pin: newPin } }),
    onSuccess: () => {
      toast.success("PIN set successfully");
      qc.invalidateQueries({ queryKey: ["hasPin"] });
      setNew(""); setConfirm("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const chgMut = useMutation({
    mutationFn: () => c({ data: { oldPin, newPin } }),
    onSuccess: () => {
      toast.success("PIN changed successfully");
      setOld(""); setNew(""); setConfirm("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const hasIt = pin.data?.hasPin;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newPin.length !== 4) return toast.error("Enter 4-digit PIN");
    if (newPin !== confirm) return toast.error("PINs do not match");
    if (hasIt) {
      if (oldPin.length !== 4) return toast.error("Enter your current PIN");
      chgMut.mutate();
    } else {
      setMut.mutate();
    }
  }

  return (
    <AppShell title="Transaction PIN">
      <form onSubmit={submit} className="space-y-6">
        {hasIt && (
          <div>
            <p className="mb-2 text-sm font-medium">Current PIN</p>
            <InputOTP maxLength={4} value={oldPin} onChange={setOld} pattern="^\d+$">
              <InputOTPGroup>{[0,1,2,3].map(i => <InputOTPSlot key={i} index={i} className="h-12 w-12 text-xl" />)}</InputOTPGroup>
            </InputOTP>
          </div>
        )}
        <div>
          <p className="mb-2 text-sm font-medium">{hasIt ? "New PIN" : "New 4-digit PIN"}</p>
          <InputOTP maxLength={4} value={newPin} onChange={setNew} pattern="^\d+$">
            <InputOTPGroup>{[0,1,2,3].map(i => <InputOTPSlot key={i} index={i} className="h-12 w-12 text-xl" />)}</InputOTPGroup>
          </InputOTP>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Confirm PIN</p>
          <InputOTP maxLength={4} value={confirm} onChange={setConfirm} pattern="^\d+$">
            <InputOTPGroup>{[0,1,2,3].map(i => <InputOTPSlot key={i} index={i} className="h-12 w-12 text-xl" />)}</InputOTPGroup>
          </InputOTP>
        </div>
        <Button type="submit" disabled={setMut.isPending || chgMut.isPending} className="w-full bg-gradient-primary shadow-glow">
          {hasIt ? "Change PIN" : "Set PIN"}
        </Button>
      </form>
    </AppShell>
  );
}
