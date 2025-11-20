/* --- 核心變數設定 --- */
:root {
  --transition-speed: 0.4s;

  /* --- 暗色模式 (預設 Deep Ocean) --- */
  --bg-body: #0f172a;
  --glass-surface: rgba(255, 255, 255, 0.05);
  --glass-highlight: rgba(255, 255, 255, 0.15);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-border-hover: rgba(255, 255, 255, 0.5);
  --text-main: #ffffff;
  --text-secondary: #94a3b8;
  --accent-color: #4CAF50; /* 保留您原本的綠色作為點綴，或改用 #38bdf8 */
  --accent-glow: rgba(76, 175, 80, 0.5);
  --card-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  --input-bg: rgba(0, 0, 0, 0.2);

  /* 背景流動光斑顏色 */
  --blob-1: rgba(76, 29, 149, 0.4);
  --blob-2: rgba(14, 165, 233, 0.2);
  --blob-3: rgba(236, 72, 153, 0.2);
}

/* --- 亮色模式 (Milky Glass) --- */
[data-theme="light"] {
  --bg-body: #eef2f6;
  --glass-surface: rgba(255, 255, 255, 0.65);
  --glass-highlight: rgba(255, 255, 255, 0.9);
  --glass-border: rgba(255, 255, 255, 0.8);
  --glass-border-hover: #4CAF50;
  --text-main: #1e293b;
  --text-secondary: #475569;
  --accent-glow: rgba(76, 175, 80, 0.25);
  --card-shadow: 0 8px 25px rgba(148, 163, 184, 0.25);
  --input-bg: rgba(255, 255, 255, 0.5);

  --blob-1: rgba(167, 139, 250, 0.4);
  --blob-2: rgba(56, 189, 248, 0.4);
  --blob-3: rgba(244, 114, 182, 0.4);
}

/* --- 全局樣式 --- */
body {
  font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
  background-color: var(--bg-body);
  color: var(--text-main);
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  transition: background-color var(--transition-speed), color var(--transition-speed);
  position: relative;
  overflow-x: hidden;
}

/* 動態流體背景 */
body::before {
  content: '';
  position: absolute;
  top: -50%; left: -50%;
  width: 200%; height: 200%;
  background: radial-gradient(circle at 50% 50%, var(--blob-1), var(--blob-2), var(--blob-3), transparent 70%);
  background-size: 100% 100%;
  animation: liquidFlow 20s ease-in-out infinite alternate;
  z-index: -1;
  pointer-events: none;
  transition: background 1s ease;
}

@keyframes liquidFlow {
  0% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(-5%, 5%) rotate(5deg); }
  100% { transform: translate(5%, -5%) rotate(-5deg); }
}

h1 {
  margin: 30px 0;
  font-size: 2.5em;
  color: var(--text-main);
  text-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

/* --- iframe 容器 (Header) --- */
.iframe-container {
  text-align: center;
  width: 100%;
  background: var(--glass-surface);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid var(--glass-border);
  position: fixed;
  top: 0;
  z-index: 1000;
  padding: 10px 0;
  transition: background 0.4s;
}

iframe {
  width: 100%;
  max-width: 800px;
  height: 100px;
  border: none;
  border-radius: 12px;
  /* 讓 iframe 在亮色模式自動變色 (若是黑底白字的 widget) */
  transition: filter 0.4s;
}

[data-theme="light"] iframe {
  filter: invert(0.85) hue-rotate(180deg);
}

/* --- 搜尋區塊 --- */
.search-container {
  margin-top: 140px;
  margin-bottom: 30px;
  width: 90%;
  max-width: 600px;
  text-align: center;
  position: relative;
}

.search-container input {
  width: 100%;
  padding: 15px 20px;
  font-size: 16px;
  border: 1px solid var(--glass-border);
  border-radius: 50px;
  background: var(--input-bg);
  color: var(--text-main);
  backdrop-filter: blur(10px);
  outline: none;
  transition: all 0.3s ease;
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.1);
}

.search-container input::placeholder {
  color: var(--text-secondary);
}

.search-container input:focus {
  border-color: var(--accent-color);
  box-shadow: 0 0 15px var(--accent-glow);
  transform: scale(1.02);
}

/* --- 卡片與網格 --- */
.group-container {
  display: grid;
  /* 自動適應寬度，比原本的 Media Queries 更流暢 */
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
  padding: 20px;
  width: 95%;
  max-width: 1400px;
  box-sizing: border-box;
}

.group {
  background: linear-gradient(135deg, var(--glass-surface) 0%, rgba(255, 255, 255, 0.01) 100%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-top: 1px solid rgba(255, 255, 255, 0.4); /* 3D 光源感 */
  border-left: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  padding: 25px;
  text-align: left;
  color: var(--text-main);
  box-shadow: var(--card-shadow);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: fadeIn 0.6s ease-out both;
}

.group:hover {
  transform: translateY(-10px) scale(1.01);
  border-color: var(--glass-border-hover);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2), 0 0 20px var(--accent-glow);
  z-index: 10;
}

.group h2 {
  font-size: 1.4em;
  margin-top: 0;
  margin-bottom: 15px;
  color: var(--accent-color);
  border-bottom: 1px solid var(--glass-border);
  padding-bottom: 10px;
  text-shadow: 0 0 10px var(--accent-glow);
}

.group ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.group li {
  margin-bottom: 8px;
}

.group a {
  text-decoration: none;
  color: var(--text-main);
  font-size: 1.1em;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.group a:hover {
  background: var(--glass-highlight);
  color: var(--accent-color);
  transform: translateX(5px);
}

.group a img {
  width: 24px;
  height: 24px;
  margin-right: 12px;
  vertical-align: middle;
  filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
}

/* --- 主題切換按鈕 --- */
#theme-toggle-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 1px solid var(--glass-border);
  background: var(--glass-surface);
  backdrop-filter: blur(10px);
  color: var(--text-main);
  font-size: 24px;
  cursor: pointer;
  z-index: 2000;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

#theme-toggle-btn:hover {
  transform: scale(1.1) rotate(15deg);
  background: var(--glass-highlight);
  box-shadow: 0 0 20px var(--accent-glow);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}