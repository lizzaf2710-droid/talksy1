const NODE_API = "https://talksy-node-production.up.railway.app";
const VOICE_API ="https://web-production-33e9e.up.railway.app";

/**
 * Универсальный JSON-запрос
 */
async function request(endpoint, options = {}) {
    const config = {
        method: options.method || "GET",
        headers: {
            ...(options.body && !(options.body instanceof FormData)
                ? { "Content-Type": "application/json" }
                : {}),
            ...(options.headers || {})
        }
    };

    if (options.body) {
        config.body =
            options.body instanceof FormData
                ? options.body
                : JSON.stringify(options.body);
    }

    const res = await fetch(NODE_API + endpoint, config);

    let data;
    const contentType = res.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
        data = await res.json();
    } else {
        data = await res.text();
    }

    if (!res.ok) {
        throw new Error(
            `API error ${res.status}: ${data?.message || data || "Unknown error"}`
        );
    }

    return data;
}

/* =========================
   CHAT API
========================= */

export async function sendChatMessage({ message, chatId, level, scenario }) {
    return request("/chat", {
        method: "POST",
        body: {
            message,
            chatId,
            level,
            scenario
        }
    });
}

/* =========================
   SPEECH / VOICE API
   (оставляем FormData как есть)
========================= */

export async function sendVoiceAudio(formData) {
    return request("/speech", {
        method: "POST",
        body: formData
    });
}

/* =========================
   MEMORY API
========================= */

export async function saveMemory(memory) {
    return request("/memory/save", {
        method: "POST",
        body: memory
    });
}

export async function getMemory(userId) {
    return request(`/memory/${userId}`);
}

/* =========================
   FLASHCARDS API
========================= */

export async function getFlashcards(level) {
    return request(`/flashcards?level=${level}`);
}

export async function saveFlashcard(card) {
    return request("/flashcards/save", {
        method: "POST",
        body: card
    });
}

export async function chat(messages) {
  return request("/chat", {
    method: "POST",
    body: { messages }
  });
}

export async function speech(formData) {
  const res = await fetch("https://web-production-33e9e.up.railway.app/speech", {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Speech error");
  }

  return res.blob();
}


export async function tts(text, voice) {
  const res = await fetch("https://web-production-33e9e.up.railway.app/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      voice
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "TTS error");
  }

  return await res.blob();
}

/* =========================
   EXPORT CORE REQUEST
========================= */

export { request };