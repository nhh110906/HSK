const level = getLevelFromUrl();
const mode = getModeFromUrl();
const levelBadge = document.getElementById("levelBadge");
const modeBadge = document.getElementById("modeBadge");
const testSetup = document.getElementById("testSetup");
const testQuiz = document.getElementById("testQuiz");
const testResult = document.getElementById("testResult");
const answerTypeField = document.getElementById("answerTypeField");
const questionCount = document.getElementById("questionCount");
const answerType = document.getElementById("answerType");
const btnStart = document.getElementById("btnStart");
const progressBar = document.getElementById("progressBar");
const quizProgressText = document.getElementById("quizProgressText");
const promptLabel = document.getElementById("promptLabel");
const quizQuestion = document.getElementById("quizQuestion");
const answerForm = document.getElementById("answerForm");
const answerInput = document.getElementById("answerInput");
const quizFeedback = document.getElementById("quizFeedback");
const feedbackText = document.getElementById("feedbackText");
const correctAnswer = document.getElementById("correctAnswer");
const btnNextQ = document.getElementById("btnNextQ");
const resultScore = document.getElementById("resultScore");
const resultList = document.getElementById("resultList");
const btnRetry = document.getElementById("btnRetry");

let words = [];
let questions = [];
let current = 0;
let score = 0;
let results = [];

const MODES = {
  "zh-to-answer": {
    label: "Hán tự → Pinyin / Việt",
    setupAnswerType: true,
  },
  "to-zh": {
    label: "Việt / Pinyin → Hán tự",
    setupAnswerType: false,
  },
};

if (!level || !HSK_CONFIG.levels[level]?.available || !MODES[mode]) {
  window.location.href = "index.html";
} else {
  levelBadge.textContent = HSK_CONFIG.levels[level].label;
  modeBadge.textContent = MODES[mode].label;
  if (!MODES[mode].setupAnswerType) {
    answerTypeField.classList.add("hidden");
  }
  testSetup.classList.remove("hidden");
  loadVocabulary(level).then((data) => {
    words = data;
  }).catch(() => {
    alert("Không tải được từ vựng");
    window.location.href = "index.html";
  });
}

btnStart.addEventListener("click", startQuiz);
btnRetry.addEventListener("click", () => {
  testResult.classList.add("hidden");
  testSetup.classList.remove("hidden");
});

answerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!quizFeedback.classList.contains("hidden")) return;
  checkAnswer();
});

btnNextQ.addEventListener("click", nextQuestion);

function startQuiz() {
  const count = Math.min(parseInt(questionCount.value, 10), words.length);
  const pool = shuffleArray(words);
  questions = pool.slice(0, count);
  current = 0;
  score = 0;
  results = [];
  testSetup.classList.add("hidden");
  testResult.classList.add("hidden");
  testQuiz.classList.remove("hidden");
  showQuestion();
}

function showQuestion() {
  quizFeedback.classList.add("hidden");
  answerForm.classList.remove("hidden");
  answerInput.value = "";
  answerInput.disabled = false;
  answerInput.focus();

  const q = questions[current];
  const pct = ((current) / questions.length) * 100;
  progressBar.style.width = `${pct}%`;
  quizProgressText.textContent = `Câu ${current + 1} / ${questions.length}`;

  quizQuestion.className = "quiz-question";

  if (mode === "zh-to-answer") {
    promptLabel.textContent = "Hán tự";
    quizQuestion.textContent = q.hanzi;
    const ans = answerType.value;
    answerInput.placeholder = ans === "pinyin" ? "Nhập pinyin..." : "Nhập nghĩa tiếng Việt...";
  } else {
    const usePinyin = Math.random() < 0.5;
    q._promptType = usePinyin ? "pinyin" : "vietnamese";
    if (usePinyin) {
      promptLabel.textContent = "Pinyin";
      quizQuestion.textContent = q.pinyin;
      quizQuestion.classList.add("prompt-pinyin");
      answerInput.placeholder = "Nhập chữ Hán...";
    } else {
      promptLabel.textContent = "Nghĩa tiếng Việt";
      quizQuestion.textContent = q.meaning;
      quizQuestion.classList.add("prompt-vi");
      answerInput.placeholder = "Nhập chữ Hán...";
    }
  }
}

function checkAnswer() {
  const q = questions[current];
  const user = answerInput.value.trim();
  if (!user) return;

  let ok = false;
  let expected = "";

  if (mode === "zh-to-answer") {
    if (answerType.value === "pinyin") {
      ok = pinyinMatches(user, q.pinyin);
      expected = q.pinyin;
    } else {
      ok = vietnameseMatches(user, q.meaning);
      expected = q.meaning;
    }
  } else {
    ok = hanziMatches(user, q.hanzi);
    expected = q.hanzi;
  }

  if (ok) score++;
  results.push({ q, user, ok, expected });

  answerInput.disabled = true;
  answerForm.classList.add("hidden");
  quizFeedback.classList.remove("hidden");
  quizFeedback.classList.toggle("correct", ok);
  quizFeedback.classList.toggle("wrong", !ok);
  feedbackText.textContent = ok ? "Đúng rồi!" : "Chưa đúng";
  correctAnswer.textContent = ok ? "" : `Đáp án: ${expected}`;
}

function nextQuestion() {
  current++;
  if (current >= questions.length) {
    showResults();
    return;
  }
  showQuestion();
}

function showResults() {
  testQuiz.classList.add("hidden");
  testResult.classList.remove("hidden");
  const pct = Math.round((score / questions.length) * 100);
  resultScore.textContent = `${score} / ${questions.length} (${pct}%)`;
  resultList.innerHTML = results
    .filter((r) => !r.ok)
    .map(
      (r) =>
        `<li class="wrong-q">${r.q.hanzi} — bạn: "${r.user}" → đúng: ${r.expected}</li>`
    )
    .join("");
  if (!resultList.innerHTML) {
    resultList.innerHTML = "<li>Tuyệt vời — không có câu sai!</li>";
  }
}
