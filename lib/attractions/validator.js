import { ALL_TAGS } from "./tag-pool.js";

const VALID_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const VALID_TIME_WINDOWS = ["morning", "afternoon", "evening"];
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*_[a-z0-9]+(-[a-z0-9]+)*$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const TAIPEI_LAT = [24.9, 25.3];
const TAIPEI_LNG = [121.4, 121.7];

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function checkNumberInRange(errors, obj, field, min, max) {
  if (typeof obj[field] !== "number" || Number.isNaN(obj[field])) {
    errors.push(`${field}: required number`);
    return false;
  }
  if (obj[field] < min || obj[field] > max) {
    errors.push(`${field}: must be within Taipei bounds`);
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

function checkTags(errors, obj) {
  const value = obj.tags;
  if (!Array.isArray(value)) {
    errors.push("tags: required array");
    return;
  }
  if (value.length < 1) {
    errors.push("tags: must have at least one entry");
    return;
  }
  value.forEach((tag, idx) => {
    if (typeof tag !== "string") {
      errors.push(`tags[${idx}]: must be string`);
    } else if (!ALL_TAGS.includes(tag)) {
      errors.push(`tags[${idx}]: '${tag}' is not in tag pool`);
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

function checkLat(errors, obj) {
  checkNumberInRange(errors, obj, "lat", TAIPEI_LAT[0], TAIPEI_LAT[1]);
}

function checkLng(errors, obj) {
  checkNumberInRange(errors, obj, "lng", TAIPEI_LNG[0], TAIPEI_LNG[1]);
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
  checkTags(errors, obj);
  checkStayRange(errors, obj);
  checkAvgCost(errors, obj);
  checkBoolean(errors, obj, "indoor");
  checkLat(errors, obj);
  checkLng(errors, obj);
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
