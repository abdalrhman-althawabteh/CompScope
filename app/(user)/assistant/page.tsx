import { Topbar } from "@/components/ui/Topbar";
import { createClient } from "@/lib/supabase/server";
import { AssistantChat } from "./AssistantChat";

type Msg = { role: "user" | "assistant"; content: string };
type Convo = { id: string; title: string | null; updated_at: string };

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const supabase = await createClient();

  const [{ data: convos }, { count: competitorCount }, messages] = await Promise.all([
    supabase
      .from("ai_conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(30),
    supabase.from("competitors").select("id", { count: "exact", head: true }),
    c
      ? supabase
          .from("ai_messages")
          .select("role, content")
          .eq("conversation_id", c)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as Msg[] }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Topbar stat="AI Assistant" />
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">AI Assistant</h1>
        <p className="mt-2 text-muted">
          Ask about your competitors and get video ideas grounded in your data.
        </p>
      </div>

      <AssistantChat
        key={c ?? "new"}
        conversations={(convos ?? []) as Convo[]}
        conversationId={c ?? null}
        initialMessages={(messages.data ?? []) as Msg[]}
        hasCompetitors={(competitorCount ?? 0) > 0}
      />
    </div>
  );
}
