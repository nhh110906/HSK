const stepFlow = document.getElementById("stepFlow");
const stepLevel = document.getElementById("stepLevel");
const stepMode = document.getElementById("stepMode");
const levelGrid = document.getElementById("levelGrid");
const modeGrid = document.getElementById("modeGrid");
const flowContextLabel = document.getElementById("flowContextLabel");
const selectedLevelLabel = document.getElementById("selectedLevelLabel");
const levelStepTitle = document.getElementById("levelStepTitle");
const modeStepTitle = document.getElementById("modeStepTitle");
const backToFlow = document.getElementById("backToFlow");
const backToLevel = document.getElementById("backToLevel");
const openApiSettings = document.getElementById("openApiSettings");
const apiModal = document.getElementById("apiModal");
const apiForm = document.getElementById("apiForm");
const apiKeyInput = document.getElementById("apiKeyInput");
const apiCancel = document.getElementById("apiCancel");

let selectedFlow = null;
let selectedLevel = null;

const STUDY_MODES = [
  {
    id: "flashcard",
    icon: "📇",
    title: "Flashcard",
    desc: "Hán tự · Pinyin · Tiếng Việt — lật thẻ để ôn",
    page: "flashcards.html",
  },
  {
    id: "examples",
    icon: "💬",
    title: "Ví dụ",
    desc: "Đọc câu mẫu, tự viết câu & kiểm tra ngữ pháp bằng AI",
    page: "examples.html",
  },
];

const TEST_MODES = [
  {
    id: "zh-to-answer",
    icon: "✍️",
    title: "Hán tự → Pinyin / Việt",
    desc: "Nhìn chữ Hán, gõ pinyin hoặc nghĩa tiếng Việt",
    page: "test.html",
    extra: { mode: "zh-to-answer" },
  },
  {
    id: "to-zh",
    icon: "🈯",
    title: "Việt / Pinyin → Hán tự",
    desc: "Nhìn nghĩa hoặc pinyin, gõ chữ Hán tương ứng",
    page: "test.html",
    extra: { mode: "to-zh" },
  },
];

document.querySelectorAll(".flow-card").forEach((btn) => {
  btn.addEventListener("click", () => selectFlow(btn.dataset.flow));
});

for (let n = 1; n <= 6; n++) {
  const cfg = HSK_CONFIG.levels[n];
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "level-btn";
  btn.innerHTML = `HSK ${n}<span class="level-sub">${cfg.available ? "Sẵn sàng" : "Sắp có"}</span>`;
  btn.disabled = !cfg.available;
  btn.dataset.level = n;
  btn.addEventListener("click", () => selectLevel(n, btn));
  levelGrid.appendChild(btn);
}

backToFlow.addEventListener("click", () => {
  selectedFlow = null;
  selectedLevel = null;
  showStep("flow");
  history.replaceState(null, "", "index.html");
});

backToLevel.addEventListener("click", () => {
  selectedLevel = null;
  showStep("level");
  history.replaceState(null, "", buildHomeUrl(selectedFlow));
});

openApiSettings.addEventListener("click", openApiModal);
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

function selectFlow(flow) {
  selectedFlow = flow;
  flowContextLabel.textContent = FLOW_LABELS[flow];
  levelStepTitle.textContent =
    flow === "study" ? "Ôn tập — Chọn cấp HSK" : "Làm test — Chọn cấp HSK";
  showStep("level");
  history.replaceState(null, "", buildHomeUrl(flow));
}

function selectLevel(level, btn) {
  if (!HSK_CONFIG.levels[level].available) return;
  selectedLevel = level;
  document.querySelectorAll(".level-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  selectedLevelLabel.textContent = `${FLOW_LABELS[selectedFlow]} · ${HSK_CONFIG.levels[level].label}`;
  modeStepTitle.textContent =
    selectedFlow === "study" ? "Ôn tập — Chọn nội dung" : "Làm test — Chọn loại bài";
  renderModeCards();
  showStep("mode");
  history.replaceState(null, "", buildHomeUrl(selectedFlow, level));
}

function renderModeCards() {
  const modes = selectedFlow === "study" ? STUDY_MODES : TEST_MODES;
  modeGrid.innerHTML = "";
  modes.forEach((m) => {
    const href =
      selectedFlow === "study"
        ? buildStudyUrl(m.page, selectedLevel, m.extra || {})
        : buildTestUrl(m.page, selectedLevel, m.extra || {});
    const a = document.createElement("a");
    a.className = "mode-card";
    a.href = href;
    a.innerHTML = `
      <span class="mode-icon">${m.icon}</span>
      <h3>${m.title}</h3>
      <p>${m.desc}</p>
    `;
    modeGrid.appendChild(a);
  });
}

function showStep(step) {
  stepFlow.classList.toggle("hidden", step !== "flow");
  stepLevel.classList.toggle("hidden", step !== "level");
  stepMode.classList.toggle("hidden", step !== "mode");
}

function restoreFromUrl() {
  const flow = getFlowFromUrl();
  const level = getLevelFromUrl();
  if (!flow) {
    showStep("flow");
    return;
  }
  selectedFlow = flow;
  flowContextLabel.textContent = FLOW_LABELS[flow];
  levelStepTitle.textContent =
    flow === "study" ? "Ôn tập — Chọn cấp HSK" : "Làm test — Chọn cấp HSK";
  if (!level) {
    showStep("level");
    return;
  }
  if (!HSK_CONFIG.levels[level]?.available) {
    showStep("level");
    return;
  }
  selectedLevel = level;
  const btn = levelGrid.querySelector(`[data-level="${level}"]`);
  if (btn) btn.classList.add("active");
  selectedLevelLabel.textContent = `${FLOW_LABELS[flow]} · ${HSK_CONFIG.levels[level].label}`;
  modeStepTitle.textContent =
    flow === "study" ? "Ôn tập — Chọn nội dung" : "Làm test — Chọn loại bài";
  renderModeCards();
  showStep("mode");
}

restoreFromUrl();
