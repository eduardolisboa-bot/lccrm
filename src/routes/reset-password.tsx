import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/lisboa-capital-logo.png";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Aguarda Supabase processar o token de recuperação no hash da URL
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("A senha deve ter pelo menos 8 caracteres.");
    if (password !== confirm) return toast.error("As senhas não conferem.");
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) toast.error(error.message);
      else {
        toast.success("Senha atualizada. Entre novamente.");
        await supabase.auth.signOut();
        navigate({ to: "/login" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-noise flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Lisboa Capital" className="w-32 h-32 object-contain" />
        </div>
        <div className="bg-card/80 backdrop-blur-xl border rounded-xl p-8 shadow-2xl">
          <h1 className="text-2xl font-serif text-center mb-6">Definir nova senha</h1>
          {!ready ? (
            <p className="text-sm text-muted-foreground text-center">
              Validando link de redefinição… Se nada acontecer, solicite um novo link na tela de login.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">Nova senha</Label>
                <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="confirm">Confirmar senha</Label>
                <Input id="confirm" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1" />
              </div>
              <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
                {submitting ? "Salvando…" : "Salvar nova senha"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
