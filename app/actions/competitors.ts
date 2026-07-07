"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveChannel } from "@/lib/youtube";
import { syncCompetitor } from "@/lib/sync";

// Dot colors assigned round-robin as competitors are added.
const PALETTE = [
  "#c5f04a", "#b9a3e3", "#ff6a2b", "#4ac5f0", "#f0d84a",
  "#f04a9c", "#4af0a0", "#9c6bff", "#ff9f4a", "#6ad0ff",
];

export type CompState = { error?: string; ok?: string };

async function userClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

function revalidate() {
  revalidatePath("/competitors");
  revalidatePath("/dashboard");
  revalidatePath("/timeline");
}

export async function addCompetitor(
  _prev: CompState,
  formData: FormData,
): Promise<CompState> {
  const input = String(formData.get("channel") ?? "").trim();
  if (!input) return { error: "Paste a channel URL or @handle." };

  const { supabase, user } = await userClient();

  let channel;
  try {
    channel = await resolveChannel(input);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not resolve channel." };
  }

  const { count } = await supabase
    .from("competitors")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  const { data: inserted, error } = await supabase
    .from("competitors")
    .insert({
      owner_id: user.id,
      youtube_channel_id: channel.channelId,
      handle: channel.handle,
      channel_title: channel.title,
      thumbnail_url: channel.thumbnail,
      uploads_playlist_id: channel.uploadsPlaylistId,
      color: PALETTE[(count ?? 0) % PALETTE.length],
    })
    .select("id, owner_id, uploads_playlist_id")
    .single();

  if (error) {
    if (error.code === "23505")
      return { error: `${channel.title} is already in your list.` };
    return { error: error.message };
  }

  try {
    const n = await syncCompetitor(supabase, inserted);
    revalidate();
    return { ok: `Added ${channel.title} — fetched ${n} videos.` };
  } catch (e) {
    revalidate();
    return {
      ok: `Added ${channel.title}, but the first sync failed: ${
        e instanceof Error ? e.message : "unknown error"
      }`,
    };
  }
}

export async function removeCompetitor(formData: FormData): Promise<void> {
  const { supabase } = await userClient();
  await supabase.from("competitors").delete().eq("id", String(formData.get("id")));
  revalidate();
}

export async function syncCompetitorAction(formData: FormData): Promise<void> {
  const { supabase } = await userClient();
  const { data } = await supabase
    .from("competitors")
    .select("id, owner_id, uploads_playlist_id")
    .eq("id", String(formData.get("id")))
    .single();
  if (data) await syncCompetitor(supabase, data);
  revalidate();
}

export async function syncAll(): Promise<void> {
  const { supabase } = await userClient();
  const { data } = await supabase
    .from("competitors")
    .select("id, owner_id, uploads_playlist_id");
  for (const c of data ?? []) await syncCompetitor(supabase, c);
  revalidate();
}
