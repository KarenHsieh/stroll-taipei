import editionsData from "../../data/editions.json" with { type: "json" };

export const EDITIONS = editionsData;

export const ACTIVE_EDITIONS = EDITIONS.filter((e) => e.active);

export function getEditionById(id) {
  return EDITIONS.find((e) => e.id === id) ?? null;
}

export function isInsideEdition(edition, lat, lng) {
  return edition.bboxes.some(
    (b) =>
      lat >= b.lat[0] && lat <= b.lat[1] && lng >= b.lng[0] && lng <= b.lng[1]
  );
}
