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
    merged[cat] = [...(base[cat] ?? []), ...(extra[cat] ?? [])];
  }
  return merged;
}

export function getTagPool(editionId) {
  const extra = EDITION_EXTRAS[editionId];
  if (!extra) return null;
  return mergePools(BASE_TAG_CATEGORIES, extra);
}

export function getAllTagPools() {
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
