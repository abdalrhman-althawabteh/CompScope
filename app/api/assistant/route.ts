import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chat, type ChatMessage } from "@/lib/ai";
import { buildSystemPrompt } from "@/lib/ai/context";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId, message } = await request.json();
  const text = String(message ?? "").trim();
  if (!text) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  // Reuse or create the conversation.
  let convoId: string = conversationId;
  if (!convoId) {
    const { data, error } = await supabase
      .from("ai_conversations")
      .insert({ owner_id: user.id, title: text.slice(0, 40) })
      .select("id")
      .single();
    if (error || !data)
      return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
    convoId = data.id;
  }

  // Persist the user's message, then load the full thread (RLS scopes to this user).
  await supabase
    .from("ai_messages")
    .insert({ conversation_id: convoId, owner_id: user.id, role: "user", content: text });

  const { data: history } = await supabase
    .from("ai_messages")
    .select("role, content")
    .eq("conversation_id", convoId)
    .order("created_at", { ascending: true });

  const messages = (history ?? []) as ChatMessage[];
  const system = await buildSystemPrompt(supabase);

  let reply: string;
  try {
    reply = await chat({ system, messages });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI request failed" },
      { status: 500 },
    );
  }

  await supabase
    .from("ai_messages")
    .insert({ conversation_id: convoId, owner_id: user.id, role: "assistant", content: reply });
  await supabase
    .from("ai_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", convoId);

  return NextResponse.json({ conversationId: convoId, reply });
}
