<!-- SPECTRA:START v1.0.2 -->

# Spectra Instructions

This project uses Spectra for Spec-Driven Development(SDD). Specs live in `openspec/specs/`, change proposals in `openspec/changes/`.

## Use `/spectra-*` skills when:

- A discussion needs structure before coding → `/spectra-discuss`
- User wants to plan, propose, or design a change → `/spectra-propose`
- Tasks are ready to implement → `/spectra-apply`
- There's an in-progress change to continue → `/spectra-ingest`
- User asks about specs or how something works → `/spectra-ask`
- Implementation is done → `/spectra-archive`
- Commit only files related to a specific change → `/spectra-commit`

## Workflow

discuss? → propose → apply ⇄ ingest → archive

- `discuss` is optional — skip if requirements are clear
- Requirements change mid-work? Plan mode → `ingest` → resume `apply`

## Parked Changes

Changes can be parked（暫存）— temporarily moved out of `openspec/changes/`. Parked changes won't appear in `spectra list` but can be found with `spectra list --parked`. To restore: `spectra unpark <name>`. The `/spectra-apply` and `/spectra-ingest` skills handle parked changes automatically.

<!-- SPECTRA:END -->

# CLAUDE.md

這是 Stroll-Taipei 專案——一個單日散策路線產生器,目前已上線台北、福岡兩個 edition。

設計定位是**輕量散策參考工具**。三個 use case 都要支援:「前一晚先打開看看明天約會可以去哪」「吃飽飯了當下打開、找附近逛的順序」「真的在散策的時候邊走邊參考」。共通點是——使用者不想花力氣「規劃」,要的是「給我一個順序、我看一下、出發」。

不是行程規劃 App,不要往那個方向設計。完整的設計脈絡放在 docs/Stroll-Taipei_專案規劃討論過程.md。

---

## 一個核心想法請記住

**時間是參考,順序才是計畫。**

意思是:演算法內部用精確時間沒問題,但顯示給使用者看的時候要刻意模糊化。例如「下午兩點左右」、「大概一個半小時」這種講法,不要寫「14:00」、「90 分鐘」。畫面上永遠不要出現精確到分鐘的時間。

---

## 技術棧

- 用 Next.js(最新版)+ pure javascript (no TypeScript)+ Tailwind
- 單體架構,API Routes 當作 BFF,不要拆成獨立後端服務
- 資料庫用 Postgres,快取用 Redis,都放在 Zeabur 上
- AWS 是 Phase 3 之後才會考慮的事,MVP 期間不要為了將來搬 AWS 預先做設計

---

## 這些已經決定了,不用再建議

- 不用 Vercel——刻意選 Zeabur 是因為要學部署細節
- 不要拆獨立的 Koa 或 Express 後端
- 排程演算法不要用 LLM,用規則式的;這是刻意選擇,因為要可解釋、可測試
- 不要做多日的 UI(像是 Day 1 / Day 2 / Day 3 那種 tabs)
- 不要做打卡功能,MVP 階段用一顆「重新校準」按鈕就好
- 不要在中午硬塞一個吃飯的站,散策不一定要安排用餐
- **環境變數命名一律用業界標準名稱(`DATABASE_URL`、`REDIS_URL` 等),不要對齊雲端供應商的命名(`POSTGRES_CONNECTION_STRING`、`KV_URL` 之類)。** 兩邊有命名差異時,在雲端供應商那邊新增一個 alias 變數,值用 reference / 引用功能指向供應商實際輸出的變數。理由:程式碼保持跨雲可攜,本機 docker-compose / CI / 未來換 provider 的時候,其他環境的設定都不用動。

---

## 這些事情動手前先問我

- 想要新增第三方 API 或新的依賴套件
- 想要改景點 schema 的核心欄位(area、stay_range、tags 這些)
- 想要動精度模糊化的 transformer 邏輯
- 想要跳過既有的測試,或關掉 lint 規則

---

## 幾個容易做錯的地方

**同時呼叫多個外部 API 的時候,請用 `Promise.allSettled`,不要用 `Promise.all`。** 後者只要有一個失敗整個就會 reject,但散策資料只是其中一塊掛掉時(例如天氣 API 暫時不通),其他應該要還能正常顯示。

**任何來自使用者或第三方的 HTML,都要經過 DOMPurify 處理。** 這是我的個人習慣,不要省略。

**分享連結用 snapshot 形式,不要用參照。** 複製一份完整資料下來,不要讓接收方的內容跟原版連動。