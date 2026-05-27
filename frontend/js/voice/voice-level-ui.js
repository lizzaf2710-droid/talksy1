import {
  getCurrentChatId,
  setCurrentLevel,
  getCurrentLevel
} from "./voice-state.js";

import {
  getChatMessages
} from "./chat-storage.js";

import {
  addTextMessage,
  addVoiceMessage
} from "./voice-message-renderer.js";



export function updateLevelButton() {
  const btn = document.getElementById("levelButton");
  if (btn) {
    btn.textContent = `Level ${getCurrentLevel()}`;
  }
}


export function setLevel(level) {
  setCurrentLevel(level);

  document.querySelectorAll('input[name="level"]').forEach(r => {
    r.checked = (r.value === getCurrentLevel());
  });

  updateLevelButton();

  console.log("LEVEL CHANGED TO:", level);

  const chat = document.getElementById("chat");
  if (!chat) return;

  const messages = getChatMessages(getCurrentChatId());

  chat.innerHTML = "";

  messages.forEach(msg => {
    if (msg.type === "text") {
      addTextMessage(msg.role, msg.text);
    } else {
      addVoiceMessage(msg.role, msg.duration || 2, msg.text);
    }
  });
}


export function toggleLevelMenu() {
  document.getElementById("levelMenu").classList.toggle("hidden");
}