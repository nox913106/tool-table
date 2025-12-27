# Tool Table - 網路管理工具入口

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Python](https://img.shields.io/badge/python-3.10+-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

一站式網路管理工具入口平台，支援樹狀結構分類、搜尋過濾、快速連結管理。

---

## 📋 目錄

- [功能特色](#-功能特色)
- [系統需求](#-系統需求)
- [安裝部署](#-安裝部署)
- [使用說明](#-使用說明)
- [管理後台](#-管理後台)
- [API 文件](#-api-文件)

---

## ✨ 功能特色

### 前台功能
| 功能 | 說明 |
|------|------|
| 🌲 樹狀導覽 | 多層級分類結構，支援無限層級 |
| 🔍 即時搜尋 | 關鍵字搜尋所有連結 |
| 🏷️ 快速篩選 | 依圖示類型快速過濾 |
| 🌐 上網驗證 | 各區域上網驗證快捷入口 |
| 🌙 深淺主題 | 支援深色/淺色模式切換 |
| ⏰ 時鐘小工具 | 翻頁式時鐘顯示 |

### 管理後台
| 功能 | 說明 |
|------|------|
| 📁 節點管理 | 新增/編輯/刪除資料夾與連結 |
| 🖼️ 圖示管理 | 上傳/重新命名/刪除圖示 |
| 🔗 驗證連結管理 | 管理各區域上網驗證連結 |
| 🔒 隱密入口 | 安全的後台進入方式 |

---

## 💻 系統需求

- Python 3.10+
- 現代瀏覽器 (Chrome/Edge/Firefox)
- 作業系統：Windows / Linux / macOS

---

## 🚀 安裝部署

### 1. 下載專案
```bash
git clone https://github.com/nox913106/tool-table.git
cd tool-table
```

### 2. 建立虛擬環境
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/macOS
python3 -m venv venv
source venv/bin/activate
```

### 3. 安裝依賴
```bash
pip install -r requirements.txt
```

### 4. 啟動服務
```bash
# Windows
run.bat

# Linux/macOS
./run.sh

# 或手動啟動
uvicorn app.main:app --host 0.0.0.0 --port 8080
```

### 5. 訪問應用
- **前台**：http://localhost:8080
- **後台**：見下方「進入後台」說明

---

## 📖 使用說明

### 前台操作

#### 瀏覽連結
1. 點擊左側樹狀選單展開分類
2. 點擊分類載入該分類下的所有連結
3. 點擊連結卡片開啟網站

#### 搜尋功能
1. 在搜尋框輸入關鍵字
2. 系統會即時顯示符合的結果
3. 支援中英文搜尋

#### 快速篩選
1. 展開「快速篩選」區塊
2. 點擊圖示類型進行過濾
3. 例如：點擊 Fortinet 顯示所有 Fortinet 相關連結

#### 主題切換
- 點擊右上角 🌙/☀️ 按鈕切換深淺色模式

---

## 🔧 管理後台

### 進入後台
> **隱密入口**：在前台頁面的**時鐘區域**連續快速點擊 **5 次**（3 秒內完成）

### 節點管理

#### 新增根節點
1. 點擊「＋ 根節點」按鈕
2. 輸入節點名稱
3. 確認新增

#### 新增子項目
1. 在樹狀結構中選擇父節點
2. 點擊右側編輯區的「➕ 新增子項目」
3. 選擇類型：
   - **📁 資料夾**：可包含子項目
   - **🔗 連結**：需填入網址
4. 填寫名稱（連結類型需填 URL）
5. 點擊新增

#### 編輯節點
1. 點擊樹狀結構中的節點
2. 在右側編輯區修改：
   - 名稱
   - 類型（資料夾/連結）
   - 圖示
   - 網址（連結類型）
   - 排序值
   - 啟用狀態
3. 點擊「💾 儲存」

#### 刪除節點
1. 選擇要刪除的節點
2. 點擊「🗑️ 刪除」
3. 確認刪除（注意：子節點也會被刪除）

### 圖示管理

#### 上傳圖示
1. 滾動到「🖼️ 圖示管理」區塊
2. 點擊「📤 上傳圖示」
3. 選擇圖片檔案（支援 PNG/JPG/SVG/WebP/GIF）
4. 可多選上傳

#### 重新命名/刪除圖示
1. 將滑鼠移到圖示卡片上
2. 出現操作按鈕：
   - ✏️ 重新命名
   - 🗑️ 刪除（使用中的圖示無法刪除）

### 上網驗證連結管理

#### 新增連結
1. 滾動到「🌐 上網驗證管理」區塊
2. 點擊「➕ 新增連結」
3. 填寫區域、名稱、網址
4. 儲存

#### 編輯/刪除連結
- 每列右側有編輯 ✏️ 和刪除 🗑️ 按鈕

---

## 📡 API 文件

### 節點 API
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/nodes/tree` | 取得完整樹狀結構 |
| GET | `/api/nodes/{id}` | 取得單一節點 |
| GET | `/api/nodes/code/{code}` | 依代碼取得節點及子項 |
| POST | `/api/nodes` | 新增節點 |
| PUT | `/api/nodes/{id}` | 更新節點 |
| DELETE | `/api/nodes/{id}` | 刪除節點 |

### 搜尋 API
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/search?q={keyword}` | 搜尋節點 |

### 圖示 API
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/icons` | 取得圖示列表 |
| POST | `/api/icons` | 上傳圖示 |
| PUT | `/api/icons/{filename}?new_name={name}` | 重新命名 |
| DELETE | `/api/icons/{filename}` | 刪除圖示 |

### 驗證連結 API
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/auth-links` | 取得分組列表 |
| GET | `/api/auth-links/all` | 取得所有連結 |
| POST | `/api/auth-links` | 新增連結 |
| PUT | `/api/auth-links/{id}` | 更新連結 |
| DELETE | `/api/auth-links/{id}` | 刪除連結 |

---

## 📁 專案結構

```
tool-table/
├── app/                    # 後端程式
│   ├── main.py            # FastAPI 主程式
│   ├── database.py        # 資料庫連線
│   ├── models.py          # 資料模型
│   └── routes/            # API 路由
│       ├── nodes.py       # 節點 API
│       ├── auth_links.py  # 驗證連結 API
│       └── search.py      # 搜尋與圖示 API
├── data/                   # SQLite 資料庫
├── resource/              # 靜態資源
│   └── icon/              # 圖示檔案
├── admin.html             # 管理後台 HTML
├── admin.css              # 管理後台 CSS
├── admin.js               # 管理後台 JavaScript
├── index.html             # 前台 HTML
├── main.js                # 前台 JavaScript
├── styles.css             # 前台 CSS
├── requirements.txt       # Python 依賴
├── run.bat                # Windows 啟動腳本
└── run.sh                 # Linux 啟動腳本
```

---

## 🔄 從 YAML 遷移

如果您有舊版 YAML 格式的資料，可使用遷移工具：

```bash
python migrate_yaml_to_sqlite.py
```

---

## 📝 授權

MIT License

---

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！
