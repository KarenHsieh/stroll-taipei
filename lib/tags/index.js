import { BASE_TAG_CATEGORIES } from "./base-tags.js";
import { TAIPEI_EXTRA_TAGS } from "./editions/taipei.js";
import { FUKUOKA_EXTRA_TAGS } from "./editions/fukuoka.js";

const EDITION_EXTRAS = {
  taipei: TAIPEI_EXTRA_TAGS,
  fukuoka: FUKUOKA_EXTRA_TAGS,
};

const CATEGORIES = ["flow", "activity", "mood", "special"];

function mergePools(base, extra) {
  const merged = {};
  for (const cat of CATEGORIES) {
    const excluded = extra.exclude?.[cat] ?? [];
    const baseFiltered = (base[cat] ?? []).filter((t) => !excluded.includes(t));
    merged[cat] = [...baseFiltered, ...(extra[cat] ?? [])];
  }
  return merged;
}

export function getTagPool(editionId) {
  const extra = EDITION_EXTRAS[editionId];
  if (!extra) return null;
  return mergePools(BASE_TAG_CATEGORIES, extra);
}

export function getAllTagPools() {
  // 聯集刻意不套用任何 edition 的 exclude——例如 `老屋` 在福岡 opt-out 但台北還在用,
  // 聯集要把它保留下來給驗證/全域查詢使用。
  const union = {};
  for (const cat of CATEGORIES) {
    union[cat] = [...BASE_TAG_CATEGORIES[cat]];
  }
  for (const extra of Object.values(EDITION_EXTRAS)) {
    for (const cat of CATEGORIES) {
      for (const tag of extra[cat] ?? []) {
        if (!union[cat].includes(tag)) union[cat].push(tag);
      }
    }
  }
  return union;
}
