import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-active";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { fmtBRL } from "@/lib/format";
import { Calculator, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_app/commissions")({
  component: CommissionsPage,
});

function CommissionsPage() {
  const perms = usePermissions();
  const navigate = useNavigate();
  useEffect(() => {
    if (!perms.isMaster && perms.tipo) navigate({ to: "/dashboard" });
  }, [perms.isMaster, perms.tipo, navigate]);

  const [opportunityId, setOpportunityId] = useState<string>("");
  const [overridePct, setOverridePct] = useState<string>("");

  const { data: opps = [] } = useQuery({
    queryKey: ["opps-commission"],
    queryFn: async () =>
      (
        await supabase
          .from("opportunities")
          .select("id,titulo,valor_estimado,produto_interesse,parceiro_id,partners(id,nome,comissao),clients(nome)")
          .order("created_at", { ascending: false })
          .limit(500)
      ).data ?? [],
    enabled: perms.isMaster,
  });

  const { data: rules = [] } = useQuery({
    queryKey: ["commission-rules"],
    queryFn: async () => (await supabase.from("commission_rules").select("*").eq("ativa", true)).data ?? [],
    enabled: perms.isMaster,
  });

  const selected = useMemo(() => opps.find((o: any) => o.id === opportunityId), [opps, opportunityId]);

  const calc = useMemo(() => {
    if (!selected) return null;
    const valor = Number(selected.valor_estimado ?? 0);
    let pctSource = "—";
    let pct = 0;

    if (overridePct.trim() !== "" && !isNaN(Number(overridePct))) {
      pct = Number(overridePct);
      pctSource = "manual";
    } else {
      // 1. matching rule (parceiro + produto)
      const exact = rules.find(
        (r: any) =>
          (!r.parceiro_id || r.parceiro_id === selected.parceiro_id) &&
          (!r.produto || r.produto === selected.produto_interesse) &&
          valor >= Number(r.valor_minimo ?? 0) &&
          (r.valor_maximo == null || valor <= Number(r.valor_maximo)),
      );
      if (exact) {
        pct = Number(exact.percentual);
        pctSource = `Regra: ${exact.nome}`;
      } else if (selected.partners?.comissao != null) {
        pct = Number(selected.partners.comissao);
        pctSource = `Parceiro: ${selected.partners.nome}`;
      }
    }
    const comissao = (valor * pct) / 100;
    return { valor, pct, comissao, pctSource };
  }, [selected, rules, overridePct]);

  if (!perms.isMaster) return <div className="p-8 text-sm text-muted-foreground">Acesso restrito.</div>;

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-serif">Comissões</h1>
        <p className="text-sm text-muted-foreground mt-1">Simulador e regras de comissão</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif">
              <Calculator className="w-5 h-5 text-primary" />
              Simulador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Oportunidade</Label>
              <Select value={opportunityId} onValueChange={setOpportunityId}>
                <SelectTrigger><SelectValue placeholder="Selecione uma oportunidade" /></SelectTrigger>
                <SelectContent>
                  {opps.map((o: any) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.titulo} · {fmtBRL(o.valor_estimado)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sobrescrever % (opcional)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 5"
                value={overridePct}
                onChange={(e) => setOverridePct(e.target.value)}
              />
            </div>

            {selected && (
              <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
                <div>Cliente: <span className="text-foreground">{selected.clients?.nome ?? "—"}</span></div>
                <div>Produto: <span className="text-foreground">{selected.produto_interesse ?? "—"}</span></div>
                <div>Parceiro: <span className="text-foreground">{selected.partners?.nome ?? "Direto"}</span></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif">
              <TrendingUp className="w-5 h-5 text-primary" />
              Resultado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!calc && <p className="text-sm text-muted-foreground">Selecione uma oportunidade para simular.</p>}
            {calc && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Valor</div>
                    <div className="font-serif text-xl mt-1">{fmtBRL(calc.valor)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Percentual</div>
                    <div className="font-serif text-xl mt-1">{calc.pct.toFixed(2)}%</div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Comissão estimada</div>
                  <div className="font-serif text-4xl text-primary mt-2">{fmtBRL(calc.comissao)}</div>
                  <Badge variant="outline" className="mt-3 text-[10px]">{calc.pctSource}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Regras de comissão ativas</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma regra cadastrada. O simulador usa o % do parceiro como padrão.</p>}
          {rules.length > 0 && (
            <div className="space-y-2">
              {rules.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between border rounded-md p-3 text-sm">
                  <div>
                    <div className="font-medium">{r.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.produto ?? "Todos os produtos"} · {r.parceiro_id ? "Parceiro específico" : "Todos parceiros"}
                      {r.valor_minimo ? ` · min ${fmtBRL(r.valor_minimo)}` : ""}
                      {r.valor_maximo ? ` · max ${fmtBRL(r.valor_maximo)}` : ""}
                    </div>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-primary/30">{Number(r.percentual).toFixed(2)}%</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
