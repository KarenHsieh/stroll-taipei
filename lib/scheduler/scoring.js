import {
  TAG_MATCH_WEIGHT,
  RATING_WEIGHT,
  WALK_MINUTE_PENALTY,
  SURPRISE_BONUS,
  SURPRISE_RATING_THRESHOLD,
  SURPRISE_MIN_TAG_MATCHES,
} from "./score-weights.js";

export function scoreAttraction(attraction, { selectedMoods, walkInMinutes = 0 }) {
  const tagMatches = attraction.tags.filter((t) => selectedMoods.includes(t)).length;
  const tagScore = tagMatches * TAG_MATCH_WEIGHT;
  const ratingScore = attraction.rating * RATING_WEIGHT;
  const walkPenalty = walkInMinutes * WALK_MINUTE_PENALTY;
  const surpriseBonus =
    attraction.rating < SURPRISE_RATING_THRESHOLD && tagMatches >= SURPRISE_MIN_TAG_MATCHES
      ? SURPRISE_BONUS
      : 0;
  return tagScore + ratingScore - walkPenalty + surpriseBonus;
}
