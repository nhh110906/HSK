const AI_KEY_STORAGE = "hsk_gemini_api_key";
const GEMINI_MODEL = "gemini-2.0-flash";

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

/**
 * @param {{ targetWord: string, meaning: string, referenceExample: string, referencePinyin?: string, userSentence: string }} ctx
 * @returns {Promise<{ score: number, correct: boolean, summary: string, issues: string[], suggestion: string }>}
 */
async function checkChineseGrammar(ctx) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    const err = new Error("Chưa có API key");
    err.code = "NEED_API_KEY";
    throw err;
  }

  const prompt = `Bạn là giáo viên tiếng Trung. Học viên đang ôn từ "${ctx.targetWord}" (nghĩa: ${ctx.meaning}).

Câu mẫu trong sách:
${ctx.referenceExample}
${ctx.referencePinyin ? "Pinyin mẫu: " + ctx.referencePinyin : ""}

Học viên tự viết câu:
${ctx.userSentence}

Hãy kiểm tra ngữ pháp, cách dùng từ, chữ Hán và tự nhiên của câu học viên.
Trả lời BẰNG TIẾNG VIỆT, chỉ JSON hợp lệ (không markdown), đúng schema:
{
  "score": <số 0-100>,
  "correct": <true nếu score >= 70>,
  "summary": "<1-2 câu đánh giá tổng>",
  "issues": ["<lỗi 1>", "<lỗi 2>"],
  "suggestion": "<câu sửa gợi ý bằng tiếng Trung, kèm pinyin trong ngoặc nếu cần>"
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    if (res.status === 400 || res.status === 403) {
      const err = new Error("API key không hợp lệ hoặc bị từ chối");
      err.code = "BAD_API_KEY";
      throw err;
    }
    throw new Error(`AI lỗi (${res.status}): ${errBody.slice(0, 120)}`);
  }

  const data = await res.json();
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

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
}
