-- 建立 attractions 主表。Schema 對應 data/attractions.json,
-- stay_range 拆成 stay_min / stay_max,open_hours 用 JSONB,
-- tags / best_time_window 用 text[]。
CREATE TABLE attractions (
  id text PRIMARY KEY,
  name text NOT NULL,
  area text NOT NULL,
  tags text[] NOT NULL,
  stay_min integer NOT NULL,
  stay_max integer NOT NULL,
  avg_cost integer NOT NULL,
  indoor boolean NOT NULL,
  lat numeric(8, 5) NOT NULL,
  lng numeric(8, 5) NOT NULL,
  open_hours jsonb NOT NULL DEFAULT '[]'::jsonb,
  rating numeric(2, 1) NOT NULL,
  best_time_window text[] NOT NULL,
  CONSTRAINT attractions_stay_min_min CHECK (stay_min >= 5),
  CONSTRAINT attractions_stay_range_order CHECK (stay_min <= stay_max),
  CONSTRAINT attractions_avg_cost_nonneg CHECK (avg_cost >= 0),
  CONSTRAINT attractions_lat_taipei CHECK (lat BETWEEN 24.9 AND 25.3),
  CONSTRAINT attractions_lng_taipei CHECK (lng BETWEEN 121.4 AND 121.7),
  CONSTRAINT attractions_rating_range CHECK (rating BETWEEN 0 AND 5)
);

CREATE INDEX attractions_area_idx ON attractions (area);
