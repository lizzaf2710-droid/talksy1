import { getVoiceWords, getSavedWords } from "./voice-dictionary.js";

// =========================
// STATELESS FLASHCARD LOGIC
// =========================

export function getStudyWords() {
  return getSavedWords();
}

export function getFlashcardIndex(index, wordsLength) {
  if (!wordsLength) return 0;
  return Math.min(index, wordsLength - 1);
}

export function nextFlashcardIndex(index, length) {
  if (!length) return 0;
  return (index + 1) % length;
}

export function prevFlashcardIndex(index, length) {
  if (!length) return 0;
  return (index - 1 + length) % length;
}

// отметка "знаю"
export function markKnowWord(word) {
  let words = getVoiceWords();

  const updated = words.map(w =>
    w.word === word.word
      ? { ...w, learned: true }
      : w
  );

  localStorage.setItem(
    "voice_dictionary",
    JSON.stringify(updated)
  );
}

// отметка "не знаю"
export function markDontKnowWord(word) {
  let words = getVoiceWords();

  const updated = words.map(w =>
    w.word === word.word
      ? { ...w, learned: false }
      : w
  );

  localStorage.setItem(
    "voice_dictionary",
    JSON.stringify(updated)
  );
}
