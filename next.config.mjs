/**
 * Runtime timezone requirement
 *
 * Stroll-Taipei 對外的所有時間都是 Asia/Taipei wall-clock。
 * 程式碼層級已透過 lib/time/taipei-clock.js 把所有對 Date.prototype.getHours
 * / getMinutes / getDay 的呼叫，改用 Intl.DateTimeFormat({ timeZone: "Asia/Taipei" })
 * 計算，所以 scheduler 與 transformer 都是 timezone-aware、不依賴 process TZ。
 *
 * 此檔案中**刻意不對 process.env.TZ 賦值**——避免 build-time 與 runtime
 * 之間製造時區語意差異，也避免污染整個 Node process 的時間語意。
 *
 * 然而仍要求 production / Zeabur / Docker 容器層必須設定環境變數
 * TZ=Asia/Taipei，作為第一道防線（defense in depth）：
 *   - 日後若新增的模組誤用 `new Date().toString()` 或其他 local-time API，
 *     會自然以 Asia/Taipei 顯示，而不是 UTC。
 *   - 雙重防線可避免單一防線失效後 bug 重現。
 *
 * 部署環境設定方式：
 *   - Zeabur: 在 service 環境變數加上 TZ=Asia/Taipei
 *   - Docker: 在 service 的 environment 區塊加上 TZ: Asia/Taipei
 *   - CI: 在 workflow env 加上 TZ=Asia/Taipei
 *
 * 詳細說明見 README.md「部署環境變數」一節。
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
};

export default nextConfig;
