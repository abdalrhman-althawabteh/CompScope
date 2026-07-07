"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { SparkIcon, ChevronRight } from "@/components/icons";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  "Give me 3 video ideas",
  "Who's winning this week?",
  "What should I post next?",
];

// Compact chat wired to /api/assistant, embedded on the dashboard's mint card.
export function DashboardChat({ hasCompetitors }: { hasCompetitors: boolean }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [convoId, setConvoId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0 || sending)
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
      setConvoId(data.conversationId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full min-h-[320px] flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <SparkIcon width={20} height={20} /> Ask the AI
        </div>
        <Link
          href={convoId ? `/assistant?c=${convoId}` : "/assistant"}
          className="flex items-center gap-0.5 text-sm font-medium opacity-70 transition-opacity hover:opacity-100"
        >
          Full assistant <ChevronRight width={14} height={14} />
        </Link>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 280 }}>
        {messages.length === 0 ? (
          <div className="flex h-full flex-col justify-center gap-3">
            <p className="max-w-xs text-[15px] leading-relaxed">
              {hasCompetitors
                ? "Ask about your competitors' latest uploads — right from here."
                : "Add competitors first so I have data to analyze."}
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  disabled={!hasCompetitors}
                  className="rounded-full bg-white/50 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/75 disabled:opacity-40"
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
                  "pop-in max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed " +
                  (m.role === "user" ? "bg-black text-white" : "bg-white/70")
                }
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="pop-in rounded-2xl bg-white/70 px-3.5 py-2.5 text-sm opacity-70">
              Thinking…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && <p className="mt-2 text-sm text-flame">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your competitors…"
          disabled={!hasCompetitors}
          className="min-w-0 flex-1 rounded-xl bg-white/60 px-4 py-2.5 text-sm placeholder-[#4b5e42] outline-none transition-colors focus:bg-white/80 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
