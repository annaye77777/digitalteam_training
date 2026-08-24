# 外訓時間軸比對系統

公司內部工具：登記外訓課程時間地點，並在同一張時間軸上疊圖比對 Sprint 週期，快速判斷是否重疊。無登入機制，任何人皆可新增／編輯／刪除資料（刪除需二次確認）。

## 技術棧

- Next.js 14（App Router）+ TypeScript + Tailwind CSS
- Prisma + PostgreSQL（部署在 Vercel，需要雲端資料庫才能讓資料在多人之間同步保存；本機開發也建議接同一顆雲端 Postgres，避免跟正式環境的資料庫方言不一致）
- 純前端 fetch 呼叫 API Route，無即時同步，重新整理頁面可看到最新資料

## 本機執行

需要 Node.js 18.17+（建議 20 或 22 LTS），以及一個可連線的 Postgres 資料庫（見 [DEPLOY.md](DEPLOY.md) 步驟 2，本機開發跟正式環境可以共用同一顆）。

```bash
npm install
# 在 .env 填入 DATABASE_URL="postgresql://..."
npx prisma migrate dev --name init   # 建立資料表
npm run db:seed                      # （選用）匯入 Navi/IFRS Sprint 範例資料
npm run dev                          # 開發模式，預設 http://localhost:3000
```

正式部署到 Vercel：見 [DEPLOY.md](DEPLOY.md)。

## 資料儲存與時區

- 資料庫為雲端 Postgres，多人共用同一份資料，重新部署不會遺失資料。
- 所有日期時間欄位皆以「無時區」字串儲存（`YYYY-MM-DD` / `YYYY-MM-DDTHH:mm`），代表台北時間的牆上時鐘時間，前後端皆不做 UTC 轉換。這是刻意的簡化設計，符合規格書「固定台北時間、不處理跨時區」的需求；若未來需要支援多時區，需重新設計儲存格式。

## 專案結構

- `prisma/schema.prisma`：Course / CourseSession / Sprint 資料模型
- `src/app/api/*`：REST API（courses、sprints 及其巢狀時段）
- `src/components/Timeline/*`：時間軸視覺化（月/季檢視、課程軌道、Sprint 軌道）
- `src/components/CourseForm.tsx`、`SprintForm.tsx`：新增／編輯表單（支援多時段增減）
- `src/components/ConfirmDialog.tsx`：刪除二次確認彈窗

## 尚待討論（規格書第 9 節，暫未實作）

- 大量資料下的時間軸效能與分頁
- 匯出 Excel/CSV 或分享連結
- 新增資料後的通知機制（Email/Slack）
