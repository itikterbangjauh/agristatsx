import { createFileRoute } from "@tanstack/react-router";

import { fetchGoogleSheetSourceData } from "@/lib/tepi";

export const Route = createFileRoute("/api/tourism-data")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const rows = await fetchGoogleSheetSourceData();
          return Response.json(rows, {
            headers: { "Cache-Control": "no-store" },
          });
        } catch (error) {
          console.error("Failed to read TourismEcoAI_BPPAS Google Sheet", error);
          return Response.json({ error: "Unable to read Google Sheet data" }, { status: 502 });
        }
      },
    },
  },
});