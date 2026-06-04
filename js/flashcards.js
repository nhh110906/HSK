const level = getLevelFromUrl();
const flow = getFlowFromUrl() || "study";
document.getElementById("backLink").href = buildHomeUrl(flow, level);
const levelBadge = document.getElementById("levelBadge");
const progressText = document.getElementById("progressText");
const flashcard = document.getElementById("flashcard");
const cardHanzi = document.getElementById("cardHanzi");
const cardPinyin = document.getElementById("cardPinyin");
const cardMeaning = document.getElementById("cardMeaning");
const exampleSection = document.getElementById("exampleSection");
const refExample = document.getElementById("refExample");
const refVi = document.getElementById("refVi");
const refPinyin = document.getElementById("refPinyin");
const btnTogglePinyin = document.getElementById("btnTogglePinyin");
const pinyinPanel = document.getElementById("pinyinPanel");
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

if (btnTogglePinyin && pinyinPanel) {
  btnTogglePinyin.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleExamplePinyin();
  });
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

function hideExamplePinyin() {
  if (!pinyinPanel || !btnTogglePinyin) return;
  pinyinPanel.classList.add("is-collapsed");
  btnTogglePinyin.setAttribute("aria-expanded", "false");
  btnTogglePinyin.classList.remove("is-open");
  btnTogglePinyin.textContent = "🔤 Pinyin ví dụ";
}

function toggleExamplePinyin() {
  if (!pinyinPanel || !btnTogglePinyin) return;
  const collapsed = pinyinPanel.classList.toggle("is-collapsed");
  const visible = !collapsed;
  btnTogglePinyin.setAttribute("aria-expanded", String(visible));
  btnTogglePinyin.classList.toggle("is-open", visible);
  btnTogglePinyin.textContent = visible ? "Ẩn pinyin ví dụ" : "🔤 Pinyin ví dụ";
}

function showExampleBlock(w) {
  const hasExample = w.example?.trim();
  if (!hasExample) {
    exampleSection.classList.add("hidden");
    return;
  }
  exampleSection.classList.remove("hidden");
  refExample.textContent = w.example;
  refVi.textContent = w.exampleVi?.trim() || "(Chưa có bản dịch trong dữ liệu)";
  refPinyin.textContent = w.examplePy?.trim() || "(Chưa có pinyin trong dữ liệu)";
  hideExamplePinyin();
  if (btnTogglePinyin) {
    btnTogglePinyin.disabled = !w.examplePy?.trim();
  }
}

function showCard() {
  const w = words[order[index]];
  cardHanzi.textContent = w.hanzi;
  cardPinyin.textContent = w.pinyin;
  cardMeaning.textContent = w.meaning;
  showExampleBlock(w);
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
