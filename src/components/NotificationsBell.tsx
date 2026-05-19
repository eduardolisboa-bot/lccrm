import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const { items, unread, markRead, markAllRead } = useNotifications();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative text-muted-foreground hover:text-foreground p-1.5" title="Notificações">
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] font-medium rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-1">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="text-sm font-medium">Notificações</div>
          {unread > 0 && (
            <Button size="sm" variant="ghost" onClick={markAllRead} className="h-7 text-xs">
              <Check className="w-3 h-3 mr-1" /> Marcar todas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {items.length === 0 && (
            <div className="text-xs text-muted-foreground p-6 text-center">Sem notificações</div>
          )}
          {items.map((n: any) => {
            const inner = (
              <div className={`p-3 border-b text-sm hover:bg-muted/40 transition-colors ${!n.lida ? "bg-primary/5" : ""}`}>
                <div className="flex items-start gap-2">
                  <div className={`w-1.5 h-1.5 mt-1.5 rounded-full shrink-0 ${!n.lida ? "bg-primary" : "bg-transparent"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium leading-tight">{n.titulo}</div>
                    {n.mensagem && <div className="text-xs text-muted-foreground mt-0.5">{n.mensagem}</div>}
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { locale: ptBR, addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>
            );
            return n.link ? (
              <Link key={n.id} to={n.link} onClick={() => { markRead(n.id); setOpen(false); }}>
                {inner}
              </Link>
            ) : (
              <div key={n.id} onClick={() => markRead(n.id)} className="cursor-pointer">
                {inner}
              </div>
            );
          })}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
