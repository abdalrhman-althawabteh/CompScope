export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ChatParams = {
  system: string;
  messages: ChatMessage[];
};
