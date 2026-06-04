const levelGrid = document.getElementById("levelGrid");
const modeSection = document.getElementById("modeSection");
const selectedLevelLabel = document.getElementById("selectedLevelLabel");
const flashcardLink = document.getElementById("flashcardLink");
const testZhLink = document.getElementById("testZhLink");
const testViLink = document.getElementById("testViLink");
const backToLevels = document.getElementById("backToLevels");

let selectedLevel = null;

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

function selectLevel(level, btn) {
  if (!HSK_CONFIG.levels[level].available) return;
  selectedLevel = level;
  document.querySelectorAll(".level-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  selectedLevelLabel.textContent = HSK_CONFIG.levels[level].label;
  flashcardLink.href = buildStudyUrl("flashcards.html", level);
  testZhLink.href = buildStudyUrl("test.html", level, { mode: "zh-to-answer" });
  testViLink.href = buildStudyUrl("test.html", level, { mode: "to-zh" });
  modeSection.classList.remove("hidden");
}

backToLevels.addEventListener("click", () => {
  selectedLevel = null;
  modeSection.classList.add("hidden");
  document.querySelectorAll(".level-btn").forEach((b) => b.classList.remove("active"));
});

const urlLevel = getLevelFromUrl();
if (urlLevel && HSK_CONFIG.levels[urlLevel]?.available) {
  const btn = levelGrid.querySelector(`[data-level="${urlLevel}"]`);
  if (btn) selectLevel(urlLevel, btn);
}
