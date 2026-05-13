import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/lisboa-capital-logo.png";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, signIn, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupMode, setSignupMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (signupMode) {
        const { supabase } = await import("@/integrations/supabase/client");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) toast.error(error.message);
        else toast.success("Conta criada. Você já pode entrar.");
        setSignupMode(false);
      } else {
        const { error } = await signIn(email, password);
        if (error) toast.error(error);
        else navigate({ to: "/dashboard" });
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
          <p className="text-xs tracking-[0.3em] text-primary/80 mt-2 font-serif">
            CONNECTING STRENGTH · STRUCTURING GROWTH
          </p>
        </div>
        <div className="bg-card/80 backdrop-blur-xl border rounded-xl p-8 shadow-2xl">
          <h1 className="text-2xl font-serif text-center mb-6">
            {signupMode ? "Criar conta" : "Acesso restrito"}
          </h1>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
              {submitting ? "Aguarde…" : signupMode ? "Criar conta" : "Entrar"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setSignupMode((s) => !s)}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              {signupMode ? "Já tem conta? Entrar" : "Primeiro acesso? Criar conta"}
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          O primeiro usuário cadastrado se torna Master automaticamente.
        </p>
      </div>
    </div>
  );
}
