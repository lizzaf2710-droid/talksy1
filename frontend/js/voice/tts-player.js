import { tts } from "../core/api.js";

let currentAudio = null;

function formatTime(sec) {
  sec = Math.floor(sec || 0);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? "0" + s : s}`;
}

export async function playTTS(text, bubble, voice) {
  if (!bubble) return;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  try {
    const playBtn = bubble.querySelector(".playBtn");
    const icon = bubble.querySelector(".icon");
    const progress = bubble.querySelector(".progress");
    const thumb = bubble.querySelector(".thumb");
    const timeEl = bubble.querySelector(".time");
    const waveform = bubble.querySelector(".waveform");

    if (timeEl) timeEl.textContent = "0:00 / ...";
    if (progress) progress.style.width = "0%";
    if (thumb) thumb.style.left = "0%";

    const blob = await tts(text, voice);

    if (!blob || blob.size === 0) return;

    let duration = 0;

    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioContext = new AudioContext();
      const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      duration = decoded.duration || 0;
      await audioContext.close();
    } catch {}

    if (timeEl) {
      timeEl.textContent = `0:00 / ${formatTime(duration)}`;
    }

    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);

    currentAudio = audio;

    function update() {
      const current = audio.currentTime || 0;
      const total = duration || audio.duration || 0;
      const percent = total ? (current / total) * 100 : 0;

      if (progress) progress.style.width = percent + "%";
      if (thumb) thumb.style.left = percent + "%";

      if (timeEl) {
        timeEl.textContent =
          `${formatTime(current)} / ${formatTime(total)}`;
      }

      if (!audio.paused && !audio.ended) {
        requestAnimationFrame(update);
      }
    }

    async function play() {
      bubble.classList.add("playing");

      if (icon) {
        icon.innerHTML = `<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>`;
      }

      await audio.play();
      requestAnimationFrame(update);
    }

    function pause() {
      audio.pause();
      bubble.classList.remove("playing");

      if (icon) {
        icon.innerHTML = `<path d="M8 5v14l11-7z"/>`;
      }
    }

    if (playBtn) {
      playBtn.onclick = (e) => {
        e.stopPropagation();
        audio.paused ? play() : pause();
      };
    }

    if (waveform) {
      waveform.onclick = (e) => {
        const rect = waveform.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        audio.currentTime = p * (duration || audio.duration);
        requestAnimationFrame(update);
      };
    }

    audio.onended = () => {
      bubble.classList.remove("playing");
      if (icon) icon.innerHTML = `<path d="M8 5v14l11-7z"/>`;
      if (progress) progress.style.width = "0%";
      if (thumb) thumb.style.left = "0%";

      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
    };

    await play();

  } catch (e) {
    console.error("TTS ERROR:", e);
  }
}

export function stopTTS() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}