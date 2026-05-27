import { load, save, loadString, saveString, remove } from "../core/storage.js";
import { getChatTitle, getChatMessages, addMessageToChat } from "./chat-storage.js";
import { addVoiceMessage, addTextMessage } from "./voice-message-renderer.js";
import {
  getCurrentChatId,
  setCurrentChatId
} from "./voice-state.js"
import {
  saveChatMessages,
  setChatTitle
} from "./chat-storage.js"
import { setSelectedVoice, getSelectedVoice } from "./voice-state.js";
import { tts } from "../core/api.js";

function renderChats(currentChatId) {
  const list = document.getElementById("chatList");
  if (!list) return;

  list.innerHTML = "";

  const chats = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (key.startsWith("voice_chat_") && !key.endsWith("_title")) {
      const id = key.replace("voice_chat_", "");
      const title = getChatTitle(id);
      chats.push({ id, title });
    }
  }

  chats.forEach(chat => {
    const item = document.createElement("div");

    item.className =
      "flex justify-between items-center p-2 rounded-xl cursor-pointer transition " +
      (chat.id === currentChatId
        ? "bg-purple-500/40 border border-purple-400"
        : "bg-white/10 hover:bg-white/20");

    const span = document.createElement("span");
    span.textContent = chat.title;
    span.className = "flex-1";
    span.onclick = () => loadChat(chat.id);
    span.ondblclick = () => renameChat(chat.id);

    const del = document.createElement("button");
    del.textContent = "✕";
    del.className = "ml-2 text-red-400";
    del.onclick = (e) => {
      e.stopPropagation();
      deleteChat(chat.id);
    };

    item.appendChild(span);
    item.appendChild(del);
    list.appendChild(item);
  });
}

function loadChat(id) {
  setCurrentChatId(id);

  renderChats(getCurrentChatId());

  const chat = document.getElementById("chat");
  if (!chat) return;

  chat.innerHTML = "";

  const messages = getChatMessages(id);

  messages.forEach(msg => {
    if (msg.type === "text") {
      addTextMessage(msg.role, msg.text);
    } else {
      addVoiceMessage(
        msg.role,
        msg.duration || 2,
        msg.text
      );
    }
  });

  chat.scrollTop = chat.scrollHeight;
}

function newChat() {
  const id = Date.now().toString();

  // создаём пустой чат
  saveChatMessages([], id);
  setChatTitle("New chat", id);

  // переключаемся на него
  setCurrentChatId(id);

  // очищаем экран
  const chat = document.getElementById("chat");
  if (chat) chat.innerHTML = "";

  // обновляем список чатов слева
  renderChats(getCurrentChatId());
}

function deleteChat(id) {
  if (!confirm("Delete this chat?")) return;

  remove("voice_chat_" + id);
  remove("voice_chat_" + id + "_title");

  setCurrentChatId("main");
  loadChat("main");
}

function renameChat(id) {
  const current =
    localStorage.getItem("voice_chat_" + id + "_title") || "";

  const name = prompt("Rename chat:", current);

  if (name && name.trim()) {
    setChatTitle(name.trim(), id);
    renderChats(getCurrentChatId());
  }
}

function initDefaultChat() {
  if (!localStorage.getItem("voice_chat_main")) {
    localStorage.setItem("voice_chat_main", JSON.stringify([]));
    localStorage.setItem("voice_chat_main_title", "Main chat");
  }
}

export function toggleVoiceMenu() {
  const menu = document.getElementById("voiceMenu");
  menu.classList.toggle("hidden");
}

export function setVoice(voice) {
  setSelectedVoice(voice);

  document.querySelectorAll('input[name="voice"]').forEach(r => {
    r.checked = (r.value === voice);
  });

  console.log("VOICE CHANGED TO:", getSelectedVoice());
}

export async function previewVoice(voice) {
  setVoice(voice);

  try {
    const blob = await tts("Hello! This is how I sound.", voice);

    const audio = new Audio(URL.createObjectURL(blob));
    audio.play();

  } catch (e) {
    console.error("Preview TTS error:", e);
  }
}

export function goBack() {
  window.location.href = "chat.html";
}

export {
  renderChats,
  loadChat,
  newChat,
  deleteChat,
  renameChat,
  initDefaultChat
};