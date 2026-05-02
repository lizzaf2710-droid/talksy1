// ===============================
let currentChatId = "main";

let currentLevel = localStorage.getItem("level") || "B";

// 🔥 сценарии
const scenarios = {
  cafe: {
    topic: "Ordering food and drinks in a café",
    style: "polite barista"
  },

  interview: {
    topic: "Job interview in English",
    style: "professional interviewer"
  },

  travel: {
    topic: "Airport / travel conversation",
    style: "airport assistant"
  },

  friends: {
    topic: "Casual teen friendship conversation",
    style: "Gen Z slang, relaxed, emotional, funny"
  }
};
// 🔥 состояние ПЕР ЧАТ
let scenarioStates = {};

function getScenarioState() {
  if (!scenarioStates[currentChatId]) {
    scenarioStates[currentChatId] = {
      mode: null,
      step: 0
    };
  }
  return scenarioStates[currentChatId];
}

// ===============================
window.onload = function () {

const savedLevel = localStorage.getItem("level") || "B";
currentLevel = savedLevel;

const label = document.getElementById("levelLabel");
if (label) label.innerText = savedLevel;

const btn = document.getElementById("levelBtn");
if (btn) {
  btn.classList.remove("bg-white/10", "bg-purple-500");
  btn.classList.add("bg-purple-500");
}



const params = new URLSearchParams(window.location.search);
const idFromUrl = params.get("id");

  initDefaultChat();
  renderChats();

const pendingMode = localStorage.getItem("pending_mode");
if (pendingMode) {
  setMode(pendingMode);
  localStorage.removeItem("pending_mode");
}

  const chatId = idFromUrl || localStorage.getItem("active_chat") || "main";
loadChat(chatId);

// проверяем сценарий
const pending = localStorage.getItem("pending_mode_" + chatId);

if (pending) {
  setMode(pending);
  localStorage.removeItem("pending_mode_" + chatId);
}


  const input = document.getElementById("input");

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
};

// ===============================
function initDefaultChat() {
  if (!localStorage.getItem("chat_main")) {
    localStorage.setItem("chat_main", JSON.stringify([]));
    localStorage.setItem("chat_main_title", "Main chat");
  }
}

// ===============================
function cleanText(text) {
  return (text || "")
    .replace(/\r/g, "")
    .replace(/^\s+|\s+$/g, "")
    .replace(/\n{3,}/g, "\n\n");
}

// ===============================
function loadChat(id) {
  currentChatId = id;
  localStorage.setItem("active_chat", id);

  const chatBox = document.getElementById("chat");
  chatBox.innerHTML = "";

  let messages = JSON.parse(localStorage.getItem("chat_" + id)) || [];

  messages.forEach(m => {
    if (m.type === "system") {
      addSystemMessage(m.text, false);
    } else {
      addMessage(m.role, m.text);
    }
  });

  renderChats();
}

// ===============================
async function sendMessage() {
  const input = document.getElementById("input");
  const text = cleanText(input.value);

  if (!text) return;

  addMessage("user", text);
  saveMessage("user", text);

  input.value = "";
  showTyping();

  const state = getScenarioState();

  try {

   // =========================
// 🎬 SCENARIOS (DYNAMIC)
// =========================
if (state.mode && state.mode !== "general" && scenarios[state.mode]) {

  // 1. проверка ошибки
  const correction = await getCorrection(text);

  hideTyping();

  if (correction && !correction.includes("NO_CORRECTION")) {
    addMessage("ai", correction);
    saveMessage("ai", correction);
  }

  // 2. ответ сценария (как живой диалог)
  const reply = await getScenarioReply(state.mode, text);

  addMessage("ai", reply);
  saveMessage("ai", reply);

  return;
}
    // =========================
    // 💬 GENERAL MODE (ВСЕГДА с исправлением)
    // =========================
    if (state.mode === "general") {

      const correction = await getCorrection(text);
      hideTyping();

      if (correction) {
        addMessage("ai", correction);
        saveMessage("ai", correction);
      }

      const reply = await getAIReply(text);

      addMessage("ai", reply);
      saveMessage("ai", reply);

      return;
    }

    // =========================
    // 🤖 FALLBACK (если режим не выбран)
    // =========================
    const reply = await getAIReply(text);
    hideTyping();

    addMessage("ai", reply);
    saveMessage("ai", reply);

  } catch (err) {
    console.error(err);
    hideTyping();
    addMessage("ai", "⚠️ Error");
  }
}

// ===============================
function addMessage(role, text) {
  const chat = document.getElementById("chat");

  const wrapper = document.createElement("div");
  wrapper.style.margin = "6px 0";

  const bubble = document.createElement("div");
  bubble.innerText = cleanText(text);

  bubble.style.display = "inline-block";
  bubble.style.padding = "10px 14px";
  bubble.style.borderRadius = "12px";
  bubble.style.maxWidth = "80%";
  bubble.style.whiteSpace = "pre-wrap";

  if (role === "user") {
    wrapper.style.textAlign = "right";
    bubble.style.background = "#a855f7";
    bubble.style.color = "white";
  } else {
    wrapper.style.textAlign = "left";
    bubble.style.background = "rgba(255,255,255,0.1)";
    bubble.style.color = "white";
  }

  wrapper.appendChild(bubble);
  chat.appendChild(wrapper);

  chat.scrollTop = chat.scrollHeight;
}

// ===============================
function addSystemMessage(text, save = true) {
  const chat = document.getElementById("chat");

  const wrapper = document.createElement("div");
  wrapper.style.textAlign = "center";
  wrapper.style.margin = "10px 0";

  const bubble = document.createElement("div");
  bubble.innerText = text;

  bubble.style.padding = "6px 12px";
  bubble.style.borderRadius = "10px";
  bubble.style.fontSize = "12px";
  bubble.style.background = "rgba(20,184,166,0.15)";
  bubble.style.color = "#2dd4bf";

  wrapper.appendChild(bubble);
  chat.appendChild(wrapper);

  if (save) saveSystemMessage(text);
}

// ===============================
function saveSystemMessage(text) {
  let chat = JSON.parse(localStorage.getItem("chat_" + currentChatId)) || [];
  chat.push({ type: "system", text });
  localStorage.setItem("chat_" + currentChatId, JSON.stringify(chat));
}

// ===============================
function showTyping() {
  const chat = document.getElementById("chat");

  const typing = document.createElement("div");
  typing.id = "typing";
  typing.innerText = "AI is typing...";
  typing.style.opacity = "0.6";

  chat.appendChild(typing);
}

// ===============================
function hideTyping() {
  const typing = document.getElementById("typing");
  if (typing) typing.remove();
}

// ===============================
async function getCorrection(text) {
  try {
    const res = await fetch("https://talksy1-production.up.railway.app/chat", {

      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        messages: [
          {
            role: "system",
            content: `
You are a strict but smart English checker.

TASK:
Decide if correction is needed.

RULES:
- If sentence is correct OR natural slang → respond ONLY: NO_CORRECTION
- If there are real grammar mistakes → fix them

OUTPUT FORMAT (ONLY if correction needed):
Corrected: ...
Explanation: 1 short sentence

DO NOT:
- correct slang like "wassup", "bro", "I'm down"
- change tone or style
`
          },
          { role: "user", content: text }
        ]
      })
    });

    const data = await res.json();
    return cleanText(data.message?.content || "");

  } catch {
    return "";
  }
}
// ===============================
async function getAIReply(text) {
  try {
    const state = getScenarioState();

    const res = await fetch("https://talksy1-production.up.railway.app/chat", {

      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        messages: [
          {
            role: "system",
            content: `
${getLevelPrompt()}

You are a friendly English tutor.

Mode: ${state.mode || "normal"}

Behavior rules:
- At LEVEL A: speak like simple tutor, slow thinking, basic words
- At LEVEL B: natural conversational English, friendly tone
- At LEVEL C: native speaker, expressive, emotional, flexible grammar

If mode = friends:
- slang
- casual
- short answers
`
          },
          { role: "user", content: text }
        ]
      })
    });

    const data = await res.json();
    return cleanText(data.message?.content || "No response");

  } catch {
    return "AI error";
  }
}


async function getScenarioReply(mode, userText) {
  const scenario = scenarios[mode];

  const res = await fetch("https://talksy1-production.up.railway.app/chat", {

    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3",
      messages: [
        {
          role: "system",
          content: `
          You are a real human roleplaying conversation.
          Level: ${currentLevel}

${getLevelPrompt()}

Level affects EVERYTHING you say:
- vocabulary
- sentence length
- question complexity

Behavior rules:
- At LEVEL A: speak like simple tutor, slow thinking, basic words
- At LEVEL B: natural conversational English, friendly tone
- At LEVEL C: native speaker, expressive, emotional, flexible grammar

Topic: ${scenario.topic}
Style: ${scenario.style}

RULES:
- speak naturally like a real person
- DO NOT always correct grammar (only if obvious mistake)
- respond emotionally or contextually
- sometimes ask a question, sometimes just react
- NEVER sound like a teacher
- 1–2 short sentences max
`
        },
        {
          role: "user",
          content: userText || "Start conversation"
        }
      ]
    })
  });

  const data = await res.json();
  return cleanText(data.message?.content || "");
}

// ===============================
function saveMessage(role, text) {
  let chat = JSON.parse(localStorage.getItem("chat_" + currentChatId)) || [];
  chat.push({ role, text });
  localStorage.setItem("chat_" + currentChatId, JSON.stringify(chat));
}

// ===============================
function setMode(mode) {
  const state = getScenarioState();

  state.mode = mode;
  state.step = 0;

  if (mode === "general") {
    addSystemMessage("💬 General mode (free chat + corrections)");
    return;
  }

  if (scenarios[mode]) {
    addSystemMessage(`🎬 ${mode.toUpperCase()} scenario started`);

    setTimeout(async () => {
  const chat = document.getElementById("chat");

  // 1. показываем "печатает"
  showTyping();

  try {
    const first = await getScenarioReply(mode, "");

    // 2. небольшая задержка — ощущение мышления
    setTimeout(() => {
      hideTyping();

      addMessage("ai", first);
      saveMessage("ai", first);
    }, 800);

  } catch (e) {
    hideTyping();
    addMessage("ai", "...");
  }
}, 300);
  }
}
// ===============================
function renderChats() {
  const list = document.getElementById("chatList");
  if (!list) return;

  list.innerHTML = "";

  // 🔥 берем только реальные чаты, а не мусор localStorage
  const chats = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (key.startsWith("chat_") && !key.includes("_title")) {
      const id = key.replace("chat_", "");

      chats.push({
        id,
        title: localStorage.getItem("chat_" + id + "_title") || "Chat"
      });
    }
  }

  // 🔥 сортируем (main всегда сверху если есть)
  chats.sort((a, b) => {
    if (a.id === "main") return -1;
    if (b.id === "main") return 1;
    return b.id.localeCompare(a.id);
  });

  chats.forEach(chat => {
    const item = document.createElement("div");

    const isActive = chat.id === currentChatId;

    item.className =
      "flex justify-between items-center p-2 rounded-xl mb-2 cursor-pointer transition " +
      (isActive
        ? "bg-purple-500/30 border border-purple-400"
        : "bg-white/10 hover:bg-white/20");

    const span = document.createElement("span");
    span.textContent = chat.title;
    span.style.flex = "1";
    span.onclick = () => {
  loadChat(chat.id);
  toggleSidebar(); // 👈 закрываем после клика
};
    span.ondblclick = () => renameChat(chat.id);

    const btn = document.createElement("button");
    btn.textContent = "✕";
    btn.style.marginLeft = "8px";
    btn.style.color = "#f87171";
    btn.onclick = (e) => {
      e.stopPropagation(); // 🔥 ВАЖНО (иначе ломает UI)
      deleteChat(chat.id);
    };

    item.appendChild(span);
    item.appendChild(btn);

    list.appendChild(item);
  });
}

// ===============================
function newChat() {
  const id = Date.now().toString();

  localStorage.setItem("chat_" + id, JSON.stringify([]));
  localStorage.setItem("chat_" + id + "_title", "New chat");

  loadChat(id);
}

// ===============================
function deleteChat(id) {
  localStorage.removeItem("chat_" + id);
  localStorage.removeItem("chat_" + id + "_title");

  delete scenarioStates[id];

  loadChat("main");
}

// ===============================
function renameChat(id) {
  const name = prompt("Rename chat:");
  if (name) {
    localStorage.setItem("chat_" + id + "_title", name);
    renderChats();
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  const isOpen = sidebar.classList.contains("translate-x-0");

  if (isOpen) {
    sidebar.classList.remove("translate-x-0");
    sidebar.classList.add("-translate-x-full");
    overlay.classList.add("hidden");
  } else {
    sidebar.classList.remove("-translate-x-full");
    sidebar.classList.add("translate-x-0");
    overlay.classList.remove("hidden");
  }
}

function getLevelPrompt() {
  if (currentLevel === "A") {
    return `
LEVEL A (Beginner):
- Use VERY simple English (A1-A2)
- Max 1 short sentence
- Max 6–10 words per sentence
- Use basic vocabulary only (eat, go, want, like)
- NO idioms, NO phrasal verbs
- Ask simple questions like "What is this?", "Do you like it?"
- Speak like teacher talking to beginner child
`;
  }

  if (currentLevel === "B") {
    return `
LEVEL B (Intermediate):
- Use natural everyday English (B1-B2)
- 1–2 sentences max
- Can use basic phrasal verbs (go out, come back)
- Simple explanations allowed
- Ask normal conversational questions
`;
  }

  if (currentLevel === "C") {
    return `
LEVEL C (Advanced):
- Natural native English (C1-C2)
- 2–3 sentences max
- Use idioms, phrasal verbs, natural expressions
- More emotional and expressive language
- Ask deeper, open-ended questions
`;
  }
}


function setLevel(level) {
  currentLevel = level;
  localStorage.setItem("level", level);

  document.getElementById("levelLabel").innerText = level;

  const btn = document.getElementById("levelBtn");

  if (btn) {
    btn.classList.remove("bg-white/10", "bg-purple-500");
    btn.classList.add("bg-purple-500");
  }
  
  document.getElementById("levelMenu").classList.add("hidden");
}
function toggleLevelMenu() {
  document.getElementById("levelMenu").classList.toggle("hidden");
}


// ===============================
window.setMode = setMode;
window.newChat = newChat;
window.sendMessage = sendMessage;
window.loadChat = loadChat;
window.deleteChat = deleteChat;
window.renameChat = renameChat;