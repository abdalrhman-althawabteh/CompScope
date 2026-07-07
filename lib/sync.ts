import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchRecentVideos } from "@/lib/youtube";

export type SyncableCompetitor = {
  id: string;
  owner_id: string;
  uploads_playlist_id: string | null;
};

// Fetch a competitor's recent uploads and upsert them. Reused by the manual "Sync now"
// action and (Phase 4) the scheduled cron. RLS scopes writes via the passed-in client.
export async function syncCompetitor(
  supabase: SupabaseClient,
  competitor: SyncableCompetitor,
): Promise<number> {
  if (!competitor.uploads_playlist_id) return 0;

  const videos = await fetchRecentVideos(competitor.uploads_playlist_id, 50);
  if (videos.length > 0) {
    const rows = videos.map((v) => ({
      ...v,
      competitor_id: competitor.id,
      owner_id: competitor.owner_id,
      fetched_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from("videos")
      .upsert(rows, { onConflict: "competitor_id,youtube_video_id" });
    if (error) throw new Error(error.message);
  }

  await supabase
    .from("competitors")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", competitor.id);

  return videos.length;
}
