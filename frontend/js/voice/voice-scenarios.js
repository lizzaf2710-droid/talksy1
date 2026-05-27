import { chat } from "../core/api.js";
import { getSystemPrompt } from "./voice-level.js";

export async function getScenarioReply(mode, userText) {
  const data = await chat([
    {
      role: "system",
      content: getSystemPrompt(mode)
    },
    {
      role: "user",
      content: userText || "Start the conversation"
    }
  ]);

  return data.message?.content?.trim() || "Tell me more!";
}
