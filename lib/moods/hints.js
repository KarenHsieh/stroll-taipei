/**
 * Per-edition per-mood 提示字串。
 *
 * 用途：home form 的 MoodPicker 與 dev-tool 的 AttractionForm 在 mood 選項旁顯示一
 * 行小字，幫助使用者 / 編輯者把抽象的「氛圍」對應到實際的景點類型。例如 mood「文青」
 * 對應到「咖啡店、書店、選物店」這類具體場景。
 *
 * 維護規則：
 * - 新增 mood tag（在 `lib/tags/base-tags.js` 或某個 edition 的 extras）時，必須在這
 *   裡同步補上對應的 hint，否則 UI 會退回顯示原 mood 字詞（沒 sub-label），看似缺漏。
 * - 同名 mood 在不同 edition 可能對應不同 hint 字典（例如台北「復古」≠ 福岡「復古」），
 *   因此 hints 結構是 per-edition per-mood，跨 edition 不共用。
 * - Hint 字串建議用 3 個左右的景點類型詞、用「、」分隔；不要寫得太長（UI 是 sub-label）。
 * - 未填 hint 時 `getMoodHint` 回傳 `null`、UI 退回顯示原字詞、不報錯。
 * - 不要在這裡放空字串 `""`：沒有 hint 就讓 key 缺席。空字串會被誤認為「有 hint」。
 */
export const MOOD_HINTS = {
  taipei: {
    文青: "咖啡店、書店、選物店",
    職人: "手作店、工藝坊",
    復古: "老建築、老字號、市場",
    靜謐: "公園、廟宇、巷弄",
    熱鬧: "商店街、夜市",
    生活感: "市場、麵包店、家常店",
    老建築: "古蹟、洋樓、老屋",
  },
  fukuoka: {
    文青: "カフェ、書店、ギャラリー",
    職人: "手仕事、工房",
    復古: "古民家、老舗",
    靜謐: "神社、庭園",
    熱鬧: "屋台、商店街",
    生活感: "商店街、市場",
    老建築: "神社、伝統建築",
    流水聲: "川辺、水岸",
    傳統: "神社、祭事",
  },
};

/**
 * Look up the hint string for a (editionId, mood) pair.
 *
 * Returns the hint string when both `editionId` and `mood` are known. Returns `null`
 * when either is missing, null/undefined, or has no entry in MOOD_HINTS — the UI
 * fallback is to render the mood label alone, without a sub-label.
 */
export function getMoodHint(editionId, mood) {
  if (editionId == null || mood == null) return null;
  const editionHints = MOOD_HINTS[editionId];
  if (!editionHints) return null;
  return editionHints[mood] ?? null;
}
