import { load, loadString } from "./storage.js";

export const appState = {
  mode: "chat",

  level: loadString("selectedLevel", "A"),

  scenario: "general",

  voiceEnabled: false,

  user: {
    name: "",
    streak: 0
  },

  memory: {
    learnedWords: load("voice_dictionary", []),
    mistakes: [],
    goals: []
  },

  chat: {
    currentChatId: loadString("last_chat_id", "main"),

    messages: []
  },

  voice: {
    selectedVoice: loadString(
      "selectedVoice",
      "en-US-AriaNeural"
    ),

    mediaRecorder: null,

    audioChunks: [],

    isRecording: false,

    isProcessingAI: false,

    currentAudio: null
  },

  flashcards: {
    currentIndex: 0,
    flipped: false
  },

  dictionary: {
    filter: "all",
    translationCache: {}
  }
};