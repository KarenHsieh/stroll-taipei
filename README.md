# Stroll-Taipei

台北市的單日散策路線產生器。

## 本機啟動

```bash
npm install
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)。

## 環境變數

景點抽屜內的地圖使用 Mapbox GL JS,需要一個 public access token。

1. 到 [Mapbox](https://account.mapbox.com/access-tokens/) 建立 public access token
2. 複製 `.env.example` 為 `.env.local`,填入:

   ```
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijoi...
   ```

未填 token 時地圖區塊顯示 fallback 文字,其餘功能不受影響。
部署時在 Zeabur service 的 Environment Variables 加入同一個 key。

建議在 Mapbox token 頁面設定 URL restrictions 限制只允許 dev 與部署網域。

## 指令

| 指令 | 用途 |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Production server(需先 build) |
| `npm run lint` | ESLint |
| `npm test` | Jest |

## 技術棧

- Next.js(app router)+ JavaScript + Tailwind CSS v4
- Jest + Testing Library
- 部署目標:Zeabur

## 資料

- 景點資料:`data/attractions.json`
- 散策標籤體系:`lib/attractions/tag-pool.js`
- Schema 驗證:`lib/attractions/validator.js`
