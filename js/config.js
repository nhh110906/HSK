const VOCAB_PROFILES = {
  "3": {
    label: "Từ vựng 3.0",
    short: "HSK 3.0",
    desc: "Bộ từ PDF chuẩn HSK 3.0 (HSK 1–4)",
    levels: {
      1: { available: true, label: "HSK 1", file: "data/hsk1.json", hasExamples: false },
      2: { available: true, label: "HSK 2", file: "data/hsk-lv2.json", hasExamples: false },
      3: { available: true, label: "HSK 3", file: "data/hsk3.json", hasExamples: true },
      4: { available: true, label: "HSK 4", file: "data/hsk4.json", hasExamples: true },
      5: { available: false, label: "HSK 5", hasExamples: false },
      6: { available: false, label: "HSK 6", hasExamples: false },
    },
  },
  "2": {
    label: "Từ vựng 2.0",
    short: "HSK 2.0",
    desc: "Thanh Mai HSK · có ví dụ (HSK 1–4)",
    levels: {
      1: { available: true, label: "HSK 1", file: "data/v2/hsk1.json", hasExamples: true },
      2: { available: true, label: "HSK 2", file: "data/v2/hsk2.json", hasExamples: true },
      3: { available: true, label: "HSK 3", file: "data/v2/hsk3.json", hasExamples: true },
      4: { available: true, label: "HSK 4", file: "data/v2/hsk4.json", hasExamples: true },
      5: { available: false, label: "HSK 5", hasExamples: false },
      6: { available: false, label: "HSK 6", hasExamples: false },
    },
  },
};

const NAV_STORAGE_KEY = "hsk_nav_state";
const DEFAULT_VER = "3";

const FOOTER_BRAND = "跟辉煌练习汉语";
const FOOTER_API_LABEL = "cài đặt API";

function buildFooterHtml({ withApiButton = false, apiButtonId = "openApiSettings" } = {}) {
  if (withApiButton) {
    return `${FOOTER_BRAND} - <button type="button" class="link-btn" id="${apiButtonId}">${FOOTER_API_LABEL}</button>`;
  }
  return `${FOOTER_BRAND} - ${FOOTER_API_LABEL}`;
}

const FLOW_LABELS = {
  study: "Ôn tập",
  test: "Làm test",
};

/** @deprecated use getProfile().levels — kept for compatibility */
const HSK_CONFIG = { levels: VOCAB_PROFILES["3"].levels };

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

function getVocabVersion() {
  const ver = new URLSearchParams(window.location.search).get("ver");
  if (ver === "2" || ver === "3") return ver;
  const saved = loadNavState();
  if (saved.ver === "2" || saved.ver === "3") return saved.ver;
  return DEFAULT_VER;
}

function getProfile(ver) {
  const v = ver || getVocabVersion();
  return VOCAB_PROFILES[v] || VOCAB_PROFILES[DEFAULT_VER];
}

function getLevelConfig(level) {
  const n = Number(level);
  if (n >= 1 && n <= 6) return getProfile().levels[n];
  return null;
}

function saveNavState(flow, level, ver) {
  try {
    sessionStorage.setItem(
      NAV_STORAGE_KEY,
      JSON.stringify({
        ver: ver || getVocabVersion(),
        flow: flow || null,
        level: level != null ? Number(level) : null,
      })
    );
  } catch {
    /* ignore */
  }
}

function loadNavState() {
  try {
    const raw = sessionStorage.getItem(NAV_STORAGE_KEY);
    if (!raw) return { ver: null, flow: null, level: null };
    const data = JSON.parse(raw);
    return {
      ver: data.ver === "2" || data.ver === "3" ? data.ver : null,
      flow: data.flow === "study" || data.flow === "test" ? data.flow : null,
      level:
        Number.isFinite(Number(data.level)) && data.level >= 1 && data.level <= 6
          ? Number(data.level)
          : null,
    };
  } catch {
    return { ver: null, flow: null, level: null };
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

function buildAppUrl(params = {}) {
  const ver = params.ver || getVocabVersion();
  return buildPageUrl("app.html", { ver, ...params });
}

function buildStudyUrl(page, level, extra = {}) {
  return buildPageUrl(page, {
    ver: getVocabVersion(),
    flow: "study",
    level: String(level),
    ...extra,
  });
}

function buildTestUrl(page, level, extra = {}) {
  return buildPageUrl(page, {
    ver: getVocabVersion(),
    flow: "test",
    level: String(level),
    ...extra,
  });
}

function buildHomeUrl(flow, level, step) {
  const params = { ver: getVocabVersion() };
  if (flow) params.flow = flow;
  if (level != null && level !== "") params.level = String(level);
  if (step) params.step = step;
  return buildAppUrl(params);
}

function buildVersionPickerUrl() {
  return buildPageUrl("index.html");
}

function getStepFromUrl() {
  const step = new URLSearchParams(window.location.search).get("step");
  return step === "flow" || step === "level" || step === "mode" ? step : null;
}
