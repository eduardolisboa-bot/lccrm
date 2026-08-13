import { useState } from "react";
import { Upload, FileText, Download, Trash2, FileIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-active";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { usePermissions } from "@/hooks/usePermissions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CATEGORIAS = [
  "contrato",
  "proposta",
  "documento_pessoal",
  "print",
  "audio",
  "comprovante",
  "outros",
] as const;

interface Props {
  clientId: string;
  opportunityId?: string;
}

export function DocumentUpload({ clientId, opportunityId }: Props) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const perms = usePermissions();
  const [uploading, setUploading] = useState(false);
  const [categoria, setCategoria] = useState<string>("outros");
  const [filterCat, setFilterCat] = useState<string>("all");

  const { data: docs = [] } = useQuery({
    queryKey: ["client-docs", clientId],
    queryFn: async () =>
      ((await supabase
        .from("client_documents")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })).data ?? []) as any[],
  });

  const upload = async (file: File) => {
    if (!perms.canUploadDocuments) {
      toast.error("Sem permissão para enviar documentos");
      return;
    }
    setUploading(true);
    try {
      const path = `${clientId}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("client-documents")
        .upload(path, file);
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("client_documents").insert({
        client_id: clientId,
        opportunity_id: opportunityId ?? null,
        nome: file.name,
        categoria,
        tipo_mime: file.type,
        tamanho_bytes: file.size,
        storage_path: path,
        uploaded_by: profile?.id ?? null,
      });
      if (dbErr) throw dbErr;
      toast.success("Documento enviado");
      qc.invalidateQueries({ queryKey: ["client-docs", clientId] });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao enviar");
    } finally {
      setUploading(false);
    }
  };

  const view = async (path: string) => {
    const { data } = await supabase.storage
      .from("client-documents")
      .createSignedUrl(path, 60 * 10);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  };

  const download = async (path: string, name: string) => {
    const { data } = await supabase.storage.from("client-documents").download(path);
    if (!data) return;
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteMut = useMutation({
    mutationFn: async (doc: any) => {
      await supabase.storage.from("client-documents").remove([doc.storage_path]);
      await supabase.from("client_documents").delete().eq("id", doc.id);
    },
    onSuccess: () => {
      toast.success("Documento excluído");
      qc.invalidateQueries({ queryKey: ["client-docs", clientId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao excluir"),
  });

  const filtered = filterCat === "all" ? docs : docs.filter((d) => d.categoria === filterCat);

  return (
    <div className="space-y-4">
      {perms.canUploadDocuments && (
        <div className="flex items-center gap-3 p-4 border border-dashed border-border rounded-lg">
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex-1">
            <input
              type="file"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.target.value = "";
              }}
            />
            <div className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 rounded bg-primary text-primary-foreground hover:opacity-90">
              <Upload className="h-4 w-4" />
              {uploading ? "Enviando..." : "Enviar arquivo"}
            </div>
          </label>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Filtrar:</span>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-48 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {CATEGORIAS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
          <FileIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
          Nenhum documento {filterCat !== "all" ? "nesta categoria" : "ainda"}.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
            >
              <FileText className="h-6 w-6 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{d.nome}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-muted">{d.categoria}</span>
                  <span>{Math.round((d.tamanho_bytes ?? 0) / 1024)} KB</span>
                  <span>{new Date(d.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => view(d.storage_path)} title="Ver">
                  <Upload className="h-4 w-4 rotate-180" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => download(d.storage_path, d.nome)} title="Baixar">
                  <Download className="h-4 w-4" />
                </Button>
                {perms.canDeleteDocuments && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" title="Excluir" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {d.nome} será removido permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMut.mutate(d)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
