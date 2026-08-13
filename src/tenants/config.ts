import lisboaLogo from "@/assets/lisboa-capital-logo.png";
import epicAsset from "@/assets/epic-logo.png.asset.json";
import hopeAsset from "@/assets/hope-capital-logo.png.asset.json";

export type TenantId = "lisboa" | "epic" | "hope";

export interface TenantBranding {
  primary: string;
  primaryHover: string;
  secondary: string;
  accent: string;
  logoLight: string;
  logoDark: string;
  favicon: string;
}

export interface Tenant {
  id: TenantId;
  name: string;
  legalName: string;
  cnpj: string;
  supportEmail: string;
  domain: string;
  isHub: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  branding: TenantBranding;
}

const env = import.meta.env as Record<string, string | undefined>;

/** Lisboa falls back to the natively connected Lovable Cloud project. */
const LISBOA_URL = env["VITE_LISBOA_SUPABASE_URL"] || env["VITE_SUPABASE_URL"] || "";
const LISBOA_KEY =
  env["VITE_LISBOA_SUPABASE_ANON_KEY"] || env["VITE_SUPABASE_PUBLISHABLE_KEY"] || "";

export const TENANTS: Tenant[] = [
  {
    id: "lisboa",
    name: "Lisboa Capital",
    legalName: "Lisboa Capital",
    cnpj: "",
    supportEmail: "contato@lisboacapital.com.br",
    domain: "crm.lisboacapital.com.br",
    isHub: true,
    supabaseUrl: LISBOA_URL,
    supabaseAnonKey: LISBOA_KEY,
    branding: {
      primary: "43 74% 49%",
      primaryHover: "43 74% 42%",
      secondary: "36 30% 88%",
      accent: "43 74% 49%",
      logoLight: lisboaLogo,
      logoDark: lisboaLogo,
      favicon: "/favicon.png",
    },
  },
  {
    id: "epic",
    name: "Epic",
    legalName: "Epic Rental Car",
    cnpj: "",
    supportEmail: "contato@epicbiz.app",
    domain: "epicbiz.app",
    isHub: false,
    supabaseUrl: env["VITE_EPIC_SUPABASE_URL"] || "",
    supabaseAnonKey: env["VITE_EPIC_SUPABASE_ANON_KEY"] || "",
    branding: {
      primary: "212 60% 45%",
      primaryHover: "212 60% 38%",
      secondary: "214 32% 91%",
      accent: "212 90% 60%",
      logoLight: epicAsset.url,
      logoDark: epicAsset.url,
      favicon: epicAsset.url,
    },
  },
  {
    id: "hope",
    name: "Hope Capital",
    legalName: "Hope Capital",
    cnpj: "",
    supportEmail: "contato@hopecapital.com.br",
    domain: "hopecapital.com.br",
    isHub: false,
    supabaseUrl: env["VITE_HOPE_SUPABASE_URL"] || "",
    supabaseAnonKey: env["VITE_HOPE_SUPABASE_ANON_KEY"] || "",
    branding: {
      primary: "45 96% 53%",
      primaryHover: "45 96% 45%",
      secondary: "0 0% 92%",
      accent: "45 96% 53%",
      logoLight: hopeAsset.url,
      logoDark: hopeAsset.url,
      favicon: hopeAsset.url,
    },
  },
];

export const DEFAULT_TENANT_ID: TenantId = "lisboa";

export function isTenantConfigured(t: Tenant) {
  return Boolean(t.supabaseUrl && t.supabaseAnonKey);
}

export function getTenant(id: string | null | undefined): Tenant {
  return TENANTS.find((t) => t.id === id) ?? TENANTS[0]!;
}
