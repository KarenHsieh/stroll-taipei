-- attractions 的 composite FK 需要 areas row 已存在才能成立，因此本 migration
-- 在同一 transaction 內 bootstrap taipei edition + 11 個 area row。這些 row 與
-- data/editions.json + lib/stroll/areas.js 對齊，seed 階段以 UPSERT 覆蓋。

CREATE TABLE editions (
  id text PRIMARY KEY,
  name text NOT NULL,
  en text NOT NULL,
  currency text NOT NULL,
  bboxes jsonb NOT NULL,
  max_walk_minutes integer NOT NULL,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE areas (
  edition_id text NOT NULL REFERENCES editions(id),
  id text NOT NULL,
  name text NOT NULL,
  en text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (edition_id, id)
);

INSERT INTO editions (id, name, en, currency, bboxes, max_walk_minutes, active) VALUES
  ('taipei', '台北', 'Taipei', 'TWD',
   '[{"lat":[24.9,25.3],"lng":[121.4,121.7]}]'::jsonb,
   15, true);

INSERT INTO areas (edition_id, id, name, en, active, sort_order) VALUES
  ('taipei', 'dadaocheng', '大稻埕', 'Dadaocheng', true, 0),
  ('taipei', 'yongkang', '永康街', 'Yongkang', true, 1),
  ('taipei', 'yuanshan', '圓山', 'Yuanshan', true, 2),
  ('taipei', 'minsheng', '民生社區', 'Minsheng', false, 3),
  ('taipei', 'guting', '古亭', 'Guting', false, 4),
  ('taipei', 'ximen', '西門', 'Ximen', false, 5),
  ('taipei', 'zhongshan', '中山', 'Zhongshan', false, 6),
  ('taipei', 'xinyi', '信義', 'Xinyi', false, 7),
  ('taipei', 'beitou', '北投', 'Beitou', false, 8),
  ('taipei', 'shilin', '士林', 'Shilin', false, 9),
  ('taipei', 'gongguan', '公館', 'Gongguan', false, 10);

ALTER TABLE attractions
  ADD COLUMN edition_id text NOT NULL DEFAULT 'taipei' REFERENCES editions(id),
  ADD COLUMN area_id text;

UPDATE attractions SET area_id = CASE area
  WHEN '大稻埕' THEN 'dadaocheng'
  WHEN '永康街' THEN 'yongkang'
  WHEN '圓山' THEN 'yuanshan'
  WHEN '民生社區' THEN 'minsheng'
  WHEN '古亭' THEN 'guting'
  WHEN '西門' THEN 'ximen'
  WHEN '中山' THEN 'zhongshan'
  WHEN '信義' THEN 'xinyi'
  WHEN '北投' THEN 'beitou'
  WHEN '士林' THEN 'shilin'
  WHEN '公館' THEN 'gongguan'
END;

ALTER TABLE attractions ALTER COLUMN area_id SET NOT NULL;

ALTER TABLE attractions
  ADD CONSTRAINT attractions_area_fk
  FOREIGN KEY (edition_id, area_id) REFERENCES areas(edition_id, id);

ALTER TABLE attractions ALTER COLUMN edition_id DROP DEFAULT;

ALTER TABLE attractions DROP CONSTRAINT attractions_lat_taipei;
ALTER TABLE attractions DROP CONSTRAINT attractions_lng_taipei;

ALTER TABLE attractions
  ADD CONSTRAINT attractions_lat_supported_range CHECK (lat BETWEEN 20 AND 46);
ALTER TABLE attractions
  ADD CONSTRAINT attractions_lng_supported_range CHECK (lng BETWEEN 120 AND 145);
