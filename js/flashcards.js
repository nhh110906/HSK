const level = getLevelFromUrl();
const flow = getFlowFromUrl() || "study";
saveNavState(flow, level);

document.getElementById("backLink").href = buildHomeUrl(flow, level, "mode");
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

const levelCfg = getLevelConfig(level);

function showLoadError(message) {
  const main = document.querySelector(".flashcard-main");
  if (!main) return;
  main.innerHTML = `
    <div class="load-error">
      <h2>Không mở được Flashcard</h2>
      <p>${message}</p>
      <p class="load-error-meta">HSK ${level || "?"} · <code>${assetUrl(levelCfg?.file || "")}</code></p>
      <a class="btn btn-primary" href="${buildHomeUrl(flow, level, "mode")}">← Chọn lại</a>
    </div>
  `;
}

if (!level || !levelCfg?.available) {
  showLoadError("Cấp HSK không hợp lệ hoặc chưa có dữ liệu.");
} else {
  levelBadge.textContent = levelCfg.label;
  init();
}

btnTogglePinyin.addEventListener("click", toggleExamplePinyin);
pinyinPanel.addEventListener("click", (e) => e.stopPropagation());

async function init() {
  try {
    words = await loadVocabulary(level);
    order = shuffleArray(words.map((_, i) => i));
    index = 0;
    showCard();
  } catch (e) {
    showLoadError(e.message || "Lỗi không xác định");
  }
}

function hideExamplePinyin() {
  pinyinPanel.classList.add("is-collapsed");
  btnTogglePinyin.setAttribute("aria-expanded", "false");
  btnTogglePinyin.classList.remove("is-open");
  btnTogglePinyin.textContent = "Pinyin";
}

function toggleExamplePinyin() {
  const collapsed = pinyinPanel.classList.toggle("is-collapsed");
  const visible = !collapsed;
  btnTogglePinyin.setAttribute("aria-expanded", String(visible));
  btnTogglePinyin.classList.toggle("is-open", visible);
  btnTogglePinyin.textContent = visible ? "Ẩn" : "Pinyin";
}

function showExampleOnCard(w) {
  const ex = (w.example || "").trim();
  const vi = (w.exampleVi || "").trim();
  const py = (w.examplePy || "").trim();

  if (!ex && !vi) {
    cardExampleBlock.style.display = "none";
    btnTogglePinyin.style.display = "none";
    pinyinPanel.classList.add("is-collapsed");
    return;
  }

  cardExampleBlock.style.display = "block";
  refExample.textContent = ex || "—";
  refVi.textContent = vi || "(Chưa có bản dịch tiếng Việt)";
  refPinyin.textContent = py || "(Chưa có pinyin câu ví dụ trong dữ liệu)";
  hideExamplePinyin();
  btnTogglePinyin.style.display = py ? "inline-block" : "none";
  btnTogglePinyin.disabled = !py;
  if (!py) {
    pinyinPanel.classList.add("is-collapsed");
  }
}

function showCard() {
  if (!words.length) {
    showLoadError("Danh sách từ trống.");
    return;
  }
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
  if (!words.length) return;
  if (e.key === "ArrowLeft") {
    index = (index - 1 + words.length) % words.length;
    showCard();
  } else if (e.key === "ArrowRight") {
    index = (index + 1) % words.length;
    showCard();
  }
});

btnPrev.addEventListener("click", () => {
  if (!words.length) return;
  index = (index - 1 + words.length) % words.length;
  showCard();
});

btnNext.addEventListener("click", () => {
  if (!words.length) return;
  index = (index + 1) % words.length;
  showCard();
});

btnShuffle.addEventListener("click", () => {
  if (!words.length) return;
  order = shuffleArray(order);
  index = 0;
  showCard();
});
