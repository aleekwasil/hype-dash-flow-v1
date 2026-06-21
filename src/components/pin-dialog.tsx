import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";

export function PinDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Enter transaction PIN",
  description = "Confirm with your 4-digit PIN.",
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (pin: string) => void;
  title?: string;
  description?: string;
  loading?: boolean;
}) {
  const [pin, setPin] = useState("");
  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setPin(""); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <InputOTP maxLength={4} value={pin} onChange={setPin} pattern="^\d+$">
            <InputOTPGroup>
              {[0, 1, 2, 3].map((i) => <InputOTPSlot key={i} index={i} className="h-12 w-12 text-xl" />)}
            </InputOTPGroup>
          </InputOTP>
          <Button
            className="w-full"
            disabled={pin.length !== 4 || loading}
            onClick={() => onConfirm(pin)}
          >
            {loading ? "Processing…" : "Confirm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
