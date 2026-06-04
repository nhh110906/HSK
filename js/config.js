const HSK_CONFIG = {
  levels: {
    1: { available: false, label: "HSK 1" },
    2: { available: false, label: "HSK 2" },
    3: { available: true, label: "HSK 3", file: "data/hsk3.json" },
    4: { available: true, label: "HSK 4", file: "data/hsk4.json" },
    5: { available: false, label: "HSK 5" },
    6: { available: false, label: "HSK 6" },
  },
};

const FLOW_LABELS = {
  study: "Ôn tập",
  test: "Làm test",
};

function getLevelFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const level = parseInt(params.get("level"), 10);
  if (level >= 1 && level <= 6) return level;
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

function buildHomeUrl(flow, level) {
  const params = {};
  if (flow) params.flow = flow;
  if (level) params.level = String(level);
  return buildPageUrl("index.html", params);
}
