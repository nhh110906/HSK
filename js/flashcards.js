const level = getLevelFromUrl();
const flow = getFlowFromUrl() || "study";
document.getElementById("backLink").href = buildHomeUrl(flow, level);
const levelBadge = document.getElementById("levelBadge");
const progressText = document.getElementById("progressText");
const flashcard = document.getElementById("flashcard");
const cardHanzi = document.getElementById("cardHanzi");
const cardPinyin = document.getElementById("cardPinyin");
const cardMeaning = document.getElementById("cardMeaning");
const cardExample = document.getElementById("cardExample");
const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");
const btnShuffle = document.getElementById("btnShuffle");

let words = [];
let order = [];
let index = 0;

if (!level || !HSK_CONFIG.levels[level]?.available) {
  window.location.href = "index.html";
} else {
  levelBadge.textContent = HSK_CONFIG.levels[level].label;
  init();
}

async function init() {
  try {
    words = await loadVocabulary(level);
    order = words.map((_, i) => i);
    showCard();
  } catch (e) {
    alert(e.message);
    window.location.href = "index.html";
  }
}

function showCard() {
  const w = words[order[index]];
  cardHanzi.textContent = w.hanzi;
  cardPinyin.textContent = w.pinyin;
  cardMeaning.textContent = w.meaning;
  if (w.example) {
    cardExample.textContent = w.example;
    cardExample.classList.remove("hidden");
  } else {
    cardExample.classList.add("hidden");
  }
  flashcard.classList.remove("flipped");
  progressText.textContent = `${index + 1} / ${words.length}`;
}

function flip() {
  flashcard.classList.toggle("flipped");
}

flashcard.addEventListener("click", flip);
flashcard.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    flip();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    index = (index - 1 + words.length) % words.length;
    showCard();
  } else if (e.key === "ArrowRight") {
    index = (index + 1) % words.length;
    showCard();
  }
});

btnPrev.addEventListener("click", () => {
  index = (index - 1 + words.length) % words.length;
  showCard();
});

btnNext.addEventListener("click", () => {
  index = (index + 1) % words.length;
  showCard();
});

btnShuffle.addEventListener("click", () => {
  order = shuffleArray(order);
  index = 0;
  showCard();
});
