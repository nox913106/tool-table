// search-enhancement.js - Tool Table 搜尋功能增強
// 此檔案為原始 index.html 添加模糊搜尋與表單送出功能

(function() {
  'use strict';
  
  console.log('🔍 Search Enhancement loaded');
  
  // 等待頁面載入完成
  window.addEventListener('DOMContentLoaded', function() {
    enhanceSearchFeature();
  });
  
  function enhanceSearchFeature() {
    const searchInput = document.getElementById('search-input');
    const searchBlock = searchInput.parentElement;
   
    // 1. 修改 HTML 結構：將輸入框包裝在表單中並添加按鈕
    const form = document.createElement('form');
    form.id = 'search-form';
    form.className = 'search-form';
    form.style.cssText = 'display:flex; gap:8px; align-items:center;';
    
    // 創建送出按鈕
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'search-btn';
    submitBtn.textContent = '🔍';
    submitBtn.style.cssText = `
      background: var(--glass-surface);
      border: 1px solid var(--glass-border);
      border-radius: 10px;
      padding: 10px 15px;
      cursor: pointer;
      color: var(--text-main);
      transition: all 0.3s;
      font-size: 1.2rem;
    `;
    
    //將輸入框從原位置移除並放入表單
    searchInput.parentNode.removeChild(searchInput);
    searchInput.style.flex = '1';
    form.appendChild(searchInput);
    form.appendChild(submitBtn);
    searchBlock.appendChild(form);
    
    // 2移除原始的 input 事件監聽器（清除即時搜尋）
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    
    // 3. 添加表單送出事件
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const keyword = newSearchInput.value.trim();
      if (!keyword) {
        return;
      }
      
      console.log('🔍 Searching for:', keyword);
      
      // 執行搜尋
      await searchByName(keyword.toLowerCase());
      
      // 搜尋完成後清空輸入框
      newSearchInput.value = '';
      newSearchInput.blur(); // 移除焦點
      
      // 關閉側邊欄（行動裝置）
      if (typeof closeSidebar === 'function') {
        closeSidebar();
      }
    });
    
    // 按鈕 hover 效果
    submitBtn.addEventListener('mouseenter', function() {
      this.style.background = 'var(--glass-highlight)';
      this.style.boxShadow = '0 0 15px var(--accent-glow)';
    });
    
    submitBtn.addEventListener('mouseleave', function() {
      this.style.background = 'var(--glass-surface)';
      this.style.boxShadow = 'none';
    });
    
    console.log('✅ Search Enhancement activated - Form submit mode enabled');
  }
})();
