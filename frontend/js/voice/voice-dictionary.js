import { load, save } from "../core/storage.js";
import { chat } from "../core/api.js";

let voiceDictFilter = "all";
let voiceTranslationCache = {};

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}


  function renderClickableWords(text) {
  const dict = load("voice_dictionary", []);
  const learnedWords = new Set(dict.map(w => w.word));

  return text
    .split(/(\s+)/)
    .map(part => {
      if (/^\s+$/.test(part)) return part;

      const clean = part.replace(/^[^a-zA-Z']+|[^a-zA-Z']+$/g, "");
      if (!clean) return part;

      const word = clean.toLowerCase();
      const isKnown = learnedWords.has(word);

      return `<span
        class="clickable-word cursor-pointer transition
        ${isKnown ? 'text-purple-400 font-semibold' : 'hover:text-purple-300'}"
        data-word="${word}"
        onclick="toggleVoiceWord(event, this)">
        ${part}
      </span>`;
    })
    .join("");
}




async function toggleVoiceWord(event, el) {
  event.stopPropagation();

  const word = el.dataset.word;
  if (!word || word.length < 2) return;

  let dict =
    load("voice_dictionary", [])

  // Если слово уже есть в словаре
  const existing = dict.find(w => w.word === word);

  if (existing) {
    // Подсветка
    el.classList.add("text-purple-400", "font-semibold");

    // Показать перевод при повторном клике
    alert(`${existing.word} → ${existing.translation}`);
    return;
  }

  // Временно показываем загрузку
  el.classList.add("text-purple-400", "font-semibold");
  el.title = "Переводится...";

  // Получаем перевод
  const translation = await translateVoiceWord(word);

  const item = {
  word,
  translation,
  time: Date.now(),
  learned: false,
  favorite: false
};

  dict.push(item);
  save("voice_dictionary",dict)

  // Показываем перевод
  el.title = translation;
  alert(`${word} → ${translation}`);

  // Обновляем словарь, если открыт
  if (!document.getElementById("voiceDictionaryScreen")
        .classList.contains("hidden")) {
    renderVoiceDictionary();
  }

  console.log("Saved:", item);
}

// Перевод слова через тот же AI endpoint, что используется в обычном чате
async function translateVoiceWord(word) {
  // Если перевод уже есть в кэше — сразу возвращаем
  if (voiceTranslationCache[word]) {
    return voiceTranslationCache[word];
  }

  try {
    const data = await chat([
  {
    role: "system",
    content:
      "Translate this English word to Russian. Answer ONLY with the Russian translation."
  },
  {
    role: "user",
    content: word
  }
]);

    const translation =
      data.message?.content?.trim() || word;

    // Сохраняем в кэш
    voiceTranslationCache[word] = translation;

    return translation;
  } catch (e) {
    console.error("Translate error:", e);
    return word;
  }
}





function openVoiceDictionary() {
  document.getElementById("voiceDictionaryScreen").classList.remove("hidden");
  renderVoiceDictionary();
}

function closeVoiceDictionary() {
  document.getElementById("voiceDictionaryScreen").classList.add("hidden");
}


function renderVoiceDictionary() {
  const list = document.getElementById("voiceWordsList");
  if (!list) return;

  list.innerHTML = "";

  // 1. берём ВСЕ слова
  let allWords = load("voice_dictionary", []);
  // 2. нормализуем (на всякий случай)
  allWords = allWords.map(w => ({
    word: w.word,
    translation: w.translation,
    time: w.time || Date.now(),
    learned: w.learned ?? false,
    favorite: w.favorite ?? false
  }));

  // 3. считаем счётчики (ВСЕГДА от полного списка)
  const allCount = allWords.length;
  const favCount = allWords.filter(w => w.favorite).length;

  const allEl = document.getElementById("allCount");
  const favEl = document.getElementById("favCount");

  if (allEl) allEl.textContent = allCount;
  if (favEl) favEl.textContent = favCount;

  // 4. применяем фильтр
  let filteredWords = allWords;

  if (voiceDictFilter === "favorites") {
    filteredWords = allWords.filter(w => w.favorite);
  }

  // 5. если пусто
  if (filteredWords.length === 0) {
    list.innerHTML = "<div class='opacity-60'>No words yet</div>";
    return;
  }

  // 6. рендер карточек
  filteredWords.forEach(item => {
    const el = document.createElement("div");

    el.className =
      "flex justify-between items-center bg-white/10 p-3 rounded-xl";

    el.innerHTML = `
      <div>
        <div class="font-bold">${item.word}</div>
        <div class="text-sm opacity-70">${item.translation}</div>
      </div>

      <div class="flex items-center gap-3">
        <button onclick="toggleVoiceFavorite('${item.word}')"
                class="text-xl">
          ${item.favorite ? "⭐" : "○"}
        </button>

        <button onclick="removeVoiceWord('${item.word}')"
                class="text-red-400 text-lg">
          ✕
        </button>
      </div>
    `;

    list.appendChild(el);
  });
}


function removeVoiceWord(word) {
  let dict =
    load("voice_dictionary", []);

  // удаляем слово
  dict = dict.filter(item => item.word !== word);

  // сохраняем
  save("voice_dictionary", dict);

  // обновляем экран
  renderVoiceDictionary();
}

function toggleVoiceFavorite(word) {
  let dict =
    load("voice_dictionary", []);

  const item = dict.find(w => w.word === word);
  if (!item) return;

  // переключаем избранное
  item.favorite = !item.favorite;

  // сохраняем
  localStorage.setItem(
    "voice_dictionary",
    JSON.stringify(dict)
  );
 // обновляем экран
  renderVoiceDictionary();
}
function getVoiceWords() {
  let words = load("voice_dictionary", []);

  // нормализация (фикс старых записей)
  words = words.map(w => ({
    word: w.word,
    translation: w.translation,
    time: w.time || Date.now(),
    learned: w.learned ?? false,
    favorite: w.favorite ?? false
  }));

  return words;
}


function getSavedWords() {
  return getVoiceWords();
}

function getStudyWords() {
  return getVoiceWords();
}



function setVoiceDictFilter(type) {
  voiceDictFilter = type;
  renderVoiceDictionary();
}



function updateVoiceDictCounters(dict) {
  const all = dict.length;
  const fav = dict.filter(w => w.favorite).length;

  const allEl = document.getElementById("allCount");
  const favEl = document.getElementById("favCount");

  if (allEl) allEl.textContent = all;
  if (favEl) favEl.textContent = fav;
}

export {
  escapeHtml,
  renderClickableWords,
  toggleVoiceWord,
  translateVoiceWord,
  openVoiceDictionary,
  closeVoiceDictionary,
  renderVoiceDictionary,
  removeVoiceWord,
  toggleVoiceFavorite,
  getVoiceWords,
  getSavedWords,
  getStudyWords,
  setVoiceDictFilter,
  updateVoiceDictCounters
};