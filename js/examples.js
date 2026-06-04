const level = getLevelFromUrl();
const flow = getFlowFromUrl() || "study";
const backLink = document.getElementById("backLink");
const levelBadge = document.getElementById("levelBadge");
const progressText = document.getElementById("progressText");
const wordHanzi = document.getElementById("wordHanzi");
const wordPinyin = document.getElementById("wordPinyin");
const wordMeaning = document.getElementById("wordMeaning");
const refExample = document.getElementById("refExample");
const refPinyin = document.getElementById("refPinyin");
const refVi = document.getElementById("refVi");
const btnTogglePinyin = document.getElementById("btnTogglePinyin");
const pinyinPanel = document.getElementById("pinyinPanel");
const hintWord = document.getElementById("hintWord");
const userSentence = document.getElementById("userSentence");
const btnCheckAi = document.getElementById("btnCheckAi");
const aiResult = document.getElementById("aiResult");
const aiLoading = document.getElementById("aiLoading");
const aiScore = document.getElementById("aiScore");
const aiVerdict = document.getElementById("aiVerdict");
const aiSummary = document.getElementById("aiSummary");
const aiIssues = document.getElementById("aiIssues");
const aiSuggestion = document.getElementById("aiSuggestion");
const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");
const btnShuffle = document.getElementById("btnShuffle");
const btnApiSettings = document.getElementById("btnApiSettings");
const apiModal = document.getElementById("apiModal");
const apiForm = document.getElementById("apiForm");
const apiKeyInput = document.getElementById("apiKeyInput");
const apiCancel = document.getElementById("apiCancel");

let words = [];
let order = [];
let index = 0;

backLink.href = buildHomeUrl(flow, level);

if (!level || !HSK_CONFIG.levels[level]?.available) {
  window.location.href = "index.html";
} else {
  levelBadge.textContent = HSK_CONFIG.levels[level].label;
  init();
}

if (btnTogglePinyin && pinyinPanel) {
  btnTogglePinyin.addEventListener("click", toggleExamplePinyin);
}

btnApiSettings.addEventListener("click", openApiModal);
apiCancel.addEventListener("click", () => apiModal.close());
apiForm.addEventListener("submit", (e) => {
  e.preventDefault();
  setGeminiApiKey(apiKeyInput.value);
  apiModal.close();
});

function openApiModal() {
  apiKeyInput.value = getGeminiApiKey();
  apiModal.showModal();
}

async function init() {
  try {
    const all = await loadVocabulary(level);
    words = all.filter((w) => w.example && w.example.trim());
    if (!words.length) {
      alert("Không có câu ví dụ cho cấp này.");
      window.location.href = buildHomeUrl("study", level);
      return;
    }
    order = words.map((_, i) => i);
    showWord();
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
  btnTogglePinyin.textContent = "Pinyin";
}

function toggleExamplePinyin() {
  if (!pinyinPanel || !btnTogglePinyin) return;
  const collapsed = pinyinPanel.classList.toggle("is-collapsed");
  const visible = !collapsed;
  btnTogglePinyin.setAttribute("aria-expanded", String(visible));
  btnTogglePinyin.classList.toggle("is-open", visible);
  btnTogglePinyin.textContent = visible ? "Ẩn" : "Pinyin";
}

function showWord() {
  const w = words[order[index]];
  wordHanzi.textContent = w.hanzi;
  wordPinyin.textContent = w.pinyin;
  wordMeaning.textContent = w.meaning;
  hintWord.textContent = w.hanzi;
  refExample.textContent = w.example || "—";
  refVi.textContent = w.exampleVi?.trim() || "(Chưa có bản dịch trong dữ liệu)";
  refPinyin.textContent = w.examplePy?.trim() || "(Chưa có pinyin trong dữ liệu)";
  hideExamplePinyin();
  if (btnTogglePinyin) {
    const py = w.examplePy?.trim();
    btnTogglePinyin.disabled = !py;
    btnTogglePinyin.style.display = py ? "inline-block" : "none";
  }
  userSentence.value = "";
  hideAiResult();
  progressText.textContent = `${index + 1} / ${words.length}`;
}

function hideAiResult() {
  aiResult.classList.add("hidden");
  aiResult.classList.remove("ai-pass", "ai-fail", "ai-error");
  aiLoading.classList.add("hidden");
}

function showAiError(message) {
  aiResult.classList.remove("hidden", "ai-pass", "ai-fail");
  aiResult.classList.add("ai-error", "ai-fail");
  aiScore.textContent = "—";
  aiVerdict.textContent = "Lỗi";
  aiSummary.textContent = message;
  aiIssues.innerHTML = "";
  aiSuggestion.textContent = "";
  if (message.includes("429") || message.includes("giới hạn")) {
    aiSuggestion.textContent =
      "Mẹo: đợi 1–2 phút, không bấm liên tục. Xem quota: aistudio.google.com → Usage.";
  }
}

btnCheckAi.addEventListener("click", async () => {
  const sentence = userSentence.value.trim();
  if (!sentence) {
    alert("Hãy viết câu tiếng Trung trước khi kiểm tra.");
    return;
  }
  if (!getGeminiApiKey()) {
    openApiModal();
    return;
  }

  const w = words[order[index]];
  hideAiResult();
  aiLoading.classList.remove("hidden");
  btnCheckAi.disabled = true;

  try {
    const result = await checkChineseGrammar({
      targetWord: w.hanzi,
      meaning: w.meaning,
      referenceExample: w.example,
      referencePinyin: w.examplePy,
      userSentence: sentence,
    });
    renderAiResult(result);
  } catch (e) {
    if (e.code === "NEED_API_KEY" || e.code === "BAD_API_KEY") {
      openApiModal();
    }
    showAiError(e.message || "Không gọi được AI. Thử lại sau.");
  } finally {
    aiLoading.classList.add("hidden");
    btnCheckAi.disabled = false;
  }
});

function renderAiResult(result) {
  aiResult.classList.remove("hidden");
  aiResult.classList.toggle("ai-pass", result.correct);
  aiResult.classList.toggle("ai-fail", !result.correct);
  aiScore.textContent = `${result.score}/100`;
  aiVerdict.textContent = result.correct ? "Đạt" : "Cần sửa";
  aiSummary.textContent = result.summary;
  aiIssues.innerHTML = result.issues.length
    ? result.issues.map((i) => `<li>${escapeHtml(i)}</li>`).join("")
    : "<li>Không phát hiện lỗi rõ ràng.</li>";
  aiSuggestion.textContent = result.suggestion
    ? `Gợi ý: ${result.suggestion}`
    : "";
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

btnPrev.addEventListener("click", () => {
  index = (index - 1 + words.length) % words.length;
  showWord();
});
btnNext.addEventListener("click", () => {
  index = (index + 1) % words.length;
  showWord();
});
btnShuffle.addEventListener("click", () => {
  order = shuffleArray(order);
  index = 0;
  showWord();
});
