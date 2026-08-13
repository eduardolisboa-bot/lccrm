import { distance } from "fastest-levenshtein";
import { supabase } from "@/lib/supabase-active";
import { onlyDigits } from "@/lib/documentValidation";

interface ClientLite {
  id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  cpf_cnpj?: string | null;
  razao_social?: string | null;
}

interface DupResult {
  client_a_id: string;
  client_b_id: string;
  similaridade: number;
  motivo: string;
  campos_conflitantes: Record<string, [any, any]>;
}

function score(a: ClientLite, b: ClientLite): DupResult | null {
  let sim = 0;
  const motivos: string[] = [];
  const conflitos: Record<string, [any, any]> = {};

  const phA = onlyDigits(a.telefone ?? "");
  const phB = onlyDigits(b.telefone ?? "");
  if (phA && phA === phB) {
    sim += 40;
    motivos.push("telefone");
  } else if (phA && phB) conflitos.telefone = [a.telefone, b.telefone];

  const emA = (a.email ?? "").toLowerCase().trim();
  const emB = (b.email ?? "").toLowerCase().trim();
  if (emA && emA === emB) {
    sim += 35;
    motivos.push("email");
  } else if (emA && emB) conflitos.email = [a.email, b.email];

  const docA = onlyDigits(a.cpf_cnpj ?? "");
  const docB = onlyDigits(b.cpf_cnpj ?? "");
  if (docA && docA === docB) {
    sim += 50;
    motivos.push("CPF/CNPJ");
  } else if (docA && docB) conflitos.cpf_cnpj = [a.cpf_cnpj, b.cpf_cnpj];

  const nA = (a.nome ?? "").toLowerCase().trim();
  const nB = (b.nome ?? "").toLowerCase().trim();
  if (nA && nB && nA.length > 5 && nB.length > 5) {
    const d = distance(nA, nB);
    if (d < 3) {
      sim += 25;
      motivos.push("nome similar");
    } else conflitos.nome = [a.nome, b.nome];
  }

  const rA = (a.razao_social ?? "").toLowerCase().trim();
  const rB = (b.razao_social ?? "").toLowerCase().trim();
  if (rA && rB && rA.length > 5 && distance(rA, rB) < 3) {
    sim += 20;
    motivos.push("razão social similar");
  }

  if (sim < 35) return null;
  // canonical ordering: smallest id first to avoid (A,B) and (B,A) duplicates
  const [first, second] = a.id < b.id ? [a, b] : [b, a];
  return {
    client_a_id: first.id,
    client_b_id: second.id,
    similaridade: Math.min(sim, 100),
    motivo: motivos.join(" + ") || "indeterminado",
    campos_conflitantes: conflitos,
  };
}

export async function runDuplicateAnalysis(): Promise<number> {
  const { data: clients = [] } = await supabase
    .from("clients")
    .select("id, nome, email, telefone, cpf_cnpj, razao_social")
    .eq("status", "ativo");
  const list = (clients ?? []) as ClientLite[];
  const found: DupResult[] = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const r = score(list[i], list[j]);
      if (r) found.push(r);
    }
  }
  if (found.length === 0) return 0;
  // upsert one-by-one (small dataset expected)
  for (const r of found) {
    await supabase
      .from("client_duplicates")
      .upsert(
        {
          client_a_id: r.client_a_id,
          client_b_id: r.client_b_id,
          similaridade: r.similaridade,
          motivo: r.motivo,
          campos_conflitantes: r.campos_conflitantes,
        },
        { onConflict: "client_a_id,client_b_id", ignoreDuplicates: false },
      );
  }
  return found.length;
}
