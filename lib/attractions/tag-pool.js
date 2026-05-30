import { BASE_TAG_CATEGORIES } from "../tags/base-tags.js";
import { getAllTagPools } from "../tags/index.js";

export const TAG_CATEGORIES = getAllTagPools();
export const ALL_TAGS = Object.values(TAG_CATEGORIES).flat();
export { BASE_TAG_CATEGORIES };
