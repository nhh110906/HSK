const AI_KEY_STORAGE = "hsk_gemini_api_key";
const GEMINI_MODELS = ["gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-2.0-flash"];
const MIN_REQUEST_GAP_MS = 4000;
const LAST_REQUEST_KEY = "hsk_ai_last_request";

function getGeminiApiKey() {
  return localStorage.getItem(AI_KEY_STORAGE)?.trim() || "";
}

function setGeminiApiKey(key) {
  if (key.trim()) {
    localStorage.setItem(AI_KEY_STORAGE, key.trim());
  } else {
    localStorage.removeItem(AI_KEY_STORAGE);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseRetryAfterSeconds(res, errBody) {
  const header = res.headers.get("retry-after");
  if (header) {
    const n = parseInt(header, 10);
    if (!Number.isNaN(n)) return Math.min(n, 60);
  }
  const match = errBody.match(/retry in (\d+(?:\.\d+)?)/i);
  if (match) return Math.min(Math.ceil(parseFloat(match[1])), 60);
  return 8;
}

function geminiErrorMessage(status, errBody) {
  if (status === 429) {
    return {
      code: "RATE_LIMIT",
      message:
        "Đã vượt giới hạn gọi API (lỗi 429). Gói miễn phí Gemini giới hạn số lần/phút. Đợi 1–2 phút rồi thử lại, hoặc kiểm tra quota tại Google AI Studio.",
    };
  }
  if (status === 400 || status === 403) {
    return {
      code: "BAD_API_KEY",
      message:
        "API key không hợp lệ hoặc chưa bật Gemini API. Tạo key mới tại Google AI Studio (dạng AIza...).",
    };
  }
  if (status === 404) {
    return {
      code: "MODEL_ERROR",
      message: "Model AI không khả dụng. Thử lại sau vài phút.",
    };
  }
  return {
    code: "API_ERROR",
    message: `AI lỗi (${status}). ${errBody.slice(0, 100)}`,
  };
}

async function callGemini(apiKey, model, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        maxOutputTokens: 512,
      },
    }),
  });

  const errBody = await res.text().catch(() => "");

  if (!res.ok) {
    const info = geminiErrorMessage(res.status, errBody);
    const err = new Error(info.message);
    err.code = info.code;
    err.status = res.status;
    err.retryAfterSec = parseRetryAfterSeconds(res, errBody);
    throw err;
  }

  const data = JSON.parse(errBody || "{}");
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

function buildPrompt(ctx) {
  return `Giáo viên tiếng Trung. Từ: ${ctx.targetWord} (${ctx.meaning}). Câu mẫu: ${ctx.referenceExample}. Học viên viết: ${ctx.userSentence}. Kiểm tra ngữ pháp và cách dùng từ. Trả lời tiếng Việt, chỉ JSON: {"score":0-100,"correct":true/false,"summary":"...","issues":["..."],"suggestion":"..."}`;
}

/**
 * @param {{ targetWord: string, meaning: string, referenceExample: string, referencePinyin?: string, userSentence: string }} ctx
 */
async function checkChineseGrammar(ctx) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    const err = new Error("Chưa có API key");
    err.code = "NEED_API_KEY";
    throw err;
  }

  const last = parseInt(localStorage.getItem(LAST_REQUEST_KEY) || "0", 10);
  const waitMs = MIN_REQUEST_GAP_MS - (Date.now() - last);
  if (waitMs > 0) {
    const err = new Error(
      `Vui lòng đợi ${Math.ceil(waitMs / 1000)} giây trước khi kiểm tra lại (tránh lỗi 429).`
    );
    err.code = "COOLDOWN";
    err.waitSec = Math.ceil(waitMs / 1000);
    throw err;
  }

  const prompt = buildPrompt(ctx);
  let lastErr = null;

  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const text = await callGemini(apiKey, model, prompt);
        localStorage.setItem(LAST_REQUEST_KEY, String(Date.now()));

        let parsed;
        try {
          const jsonStr = text.replace(/^```json?\s*|\s*```$/g, "");
          parsed = JSON.parse(jsonStr);
        } catch {
          parsed = {
            score: 0,
            correct: false,
            summary: text || "Không phân tích được phản hồi AI.",
            issues: [],
            suggestion: "",
          };
        }

        return {
          score: Number(parsed.score) || 0,
          correct: Boolean(parsed.correct),
          summary: String(parsed.summary || ""),
          issues: Array.isArray(parsed.issues) ? parsed.issues.map(String) : [],
          suggestion: String(parsed.suggestion || ""),
        };
      } catch (e) {
        lastErr = e;
        if (e.code === "RATE_LIMIT" && attempt < 2) {
          const sec = e.retryAfterSec || 8 * (attempt + 1);
          await sleep(sec * 1000);
          continue;
        }
        if (e.code === "RATE_LIMIT" || e.code === "MODEL_ERROR") {
          break;
        }
        throw e;
      }
    }
  }

  throw lastErr || new Error("Không gọi được AI");
}
