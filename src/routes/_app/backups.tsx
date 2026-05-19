import { createFileRoute } from "@tanstack/react-router";
import { BackupsManager } from "@/components/settings/BackupsManager";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/backups")({
  component: BackupsPage,
});

function BackupsPage() {
  const { profile } = useAuth();

  if (profile?.tipo_usuario !== "master") {
    return <div className="p-8 text-center text-muted-foreground">Acesso restrito ao Master.</div>;
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-serif">Backups</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lista automática, validação e restauração segura dos backups.
        </p>
      </div>
      <BackupsManager />
    </div>
  );
}
