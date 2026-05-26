export const AREAS = [
  { id: "dadaocheng", name: "大稻埕", en: "Dadaocheng", active: true },
  { id: "yongkang", name: "永康街", en: "Yongkang", active: true },
  { id: "yuanshan", name: "圓山", en: "Yuanshan", active: true },
  { id: "minsheng", name: "民生社區", en: "Minsheng", active: false },
  { id: "guting", name: "古亭", en: "Guting", active: false },
  { id: "ximen", name: "西門", en: "Ximen", active: false },
  { id: "zhongshan", name: "中山", en: "Zhongshan", active: false },
  { id: "xinyi", name: "信義", en: "Xinyi", active: false },
  { id: "beitou", name: "北投", en: "Beitou", active: false },
  { id: "shilin", name: "士林", en: "Shilin", active: false },
  { id: "gongguan", name: "公館", en: "Gongguan", active: false },
];

export const CITY = { zh: "台北", en: "Taipei" };

export const ACTIVE_AREAS = AREAS.filter((a) => a.active);
export const SOON_AREAS = AREAS.filter((a) => !a.active);
