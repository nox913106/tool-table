// Tool-Table 效能模式切換功能
(function () {
    'use strict';

    // 在 document 載入時執行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        // 1. 注入效能模式 CSS
        injectPerformanceCSS();

        // 2. 創建效能模式切換按鈕
        createPerformanceToggle();

        // 3. 從 localStorage 讀取並應用效能模式設定
        const savedPerformance = localStorage.getItem('performance-mode') || 'normal';
        setPerformanceMode(savedPerformance);
    }

    function injectPerformanceCSS() {
        const style = document.createElement('style');
        style.id = 'performance-mode-styles';
        style.innerHTML = `
      /* 效能模式 CSS 變數覆蓋 */
      :root {
        --animation-state: running;
        --blur-amount: 20px;
        --blur-sidebar: 25px;
        --blur-card: 12px;
        --transition-duration: 0.4s;
        --transition-fast: 0.3s;
        --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.3);
        --shadow-header: 0 4px 30px rgba(0, 0, 0, 0.05);
        --shadow-card-hover: 0 15px 40px rgba(0, 0, 0, 0.15);
        --shadow-button: 0 4px 20px rgba(0, 0, 0, 0.2);
        --hover-transform: translateY(-10px) scale(1.02);
        --card-animation: fadeIn 0.6s ease-out both;
      }

      /* 低資源消耗模式 */
      html[data-performance="low"] {
        --animation-state: paused;
        --blur-amount: 0px;
        --blur-sidebar: 0px;
        --blur-card: 0px;
        --transition-duration: 0s;
        --transition-fast: 0s;
        --shadow-card: none;
        --shadow-header: none;
        --shadow-card-hover: none;
        --shadow-button: none;
        --hover-transform: none;
        --card-animation: none;
      }

      /* 覆蓋現有樣式以使用新變數 */
      html[data-performance] body::before {
        animation-play-state: var(--animation-state);
      }

      html[data-performance] header {
        backdrop-filter: blur(var(--blur-amount)) saturate(180%);
        -webkit-backdrop-filter: blur(var(--blur-amount)) saturate(180%);
        box-shadow: var(--shadow-header);
        transition: background var(--transition-duration), border-color var(--transition-duration);
      }

      html[data-performance] .sidebar {
        backdrop-filter: blur(var(--blur-sidebar)) saturate(150%);
        -webkit-backdrop-filter: blur(var(--blur-sidebar)) saturate(150%);
        box-shadow: var(--shadow-header);
        transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), background var(--transition-duration), border-color var(--transition-duration);
      }

      html[data-performance] .sidebar details summary {
        transition: all var(--transition-fast) ease;
      }

      html[data-performance] .search-block input {
        backdrop-filter: blur(calc(var(--blur-amount) / 4));
        transition: var(--transition-fast);
      }

      html[data-performance] .icon-filter-list .filter-item {
        transition: var(--transition-fast);
      }

      html[data-performance] #access-auth {
        backdrop-filter: blur(calc(var(--blur-amount) * 0.75));
        box-shadow: var(--shadow-card);
        transition: background var(--transition-duration), border-color var(--transition-duration);
      }

      html[data-performance] .auth-grid .grid-item {
        transition: all var(--transition-fast) cubic-bezier(0.175, 0.885, 0.32, 1.275);
        box-shadow: var(--shadow-card);
      }

      html[data-performance] .grid-item-card {
        backdrop-filter: blur(var(--blur-card));
        -webkit-backdrop-filter: blur(var(--blur-card));
        box-shadow: var(--shadow-card);
        transition: all var(--transition-duration) cubic-bezier(0.34, 1.56, 0.64, 1);
        animation: var(--card-animation);
      }

      html[data-performance] .grid-item-card:hover {
        transform: var(--hover-transform);
        box-shadow: var(--shadow-card-hover), 0 0 20px var(--accent-glow);
      }

      html[data-performance] #back-button {
        backdrop-filter: blur(var(--blur-amount));
        box-shadow: var(--shadow-button);
        transition: all var(--transition-fast);
      }

      html[data-performance="low"] #back-button:hover {
        transform: scale(1.05);
      }

      html[data-performance="normal"] #back-button:hover {
        transform: scale(1.15) rotate(-90deg);
      }

      html[data-performance] .theme-btn,
      html[data-performance] .performance-btn {
        transition: all var(--transition-fast) ease;
        box-shadow: var(--shadow-card);
      }

      /* 效能模式按鈕樣式 */
      .performance-btn {
        position: absolute;
        right: 70px;
        top: 50%;
        transform: translateY(-50%);
        background: var(--glass-surface);
        border: 1px solid var(--glass-border);
        color: var(--text-main);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1.2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 50;
      }

      .performance-btn:hover {
        background: var(--glass-highlight);
        transform: translateY(-50%) scale(1.1);
        box-shadow: 0 0 15px var(--accent-glow);
      }

      /* 在 mobile 模式下調整按鈕位置 */
      @media (max-width: 768px) {
        .performance-btn {
          right: 65px;
          top: 15px;
          transform: none;
        }

        .performance-btn:hover {
          transform: scale(1.1);
        }

        .theme-btn {
          right: 15px !important;
        }
      }
    `;
        document.head.appendChild(style);
    }

    function createPerformanceToggle() {
        const button = document.createElement('button');
        button.id = 'performance-toggle';
        button.className = 'performance-btn';
        button.title = '切換效能模式 (⚡正常 / 🐌省資源)';
        button.textContent = '⚡';

        button.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-performance') || 'normal';
            const next = current === 'normal' ? 'low' : 'normal';
            setPerformanceMode(next);
        });

        // 插入到 header 中 (在主題切換按鈕之前)
        const header = document.querySelector('header');
        if (header) {
            const themeBtn = document.getElementById('theme-toggle');
            if (themeBtn) {
                // 調整主題按鈕位置
                themeBtn.style.right = '20px';
            }
            header.appendChild(button);
        }
    }

    function setPerformanceMode(mode) {
        const htmlElement = document.documentElement;
        htmlElement.setAttribute('data-performance', mode);
        localStorage.setItem('performance-mode', mode);

        // 更新按鈕圖示
        const button = document.getElementById('performance-toggle');
        if (button) {
            button.textContent = mode === 'normal' ? '⚡' : '🐌';
            button.title = mode === 'normal'
                ? '切換為低資源模式 🐌'
                : '切換為正常模式 ⚡';
        }

        console.log(`效能模式已切換為: ${mode === 'normal' ? '正常模式 ⚡' : '低資源模式 🐌'}`);
    }
})();
