import { speech } from "../core/api.js";

let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let currentStream = null;

let onResultCallback = null;

export function initAudio(callback) {
  onResultCallback = callback;
}



export function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}


export async function startRecording() {
  if (isRecording) return;

  isRecording = true;

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  currentStream = stream;

  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  mediaRecorder.ondataavailable = (e) => {
    audioChunks.push(e.data);
  };

  mediaRecorder.onstop = async () => {
    const blob = new Blob(audioChunks, { type: "audio/webm" });
    await sendAudio(blob);
  };

  mediaRecorder.start();
}


export function stopRecording() {
  if (!isRecording) return;

  isRecording = false;

  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }

  currentStream?.getTracks().forEach(track => track.stop());
}



export async function sendAudio(blob) {
  try {
    const formData = new FormData();
    formData.append("file", blob, "voice.webm");

    const data = await speech(formData);

    const text =
      data.text ||
      data.message?.content?.trim() ||
      "I didn't hear that";

    if (onResultCallback) {
      onResultCallback(text);
    }

  } catch (e) {
    console.error("sendAudio error:", e);
  }
}

export function formatTime(sec) {
  sec = Math.floor(sec || 0);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? "0" + s : s}`;
}


export function stopAudio(bubble) {
  if (!bubble) return;

  bubble.isPlaying = false;

  if (bubble.audio) {
    bubble.audio.pause();
    bubble.audio.currentTime = 0;
  }

  bubble.classList.remove("playing");

  const fill = bubble.querySelector(".progress-bar div");
  if (fill) fill.style.width = "0%";
}
