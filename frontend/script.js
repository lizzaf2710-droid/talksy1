import {appState} from "./js/core/state.js";
console.log ("STATE LOADED:", appState);
// ===============================
let currentChatId = "main";

let currentLevel = localStorage.getItem("level") || "B";

let savedWords = JSON.parse(localStorage.getItem("saved_words") || "[]");

let translationCache = {};

let wordsFilter = "all";

let flashIndex = 0;
let flashFlipped = false;

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
    // 🎬 SCENARIO MODE
    // =========================
    if (state.mode && state.mode !== "general" && scenarios[state.mode]) {

      const correction = await getCorrection(text);
      hideTyping();

      if (correction && !correction.includes("NO_CORRECTION")) {
        addMessage("ai", correction);
        saveMessage("ai", correction);
      } else {
        const reply = await getScenarioReply(state.mode, text);
        addMessage("ai", reply);
        saveMessage("ai", reply);
      }

      return;
    }

    // =========================
    // 💬 GENERAL MODE
    // =========================
    if (state.mode === "general") {

      const correction = await getCorrection(text);
      hideTyping();

      if (correction && !correction.includes("NO_CORRECTION")) {
        addMessage("ai", correction);
        saveMessage("ai", correction);
      }

      const reply = await getAIReply(text);

      addMessage("ai", reply);
      saveMessage("ai", reply);

      return;
    }

    // =========================
    // 🤖 DEFAULT MODE
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
  bubble.innerHTML = makeWordsClickable(text);


  bubble.querySelectorAll(".word").forEach(el => {
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    handleWordClick(el.innerText);
  });
});

  

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
    const res = await fetch("https://talksy-node-production.up.railway.app/chat", {

      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
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

    const chatHistory = JSON.parse(localStorage.getItem("chat_" + currentChatId)) || [];

    // берем последние 6 сообщений
    const lastMessages = chatHistory.slice(-6).map(m => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.text
    }));
    const state = getScenarioState();

    const res = await fetch("https://talksy-node-production.up.railway.app/chat", {

      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
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

IMPORTANT:
- ALWAYS remember the topic of conversation
- NEVER ask obvious or repetitive questions
- If the user already gave information → build on it
- DO NOT ask questions that contradict context
- If something is already known (e.g. tennis player → tennis), DO NOT ask about it again

STYLE:
- React naturally like a human
- Show opinion, not just questions
- Sometimes continue the topic instead of asking

AVOID:
- Avoid generic questions like "What do you think?"
- Avoid dumb questions like "What sport does he play?"

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

  const res = await fetch("https://talksy-node-production.up.railway.app/chat", {

    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
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

IMPORTANT:
- ALWAYS remember the topic of conversation
- NEVER ask obvious or repetitive questions
- If the user already gave information → build on it
- DO NOT ask questions that contradict context
- If something is already known (e.g. tennis player → tennis), DO NOT ask about it again

STYLE:
- React naturally like a human
- Show opinion, not just questions
- Sometimes continue the topic instead of asking

AVOID:
- Avoid generic questions like "What do you think?"
- Avoid dumb questions like "What sport does he play?"

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
  (chat.id === currentChatId
    ? "bg-purple-500/40 border border-purple-400"
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
  if (!confirm("Delete this chat?")) return;

  localStorage.removeItem("chat_" + id);
  localStorage.removeItem("chat_" + id + "_title");

  delete scenarioStates[id];

  loadChat("main");
}

// ===============================
function renameChat(id) {
  const current = localStorage.getItem("chat_" + id + "_title") || "";
  const name = prompt("Rename chat:", current);

  if (name && name.trim()) {
    localStorage.setItem("chat_" + id + "_title", name.trim());
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
    btn.classList.remove("bg-purple-500/30", "bg-purple-500/50");
    btn.classList.add("bg-purple-500/50");
  }
  
  document.getElementById("levelMenu").classList.add("hidden");
}
function toggleLevelMenu() {
  document.getElementById("levelMenu").classList.toggle("hidden");
}


function makeWordsClickable(text) {
  return cleanText(text)
    .split(" ")
    .map(word => {
      const clean = word.toLowerCase().replace(/[.,!?]/g, "");
      const isSaved = savedWords.find(w => w.word === clean);

      return `<span class="word ${isSaved ? "saved" : ""}">${word}</span>`;
    })
    .join(" ");
}


async function handleWordClick(word) {
  const clean = word.toLowerCase().replace(/[.,!?]/g, "");

  const existing = savedWords.find(w => w.word === clean);

  const translation = await translateWord(clean);

  if (!existing) {
    savedWords.push({
      word: clean,
      translation: translation,
      favorite: false,
      learned: false,
      repeats: 0,
      lastReviewed: null
      
    });

    localStorage.setItem("saved_words", JSON.stringify(savedWords));
  }

  showTooltip(clean, translation);

  document.querySelectorAll(".word").forEach(el => {
    if (el.innerText.toLowerCase().replace(/[.,!?]/g, "") === clean) {
      el.classList.add("saved");
    }
  });
}



async function translateWord(word) {
  if (translationCache[word]) return translationCache[word];

  try {
    const res = await fetch("https://talksy-node-production.up.railway.app/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Translate this word to Russian. Answer ONLY with translation."
          },
          { role: "user", content: word }
        ]
      })
    });

    const data = await res.json();
    const result = data.message?.content || "no translation";

    translationCache[word] = result; // 🔥 ВАЖНО

    return result;

  } catch {
    return "error";
  }
}




function showTooltip(word, translation) {
  const tooltip = document.createElement("div");

  tooltip.innerText = `${word} → ${translation}`;

  tooltip.style.position = "fixed";
  tooltip.style.bottom = "20px";
  tooltip.style.left = "50%";
  tooltip.style.transform = "translateX(-50%)";
  tooltip.style.background = "#111";
  tooltip.style.color = "white";
  tooltip.style.padding = "10px 14px";
  tooltip.style.borderRadius = "10px";
  tooltip.style.zIndex = "999";

  document.body.appendChild(tooltip);

  setTimeout(() => tooltip.remove(), 2500);
}



function openWords() {
  document.getElementById("wordsScreen").classList.remove("hidden");
  renderWords();
  updateWordsCounters();
  updateProgress();
}

function closeWords() {
  document.getElementById("wordsScreen").classList.add("hidden");
}



async function renderWords() {
  const list = document.getElementById("wordsList");
  list.innerHTML = "";

  let filtered = savedWords;

  if (wordsFilter === "favorites") {
    filtered = savedWords.filter(w => w.favorite);
  }

  for (let word of filtered) {
    const translation = word.translation || await translateWord(word.word);

    const isFav = word.favorite;

    const item = document.createElement("div");
    item.className = "flex justify-between items-center bg-white/10 p-3 rounded-xl";

    item.innerHTML = `
  <div>
    <div class="font-bold">${word.word}</div>
    <div class="text-sm opacity-70">${translation}</div>
  </div>

  <div class="flex items-center gap-3">

    <button onclick="speakWord('${word.word}')" class="text-lg">
      🔊
    </button>

    <!-- ⭐ favorite -->
    <button onclick="toggleFavorite('${word.word}')" class="text-xl">
      ${word.favorite ? "⭐" : "○"}
    </button>

    <!-- ❌ delete -->
    <button onclick="removeWord('${word.word}')" class="text-red-400 text-lg">
      ✕
    </button>

  </div>
`;

    list.appendChild(item);
  }
}

function removeWord(word) {
  savedWords = savedWords.filter(w => w.word !== word);
  localStorage.setItem("saved_words", JSON.stringify(savedWords));

  renderWords();

  document.querySelectorAll(".word").forEach(el => {
    const clean = el.innerText.toLowerCase().replace(/[.,!?]/g, "");
    if (clean === word) {
      el.classList.remove("saved");
    }
  });
}

function setWordsFilter(type) {
  wordsFilter = type;
  renderWords();
  updateWordsCounters();
  updateProgress();
}


function toggleFavorite(word) {
  const item = savedWords.find(w => w.word === word);
  if (!item) return;

  item.favorite = !item.favorite;

  localStorage.setItem("saved_words", JSON.stringify(savedWords));

  renderWords();
  updateWordsCounters();
  updateProgress();
}



function openFlashcards() {
  document.getElementById("flashcardsScreen").classList.remove("hidden");
  flashIndex = 0;
  flashFlipped = false;
  renderFlashcard();
}


function closeFlashcards() {
  document.getElementById("flashcardsScreen").classList.add("hidden");
}


function renderFlashcard() {
  const card = document.getElementById("flashcard");

  const studyWords = getStudyWords();

  if (!studyWords.length) {
    card.innerHTML = "🎉 You learned all words!";
    return;
  }

  const word = studyWords[flashIndex];

  if (!flashFlipped) {
    card.innerHTML = `<div>${word.word}</div>`;
  } else {
    card.innerHTML = `
      <div>${word.translation || "..."}</div>

      <div class="flex gap-6 mt-5 justify-center text-2xl">

        <button onclick="markDontKnow(event)" class="opacity-70 hover:opacity-100">
          ○ ✖
        </button>

        <button onclick="markKnow(event)" class="opacity-70 hover:opacity-100">
          ○ ✔
        </button>

      </div>
    `;
  }
}



function flipCard() {
  flashFlipped = !flashFlipped;
  renderFlashcard();
}


function nextCard() {
  const studyWords = getStudyWords();
  if (!studyWords.length) return;

  flashIndex = (flashIndex + 1) % studyWords.length;
  flashFlipped = false;
  renderFlashcard();
}


function prevCard() {
  const studyWords = getStudyWords();
  if (!studyWords.length) return;

  flashIndex = (flashIndex - 1 + studyWords.length) % studyWords.length;
  flashFlipped = false;
  renderFlashcard();
}


function updateWordsCounters() {
  const allCount = savedWords.length;

  const favCount = savedWords.filter(w => w.favorite).length;

  document.getElementById("allCount").innerText = allCount;
  document.getElementById("favCount").innerText = favCount;
}




function updateProgress() {
  const total = savedWords.length;
  const learned = savedWords.filter(w => w.learned).length;

  const percent = total === 0 ? 0 : Math.round((learned / total) * 100);

  document.getElementById("totalCount").innerText = total;
  document.getElementById("learnedCount").innerText = learned;
  document.getElementById("progressPercent").innerText = percent;

  document.getElementById("progressBar").style.width = percent + "%";
}


function markKnow(e) {
  e.stopPropagation();

  const studyWords = getStudyWords();
  const word = studyWords[flashIndex];

  word.learned = true;

  localStorage.setItem("saved_words", JSON.stringify(savedWords));

  updateProgress();
  nextCard();
}

function markDontKnow(e) {
  e.stopPropagation();

  const studyWords = getStudyWords();
  const word = studyWords[flashIndex];

  word.learned = false;

  localStorage.setItem("saved_words", JSON.stringify(savedWords));

  updateProgress();
  nextCard();
}

function getStudyWords() {
  return savedWords.filter(w => !w.learned);
}

function speakWord(word) {
  const utterance = new SpeechSynthesisUtterance(word);

  utterance.lang = "en-US"; // английский
  utterance.rate = 0.9; // скорость (0.8–1 норм)

  speechSynthesis.speak(utterance);
}


window.openVoice = function () {
  window.location.href = "./voice.html";
};

window.goHome = function () {
  window.location.href = "./index.html";
};





// ===============================
window.setMode = setMode;
window.newChat = newChat;
window.sendMessage = sendMessage;
window.loadChat = loadChat;
window.deleteChat = deleteChat;
window.renameChat = renameChat;
window.openVoice = openVoice;
window.state = appState;