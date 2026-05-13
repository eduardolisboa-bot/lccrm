import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";

export interface Funnel {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  ativo: boolean;
}

interface FunnelCtx {
  funnels: Funnel[];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  loading: boolean;
}

const Ctx = createContext<FunnelCtx | undefined>(undefined);
const STORAGE_KEY = "lc.selectedFunnelId";

export function FunnelProvider({ children }: { children: ReactNode }) {
  const { profile, user } = useAuth();
  const [selectedId, setSelectedIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  });

  // Lista de funis acessíveis: master vê todos; demais via user_funnel_access (RLS já filtra para os demais)
  const { data: funnels = [], isLoading } = useQuery({
    queryKey: ["funnels-accessible", profile?.id, profile?.tipo_usuario],
    queryFn: async (): Promise<Funnel[]> => {
      if (profile?.tipo_usuario === "master") {
        const { data } = await supabase.from("funnels").select("*").eq("ativo", true).order("ordem");
        return (data ?? []) as Funnel[];
      }
      const { data } = await supabase
        .from("user_funnel_access")
        .select("funnels(id,nome,cor,ordem,ativo)")
        .eq("user_profile_id", profile?.id ?? "");
      return ((data ?? []).map((r: any) => r.funnels).filter(Boolean) as Funnel[])
        .filter((f) => f.ativo)
        .sort((a, b) => a.ordem - b.ordem);
    },
    enabled: !!user && !!profile,
  });

  // Garantir uma seleção válida
  useEffect(() => {
    if (!funnels.length) return;
    if (!selectedId || !funnels.find((f) => f.id === selectedId)) {
      const fallback = funnels[0].id;
      setSelectedIdState(fallback);
      localStorage.setItem(STORAGE_KEY, fallback);
    }
  }, [funnels, selectedId]);

  const setSelectedId = (id: string) => {
    setSelectedIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const value = useMemo(
    () => ({ funnels, selectedId, setSelectedId, loading: isLoading }),
    [funnels, selectedId, isLoading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFunnel() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFunnel must be inside FunnelProvider");
  return ctx;
}
