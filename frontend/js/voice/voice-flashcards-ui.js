import {
  getStudyWords,
  markKnowWord,
  markDontKnowWord
} from "./voice-flashcards.js";

let flashIndex = 0;
let flashFlipped = false;

export function resentFlashcards() {
    flashIndex = 0;
    flashFlipped = false;
    updateProgress?.();
}


export function renderFlashcard() {
  const card = document.getElementById("voiceFlashcard");
  if (!card) return;

  const studyWords = getStudyWords();

  if (!studyWords.length) {
    card.innerHTML = "🎉 You learned all words!";
    return;
  }

  const word = studyWords[flashIndex];
  if (!word) return;

  if (!flashFlipped) {
    card.innerHTML = `
      <div class="flashcard-front">
        ${word.word}
      </div>
    `;
    return;
  }

  card.innerHTML = `
    <div class="flashcard-back">
      <div class="mb-4">
        ${word.translation || "..."}
      </div>

      <div class="flex gap-6 justify-center text-2xl">
        <button onclick="markDontKnow(event)">✖</button>
        <button onclick="markKnow(event)">✔</button>
      </div>
    </div>
  `;
}


export function nextVoiceCard() {
  const words = getStudyWords();
  if (!words.length) return;

  flashIndex = (flashIndex + 1) % words.length;
  flashFlipped = false;

  renderFlashcard();
}


export function prevVoiceCard() {
  const words = getStudyWords();
  if (!words.length) return;

  flashIndex = (flashIndex - 1 + words.length) % words.length;
  flashFlipped = false;

  renderFlashcard();
}


export function flipVoiceCard() {
  flashFlipped = !flashFlipped;
  renderFlashcard();
}


export function openFlashcards() {
  document.getElementById("voiceFlashcardsScreen")?.classList.remove("hidden");

  flashIndex = 0;
  flashFlipped = false;

  renderFlashcard();
  updateProgress();
}

export function closeVoiceFlashcards() {
  document.getElementById("voiceFlashcardsScreen")?.classList.add("hidden");
}


export function updateProgress() {
  const words = getStudyWords();
  const learned = words.filter(w => w.learned).length;

  const percent = words.length
    ? Math.round((learned / words.length) * 100)
    : 0;

  const bar = document.getElementById("voiceProgressBar");
  const learnedEl = document.getElementById("voiceLearnedCount");
  const totalEl = document.getElementById("voiceTotalCount");
  const percentEl = document.getElementById("voiceProgressPercent");

  if (bar) bar.style.width = percent + "%";
  if (learnedEl) learnedEl.textContent = learned;
  if (totalEl) totalEl.textContent = words.length;
  if (percentEl) percentEl.textContent = percent;
}


export function markKnow(e) {
  e.stopPropagation();

  const words = getStudyWords();
  const word = words[flashIndex];

  markKnowWord(word);

  flashFlipped = false;
  renderFlashcard();
}


export function markDontKnow(e) {
  e.stopPropagation();

  const words = getStudyWords();
  const word = words[flashIndex];

  markDontKnowWord(word);

  flashFlipped = false;
  renderFlashcard();
}
