import { chat, tts, speech } from "../core/api.js";
import {
  load,
  save,
  remove,
  loadString,
  saveString
} from "../core/storage.js";
import { scenarios } from "./scenarios.js";
import {
  getChatMessages,
  saveChatMessages,
  addMessageToChat,
  setChatTitle,
  getChatTitle,
  clearChat,
  getChatHistory
} from "./chat-storage.js";
import {
  escapeHtml,
  renderClickableWords,
  toggleVoiceWord,
  openVoiceDictionary,
  closeVoiceDictionary,
  renderVoiceDictionary,
  removeVoiceWord,
  toggleVoiceFavorite,
  getVoiceWords,
  getSavedWords,
  setVoiceDictFilter
} from "./voice-dictionary.js";
import {
  initAudio,
  toggleRecording,
  sendAudio,
  formatTime,
  stopAudio
} from "./audio.js";
import { playTTS, stopTTS } from "./tts-player.js";
import { handleAIResponse, getAIReply } from "./voice-ai.js";
import {
  addVoiceMessage,
  addTextMessage,
  addSystemMessage
} from "./voice-message-renderer.js";
import {
  renderChats,
  loadChat,
  newChat,
  deleteChat,
  renameChat,
  initDefaultChat,
  toggleVoiceMenu,
  setVoice,
  previewVoice,
  goBack
} from "./voice-ui.js";
import {
  getCurrentChatId,
  setCurrentChatId,
  getSelectedVoice,
  setSelectedVoice,
  getCurrentLevel,
  setCurrentLevel,
  getLastChatId
} from "./voice-state.js";
import {
  getStudyWords,
  getFlashcardIndex,
  nextFlashcardIndex,
  prevFlashcardIndex,
  markKnowWord,
  markDontKnowWord
} from "./voice-flashcards.js";
import {
  getSystemPrompt,
  getLevel
} from "./voice-level.js";
import * as flashUI from "./voice-flashcards-ui.js";
import * as levelUI from "./voice-level-ui.js";
import { getScenarioReply } from "./voice-scenarios.js";



let isProcessingAI = false;
let currentAudio = null;

function handleAudioResult(text) {
  addVoiceMessage("user", 2, text);
  addMessageToChat({
  role: "user",
  text,
  duration: 2,
  type: "voice"
}, getCurrentChatId());
  handleAIResponse(text, {
    currentChatId: getCurrentChatId(),
    getLevel,
    renderChats,
    selectedVoice: getSelectedVoice()
  });
}

window.onload = async function () {
  initDefaultChat();
  renderChats(getCurrentChatId());
  initAudio(handleAudioResult);

  document.querySelectorAll('input[name="voice"]').forEach(r => {
    r.checked = (r.value === getSelectedVoice());
  });

  document.querySelectorAll('input[name="level"]').forEach(r => {
    r.checked = (r.value === getCurrentLevel());
  });

  levelUI.updateLevelButton();
  flashUI.resentFlashcards();

  const urlParams = new URLSearchParams(window.location.search);
  const chatId = urlParams.get("id");

  if (chatId) {
    setCurrentChatId(chatId);
    localStorage.setItem("last_chat_id", chatId);
  }

  // 1. загружаем чат
  loadChat(getCurrentChatId());

  // 2. проверяем сценарий
  const modeKey = 
    "voice_pending_mode_" + getCurrentChatId();
  const mode = localStorage.getItem(modeKey);

  if (mode) {
    localStorage.removeItem(modeKey);

    // 3. запускаем СРАЗУ после загрузки DOM чата
    await setVoiceMode(mode, { reset: true });
  }

  console.log(
    "APP STARTED, VOICE:", 
    getSelectedVoice()
  );
};

async function speakAI(text) {
  try {
    if (!text) return;

    const blob = await tts(
      text,
      getSelectedVoice()
    );

    if (!blob || blob.size === 0) {
      console.error("Empty audio blob");
      return;
    }

    const url = URL.createObjectURL(blob);

    const audio = new Audio(url);

    currentAudio = audio;

    audio.onended = () => {
      URL.revokeObjectURL(url);
      currentAudio = null;
    };

    await audio.play();

  } catch (error) {
    console.error("speakAI crashed:", error);
  }
}


async function setVoiceMode(mode, options = { reset: false }) {
  try {
    saveString("voice_mode", mode);

    const chat = document.getElementById("chat");
    if (!chat) return;

    const savedChat = getChatMessages(getCurrentChatId());

    // 🔥 если нужен reset — очищаем ВСЕГДА
    if (options.reset || savedChat.length === 0) {
      chat.innerHTML = "";
    }

    // 🧠 СЛУЧАЙ 1: новый чат / первый запуск сценария
    if (savedChat.length === 0) {
  const systemText = await getScenarioReply(mode, "");

  // 💬 сообщение сценария в чат
  const startMsg = `✨ Scenario "${mode}" started`;

  addSystemMessage(startMsg);
  addMessageToChat({
  role: "ai",
  text: startMsg,
  duration: 0,
  type: "text"
}, getCurrentChatId());

  // 🎤 первое голосовое сообщение AI
  const bubble = addVoiceMessage("ai", 3, systemText);
  addMessageToChat({
  role: "ai",
  text: systemText,
  duration: 3,
  type: "voice"
}, getCurrentChatId());
  playTTS(systemText, bubble);

  return;
}


    // 🧠 СЛУЧАЙ 2: чат уже есть → просто уведомление
    const intro = `Scenario "${mode}" is active. Level ${getLevel()}`;

    await speakAI(intro);

    console.log("SCENARIO RESUMED");
  } catch (err) {
    console.error("setVoiceMode error:", err);
  }
}

function startVoiceInput() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  const recognition = new SpeechRecognition();

  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.onresult = async (event) => {
    if (isProcessingAI) return;

    const text = event.results[0][0].transcript;
    isProcessingAI = true;

    try {
      await handleAIResponse(text, {
        currentChatId: getCurrentChatId(),
        getLevel,
        selectedVoice: getSelectedVoice()
      });
    } finally {
      isProcessingAI = false;
    }
  };

  recognition.start();
}


async function startFirstVoiceTurn(mode) {
  const first = await getScenarioReply(mode, "");

  await speakAI(first);
}


// Переход на главный экран
function goHome() {
  window.location.href = "index.html";
}



function goBackToChat() {
  window.location.href = "chat.html";
}


window.startVoiceChat = function(mode) {
  const chatId = Date.now().toString();

  save("voice_chat_" + chatId, []);
  saveString("voice_chat_" + chatId + "_title", mode + " voice chat");
  saveString("voice_pending_mode_" + chatId, mode);

  window.location.href = "voice.html?id=" + chatId;
};

window.toggleRecording = toggleRecording;
window.newChat = newChat;
window.loadChat = loadChat;
window.setVoice = setVoice;
window.previewVoice = previewVoice;
window.openVoiceDictionary = openVoiceDictionary;
window.closeVoiceDictionary = closeVoiceDictionary;
window.openFlashcards = flashUI.openFlashcards;
window.closeVoiceFlashcards = flashUI.closeVoiceFlashcards;
window.flipVoiceCard = flashUI.flipVoiceCard;
window.nextVoiceCard = flashUI.nextVoiceCard;
window.prevVoiceCard = flashUI.prevVoiceCard;
window.setLevel = levelUI.setLevel;
window.toggleLevelMenu = levelUI.toggleLevelMenu;
window.goHome = goHome;
window.goBackToChat = goBackToChat;
window.toggleVoiceMenu = toggleVoiceMenu;
window.toggleVoiceWord = toggleVoiceWord;
window.toggleVoiceFavorite = toggleVoiceFavorite;
window.removeVoiceWord = removeVoiceWord;
window.markKnow = flashUI.markKnow;
window.markDontKnow = flashUI.markDontKnow;
window.setVoiceDictFilter = setVoiceDictFilter;
window.setVoiceMode = setVoiceMode;