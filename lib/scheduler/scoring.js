import {
  TAG_MATCH_WEIGHT,
  RATING_WEIGHT,
  WALK_MINUTE_PENALTY,
  SURPRISE_BONUS,
  SURPRISE_RATING_THRESHOLD,
  SURPRISE_MIN_TAG_MATCHES,
} from "./score-weights.js";

export function scoreAttraction(
  attraction,
  { selectedMoods, selectedActivities = [], walkInMinutes = 0 }
) {
  // mood 跟 activity 在 scoring 階段一視同仁:每命中一個 selected tag 加固定權重。
  // 之所以分開傳入是讓 caller / URL / UI 端保留語意區別,便於日後分流。
  const selected = [...selectedMoods, ...selectedActivities];
  const tagMatches = attraction.tags.filter((t) => selected.includes(t)).length;
  const tagScore = tagMatches * TAG_MATCH_WEIGHT;
  const ratingScore = attraction.rating * RATING_WEIGHT;
  const walkPenalty = walkInMinutes * WALK_MINUTE_PENALTY;
  const surpriseBonus =
    attraction.rating < SURPRISE_RATING_THRESHOLD && tagMatches >= SURPRISE_MIN_TAG_MATCHES
      ? SURPRISE_BONUS
      : 0;
  return tagScore + ratingScore - walkPenalty + surpriseBonus;
}
