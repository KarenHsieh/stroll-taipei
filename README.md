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
- `TZ` — 容器/runtime 時區。**production、Zeabur、Docker 容器、CI runner 都必須設定 `TZ=Asia/Taipei`。** 程式碼層級已用 `lib/time/taipei-clock.js` 把 scheduler 與 transformer 的時間計算固定在 Asia/Taipei,所以即使 TZ 沒設定,核心散策邏輯也會正確;但 `TZ=Asia/Taipei` 仍是第一道防線(defense in depth),日後若新模組誤用 `new Date().toString()` 之類 local-time API,會自然以 Asia/Taipei 顯示,而不是 UTC。本機 macOS 開發時系統時區通常就是 Asia/Taipei,無需額外設定。

## 看本機 DB 資料

`docker compose up -d` 會順便起一個 pgweb sidecar(dev-only),開 [http://localhost:8081](http://localhost:8081) 就能直接瀏覽 `attractions` 等表的內容、跑 ad-hoc query。production 不會有這個。

## 修改景點資料

景點資料以 `data/attractions.json` 為唯一手動編輯入口,Postgres 中的 `attractions` 表是 derived 的。**改完一定要跑 `npm run db:seed` 同步進 DB**,流程不變;差別只在新增/編輯 JSON 的方式有兩種。

### 方式 1:本機編輯器 `/dev-tools/attractions`(推薦)

`npm run dev` 起 dev server 後,瀏覽器打開:

- 清單頁:[http://localhost:3000/dev-tools/attractions](http://localhost:3000/dev-tools/attractions)
  - 顯示 `data/attractions.json` 全部 entries,table 形式
  - 三層 filter:edition dropdown、area dropdown(依 edition 連動)、name 模糊搜尋
  - 點 row 可展開看完整 11 欄
- 新增頁:[http://localhost:3000/dev-tools/attractions/new](http://localhost:3000/dev-tools/attractions/new)
  - 11 欄表單,送出時 server-side 跑 `lib/attractions/validator.js` 把關
  - 通過驗證即 append 到 `data/attractions.json`、UI 跳回清單頁;失敗則 inline 顯示錯誤
  - 表單便利性:
    - `edition_id` / `area_id` 連動 dropdown
    - `tags` 只列當下 edition 的 tag pool(避免誤用別 edition 的詞)
    - `lat` / `lng` 即時顯示 ✓ / ✗ 標示是否在該 edition 的 bbox 內
    - `id` 從 `<area_id>_<slugify(name)>` 自動生成,純 CJK 名稱可手填羅馬字 slug
    - `open_hours` 七天 grid + 一鍵「全週同樣時段」「24h 營業」「複製週一到全部」
    - 撞 id 即時警示

**這個編輯器只在 `npm run dev` 時可用**。部署後 `/dev-tools/...` 全部 404(`requireDevOnly` helper 看 `process.env.NODE_ENV !== "development"` 直接呼叫 `notFound()`,Zeabur / production build 都進不去)。所以可以放心提交、不用 gitignore。

編輯器原始碼:`app/dev-tools/`、`app/api/dev-tools/`、`lib/dev-tools/`。

### 方式 2:手動編輯 JSON

直接打開 `data/attractions.json` 編輯。schema 規則參考 `lib/attractions/validator.js`。`npm run db:seed` 之前 validator 不會跑,所以建議改完先在編輯器或本地跑一次 lint / 試 build 確認沒打錯字。

### 編輯完之後

```bash
npm run db:seed
```

內部會先用 `validateAttractionList` 驗證,失敗時 exit 非 0、不動 DB;成功時 upsert 進 DB。不要直接寫 DB — `data/attractions.json` 是 source of truth,DB 重 seed 一次就會被覆蓋。

## Zeabur 部署

1. 在 Zeabur project 加 Postgres template(版本 17),把 `DATABASE_URL` service variable 注入到 Next.js service
2. 在 Next.js service 的 Environment Variables 加上 `TZ=Asia/Taipei`(理由見上方「環境變數」一節)
3. Deploy Next.js service
4. 在 Zeabur Shell 跑 migration 與 seed:

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
