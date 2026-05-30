import { getEditionById, isInsideEdition } from "../stroll/editions.js";
import { findAreaInEdition } from "../stroll/areas.js";
import { getTagPool, getAllTagPools } from "../tags/index.js";

const VALID_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const VALID_TIME_WINDOWS = ["morning", "afternoon", "evening"];
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*_[a-z0-9]+(-[a-z0-9]+)*$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function flattenPool(pool) {
  return Object.values(pool).flat();
}

function checkRequiredString(errors, obj, field) {
  if (!(field in obj) || typeof obj[field] !== "string" || obj[field].length === 0) {
    errors.push(`${field}: required string`);
    return false;
  }
  return true;
}

function checkBoolean(errors, obj, field) {
  if (typeof obj[field] !== "boolean") {
    errors.push(`${field}: required boolean`);
    return false;
  }
  return true;
}

function checkNumber(errors, obj, field) {
  if (typeof obj[field] !== "number" || Number.isNaN(obj[field])) {
    errors.push(`${field}: required number`);
    return false;
  }
  return true;
}

function checkId(errors, obj) {
  if (!checkRequiredString(errors, obj, "id")) return;
  if (!ID_PATTERN.test(obj.id)) {
    errors.push(
      "id: must match area-prefixed kebab-case format <area-slug>_<name-slug>"
    );
  }
}

function checkEditionAndArea(errors, obj) {
  if (!checkRequiredString(errors, obj, "edition_id")) return null;
  const edition = getEditionById(obj.edition_id);
  if (!edition) {
    errors.push(`edition_id: '${obj.edition_id}' is not a known edition`);
    return null;
  }
  if (!checkRequiredString(errors, obj, "area_id")) return edition;
  const area = findAreaInEdition(obj.edition_id, obj.area_id);
  if (!area) {
    errors.push(
      `area_id: '${obj.area_id}' is not a known area in edition '${obj.edition_id}'`
    );
  }
  return edition;
}

function checkTags(errors, obj, edition) {
  const value = obj.tags;
  if (!Array.isArray(value)) {
    errors.push("tags: required array");
    return;
  }
  if (value.length < 1) {
    errors.push("tags: must have at least one entry");
    return;
  }
  const pool = edition ? getTagPool(edition.id) : null;
  const allowed = pool ? flattenPool(pool) : flattenPool(getAllTagPools());
  value.forEach((tag, idx) => {
    if (typeof tag !== "string") {
      errors.push(`tags[${idx}]: must be string`);
    } else if (!allowed.includes(tag)) {
      const where = edition ? `edition '${edition.id}' tag pool` : "tag pool";
      errors.push(`tags[${idx}]: '${tag}' is not in ${where}`);
    }
  });
}

function checkStayRange(errors, obj) {
  const value = obj.stay_range;
  if (!Array.isArray(value) || value.length !== 2) {
    errors.push("stay_range: must be [min, max]");
    return;
  }
  const [min, max] = value;
  if (typeof min !== "number" || typeof max !== "number") {
    errors.push("stay_range: both entries must be numbers");
    return;
  }
  if (min < 5) {
    errors.push("stay_range: min must be >= 5 minutes");
  }
  if (min > max) {
    errors.push("stay_range: min must not exceed max");
  }
}

function checkAvgCost(errors, obj) {
  if (typeof obj.avg_cost !== "number" || Number.isNaN(obj.avg_cost)) {
    errors.push("avg_cost: required number");
    return;
  }
  if (obj.avg_cost < 0) {
    errors.push("avg_cost: must be >= 0");
  }
}

function checkLatLng(errors, obj, edition) {
  const latOk = checkNumber(errors, obj, "lat");
  const lngOk = checkNumber(errors, obj, "lng");
  if (!latOk || !lngOk || !edition) return;
  if (!isInsideEdition(edition, obj.lat, obj.lng)) {
    errors.push(
      `lat/lng: (${obj.lat}, ${obj.lng}) falls outside edition '${edition.id}' bounding boxes`
    );
  }
}

function checkOpenHours(errors, obj) {
  const value = obj.open_hours;
  if (!Array.isArray(value)) {
    errors.push("open_hours: required array");
    return;
  }
  value.forEach((entry, idx) => {
    if (!isPlainObject(entry)) {
      errors.push(`open_hours[${idx}]: must be object with day/open/close`);
      return;
    }
    if (!VALID_DAYS.includes(entry.day)) {
      errors.push(
        `open_hours[${idx}].day: must be one of ${VALID_DAYS.join("|")}`
      );
    }
    const openOk = typeof entry.open === "string" && TIME_PATTERN.test(entry.open);
    const closeOk = typeof entry.close === "string" && TIME_PATTERN.test(entry.close);
    if (!openOk) {
      errors.push(`open_hours[${idx}].open: must be HH:MM 24-hour format`);
    }
    if (!closeOk) {
      errors.push(`open_hours[${idx}].close: must be HH:MM 24-hour format`);
    }
    if (openOk && closeOk && entry.close <= entry.open) {
      errors.push(`open_hours[${idx}]: close must be later than open`);
    }
  });
}

function checkRating(errors, obj) {
  if (typeof obj.rating !== "number" || Number.isNaN(obj.rating)) {
    errors.push("rating: required number");
    return;
  }
  if (obj.rating < 0 || obj.rating > 5) {
    errors.push("rating: must be between 0 and 5");
  }
}

function checkBestTimeWindow(errors, obj) {
  const value = obj.best_time_window;
  if (!Array.isArray(value)) {
    errors.push("best_time_window: required array");
    return;
  }
  if (value.length < 1) {
    errors.push("best_time_window: must have at least one entry");
    return;
  }
  value.forEach((entry, idx) => {
    if (!VALID_TIME_WINDOWS.includes(entry)) {
      errors.push(
        `best_time_window[${idx}]: must be one of ${VALID_TIME_WINDOWS.join("|")}`
      );
    }
  });
}

export function validateAttraction(obj) {
  if (!isPlainObject(obj)) {
    return {
      valid: false,
      errors: ["input: required object"],
    };
  }
  const errors = [];
  checkId(errors, obj);
  checkRequiredString(errors, obj, "name");
  checkRequiredString(errors, obj, "area");
  const edition = checkEditionAndArea(errors, obj);
  checkTags(errors, obj, edition);
  checkStayRange(errors, obj);
  checkAvgCost(errors, obj);
  checkBoolean(errors, obj, "indoor");
  checkLatLng(errors, obj, edition);
  checkOpenHours(errors, obj);
  checkRating(errors, obj);
  checkBestTimeWindow(errors, obj);
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateAttractionList(arr) {
  if (!Array.isArray(arr)) {
    return {
      valid: false,
      errors: ["input: required array"],
    };
  }
  const errors = [];
  arr.forEach((item, idx) => {
    const result = validateAttraction(item);
    for (const err of result.errors) {
      errors.push(`[index ${idx}] ${err}`);
    }
  });
  return {
    valid: errors.length === 0,
    errors,
  };
}
