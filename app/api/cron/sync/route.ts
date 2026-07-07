import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncCompetitor } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Daily sync of every competitor's latest videos. Triggered by Vercel Cron (see vercel.json),
// which sends `Authorization: Bearer $CRON_SECRET`. Also callable manually with the same header.
export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: competitors, error } = await admin
    .from("competitors")
    .select("id, owner_id, uploads_playlist_id");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // group competitors by owner
  const byOwner = new Map<string, typeof competitors>();
  for (const c of competitors ?? []) {
    const list = byOwner.get(c.owner_id) ?? [];
    list.push(c);
    byOwner.set(c.owner_id, list);
  }

  let ownersDone = 0;
  let totalVideos = 0;

  // ponytail: sequential per owner + per competitor. Fine at current scale. Ceiling: if
  // owners×competitors risks the 60s function timeout, batch per-owner or move to a queue.
  for (const [ownerId, comps] of byOwner) {
    const { data: run } = await admin
      .from("sync_runs")
      .insert({ owner_id: ownerId, status: "running", source: "schedule" })
      .select("id")
      .single();

    let synced = 0;
    let videos = 0;
    let errMsg: string | null = null;
    for (const c of comps) {
      try {
        videos += await syncCompetitor(admin, c);
        synced += 1;
      } catch (e) {
        errMsg = e instanceof Error ? e.message : "unknown error";
      }
    }

    if (run) {
      await admin
        .from("sync_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: errMsg ? "error" : "success",
          competitors_synced: synced,
          videos_upserted: videos,
          error: errMsg,
        })
        .eq("id", run.id);
    }

    ownersDone += 1;
    totalVideos += videos;
  }

  return NextResponse.json({
    owners: ownersDone,
    competitors: competitors?.length ?? 0,
    videos: totalVideos,
  });
}
