import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { ChatParams } from "./types";

// Anthropic (Claude) adapter. Non-streaming — replies are short.
export async function anthropicChat({ system, messages }: ChatParams): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: process.env.AI_MODEL || "claude-opus-4-8",
    max_tokens: 4096,
    system,
    messages,
  });
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}
