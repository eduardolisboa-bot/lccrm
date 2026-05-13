import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/users")({
  component: UsersPage,
});

function UsersPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ["users-all"],
    queryFn: async () => (await supabase.from("user_profiles").select("*, partners(nome)").order("created_at")).data ?? [],
  });
  const { data: partners = [] } = useQuery({
    queryKey: ["partners-select"],
    queryFn: async () => (await supabase.from("partners").select("id,nome")).data ?? [],
  });
  const { data: funnels = [] } = useQuery({
    queryKey: ["funnels-all-settings"],
    queryFn: async () => (await supabase.from("funnels").select("*").order("ordem")).data ?? [],
  });
  const { data: access = [] } = useQuery({
    queryKey: ["user-funnel-access-all"],
    queryFn: async () => (await supabase.from("user_funnel_access").select("*")).data ?? [],
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      const { error } = await supabase.from("user_profiles").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users-all"] }); toast.success("Atualizado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const setAccess = useMutation({
    mutationFn: async ({ userId, funnelId, on }: { userId: string; funnelId: string; on: boolean }) => {
      if (on) {
        const { error } = await supabase.from("user_funnel_access").insert({ user_profile_id: userId, funnel_id: funnelId });
        if (error && !error.message.includes("duplicate")) throw error;
      } else {
        const { error } = await supabase.from("user_funnel_access").delete().eq("user_profile_id", userId).eq("funnel_id", funnelId);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-funnel-access-all"] }),
    onError: (e: any) => toast.error(e.message),
  });

  if (profile?.tipo_usuario !== "master") {
    return <div className="p-8 text-center text-muted-foreground">Acesso restrito ao Master.</div>;
  }

  const userAccessFor = (uid: string, fid: string) => access.some((a: any) => a.user_profile_id === uid && a.funnel_id === fid);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-serif">Usuários</h1>
          <p className="text-sm text-muted-foreground mt-1">Apenas o Master pode criar e gerenciar acessos</p>
        </div>
        <NewUserDialog funnels={funnels} />
      </div>

      <div className="bg-card border rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="px-5 py-3">Nome</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Tipo</th>
              <th className="px-5 py-3">Parceiro</th>
              <th className="px-5 py-3">Funis acessíveis</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-b border-border last:border-0 align-top">
                <td className="px-5 py-3">{u.nome}</td>
                <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-5 py-3">
                  <Select value={u.tipo_usuario} onValueChange={(v) => update.mutate({ id: u.id, patch: { tipo_usuario: v } })}>
                    <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="master">Master</SelectItem>
                      <SelectItem value="interno">Interno</SelectItem>
                      <SelectItem value="parceiro">Parceiro</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-5 py-3">
                  <Select value={u.parceiro_id ?? ""} onValueChange={(v) => update.mutate({ id: u.id, patch: { parceiro_id: v || null } })}>
                    <SelectTrigger className="h-8 w-44"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {partners.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-5 py-3">
                  {u.tipo_usuario === "master" ? (
                    <span className="text-xs text-muted-foreground">Acesso total</span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {funnels.map((f: any) => (
                        <label key={f.id} className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <Checkbox
                            checked={userAccessFor(u.id, f.id)}
                            onCheckedChange={(c) => setAccess.mutate({ userId: u.id, funnelId: f.id, on: !!c })}
                          />
                          <span style={{ color: f.cor }}>●</span> {f.nome}
                        </label>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3">
                  <Select value={u.status} onValueChange={(v) => update.mutate({ id: u.id, patch: { status: v } })}>
                    <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewUserDialog({ funnels }: { funnels: any[] }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tipo, setTipo] = useState<"master" | "interno" | "parceiro">("interno");
  const [parceiroId, setParceiroId] = useState("");
  const [selectedFunnels, setSelectedFunnels] = useState<string[]>([]);

  const { data: partners = [] } = useQuery({
    queryKey: ["partners-select"],
    queryFn: async () => (await supabase.from("partners").select("id,nome")).data ?? [],
    enabled: open,
  });

  const create = useMutation({
    mutationFn: async () => {
      // Cria via signUp do Auth — o trigger handle_new_auth_user cria o user_profile
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { nome }, emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      const authUser = data.user;
      if (!authUser) throw new Error("Falha ao criar usuário");

      // Aguarda o trigger criar o profile e então atualiza tipo + parceiro + acessos
      let profileId: string | null = null;
      for (let i = 0; i < 10; i++) {
        const { data: p } = await supabase.from("user_profiles").select("id").eq("auth_user_id", authUser.id).maybeSingle();
        if (p) { profileId = p.id; break; }
        await new Promise((r) => setTimeout(r, 300));
      }
      if (!profileId) throw new Error("Profile não foi criado");

      const { error: e2 } = await supabase.from("user_profiles").update({
        nome,
        tipo_usuario: tipo,
        parceiro_id: tipo === "parceiro" ? parceiroId || null : null,
      }).eq("id", profileId);
      if (e2) throw e2;

      if (tipo !== "master" && selectedFunnels.length) {
        const rows = selectedFunnels.map((fid) => ({ user_profile_id: profileId!, funnel_id: fid }));
        const { error: e3 } = await supabase.from("user_funnel_access").insert(rows);
        if (e3) throw e3;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users-all"] });
      qc.invalidateQueries({ queryKey: ["user-funnel-access-all"] });
      toast.success("Usuário criado. Senha enviada por e-mail se necessário.");
      setOpen(false);
      setNome(""); setEmail(""); setPassword(""); setTipo("interno"); setParceiroId(""); setSelectedFunnels([]);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleFunnel = (id: string) => setSelectedFunnels((arr) => arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="w-4 h-4 mr-1" /> Novo usuário</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="font-serif">Novo usuário</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Senha temporária</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="master">Master</SelectItem>
                  <SelectItem value="interno">Interno</SelectItem>
                  <SelectItem value="parceiro">Parceiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {tipo === "parceiro" && (
              <div>
                <Label>Parceiro</Label>
                <Select value={parceiroId} onValueChange={setParceiroId}>
                  <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent>
                    {partners.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {tipo !== "master" && (
            <div>
              <Label className="mb-2 block">Funis que poderá acessar</Label>
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg">
                {funnels.map((f: any) => (
                  <label key={f.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={selectedFunnels.includes(f.id)} onCheckedChange={() => toggleFunnel(f.id)} />
                    <span style={{ color: f.cor }}>●</span> {f.nome}
                  </label>
                ))}
                {!funnels.length && <span className="text-xs text-muted-foreground">Nenhum funil cadastrado</span>}
              </div>
            </div>
          )}
          <Button className="w-full" disabled={!email || !password || !nome || (tipo === "parceiro" && !parceiroId)} onClick={() => create.mutate()}>
            Criar usuário
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
