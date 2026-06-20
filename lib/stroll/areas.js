export const AREAS = [
  {
    editionId: "taipei",
    id: "dadaocheng",
    name: "大稻埕",
    en: "Dadaocheng",
    active: true,
    bbox: { lat: [25.0522, 25.0642], lng: [121.5048, 121.5177] },
  },
  {
    editionId: "taipei",
    id: "yongkang",
    name: "永康街",
    en: "Yongkang",
    active: true,
    bbox: { lat: [25.0235, 25.0371], lng: [121.5207, 121.5336] },
  },
  {
    editionId: "taipei",
    id: "yuanshan",
    name: "圓山",
    en: "Yuanshan",
    active: true,
    bbox: { lat: [25.0693, 25.0991], lng: [121.5121, 121.5404] },
  },
  { editionId: "taipei", id: "minsheng", name: "民生社區", en: "Minsheng", active: false },
  { editionId: "taipei", id: "guting", name: "古亭", en: "Guting", active: false },
  { editionId: "taipei", id: "ximen", name: "西門", en: "Ximen", active: false },
  { editionId: "taipei", id: "zhongshan", name: "中山", en: "Zhongshan", active: false },
  { editionId: "taipei", id: "xinyi", name: "信義", en: "Xinyi", active: false },
  { editionId: "taipei", id: "beitou", name: "北投", en: "Beitou", active: false },
  { editionId: "taipei", id: "shilin", name: "士林", en: "Shilin", active: false },
  { editionId: "taipei", id: "gongguan", name: "公館", en: "Gongguan", active: false },
  {
    editionId: "fukuoka",
    id: "hakata-tenjin-nakasu",
    name: "博多・天神・中洲",
    en: "Hakata-Tenjin-Nakasu",
    active: true,
    bbox: { lat: [33.5827, 33.5976], lng: [130.3827, 130.4243] },
  },
  { editionId: "fukuoka", id: "mojiko", name: "門司港", en: "Mojiko", active: false },
  { editionId: "fukuoka", id: "itoshima", name: "糸島", en: "Itoshima", active: false },
];

export const ACTIVE_AREAS = AREAS.filter((a) => a.active);
export const SOON_AREAS = AREAS.filter((a) => !a.active);

export function findAreaInEdition(editionId, areaIdOrName) {
  return (
    AREAS.find(
      (a) =>
        a.editionId === editionId &&
        (a.id === areaIdOrName || a.name === areaIdOrName)
    ) ?? null
  );
}
