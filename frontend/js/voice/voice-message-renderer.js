import { escapeHtml, renderClickableWords } from "./voice-dictionary.js";
import { playTTS } from "./tts-player.js";

function addVoiceMessage(role, duration, text = "Test message") {
  const chat = document.getElementById("chat");

    if (!chat) return;

  const wrapper = document.createElement("div");
  wrapper.className =
    "flex " + (role === "user" ? "justify-end" : "justify-start");

  const bubble = document.createElement("div");

  bubble.className =
    "inline-flex items-center gap-3 px-4 py-3 rounded-2xl max-w-[80%] cursor-pointer transition-all duration-300 shadow-lg " +
    (role === "user"
      ? "bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white"
      : "bg-white/10 backdrop-blur-xl text-white border border-white/10");

  bubble.dataset.text = text;

  bubble.audio = null;
  bubble.isPlaying = false;
  bubble.duration = duration;
  bubble.progress = 0;  

  bubble.innerHTML = `
  <div class="w-[260px] max-w-full">

    <!-- Верхняя строка -->
    <div class="flex items-center gap-2">

      <!-- Play -->
      <button class="play-btn playBtn shrink-0 mt-3 -ml-2">
        <svg class="w-4 h-4 icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>

      <!-- Waveform -->
      <div class="waveform flex-1 cursor-pointer select-none">
        <div class="relative w-full h-[14px] flex items-center">
          <div class="absolute left-0 w-full h-[4px] bg-white/20 rounded-full"></div>
          <div class="progress absolute left-0 h-[4px] bg-gradient-to-r from-purple-400 to-fuchsia-500 rounded-full w-0"></div>
          <div class="thumb absolute w-3 h-3 bg-white rounded-full shadow-md -translate-x-1/2 left-0"></div>
        </div>
      </div>

      <!-- CC справа -->
      <button class="toggle-text text-xs opacity-70 hover:opacity-100 shrink-0">
        CC
      </button>
    </div>

    <!-- Время -->
    <div class="time text-[10px] opacity-60 -mt-3 ml-7 text-left">
      0:00 / 0:00
    </div>

    <!-- Расшифровка -->
    <div class="message-text hidden mt-3 pt-3 border-t border-white/10
                text-sm leading-relaxed break-words whitespace-normal opacity-90">
      ${renderClickableWords(escapeHtml(text))}
    </div>

  </div>
`;

  const toggleBtn = bubble.querySelector(".toggle-text");
const textBlock = bubble.querySelector(".message-text");

if (toggleBtn && textBlock) {
  toggleBtn.onclick = (e) => {
    e.stopPropagation();
    textBlock.classList.toggle("hidden");
  };
}


  // авто-скролл вниз
  wrapper.appendChild(bubble);
  chat.appendChild(wrapper);
  chat.scrollTop = chat.scrollHeight;
  
  if (role === "ai") {
  bubble.addEventListener("click", () => {
    playTTS(text, bubble);
  });
}

  return bubble;
}

function addTextMessage(role, text) {
  const chat = document.getElementById("chat");
  if (!chat) return;

  const wrapper = document.createElement("div");
  wrapper.className =
    "flex " + (role === "user" ? "justify-end" : "justify-start");

  const bubble = document.createElement("div");
  bubble.className =
    "max-w-[80%] px-4 py-3 rounded-2xl whitespace-pre-wrap shadow-lg " +
    (role === "user"
      ? "bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white"
      : "bg-white/10 backdrop-blur-xl text-white border border-white/10");

  bubble.textContent = text;

  wrapper.appendChild(bubble);
  chat.appendChild(wrapper);
  chat.scrollTop = chat.scrollHeight;
}

function addSystemMessage(text) {
  const chat = document.getElementById("chat");
  if (!chat) return;

  const wrapper = document.createElement("div");
  wrapper.className = "flex justify-center";

  const bubble = document.createElement("div");

  bubble.className = `
  px-4 py-2 rounded-2xl
  bg-cyan-400/10
  backdrop-blur-xl
  border border-cyan-300/20
  text-cyan-100 text-sm opacity-90
  max-w-[80%] text-center
  shadow-[0_0_20px_rgba(34,211,238,0.25)]
`;


  bubble.textContent = text;

  wrapper.appendChild(bubble);
  chat.appendChild(wrapper);

  chat.scrollTop = chat.scrollHeight;
}

export {
  addVoiceMessage,
  addTextMessage,
  addSystemMessage
};