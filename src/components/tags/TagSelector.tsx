import { useState } from "react";
import { Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagBadge, type Tag } from "./TagBadge";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";

interface Props {
  entityId: string;
  entityType: "client" | "partner";
}

export function TagSelector({ entityId, entityType }: Props) {
  const qc = useQueryClient();
  const perms = usePermissions();
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#C9A84C");
  const linkTable = entityType === "client" ? "client_tags" : "partner_tags";
  const fkCol = entityType === "client" ? "client_id" : "partner_id";
  const categoria = entityType === "client" ? "cliente" : "parceiro";

  const { data: allTags = [] } = useQuery({
    queryKey: ["tags", categoria],
    queryFn: async () =>
      ((await supabase.from("tags").select("*").eq("ativa", true).in("categoria", [categoria, "geral"])).data ?? []) as Tag[],
  });

  const { data: applied = [] } = useQuery({
    queryKey: ["entity-tags", entityType, entityId],
    queryFn: async () => {
      const { data } = await supabase
        .from(linkTable as any)
        .select("tag_id, tags(*)")
        .eq(fkCol, entityId);
      return (data ?? []).map((r: any) => r.tags as Tag);
    },
  });

  const appliedIds = new Set(applied.map((t) => t.id));

  const addMut = useMutation({
    mutationFn: async (tagId: string) => {
      await supabase.from(linkTable as any).insert({ [fkCol]: entityId, tag_id: tagId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["entity-tags", entityType, entityId] }),
  });

  const removeMut = useMutation({
    mutationFn: async (tagId: string) => {
      await supabase.from(linkTable as any).delete().eq(fkCol, entityId).eq("tag_id", tagId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["entity-tags", entityType, entityId] }),
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .insert({ nome: newName, cor: newColor, categoria, tipo: "manual", ativa: true })
        .select()
        .single();
      if (error) throw error;
      await supabase.from(linkTable as any).insert({ [fkCol]: entityId, tag_id: data.id });
    },
    onSuccess: () => {
      toast.success("Tag criada");
      setNewName("");
      qc.invalidateQueries({ queryKey: ["tags", categoria] });
      qc.invalidateQueries({ queryKey: ["entity-tags", entityType, entityId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao criar tag"),
  });

  const filtered = allTags.filter((t) => t.nome.toLowerCase().includes(search.toLowerCase()));
  const manuais = filtered.filter((t) => t.tipo === "manual");
  const automaticas = filtered.filter((t) => t.tipo === "automatica");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {applied.map((tag) => (
        <TagBadge
          key={tag.id}
          tag={tag}
          onRemove={perms.canEditTags ? () => removeMut.mutate(tag.id) : undefined}
        />
      ))}
      {perms.canEditTags && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-dashed border-border text-muted-foreground hover:border-foreground hover:text-foreground">
              <Plus className="h-3 w-3" />
              Etiqueta
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <Input
              placeholder="Buscar tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-3"
            />
            <div className="max-h-64 overflow-y-auto space-y-3">
              {manuais.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Manuais</div>
                  <div className="flex flex-wrap gap-1">
                    {manuais.map((t) => {
                      const has = appliedIds.has(t.id);
                      return (
                        <button
                          key={t.id}
                          onClick={() => (has ? removeMut.mutate(t.id) : addMut.mutate(t.id))}
                          className={`text-xs ${has ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
                        >
                          <TagBadge tag={t} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {automaticas.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Automáticas</div>
                  <div className="flex flex-wrap gap-1">
                    {automaticas.map((t) => (
                      <TagBadge key={t.id} tag={t} />
                    ))}
                  </div>
                </div>
              )}
            </div>
            {perms.canCreateTags && (
              <div className="border-t border-border mt-3 pt-3 space-y-2">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Nova tag</div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="h-9 w-12 rounded border border-border bg-transparent"
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={!newName.trim()}
                  onClick={() => createMut.mutate()}
                >
                  Criar e aplicar
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
