# Stroll-Taipei

台北市的單日散策路線產生器。

## 本機啟動

```bash
npm install
docker compose up -d            # 起本機 Postgres 17
cp .env.example .env            # 填入 DATABASE_URL 與 Mapbox token
npm run db:migrate              # 建立 attractions 表
npm run db:seed                 # 從 data/attractions.json 寫入資料
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)。

## 環境變數

`.env.example` 是設定模板,複製為 `.env` 後填入實際值。

- `DATABASE_URL` — Postgres 連線字串。本機 `docker compose` 預設值已在 `.env.example` 給出;Zeabur 上由 Postgres template 透過 service injection 自動注入。
- `NEXT_PUBLIC_MAPBOX_TOKEN` — Mapbox public access token,景點抽屜內的地圖會用到。從 [Mapbox](https://account.mapbox.com/access-tokens/) 申請。未填時地圖區塊顯示 fallback 文字,其餘功能不受影響。建議在 Mapbox token 頁面設定 URL restrictions 限制只允許 dev 與部署網域。

## 看本機 DB 資料

`docker compose up -d` 會順便起一個 pgweb sidecar(dev-only),開 [http://localhost:8081](http://localhost:8081) 就能直接瀏覽 `attractions` 等表的內容、跑 ad-hoc query。production 不會有這個。

## 修改景點資料

景點資料以 `data/attractions.json` 為唯一手動編輯入口,Postgres 中的 `attractions` 表是 derived 的。流程:

1. 編輯 `data/attractions.json`
2. 跑 `npm run db:seed`(內部會先用 `validateAttractionList` 驗證,失敗時 exit 非 0、不動 DB;成功時 upsert 進 DB)

不要直接寫 DB — `data/attractions.json` 是 source of truth,DB 重 seed 一次就會被覆蓋。

## Zeabur 部署

1. 在 Zeabur project 加 Postgres template(版本 17),把 `DATABASE_URL` service variable 注入到 Next.js service
2. Deploy Next.js service
3. 在 Zeabur Shell 跑 migration 與 seed:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

MVP 階段 migration 不自動跑,每次 schema 變動後手動執行一次。

## 指令

| 指令 | 用途 |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Production server(需先 build) |
| `npm run lint` | ESLint |
| `npm test` | Jest |
| `npm run db:migrate` | 跑 `db/migrations/*.sql`(idempotent) |
| `npm run db:seed` | 從 `data/attractions.json` 寫入 attractions 表 |

## 技術棧

- Next.js(app router)+ JavaScript + Tailwind CSS v4
- Postgres 17 + node-postgres(`pg`)原生 client,手寫 SQL
- Jest + Testing Library
- 部署目標:Zeabur

## 資料

- 景點資料(seed 來源):`data/attractions.json`
- 散策標籤體系:`lib/attractions/tag-pool.js`
- Schema 驗證:`lib/attractions/validator.js`
- DB schema:`db/migrations/0001_create_attractions.sql`
- Repository:`lib/attractions/repository.js`
