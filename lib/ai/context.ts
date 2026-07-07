import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCompetitors, getVideos } from "@/lib/queries";
import { fmtViews } from "@/lib/format";

// Builds the grounded system prompt for the signed-in customer. Only this customer's
// rows are ever fetched (RLS-scoped client), so the model can't see anyone else's data.
export async function buildSystemPrompt(supabase: SupabaseClient): Promise<string> {
  const [competitors, videos] = await Promise.all([
    getCompetitors(supabase),
    getVideos(supabase, { limit: 200 }),
  ]);

  const role =
    "You are CompScope's AI analyst. You help a YouTube creator understand their competitors " +
    "and brainstorm video ideas. Base every answer strictly on the competitor data below — do " +
    "not invent channels, videos, or numbers. Be concise and specific; when suggesting ideas, tie " +
    "them to patterns you actually see in the data. If the data is empty, say so and suggest the " +
    "user add competitors first.";

  if (competitors.length === 0) {
    return `${role}\n\nThe user has not added any competitors yet.`;
  }

  const byCompetitor = competitors.map((c) => {
    const vids = videos
      .filter((v) => v.competitor_id === c.id)
      .slice(0, 8)
      .map(
        (v) =>
          `  - "${v.title}" — ${fmtViews(v.view_count)} views, published ${v.published_at?.slice(0, 10)}`,
      );
    const recent30 = videos.filter(
      (v) =>
        v.competitor_id === c.id &&
        v.published_at &&
        Date.now() - new Date(v.published_at).getTime() < 30 * 86_400_000,
    ).length;
    return (
      `Competitor: ${c.channel_title ?? c.handle ?? "?"} ` +
      `(${recent30} uploads in the last 30 days)\n` +
      (vids.length ? vids.join("\n") : "  (no recent videos)")
    );
  });

  return `${role}\n\n=== COMPETITOR DATA ===\n${byCompetitor.join("\n\n")}`;
}
