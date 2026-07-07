import "server-only";
import type { ChatParams } from "./types";
import { anthropicChat } from "./anthropic";

// Provider-swappable entry point. Default: anthropic. Set AI_PROVIDER=openai once
// an OpenAI adapter exists (not built yet — chosen provider is Claude).
export async function chat(params: ChatParams): Promise<string> {
  const provider = process.env.AI_PROVIDER || "anthropic";
  switch (provider) {
    case "anthropic":
      return anthropicChat(params);
    default:
      throw new Error(`AI_PROVIDER "${provider}" is not implemented yet.`);
  }
}

export type { ChatMessage, ChatParams } from "./types";
