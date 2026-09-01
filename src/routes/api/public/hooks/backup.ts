import { createFileRoute } from "@tanstack/react-router";

function hasCronApiKey(request: Request) {
  const expected = process.env["SUPABASE_PUBLISHABLE_KEY"];
  return Boolean(expected && request.headers.get("apikey") === expected);
}

export const Route = createFileRoute("/api/public/hooks/backup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!hasCronApiKey(request)) {
          return Response.json({ success: false, error: "Chave de agendamento inválida" }, { status: 401 });
        }
        try {
          const { BACKUP_TENANTS, createBackup } = await import("@/lib/backup.server");
          const results = [];
          for (const tenant of BACKUP_TENANTS) {
            results.push({ tenant, ...(await createBackup(tenant, "automatico", null)) });
          }
          return Response.json({ success: true, results });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return Response.json({ success: false, error: message }, { status: 500 });
        }
      },
    },
  },
});