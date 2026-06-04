async function loadVocabulary(level) {
  const cfg = HSK_CONFIG.levels[level];
  if (!cfg?.available || !cfg.file) {
    throw new Error("Cấp HSK này chưa có dữ liệu");
  }
  const res = await fetch(cfg.file);
  if (!res.ok) throw new Error("Không tải được từ vựng");
  const data = await res.json();
  return data.filter((w) => w.hanzi && w.pinyin && w.meaning);
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizePinyin(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[,.;:!?]/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ü/g, "u")
    .replace(/ǖ|ǘ|ǚ|ǜ/g, "u");
}

function normalizeVietnamese(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[,.;:!?]/g, "");
}

function normalizeHanzi(s) {
  return s.replace(/\s+/g, "").trim();
}

function pinyinMatches(user, expected) {
  const u = normalizePinyin(user);
  const e = normalizePinyin(expected);
  if (u === e) return true;
  const uNoTone = u.replace(/[1-5]/g, "");
  const eNoTone = e.replace(/[1-5]/g, "");
  return uNoTone === eNoTone;
}

function vietnameseMatches(user, expected) {
  const u = normalizeVietnamese(user);
  const e = normalizeVietnamese(expected);
  if (u === e) return true;
  const uParts = u.split(/[,;/]+/).map((p) => p.trim());
  const eParts = e.split(/[,;/]+/).map((p) => p.trim());
  return uParts.some((up) => eParts.some((ep) => ep.includes(up) || up.includes(ep)));
}

function hanziMatches(user, expected) {
  return normalizeHanzi(user) === normalizeHanzi(expected);
}
