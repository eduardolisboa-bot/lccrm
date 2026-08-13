import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTenantClient } from "@/lib/supabaseClients";
import { getTenant, type TenantId } from "@/tenants/config";
import { useTenant } from "@/lib/tenant-context";

export function TenantLoginDialog({
  tenantId,
  onClose,
  onSuccess,
}: {
  tenantId: TenantId;
  onClose: () => void;
  onSuccess: (id: TenantId) => void;
}) {
  const tenant = getTenant(tenantId);
  const { refreshAvailability } = useTenant();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await getTenantClient(tenantId).auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        return;
      }
      await refreshAvailability();
      onSuccess(tenantId);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center gap-3">
          <img src={tenant.branding.logoDark} alt="" className="h-8 w-8 object-contain" />
          <div className="font-serif text-lg">Entrar em {tenant.name}</div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="t-email">E-mail</Label>
            <Input id="t-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="t-pass">Senha</Label>
            <Input id="t-pass" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Aguarde…" : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
