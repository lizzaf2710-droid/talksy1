import { chat } from "../core/api.js";
import {
  getChatHistory,
  setChatTitle
} from "./chat-storage.js";
import { addVoiceMessage } from "./voice-message-renderer.js";
import { saveVoiceMessage } from "./chat-storage.js";
import { playTTS } from "./tts-player.js";
import { getChatTitle } from "./chat-storage.js"
import { getLevel } from "./voice-level.js";

let isProcessingAI = false;

export async function handleAIResponse(text, {
  currentChatId,
  getLevel,
  renderChats,
  selectedVoice
}) {
  if (isProcessingAI) return;
  isProcessingAI = true;

  try {
    console.log("INPUT:", text);

    // 1. grammar check
    const correctionData = await chat([
      {
        role: "system",
        content: `
You are a strict English grammar checker.

If mistakes exist:
Correct: <fixed sentence>
Explanation: <short explanation in Russian>

If no mistakes:
NO_ERRORS

Return ONLY this format.
`
      },
      {
        role: "user",
        content: text
      }
    ]);

    const msg = correctionData.message?.content?.trim() || "NO_ERRORS";
    const hasErrors = msg.startsWith("Correct:");

    let correctedText = text;
    let explanation = "";

    if (hasErrors) {
      const correctMatch = msg.match(/Correct:\s*(.+)/i);
      const explanationMatch = msg.match(/Explanation:\s*(.+)/i);

      correctedText = correctMatch
        ? correctMatch[1].split("\n")[0].trim()
        : text;

      explanation = explanationMatch
        ? explanationMatch[1].trim()
        : "";
    }

    // correction message
    if (hasErrors) {
      const correctionMessage =
        `💡 ${explanation}\n\nCorrected: ${correctedText}`;

      // ⚠️ сюда позже можно вынести addTextMessage
      console.warn("Correction:", correctionMessage);
    }

    if (typeof getChatTitle === "function" && getChatTitle(currentChatId) === "New chat") {
      setChatTitle(
        correctedText.slice(0, 30),
        currentChatId
      );
      renderChats?.();
    }

    // 3. system prompt

// НЕ МУТИРУЕМ ORIGINAL
const history = [...getChatHistory(currentChatId)];

const trimmedHistory = history.slice(-12);

const safeHistory = [
  {
    role: "system",
    content: `
You are a friendly English tutor.

Current student level: ${getLevel()}

Rules:
- Level A: very simple words, short sentences (5–8 words)
- Level B: normal everyday English
- Level C: advanced natural English, idioms allowed

Always adapt your responses.
Reply in 1–2 sentences and ask 1 follow-up question.
`
  },
  ...trimmedHistory,
  {
    role: "user",
    content: correctedText
  }
];

    // 4. AI request
    const replyData = await chat(safeHistory);

    const reply =
      replyData.message?.content?.trim() ||
      "That's interesting! Tell me more.";

    const history = getChatHistory(currentChatId).slice(-20);

    history.push({
      role: "user",
      content: correctedText
    });

    history.push({
      role: "assistant",
      content: reply
    });  

    // 5. bubble creation (UI responsibility stays in voice.js)
    const duration = Math.max(1, Math.ceil(reply.split(" ").length / 3));

    const bubble = addVoiceMessage("ai", duration, reply);
    saveVoiceMessage({
      role: "assistant",
      text: reply,
      duration,
      type: "voice"
    }, currentChatId);

    // 6. TTS
    await new Promise(r => setTimeout(r, 300));
    playTTS(reply, bubble, selectedVoice);

  } catch (e) {
    console.error("AI ERROR:", e);
  } finally {
    isProcessingAI = false;
  }
}

export async function getAIReply(userText) {
  const data = await chat([
    {
      role: "system",
      content: `You are a helpful English tutor. Level: ${getLevel()}`
    },
    {
      role: "user",
      content: userText
    }
  ]);

  return data.message?.content?.trim() || "OK!";
}