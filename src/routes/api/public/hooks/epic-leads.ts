import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/epic-leads")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleEpicLeadWebhook } = await import("@/lib/epic-lead-webhook.server");
        return handleEpicLeadWebhook(request);
      },
    },
  },
});
