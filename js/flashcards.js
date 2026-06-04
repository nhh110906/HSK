const level = getLevelFromUrl();
const flow = getFlowFromUrl() || "study";
document.getElementById("backLink").href = buildHomeUrl(flow, level);
const levelBadge = document.getElementById("levelBadge");
const progressText = document.getElementById("progressText");
const flashcard = document.getElementById("flashcard");
const cardHanzi = document.getElementById("cardHanzi");
const cardPinyin = document.getElementById("cardPinyin");
const cardMeaning = document.getElementById("cardMeaning");
const cardExampleBlock = document.getElementById("cardExampleBlock");
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

btnTogglePinyin.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleExamplePinyin();
});

pinyinPanel.addEventListener("click", (e) => e.stopPropagation());
cardExampleBlock.addEventListener("click", (e) => e.stopPropagation());

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
  pinyinPanel.classList.add("is-collapsed");
  btnTogglePinyin.setAttribute("aria-expanded", "false");
  btnTogglePinyin.classList.remove("is-open");
  btnTogglePinyin.textContent = "🔤 Pinyin ví dụ";
}

function toggleExamplePinyin() {
  const collapsed = pinyinPanel.classList.toggle("is-collapsed");
  const visible = !collapsed;
  btnTogglePinyin.setAttribute("aria-expanded", String(visible));
  btnTogglePinyin.classList.toggle("is-open", visible);
  btnTogglePinyin.textContent = visible ? "Ẩn pinyin ví dụ" : "🔤 Pinyin ví dụ";
}

function showExampleOnCard(w) {
  const ex = (w.example || "").trim();
  const vi = (w.exampleVi || "").trim();
  const py = (w.examplePy || "").trim();

  if (!ex && !vi) {
    cardExampleBlock.style.display = "none";
    return;
  }

  cardExampleBlock.style.display = "block";
  refExample.textContent = ex || "—";
  refVi.textContent = vi || "(Chưa có bản dịch tiếng Việt)";
  refPinyin.textContent = py || "(HSK này chưa có pinyin câu ví dụ trong dữ liệu)";
  hideExamplePinyin();
  btnTogglePinyin.disabled = !py;
  btnTogglePinyin.style.display = py ? "block" : "none";
  if (!py) {
    pinyinPanel.classList.add("is-collapsed");
  }
}

function showCard() {
  const w = words[order[index]];
  cardHanzi.textContent = w.hanzi;
  cardPinyin.textContent = w.pinyin;
  cardMeaning.textContent = w.meaning;
  showExampleOnCard(w);
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
