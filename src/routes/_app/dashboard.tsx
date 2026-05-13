import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fmtBRL, fmtNum } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, CartesianGrid } from "recharts";
import { TrendingUp, Users, Handshake, Target, CheckCircle2, XCircle, UserCheck, Network } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function KpiCard({ label, value, icon: Icon, accent }: { label: string; value: string; icon: any; accent?: string }) {
  return (
    <div className="bg-card border rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className={`mt-2 text-2xl font-serif ${accent ?? ""}`}>{value}</div>
        </div>
        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { data: opps = [] } = useQuery({
    queryKey: ["opps-all"],
    queryFn: async () => {
      const { data } = await supabase.from("opportunities").select("*, pipeline_stages(nome,tipo,cor,ordem), partners(nome)");
      return data ?? [];
    },
  });
  const { data: partners = [] } = useQuery({
    queryKey: ["partners-all"],
    queryFn: async () => (await supabase.from("partners").select("*")).data ?? [],
  });
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-all"],
    queryFn: async () => (await supabase.from("clients").select("*")).data ?? [],
  });
  const { data: stages = [] } = useQuery({
    queryKey: ["stages-all"],
    queryFn: async () => (await supabase.from("pipeline_stages").select("*").order("ordem")).data ?? [],
  });

  const total = opps.length;
  const pipelineValue = opps.reduce((s: number, o: any) => s + Number(o.valor_estimado ?? 0), 0);
  const won = opps.filter((o: any) => o.pipeline_stages?.tipo === "ganha").length;
  const lost = opps.filter((o: any) => o.pipeline_stages?.tipo === "perdida").length;
  const conv = total > 0 ? (won / total) * 100 : 0;
  const activePartners = partners.filter((p: any) => p.status === "ativo").length;
  const directClients = clients.filter((c: any) => c.tipo_cliente === "direto").length;
  const partnerClients = clients.filter((c: any) => c.tipo_cliente === "parceiro").length;

  const funnel = stages.map((s: any) => {
    const list = opps.filter((o: any) => o.etapa_id === s.id);
    return { nome: s.nome, count: list.length, valor: list.reduce((sum: number, o: any) => sum + Number(o.valor_estimado ?? 0), 0), cor: s.cor };
  });

  const byPartner = partners
    .map((p: any) => {
      const ps = opps.filter((o: any) => o.parceiro_id === p.id);
      return { nome: p.nome, valor: ps.reduce((s: number, o: any) => s + Number(o.valor_estimado ?? 0), 0) };
    })
    .sort((a: any, b: any) => b.valor - a.valor)
    .slice(0, 5);

  const tempData = ["frio", "morno", "quente"].map((t) => ({
    name: t,
    value: opps.filter((o: any) => o.temperatura === t).length,
  }));
  const tempColors: Record<string, string> = { frio: "#3B82F6", morno: "#F59E0B", quente: "#EF4444" };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-serif">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão executiva da operação Lisboa Capital</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Oportunidades" value={fmtNum(total)} icon={Target} />
        <KpiCard label="Pipeline (R$)" value={fmtBRL(pipelineValue)} icon={TrendingUp} accent="gold-gradient-text" />
        <KpiCard label="Parceiros Ativos" value={fmtNum(activePartners)} icon={Handshake} />
        <KpiCard label="Conversão" value={`${conv.toFixed(1)}%`} icon={CheckCircle2} />
        <KpiCard label="Aprovados" value={fmtNum(won)} icon={CheckCircle2} accent="text-success" />
        <KpiCard label="Perdidos" value={fmtNum(lost)} icon={XCircle} accent="text-destructive" />
        <KpiCard label="Clientes Diretos" value={fmtNum(directClients)} icon={UserCheck} />
        <KpiCard label="Via Parceiros" value={fmtNum(partnerClients)} icon={Network} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-serif text-lg mb-4">Funil por Etapa</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={funnel} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" stroke="#8B949E" fontSize={11} />
              <YAxis type="category" dataKey="nome" stroke="#8B949E" fontSize={11} width={120} />
              <Tooltip contentStyle={{ background: "#1A1D24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {funnel.map((f: any, i) => <Cell key={i} fill={f.cor} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-serif text-lg mb-4">Top 5 Parceiros · Pipeline</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byPartner}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="nome" stroke="#8B949E" fontSize={11} />
              <YAxis stroke="#8B949E" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "#1A1D24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                formatter={(v: any) => fmtBRL(v as number)}
              />
              <Bar dataKey="valor" fill="#C9A84C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-serif text-lg mb-4">Distribuição por Temperatura</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={tempData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                {tempData.map((d, i) => <Cell key={i} fill={tempColors[d.name]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#1A1D24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            {tempData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: tempColors[d.name] }} />
                <span className="capitalize">{d.name}</span>
                <span>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-serif text-lg mb-4">Resumo Operacional</h3>
          <div className="space-y-3 text-sm">
            <Row label="Ticket médio" value={fmtBRL(total > 0 ? pipelineValue / total : 0)} />
            <Row label="Total de clientes" value={fmtNum(clients.length)} />
            <Row label="Parceiros cadastrados" value={fmtNum(partners.length)} />
            <Row label="Etapas ativas no funil" value={fmtNum(stages.filter((s: any) => s.ativa).length)} />
            <Row label="Aprovação vs Perda" value={`${won} / ${lost}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
