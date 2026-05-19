import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, CheckCircle2, Calendar as CalIcon, List } from "lucide-react";
import { ActivityFormDialog, type ActivityRecord } from "@/components/activities/ActivityFormDialog";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay, isBefore, isToday, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { nextRecurrenceDate } from "@/lib/recurrence";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

const DnDCalendar = withDragAndDrop(Calendar as any);

export const Route = createFileRoute("/_app/activities")({
  component: ActivitiesPage,
});

const locales = { "pt-BR": ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (d: Date) => startOfWeek(d, { locale: ptBR }),
  getDay,
  locales,
});

const PRIO_COLORS: Record<string, string> = {
  alta: "bg-red-500/20 text-red-300 border-red-500/30",
  media: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  baixa: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

function activityDate(a: any): Date {
  if (a.data_agendada) {
    return new Date(`${a.data_agendada}T${a.horario_agendado ?? "09:00"}`);
  }
  return new Date(a.data_atividade);
}

function ActivitiesPage() {
  const qc = useQueryClient();
  const perms = usePermissions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ActivityRecord | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState<Date>(new Date());

  const { data: acts = [], isLoading } = useQuery({
    queryKey: ["activities", "all"],
    queryFn: async () =>
      (
        await supabase
          .from("activities")
          .select("*, user_profiles:responsavel_id(nome), opportunities(titulo,id), clients(nome)")
          .order("data_atividade", { ascending: false })
          .limit(500)
      ).data ?? [],
  });

  const now = new Date();
  const startToday = startOfDay(now);

  const buckets = useMemo(() => {
    const pendentes: any[] = [];
    const hoje: any[] = [];
    const atrasadas: any[] = [];
    const concluidas: any[] = [];
    for (const a of acts as any[]) {
      const d = activityDate(a);
      if (a.status_atividade === "concluida") {
        concluidas.push(a);
        continue;
      }
      if (a.status_atividade === "cancelada") continue;
      if (isToday(d)) hoje.push(a);
      else if (isBefore(d, startToday)) atrasadas.push(a);
      else pendentes.push(a);
    }
    return { pendentes, hoje, atrasadas, concluidas };
  }, [acts, startToday]);

  const events = useMemo(
    () =>
      (acts as any[])
        .filter((a) => a.status_atividade !== "cancelada")
        .map((a) => {
          const start = activityDate(a);
          const end = new Date(start.getTime() + (a.duracao_minutos ?? 30) * 60000);
          return {
            id: a.id,
            title: a.titulo ?? a.descricao ?? "Atividade",
            start,
            end,
            resource: a,
          };
        }),
    [acts],
  );

  async function markComplete(a: any) {
    const { error } = await supabase
      .from("activities")
      .update({ status_atividade: "concluida" })
      .eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success("Concluída");
    qc.invalidateQueries({ queryKey: ["activities"] });
  }

  async function handleDelete() {
    if (!toDelete) return;
    const { error } = await supabase.from("activities").delete().eq("id", toDelete);
    if (error) return toast.error(error.message);
    toast.success("Excluída");
    setToDelete(null);
    qc.invalidateQueries({ queryKey: ["activities"] });
  }

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(a: any) {
    setEditing(a);
    setDialogOpen(true);
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif">Atividades</h1>
          <p className="text-sm text-muted-foreground mt-1">Tarefas, reuniões e follow-ups</p>
        </div>
        {perms.canCreateActivities && (
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nova atividade</Button>
        )}
      </div>

      <Tabs defaultValue="lista" className="w-full">
        <TabsList>
          <TabsTrigger value="lista"><List className="h-4 w-4 mr-2" />Lista</TabsTrigger>
          <TabsTrigger value="calendario"><CalIcon className="h-4 w-4 mr-2" />Calendário</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="mt-6">
          <Tabs defaultValue="hoje">
            <TabsList>
              <TabsTrigger value="hoje">Hoje <Badge variant="secondary" className="ml-2">{buckets.hoje.length}</Badge></TabsTrigger>
              <TabsTrigger value="atrasadas">Atrasadas <Badge variant="destructive" className="ml-2">{buckets.atrasadas.length}</Badge></TabsTrigger>
              <TabsTrigger value="pendentes">Pendentes <Badge variant="secondary" className="ml-2">{buckets.pendentes.length}</Badge></TabsTrigger>
              <TabsTrigger value="concluidas">Concluídas <Badge variant="outline" className="ml-2">{buckets.concluidas.length}</Badge></TabsTrigger>
            </TabsList>
            {(["hoje", "atrasadas", "pendentes", "concluidas"] as const).map((k) => (
              <TabsContent key={k} value={k} className="mt-4 space-y-3">
                {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
                {!isLoading && buckets[k].length === 0 && (
                  <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma atividade.</p>
                )}
                {buckets[k].map((a: any) => (
                  <div
                    key={a.id}
                    className={`bg-card border rounded-xl p-4 border-l-2 ${
                      a.prioridade === "alta" ? "border-l-red-500" :
                      a.prioridade === "baixa" ? "border-l-emerald-500" :
                      "border-l-primary"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium">{a.titulo ?? a.descricao ?? "Atividade"}</h3>
                          <Badge variant="outline" className="text-xs">{a.tipo_atividade}</Badge>
                          {a.prioridade && (
                            <Badge className={`text-xs border ${PRIO_COLORS[a.prioridade] ?? ""}`}>{a.prioridade}</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {activityDate(a).toLocaleString("pt-BR")} · {a.user_profiles?.nome ?? "—"}
                          {a.duracao_minutos ? ` · ${a.duracao_minutos}min` : ""}
                        </div>
                        {a.descricao && a.titulo && (
                          <p className="text-sm mt-2 text-muted-foreground">{a.descricao}</p>
                        )}
                        {(a.opportunities?.titulo || a.clients?.nome) && (
                          <div className="mt-2 text-xs text-primary/70">
                            {a.opportunities?.titulo && `Oportunidade: ${a.opportunities.titulo}`}
                            {a.clients?.nome && ` · Cliente: ${a.clients.nome}`}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {perms.canCompleteActivities && a.status_atividade !== "concluida" && (
                          <Button size="icon" variant="ghost" onClick={() => markComplete(a)} title="Concluir">
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        {perms.canCreateActivities && (
                          <Button size="icon" variant="ghost" onClick={() => openEdit(a)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {perms.canCompleteActivities && (
                          <Button size="icon" variant="ghost" onClick={() => setToDelete(a.id)} title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        <TabsContent value="calendario" className="mt-6">
          <div className="bg-card border rounded-xl p-4 h-[700px]">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              views={["month", "week", "day", "agenda"]}
              culture="pt-BR"
              messages={{
                today: "Hoje", previous: "Anterior", next: "Próximo",
                month: "Mês", week: "Semana", day: "Dia", agenda: "Agenda",
                date: "Data", time: "Hora", event: "Evento", noEventsInRange: "Sem atividades neste período",
              }}
              onSelectEvent={(e: any) => openEdit(e.resource)}
              eventPropGetter={(e: any) => {
                const p = e.resource?.prioridade;
                const bg = p === "alta" ? "hsl(0 70% 50%)" : p === "baixa" ? "hsl(150 60% 40%)" : "hsl(var(--primary))";
                return { style: { backgroundColor: bg, border: "none", color: "hsl(var(--primary-foreground))" } };
              }}
              style={{ height: "100%" }}
            />
          </div>
        </TabsContent>
      </Tabs>

      <ActivityFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir atividade?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
