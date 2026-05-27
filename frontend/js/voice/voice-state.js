import { loadString, saveString } from "../core/storage.js";

let selectedVoice =
  loadString("selectedVoice", "en-US-AriaNeural");

let currentChatId =
  loadString("last_chat_id", "main");

let currentLevel =
  loadString("selectedLevel", "A");

if (!["A", "B", "C"].includes(currentLevel)) {
  currentLevel = "A";
}

// CHAT ID
export function getCurrentChatId() {
  return currentChatId;
}

export function setCurrentChatId(id) {
  currentChatId = id;
  saveString("last_chat_id", id);
}

// VOICE
export function getSelectedVoice() {
  return selectedVoice;
}

export function setSelectedVoice(voice) {
  selectedVoice = voice;
  saveString("selectedVoice", voice);
}

// LEVEL
export function getCurrentLevel() {
  return currentLevel;
}

export function setCurrentLevel(level) {
  currentLevel = level;
  saveString("selectedLevel", level);
}


export function getLastChatId() {
  return loadString("last_chat_id", "main");
}