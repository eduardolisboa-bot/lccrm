import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase-active";
import { useAuth } from "@/lib/auth-context";

export function useNotifications() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const userId = profile?.id;

  const q = useQuery({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`notif-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => qc.invalidateQueries({ queryKey: ["notifications", userId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, qc]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ lida: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications", userId] });
  };
  const markAllRead = async () => {
    if (!userId) return;
    await supabase.from("notifications").update({ lida: true }).eq("user_id", userId).eq("lida", false);
    qc.invalidateQueries({ queryKey: ["notifications", userId] });
  };

  const items = q.data ?? [];
  const unread = items.filter((n: any) => !n.lida).length;
  return { items, unread, markRead, markAllRead, isLoading: q.isLoading };
}
