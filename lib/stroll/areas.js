export const AREAS = [
  { editionId: "taipei", id: "dadaocheng", name: "大稻埕", en: "Dadaocheng", active: true },
  { editionId: "taipei", id: "yongkang", name: "永康街", en: "Yongkang", active: true },
  { editionId: "taipei", id: "yuanshan", name: "圓山", en: "Yuanshan", active: true },
  { editionId: "taipei", id: "minsheng", name: "民生社區", en: "Minsheng", active: false },
  { editionId: "taipei", id: "guting", name: "古亭", en: "Guting", active: false },
  { editionId: "taipei", id: "ximen", name: "西門", en: "Ximen", active: false },
  { editionId: "taipei", id: "zhongshan", name: "中山", en: "Zhongshan", active: false },
  { editionId: "taipei", id: "xinyi", name: "信義", en: "Xinyi", active: false },
  { editionId: "taipei", id: "beitou", name: "北投", en: "Beitou", active: false },
  { editionId: "taipei", id: "shilin", name: "士林", en: "Shilin", active: false },
  { editionId: "taipei", id: "gongguan", name: "公館", en: "Gongguan", active: false },
  { editionId: "fukuoka", id: "tenjin", name: "天神", en: "Tenjin", active: true },
  { editionId: "fukuoka", id: "hakata", name: "博多", en: "Hakata", active: true },
  { editionId: "fukuoka", id: "nakasu", name: "中洲", en: "Nakasu", active: true },
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
