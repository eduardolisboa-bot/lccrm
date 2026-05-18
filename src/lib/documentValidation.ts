// Validação e formatação CPF/CNPJ + BrasilAPI

export function onlyDigits(s: string): string {
  return (s || "").replace(/\D/g, "");
}

export function detectDocumentType(value: string): "cpf" | "cnpj" | "unknown" {
  const d = onlyDigits(value);
  if (d.length === 11) return "cpf";
  if (d.length === 14) return "cnpj";
  return "unknown";
}

export function formatCPF(cpf: string): string {
  const d = onlyDigits(cpf).padStart(11, "0").slice(0, 11);
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

export function formatCNPJ(cnpj: string): string {
  const d = onlyDigits(cnpj).padStart(14, "0").slice(0, 14);
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

export function formatDocument(value: string): string {
  const t = detectDocumentType(value);
  if (t === "cpf") return formatCPF(value);
  if (t === "cnpj") return formatCNPJ(value);
  return value;
}

export function validateCPF(cpf: string): boolean {
  const d = onlyDigits(cpf);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10) r = 0;
  if (r !== parseInt(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10) r = 0;
  return r === parseInt(d[10]);
}

export function validateCNPJ(cnpj: string): boolean {
  const d = onlyDigits(cnpj);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calc = (base: string) => {
    let pos = base.length - 7;
    let sum = 0;
    for (let i = base.length; i >= 1; i--) {
      sum += parseInt(base[base.length - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = calc(d.slice(0, 12));
  if (d1 !== parseInt(d[12])) return false;
  const d2 = calc(d.slice(0, 13));
  return d2 === parseInt(d[13]);
}

export function validateDocument(value: string): boolean {
  const t = detectDocumentType(value);
  if (t === "cpf") return validateCPF(value);
  if (t === "cnpj") return validateCNPJ(value);
  return false;
}

export interface BrasilApiCnpj {
  razao_social?: string;
  nome_fantasia?: string;
  cnae_fiscal_descricao?: string;
  descricao_situacao_cadastral?: string;
  data_inicio_atividade?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
}

export async function fetchCnpjData(cnpj: string): Promise<BrasilApiCnpj | null> {
  const d = onlyDigits(cnpj);
  if (d.length !== 14) return null;
  try {
    const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${d}`);
    if (!r.ok) return null;
    return (await r.json()) as BrasilApiCnpj;
  } catch {
    return null;
  }
}
