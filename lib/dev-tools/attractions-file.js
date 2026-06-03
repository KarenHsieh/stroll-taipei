import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const ATTRACTIONS_PATH = path.resolve(
  process.cwd(),
  "data/attractions.json"
);

export class IdAlreadyExistsError extends Error {
  constructor(id) {
    super(`id "${id}" 已存在`);
    this.name = "IdAlreadyExistsError";
    this.id = id;
  }
}

export function readAttractions(filePath = ATTRACTIONS_PATH) {
  const raw = readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

export function appendAttraction(attraction, filePath = ATTRACTIONS_PATH) {
  const list = readAttractions(filePath);
  if (list.some((a) => a.id === attraction.id)) {
    throw new IdAlreadyExistsError(attraction.id);
  }
  list.push(attraction);
  writeFileSync(filePath, JSON.stringify(list, null, 2) + "\n", "utf8");
}
