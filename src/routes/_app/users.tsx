import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/users")({
  component: UsersPage,
});

function UsersPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const { data: users = [] } = useQuery({
    queryKey: ["users-all"],
    queryFn: async () => (await supabase.from("user_profiles").select("*, partners(nome)")).data ?? [],
  });
  const { data: partners = [] } = useQuery({
    queryKey: ["partners-select"],
    queryFn: async () => (await supabase.from("partners").select("id,nome")).data ?? [],
  });
  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      const { error } = await supabase.from("user_profiles").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users-all"] }); toast.success("Atualizado"); },
    onError: (e: any) => toast.error(e.message),
  });

  if (profile?.tipo_usuario !== "master") {
    return <div className="p-8 text-center text-muted-foreground">Acesso restrito ao Master.</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-serif">Usuários</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestão de acesso · novos usuários se cadastram pela tela de login</p>
      </div>
      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="px-5 py-3">Nome</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Tipo</th>
              <th className="px-5 py-3">Parceiro</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-b border-border last:border-0">
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
