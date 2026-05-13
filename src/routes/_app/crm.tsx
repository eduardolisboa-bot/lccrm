import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KanbanBoard } from "@/components/crm/KanbanBoard";
import { OpportunityDrawer } from "@/components/crm/OpportunityDrawer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/crm")({
  component: CrmPage,
});

function CrmPage() {
  const [oppId, setOppId] = useState<string | null>(null);
  const [tab, setTab] = useState("todos");

  return (
    <div className="p-8 space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-serif">CRM Kanban</h1>
          <p className="text-sm text-muted-foreground mt-1">Pipeline completo de oportunidades</p>
        </div>
        <NewOpportunityButton />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="diretos">Diretos</TabsTrigger>
          <TabsTrigger value="parceiros">Por Parceiro</TabsTrigger>
        </TabsList>
        <TabsContent value="todos" className="mt-4">
          <KanbanBoard onCardClick={setOppId} />
        </TabsContent>
        <TabsContent value="diretos" className="mt-4">
          <KanbanBoard filters={{ origem: "direto" }} onCardClick={setOppId} />
        </TabsContent>
        <TabsContent value="parceiros" className="mt-4">
          <KanbanBoard filters={{ origem: "parceiro" }} onCardClick={setOppId} />
        </TabsContent>
      </Tabs>

      <OpportunityDrawer oppId={oppId} open={!!oppId} onClose={() => setOppId(null)} />
    </div>
  );
}

function NewOpportunityButton() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [valor, setValor] = useState("");
  const [produto, setProduto] = useState("");
  const [origem, setOrigem] = useState<"direto" | "parceiro">("direto");
  const [parceiroId, setParceiroId] = useState("");
  const [temperatura, setTemperatura] = useState<"frio" | "morno" | "quente">("morno");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-select"],
    queryFn: async () => (await supabase.from("clients").select("id,nome,parceiro_id,tipo_cliente")).data ?? [],
    enabled: open,
  });
  const { data: partners = [] } = useQuery({
    queryKey: ["partners-select"],
    queryFn: async () => (await supabase.from("partners").select("id,nome").eq("status", "ativo")).data ?? [],
    enabled: open,
  });
  const { data: stages = [] } = useQuery({
    queryKey: ["stages-first"],
    queryFn: async () => (await supabase.from("pipeline_stages").select("id").eq("ativa", true).order("ordem").limit(1)).data ?? [],
    enabled: open,
  });

  const create = useMutation({
    mutationFn: async () => {
      const firstStage = stages[0]?.id;
      const { error } = await supabase.from("opportunities").insert({
        titulo,
        cliente_id: clienteId || null,
        parceiro_id: origem === "parceiro" ? parceiroId || null : null,
        valor_estimado: Number(valor) || 0,
        produto_interesse: produto,
        etapa_id: firstStage,
        origem,
        temperatura,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opps"] });
      qc.invalidateQueries({ queryKey: ["opps-all"] });
      toast.success("Oportunidade criada");
      setOpen(false);
      setTitulo(""); setClienteId(""); setValor(""); setProduto(""); setParceiroId("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="w-4 h-4 mr-1" /> Nova Oportunidade</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-serif">Nova Oportunidade</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Título</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} /></div>
          <div>
            <Label>Cliente</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Valor (R$)</Label><Input type="number" value={valor} onChange={(e) => setValor(e.target.value)} /></div>
            <div><Label>Produto</Label><Input value={produto} onChange={(e) => setProduto(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Origem</Label>
              <Select value={origem} onValueChange={(v: any) => setOrigem(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="direto">Direto</SelectItem>
                  <SelectItem value="parceiro">Via Parceiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Temperatura</Label>
              <Select value={temperatura} onValueChange={(v: any) => setTemperatura(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="frio">Frio</SelectItem>
                  <SelectItem value="morno">Morno</SelectItem>
                  <SelectItem value="quente">Quente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {origem === "parceiro" && (
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
          <Button onClick={() => create.mutate()} disabled={!titulo} className="w-full">Criar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
