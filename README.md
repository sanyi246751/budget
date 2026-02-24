# React Budget App

這是一個以 React + Vite 開發的記帳與預算管理套件。專案包含了基礎的依賴套件配置與 TailwindCSS 設定。

## 安裝與執行

1. **安裝依賴套件**
   確保你的環境已安裝 Node.js (v18 或以上)。
   ```bash
   npm install
   ```

2. **本地啟動測試**
   ```bash
   npm run dev
   ```
   服務將預設啟動在 `http://localhost:3000` (或其他埠口，請看終端機提示)，即可開啟瀏覽器預覽。

## 部署上線

已設定好 GitHub Actions，流程腳本位在 `.github/workflows/deploy.yml`。

1. 當你的程式碼 push 至 `main` 或 `master` 分支，GitHub Actions 將會自動執行測試並部署打包好的 `/dist` 內容。
2. 請進入你的 GitHub Repository **Settings > Pages > Build and deployment > Source** 中，選擇 **GitHub Actions**。

> **注意：**如果專案路徑是在子目錄或是子網域（如 `https://<user>.github.io/<repo>/`），請確保 `vite.config.ts` 中的 `base` 參數對應你的倉庫名稱（例如 `base: '/<repo>/'`），否則打包出來的資源網址會錯誤。

## 資料夾忽略策略 (Git)
已經設定完整的 `.gitignore`，避免將：
- `node_modules/` 模組資料夾
- `dist/` 打包產物
- `.env*` 等環境變數與私密設定檔
- `*.log` 及開發暫存檔、編輯器資料夾 (e.g. `.idea/`, `.vscode/`) 加入版控。
