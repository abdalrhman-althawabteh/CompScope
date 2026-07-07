"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { SparkIcon, PlusIcon } from "@/components/icons";

type Msg = { role: "user" | "assistant"; content: string };
type Convo = { id: string; title: string | null; updated_at: string };

const QUICK_PROMPTS = [
  "Give me 3 video ideas based on my competitors",
  "Which competitor is winning this week?",
  "What topics are my competitors posting most?",
];

export function AssistantChat({
  conversations,
  conversationId,
  initialMessages,
  hasCompetitors,
}: {
  conversations: Convo[];
  conversationId: string | null;
  initialMessages: Msg[];
  hasCompetitors: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [convoId, setConvoId] = useState<string | null>(conversationId);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || sending) return;
    setInput("");
    setError(null);
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setSending(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convoId, message: msg }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      const isNew = !convoId;
      setConvoId(data.conversationId);
      if (isNew) router.refresh(); // update the conversation rail
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_1fr]">
      {/* conversation rail */}
      <Card className="flex h-fit flex-col gap-2">
        <Link
          href="/assistant"
          className="mb-1 flex items-center justify-center gap-1.5 rounded-xl bg-accent py-2.5 text-sm font-semibold text-accent-ink"
        >
          <PlusIcon width={16} height={16} /> New chat
        </Link>
        {conversations.length === 0 ? (
          <p className="px-1 py-2 text-xs text-faint">No conversations yet.</p>
        ) : (
          conversations.map((c) => (
            <Link
              key={c.id}
              href={`/assistant?c=${c.id}`}
              className={
                "truncate rounded-xl px-3 py-2 text-sm " +
                (c.id === convoId
                  ? "bg-panel-2 text-fg"
                  : "text-muted hover:bg-panel-2 hover:text-fg")
              }
            >
              {c.title || "Untitled"}
            </Link>
          ))
        )}
      </Card>

      {/* chat panel */}
      <Card className="flex min-h-[520px] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <SparkIcon width={28} height={28} className="text-accent" />
              <p className="max-w-sm text-muted">
                {hasCompetitors
                  ? "Ask me anything about your competitors, or try a prompt below."
                  : "Add some competitors first so I have data to analyze."}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    disabled={!hasCompetitors}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:text-fg disabled:opacity-40"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed " +
                    (m.role === "user"
                      ? "bg-accent text-accent-ink"
                      : "bg-panel-2 text-fg")
                  }
                >
                  {m.content}
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-panel-2 px-4 py-3 text-sm text-muted">
                Thinking…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {error && <p className="mt-3 text-sm text-flame">{error}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mt-4 flex items-center gap-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your competitors…"
            className="flex-1 rounded-xl border border-border bg-panel-2 px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-ink disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </Card>
    </div>
  );
}
