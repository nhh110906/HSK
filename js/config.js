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

const NAV_STORAGE_KEY = "hsk_nav_state";

function getAppBase() {
  const path = window.location.pathname || "/";
  const lastSlash = path.lastIndexOf("/");
  if (lastSlash >= 0) {
    return path.slice(0, lastSlash + 1);
  }
  return "/";
}

function assetUrl(relativePath) {
  const base = getAppBase();
  const clean = String(relativePath).replace(/^\//, "");
  return `${base}${clean}`;
}

function getLevelConfig(level) {
  const n = Number(level);
  if (n >= 1 && n <= 6) return HSK_CONFIG.levels[n];
  return null;
}

const FLOW_LABELS = {
  study: "Ôn tập",
  test: "Làm test",
};

function saveNavState(flow, level) {
  try {
    sessionStorage.setItem(
      NAV_STORAGE_KEY,
      JSON.stringify({ flow: flow || null, level: level != null ? Number(level) : null })
    );
  } catch {
    /* ignore */
  }
}

function loadNavState() {
  try {
    const raw = sessionStorage.getItem(NAV_STORAGE_KEY);
    if (!raw) return { flow: null, level: null };
    const data = JSON.parse(raw);
    return {
      flow: data.flow === "study" || data.flow === "test" ? data.flow : null,
      level:
        Number.isFinite(Number(data.level)) && data.level >= 1 && data.level <= 6
          ? Number(data.level)
          : null,
    };
  } catch {
    return { flow: null, level: null };
  }
}

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
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") qs.set(k, String(v));
  });
  const q = qs.toString();
  const base = getAppBase();
  const file = page.replace(/^\//, "");
  return q ? `${base}${file}?${q}` : `${base}${file}`;
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
