import {
  load,
  save,
  loadString,
  saveString,
  remove
} from "../core/storage.js";

export function getChatKey(id) {
  return `voice_chat_${id}`;
}

export function getChatTitleKey(id) {
  return `voice_chat_${id}_title`;
}

export function getChatMessages(id) {
  return load(getChatKey(id), []);
}

export function saveChatMessages(messages, id) {
  save(getChatKey(id), messages);
}

export function addMessageToChat(message, id) {
  const messages = getChatMessages(id);

  messages.push({
    ...message,
    time: Date.now()
  });

  saveChatMessages(messages, id);
}

export function setChatTitle(title, id) {
  saveString(getChatTitleKey(id), title);
}

export function saveVoiceMessage(role, text, duration = 2, type = "voice") {
  addMessageToChat({ role, text, duration, type });
}

export function getChatTitle(id) {
  return loadString(
    getChatTitleKey(id),
    "New chat"
  );
}
export function clearChat(id) {
  saveChatMessages([], id);
}

export function getChatHistory(id) {
  const messages = getChatMessages(id);

  return messages.map(msg => ({
    role: msg.role,
    content: msg.text
  }));
}