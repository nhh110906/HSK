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

function getLevelFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const level = parseInt(params.get("level"), 10);
  if (level >= 1 && level <= 6) return level;
  return null;
}

function getModeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("mode") || "";
}

function buildStudyUrl(page, level, extra = {}) {
  const params = new URLSearchParams({ level: String(level), ...extra });
  return `${page}?${params.toString()}`;
}
