# 🌐 網路管理工具入口網站 (Tool Table)

一個現代化、響應式的內部網路管理工具入口網站，提供快速存取企業內部各項服務、跳板主機、維運工具和線上資源的統一介面。

![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## ✨ 功能特色

### 🎨 現代化 UI 設計
- **玻璃擬態 (Glassmorphism)** 風格介面
- **深色/淺色主題** 一鍵切換
- **響應式設計** 支援桌面、平板、手機
- **流暢動畫** 提升使用體驗

### 🔧 核心功能
- **階層式側邊欄導航** - 多層巢狀選單，清晰的服務分類
- **即時搜尋** - 快速搜尋所有服務
- **快速篩選** - 依圖示類型篩選 (Fortinet、Graylog、Ruckus 等)
- **上網驗證快捷入口** - 各區域網路驗證連結
- **時鐘小工具** - 顯示即時時間、日期、IP 位置資訊
- **效能模式** - 關閉動畫效果，提升舊設備效能

### 📁 服務分類架構
```
1. 集團服務 PCG Service
   └── 1-1. 常用服務 (CMS、BPMS、VMS、M365...)

2. 跳板主機 Jumpserver
   ├── 2-1. 臺灣區
   ├── 2-2. 大陸區
   ├── 2-3. 越南區
   ├── 2-4. 印尼區
   └── 2-5. 印度區

3. 維運工具 NetOps Tools
   ├── 3-1. 雲端 Cloud (Azure、AWS)
   ├── 3-2. 臺灣區 Taiwan
   ├── 3-3. 大陸區 China
   ├── 3-4. 越南區 Viet Nam
   ├── 3-5. 印尼區 Indonesia
   └── 3-6. 印度區 India

4. 線上工具
   ├── 4-1. 網路工具
   ├── 4-2. 安全工具
   ├── 4-3. 文書工具
   └── 4-4. 生成式 AI
```

---

## 🚀 快速開始

### 方法一：使用 Python HTTP Server (推薦)

```bash
# 進入專案目錄
cd tool-table

# 啟動本地伺服器
python -m http.server 8080

# 在瀏覽器開啟
# http://localhost:8080
```

### 方法二：使用 Node.js

```bash
# 安裝 http-server (僅需一次)
npm install -g http-server

# 啟動伺服器
http-server -p 8080

# 在瀏覽器開啟
# http://localhost:8080
```

### 方法三：使用 VS Code Live Server

1. 安裝 VS Code 擴充套件「Live Server」
2. 右鍵點擊 `index.html`
3. 選擇「Open with Live Server」

> ⚠️ **重要提示**：請勿直接用瀏覽器開啟 `index.html` (file:// 協議)，因為瀏覽器安全限制會阻止 YAML 檔案載入。必須透過 HTTP 伺服器存取。

---

## 📂 專案結構

```
tool-table/
├── index.html              # 主頁面
├── styles.css              # 主樣式表 (含響應式設計)
├── main.js                 # 核心邏輯 (導航、搜尋、YAML 載入)
├── clock-widget.js         # 時鐘與 IP 資訊小工具
├── search-enhancement.js   # 搜尋增強功能
├── performance-mode.js     # 效能模式切換
├── js-yaml.min.js          # YAML 解析庫 (本地化)
├── fonts.css               # 本地字體定義
├── fonts/                  # 本地字體檔案
│   └── RobotoMono-Bold.woff2
└── resource/
    ├── icon/               # 服務圖示
    │   ├── fortinet-icon.png
    │   ├── graylog-icon.svg
    │   ├── ruckus-icon.png
    │   └── ...
    ├── 1.yaml              # 集團服務分類
    ├── 2.yaml              # 跳板主機分類
    ├── 3.yaml              # 維運工具分類
    ├── 4.yaml              # 線上工具分類
    ├── AccessInternetAuth.yaml  # 上網驗證連結
    └── *.yaml              # 各子分類資料
```

---

## 📝 YAML 資料格式

### 服務項目格式
```yaml
# resource/1-1.yaml
items:
  - name: "服務名稱"
    icon: "icon-filename.png"    # 對應 resource/icon/ 下的圖示
    url: "https://example.com"   # 外部連結

  - name: "子選單名稱"
    icon: "folder-icon.png"
    file: "1-1-1.yaml"           # 指向子分類 YAML 檔案
```

### 上網驗證格式
```yaml
# resource/AccessInternetAuth.yaml
sections:
  - region: "區域名稱"
    items:
      - name: "地點名稱"
        url: "https://auth-portal.com"
```

---

## 🎨 自訂主題

### 修改顏色變數
編輯 `styles.css` 中的 CSS 變數：

```css
:root {
  /* 深色主題 */
  --bg-gradient: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  --text-main: #ffffff;
  --text-secondary: #a0a0a0;
  --accent-color: #38bdf8;
  --glass-surface: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
}

[data-theme="light"] {
  /* 淺色主題 */
  --bg-gradient: linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 50%, #bcccdc 100%);
  --text-main: #1a202c;
  --text-secondary: #4a5568;
}
```

---

## 🔧 新增服務項目

1. **選擇對應的 YAML 檔案**
   - 依據服務分類選擇適當的 YAML 檔案

2. **新增項目**
   ```yaml
   - name: "新服務名稱"
     icon: "service-icon.png"
     url: "https://new-service.com"
   ```

3. **若需要圖示**
   - 將圖示檔案放入 `resource/icon/` 目錄
   - 建議使用 PNG 或 SVG 格式，尺寸 64x64 像素

4. **刷新頁面** 即可看到新增的服務

---

## 🛠️ 技術棧

| 技術 | 用途 |
|------|------|
| **HTML5** | 頁面結構、語意化標籤 |
| **CSS3** | 樣式、動畫、響應式設計 |
| **JavaScript (ES6+)** | 互動邏輯、動態載入 |
| **js-yaml** | YAML 檔案解析 |
| **Fetch API** | 非同步載入資料 |

### 設計特點
- **CSS clamp()** - 實現流暢的響應式設計
- **CSS Variables** - 方便的主題切換
- **Flexbox & Grid** - 現代化佈局系統
- **Backdrop Filter** - 玻璃擬態效果

---

## 🌐 瀏覽器支援

| 瀏覽器 | 支援版本 |
|--------|----------|
| Chrome | 76+ |
| Firefox | 70+ |
| Safari | 13+ |
| Edge | 79+ |

> 💡 建議使用最新版 Chrome 或 Edge 以獲得最佳體驗

---

## 📄 License

MIT License - 歡迎自由使用與修改

---

## 👨‍💻 維護者

**Network Operations Team**

如有問題或建議，請透過內部管道聯繫維運團隊。
