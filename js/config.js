const HSK_CONFIG = {
  levels: {
    1: { available: true, label: "HSK 1", file: "data/hsk1.json", hasExamples: false },
    2: { available: true, label: "HSK 2", file: "data/hsk-lv2.json", hasExamples: false },
    3: { available: true, label: "HSK 3", file: "data/hsk3.json", hasExamples: true },
    4: { available: true, label: "HSK 4", file: "data/hsk4.json", hasExamples: true },
    5: { available: false, label: "HSK 5", hasExamples: false },
    6: { available: false, label: "HSK 6", hasExamples: false },
  },
};

function getLevelConfig(level) {
  const n = Number(level);
  if (n >= 1 && n <= 6) return HSK_CONFIG.levels[n];
  return null;
}

const FLOW_LABELS = {
  study: "Ôn tập",
  test: "Làm test",
};

function getLevelFromUrl() {
  const raw = new URLSearchParams(window.location.search).get("level");
  if (raw == null || raw === "") return null;
  const level = parseInt(String(raw).trim(), 10);
  if (Number.isFinite(level) && level >= 1 && level <= 6) return level;
  return null;
}

function getFlowFromUrl() {
  const flow = new URLSearchParams(window.location.search).get("flow");
  return flow === "study" || flow === "test" ? flow : null;
}

function getModeFromUrl() {
  return new URLSearchParams(window.location.search).get("mode") || "";
}

function buildPageUrl(page, params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v != null && v !== "")
    )
  );
  const q = qs.toString();
  return q ? `${page}?${q}` : page;
}

function buildStudyUrl(page, level, extra = {}) {
  return buildPageUrl(page, { flow: "study", level: String(level), ...extra });
}

function buildTestUrl(page, level, extra = {}) {
  return buildPageUrl(page, { flow: "test", level: String(level), ...extra });
}

function buildHomeUrl(flow, level, step) {
  const params = {};
  if (flow) params.flow = flow;
  if (level != null && level !== "") params.level = String(level);
  if (step) params.step = step;
  return buildPageUrl("index.html", params);
}

function getStepFromUrl() {
  const step = new URLSearchParams(window.location.search).get("step");
  return step === "flow" || step === "level" || step === "mode" ? step : null;
}
