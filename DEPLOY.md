# 部署到 Vercel（讓其他團隊的人都能用）

目標：一個大家都能開的網址、資料共用同步、免費、撐到年底沒問題。

程式已經改好可以直接部署，資料庫需要從本機 SQLite 換成雲端 Postgres（Vercel 的伺服器沒有永久磁碟，SQLite 檔案在雲端會裝不住資料）。以下步驟大約 15–20 分鐘可以走完一次。

## 你需要準備的東西

- 一個 GitHub 帳號（免費）
- 一個 Vercel 帳號（免費，可直接用 GitHub 帳號登入，不用另外註冊）

## 步驟 1：把程式碼放到 GitHub

```bash
# 在專案資料夾 D:\Deltabox\ANNA.YE\claude\0728 裡
git add -A
git commit -m "Initial commit"
```

接著到 https://github.com/new 建立一個新的 repository（Public 或 Private 都可以，Private 也不影響部署），照畫面指示把上面 commit 好的內容 push 上去（GitHub 建立完會直接顯示指令，複製貼上執行即可）。

## 步驟 2：建立 Postgres 資料庫

1. 到 https://vercel.com 用 GitHub 帳號登入
2. 左側選 **Storage** → **Create Database** → 選 **Postgres**（背後是 Neon，免費方案足夠這個規模使用）
3. 建立好之後，進到該資料庫的 **.env.local** 分頁，複製 `DATABASE_URL` 這一行的值（一長串 `postgresql://...` 開頭的連線字串）

## 步驟 3：建立 Vercel 專案並部署

1. 回到 Vercel 首頁 → **Add New** → **Project**
2. 選擇你剛剛 push 上去的 GitHub repository → **Import**
3. 在 **Environment Variables** 這一區塊，新增一筆：
   - Key: `DATABASE_URL`
   - Value: 貼上步驟 2 複製的連線字串
   - 記得三個環境（Production / Preview / Development）都勾選
4. 按 **Deploy**，等它跑完（第一次大約 1–2 分鐘）

部署完成後，Vercel 會給你一個網址，例如 `training-timeline-xxx.vercel.app`，這個網址任何人都可以直接打開使用（目前沒有登入機制，符合你要「完全開放不設限」的決定）。

## 步驟 4：初始化資料庫內容（只需要做一次）

部署腳本（`npm run build` 已經內建 `prisma migrate deploy`）會自動幫你在雲端資料庫建好資料表，但「範例 Sprint 行事曆」跟你之前在本機測試建立的「IFRS」課程需要手動匯入一次：

在你自己電腦上（這個專案資料夾內）：

```bash
# 1. 把 .env 裡的 DATABASE_URL 換成步驟 2 複製的雲端連線字串
# 2. 執行：
npm run db:seed                        # 建立 Navi / IFRS 全年度 Sprint 行事曆
npx tsx prisma/restore-courses.ts      # 還原你先前在本機建立的 IFRS 測試課程
```

跑完這兩行之後，雲端網站上就會看到跟本機一樣的資料了。

## 之後要怎麼更新

以後只要在本機改完程式碼、`git push` 回 GitHub，Vercel 會自動重新部署，資料庫的 schema 變更（例如以後又加新欄位）也會在部署時自動套用，不需要手動操作。

## 費用 & 撐到年底沒問題嗎？

- Vercel Hobby（免費方案）＋ Neon/Vercel Postgres 免費方案，對於一個團隊內部、使用量不大的排課比對工具來說綽綽有餘，不會有費用問題
- 免費方案的資料庫在完全沒有連線時可能會有幾秒鐘的「喚醒」延遲（幾天沒人用之後第一次打開會稍微慢一點點），之後就正常，不影響到年底持續使用

## 之後如果想加簡單的存取保護

目前照你的決定是完全開放不設限。如果之後想加一層保護（不用改程式），Vercel 專案設定裡有內建的 **Password Protection**（Pro 方案功能）可以一鍵開關；或是請告訴我，我可以幫你在程式裡加一組全公司共用的簡單密碼驗證。
