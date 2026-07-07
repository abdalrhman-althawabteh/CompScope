import "server-only";

// Thin wrapper over the YouTube Data API v3 (plain fetch, no SDK).
const API = "https://www.googleapis.com/youtube/v3";

function key() {
  const k = process.env.YOUTUBE_API_KEY;
  if (!k) throw new Error("YOUTUBE_API_KEY is not set.");
  return k;
}

export type ResolvedChannel = {
  channelId: string;
  title: string;
  thumbnail: string | null;
  uploadsPlaylistId: string;
  handle: string | null;
};

export type FetchedVideo = {
  youtube_video_id: string;
  title: string;
  url: string;
  published_at: string;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  duration: string | null;
  thumbnail_url: string | null;
};

// Turn a channel URL / @handle / channel ID into the channels.list lookup param.
function lookupParam(input: string): string {
  const raw = input.trim();
  if (raw.startsWith("@")) return `forHandle=${encodeURIComponent(raw)}`;
  if (/^UC[0-9A-Za-z_-]{22}$/.test(raw)) return `id=${raw}`;

  try {
    const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts[0]?.startsWith("@")) return `forHandle=${encodeURIComponent(parts[0])}`;
    if (parts[0] === "channel" && parts[1]) return `id=${parts[1]}`;
    if (parts[0] === "user" && parts[1])
      return `forUsername=${encodeURIComponent(parts[1])}`;
    if (parts[0] === "c" && parts[1])
      return `forHandle=${encodeURIComponent("@" + parts[1])}`;
  } catch {
    // not a URL — fall through
  }
  // bare word → try as a handle
  return `forHandle=${encodeURIComponent("@" + raw)}`;
}

async function ytFetch(path: string) {
  const res = await fetch(`${API}/${path}&key=${key()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube API error (${res.status}): ${body.slice(0, 300)}`);
  }
  return res.json();
}

export async function resolveChannel(input: string): Promise<ResolvedChannel> {
  const data = await ytFetch(
    `channels?part=snippet,contentDetails&${lookupParam(input)}`,
  );
  const ch = data.items?.[0];
  if (!ch)
    throw new Error(
      "Channel not found. Paste the channel URL or its @handle (e.g. @MrBeast).",
    );
  return {
    channelId: ch.id,
    title: ch.snippet?.title ?? "",
    thumbnail: ch.snippet?.thumbnails?.default?.url ?? null,
    uploadsPlaylistId: ch.contentDetails?.relatedPlaylists?.uploads,
    handle: ch.snippet?.customUrl ?? null,
  };
}

const num = (v: unknown) => (v == null ? null : Number(v));

export async function fetchRecentVideos(
  uploadsPlaylistId: string,
  max = 50,
): Promise<FetchedVideo[]> {
  const pl = await ytFetch(
    `playlistItems?part=contentDetails&maxResults=${Math.min(max, 50)}&playlistId=${uploadsPlaylistId}`,
  );
  const ids: string[] = (pl.items ?? [])
    .map((i: { contentDetails?: { videoId?: string } }) => i.contentDetails?.videoId)
    .filter(Boolean);
  if (ids.length === 0) return [];

  const vids = await ytFetch(
    `videos?part=snippet,statistics,contentDetails&id=${ids.join(",")}`,
  );
  return (vids.items ?? []).map(
    (v: {
      id: string;
      snippet?: { title?: string; publishedAt?: string; thumbnails?: Record<string, { url: string }> };
      statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
      contentDetails?: { duration?: string };
    }): FetchedVideo => ({
      youtube_video_id: v.id,
      title: v.snippet?.title ?? "",
      url: `https://youtu.be/${v.id}`,
      published_at: v.snippet?.publishedAt ?? new Date(0).toISOString(),
      view_count: num(v.statistics?.viewCount),
      like_count: num(v.statistics?.likeCount),
      comment_count: num(v.statistics?.commentCount),
      duration: v.contentDetails?.duration ?? null,
      thumbnail_url:
        v.snippet?.thumbnails?.medium?.url ??
        v.snippet?.thumbnails?.default?.url ??
        null,
    }),
  );
}
