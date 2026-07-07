import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CompetitorRow = {
  id: string;
  channel_title: string | null;
  handle: string | null;
  color: string;
  thumbnail_url: string | null;
  last_synced_at: string | null;
  created_at: string;
};

export type VideoRow = {
  id: string;
  competitor_id: string;
  youtube_video_id: string;
  title: string | null;
  url: string | null;
  published_at: string | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  competitor: { channel_title: string | null; color: string } | null;
};

const daysAgoISO = (n: number) =>
  new Date(Date.now() - n * 86_400_000).toISOString();

// Cutoff timestamp N days ago. Module-scope so callers don't call Date.now() in render
// (React 19 flags impure calls in component bodies).
export const daysAgoTs = (n: number) => Date.now() - n * 86_400_000;

export async function getCompetitors(
  supabase: SupabaseClient,
): Promise<CompetitorRow[]> {
  const { data } = await supabase
    .from("competitors")
    .select(
      "id, channel_title, handle, color, thumbnail_url, last_synced_at, created_at",
    )
    .order("created_at", { ascending: true });
  return (data ?? []) as CompetitorRow[];
}

// competitor_id -> number of stored videos
export async function getVideoCounts(
  supabase: SupabaseClient,
): Promise<Record<string, number>> {
  const { data } = await supabase.from("videos").select("competitor_id");
  const counts: Record<string, number> = {};
  for (const r of (data ?? []) as { competitor_id: string }[])
    counts[r.competitor_id] = (counts[r.competitor_id] ?? 0) + 1;
  return counts;
}

export async function getVideos(
  supabase: SupabaseClient,
  opts: { sinceDays?: number; limit?: number } = {},
): Promise<VideoRow[]> {
  let q = supabase
    .from("videos")
    .select(
      "id, competitor_id, youtube_video_id, title, url, published_at, view_count, like_count, comment_count, competitor:competitors(channel_title, color)",
    )
    .order("published_at", { ascending: false });
  if (opts.sinceDays) q = q.gte("published_at", daysAgoISO(opts.sinceDays));
  if (opts.limit) q = q.limit(opts.limit);
  const { data } = await q;
  return (data ?? []) as unknown as VideoRow[];
}

// ── Dashboard aggregates computed from a video set ──
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function trendOf(views: number | null): "hot" | "rising" | "flat" {
  if ((views ?? 0) >= 1_000_000) return "hot";
  if ((views ?? 0) >= 100_000) return "rising";
  return "flat";
}

export function computeDashboard(videos: VideoRow[]) {
  // uploads per weekday (Mon-first)
  const perDay = new Array(7).fill(0);
  for (const v of videos) {
    if (!v.published_at) continue;
    const js = new Date(v.published_at).getDay(); // 0=Sun
    perDay[(js + 6) % 7] += 1;
  }
  const maxDay = Math.max(...perDay, 1);
  const uploads = WEEKDAYS.map((label, i) => ({
    label,
    value: `${perDay[i]} upload${perDay[i] === 1 ? "" : "s"}`,
    pct: Math.round((perDay[i] / maxDay) * 100) || 4,
    highlight: perDay[i] === maxDay && maxDay > 0,
  }));

  // total-views trend: daily summed views over the fetched window (oldest→newest)
  const byDate: Record<string, number> = {};
  for (const v of videos) {
    if (!v.published_at) continue;
    const d = v.published_at.slice(0, 10);
    byDate[d] = (byDate[d] ?? 0) + (v.view_count ?? 0);
  }
  const dates = Object.keys(byDate).sort();
  const points = dates.map((d) => byDate[d]);
  const peak = Math.max(0, ...points);

  const latest = videos.slice(0, 4);
  const totalViews = videos.reduce((s, v) => s + (v.view_count ?? 0), 0);

  return {
    uploads,
    points: points.length > 1 ? points : [0, 0],
    peak,
    latest,
    totalViews,
  };
}
