/**
 * Tool Table - Main JavaScript (API Version)
 * Network Management Portal Frontend
 * 
 * Uses API endpoints with YAML fallback for backwards compatibility
 */

let historyStack = [];
let useAPI = true;  // Will be set to false if API is unavailable

// DOM Elements
const grid = document.getElementById('grid');
const loadingSpinner = document.getElementById('loading-spinner');
const backButton = document.getElementById('back-button');
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menu-toggle');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const themeToggle = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;

document.addEventListener('DOMContentLoaded', async () => {
  // Check if API is available
  await checkAPIAvailability();

  // --- Theme Logic ---
  const savedTheme = localStorage.getItem('theme') || 'dark';
  setTheme(savedTheme);

  themeToggle.addEventListener('click', () => {
    const current = htmlElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
  });

  function setTheme(theme) {
    htmlElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    themeToggle.textContent = theme === 'light' ? '☀️' : '🌙';
  }

  // --- Mobile Menu ---
  menuToggle.addEventListener('click', toggleSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);

  // --- Search ---
  document.getElementById('search-input').addEventListener('input', async (e) => {
    const kw = e.target.value.trim().toLowerCase();
    closeAllDetails();
    clearActiveState();
    if (kw) {
      await searchByName(kw);
    } else {
      grid.innerHTML = '';
      historyStack = [];
      updateBackButton();
    }
    closeSidebar();
  });

  // --- Quick Filter ---
  document.querySelectorAll('.filter-item').forEach(el => {
    el.addEventListener('click', async () => {
      closeAllDetails();
      clearActiveState();
      await filterByIcon(el.dataset.icon);
      closeSidebar();
    });
  });

  // --- Sidebar Navigation ---
  document.querySelectorAll('.sidebar summary[data-file]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      clearActiveState();
      el.classList.add('active');

      closeAllDetails();
      let p = el.parentElement;
      while (p && p.tagName === 'DETAILS') {
        p.open = true;
        p = p.parentElement;
      }

      // Extract code from file (e.g., "3-2-1.yaml" -> "3-2-1")
      const file = el.dataset.file;
      const code = file.replace('.yaml', '');
      loadAndRender(code, file);
      closeSidebar();
    });
  });

  // --- Back Button ---
  backButton.addEventListener('click', () => {
    if (historyStack.length > 1) {
      historyStack.pop();
      const prev = historyStack[historyStack.length - 1];
      loadAndRender(prev.code, prev.file, false);
    }
  });

  // --- Init Data ---
  loadAccessAuth();

  // --- Hidden Admin Access (click clock 5 times rapidly) ---
  setupSecretAdminAccess();
});

// ============ Secret Admin Access ============
function setupSecretAdminAccess() {
  const clockWidget = document.getElementById('clock-widget-container');
  if (!clockWidget) return;

  let clickCount = 0;
  let clickTimer = null;
  const REQUIRED_CLICKS = 5;
  const CLICK_TIMEOUT = 3000; // 3 seconds

  clockWidget.addEventListener('click', () => {
    clickCount++;

    if (clickTimer) clearTimeout(clickTimer);

    if (clickCount >= REQUIRED_CLICKS) {
      clickCount = 0;
      window.location.href = '/admin';
    } else {
      clickTimer = setTimeout(() => {
        clickCount = 0;
      }, CLICK_TIMEOUT);
    }
  });
}

// ============ API Check ============
async function checkAPIAvailability() {
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      useAPI = true;
      console.log('✓ API mode enabled');
    } else {
      useAPI = false;
    }
  } catch (e) {
    useAPI = false;
    console.log('⚠ API unavailable, using YAML fallback');
  }
}

// ============ UI Helpers ============
function toggleSidebar() {
  sidebar.classList.toggle('open');
  sidebarOverlay.classList.toggle('active');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('active');
}

function showLoading(show) {
  loadingSpinner.style.display = show ? 'block' : 'none';
  if (show) grid.style.opacity = '0.5';
  else grid.style.opacity = '1';
}

function closeAllDetails() {
  document.querySelectorAll('.sidebar details').forEach(d => d.open = false);
}

function clearActiveState() {
  document.querySelectorAll('.sidebar summary').forEach(s => s.classList.remove('active'));
}

function updateBackButton() {
  backButton.style.display = historyStack.length > 1 ? 'flex' : 'none';
}

// ============ Data Loading ============
async function loadAndRender(code, yamlFile, push = true) {
  if (push) historyStack.push({ code, file: yamlFile });
  updateBackButton();
  showLoading(true);

  try {
    let items = [];

    if (useAPI) {
      // Try API first
      const res = await fetch(`/api/nodes/code/${code}`);
      if (res.ok) {
        const data = await res.json();
        items = data.items || [];
      } else {
        throw new Error('API failed');
      }
    } else {
      // Fallback to YAML
      items = await loadFromYAML(yamlFile);
    }

    renderGrid(items);
  } catch (err) {
    console.error('Load error:', err);
    // Try YAML fallback
    try {
      const items = await loadFromYAML(yamlFile);
      renderGrid(items);
    } catch (e) {
      grid.innerHTML = `<div style="color: #ff6b6b; grid-column: 1/-1;">讀取失敗: ${e.message}</div>`;
    }
  } finally {
    showLoading(false);
  }
}

async function loadFromYAML(yamlFile) {
  const res = await fetch(`resource/${yamlFile}`);
  if (!res.ok) throw new Error('Network response was not ok');
  const txt = await res.text();
  const data = jsyaml.load(txt);
  return data.items || [];
}

// ============ Search ============
async function searchByName(keyword) {
  showLoading(true);
  try {
    let filtered = [];

    if (useAPI) {
      const res = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`);
      if (res.ok) {
        filtered = await res.json();
      }
    } else {
      // YAML fallback - gather all items
      const roots = ['1.yaml', '2.yaml', '3.yaml', '4.yaml'];
      const results = await Promise.all(roots.map(r => gatherItemsFromFile(r)));
      let all = results.flat();
      filtered = all.filter(it => it.name && it.name.toLowerCase().includes(keyword));
    }

    renderGrid(filtered);
    historyStack = [];
    updateBackButton();
  } finally {
    showLoading(false);
  }
}

async function filterByIcon(icon) {
  showLoading(true);
  try {
    let filtered = [];

    if (useAPI) {
      // Search all and filter by icon
      const res = await fetch('/api/nodes/tree');
      if (res.ok) {
        const tree = await res.json();
        filtered = flattenTree(tree).filter(it => it.icon === icon);
      }
    } else {
      const roots = ['1.yaml', '2.yaml', '3.yaml', '4.yaml'];
      const results = await Promise.all(roots.map(r => gatherItemsFromFile(r)));
      let all = results.flat();
      filtered = all.filter(it => it.icon === icon);
    }

    renderGrid(filtered);
    historyStack = [];
    updateBackButton();
  } finally {
    showLoading(false);
  }
}

function flattenTree(nodes) {
  let result = [];
  nodes.forEach(node => {
    result.push(node);
    if (node.children) {
      result = result.concat(flattenTree(node.children));
    }
  });
  return result;
}

async function gatherItemsFromFile(file) {
  try {
    const res = await fetch(`resource/${file}`);
    if (!res.ok) throw new Error(`File not found: ${file}`);
    const txt = await res.text();
    const doc = jsyaml.load(txt);
    let items = [];
    if (doc && doc.items) {
      for (const item of doc.items) {
        if (item.icon || item.url || item.file) items.push(item);
        if (item.file) items = items.concat(await gatherItemsFromFile(item.file));
      }
    }
    return items;
  } catch (e) {
    console.warn(e);
    return [];
  }
}

// ============ Rendering ============
function renderGrid(items) {
  grid.innerHTML = '';
  if (!items || items.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; opacity: 0.7;">沒有找到相關項目</div>';
    return;
  }

  const fragment = document.createDocumentFragment();

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'grid-item-card';

    if (item.icon) {
      const img = document.createElement('img');
      img.src = `resource/icon/${item.icon}`;
      img.alt = item.name;
      img.onerror = function () { this.style.display = 'none'; };
      card.appendChild(img);
    }

    const name = document.createElement('div');
    name.className = 'card-title';
    name.textContent = item.name;
    card.appendChild(name);

    // For API items
    if (item.node_type === 'folder' || item.file) {
      card.addEventListener('click', () => {
        const code = item.code || (item.file ? item.file.replace('.yaml', '') : '');
        const file = item.file || `${code}.yaml`;
        loadAndRender(code, file);
      });
    } else if (item.node_type === 'link' || item.url) {
      card.addEventListener('click', () => window.open(item.url, '_blank'));
    }

    fragment.appendChild(card);
  });

  grid.appendChild(fragment);
}

// ============ Auth Links ============
function loadAccessAuth() {
  const authGrid = document.getElementById('auth-grid');

  if (useAPI) {
    // Try API
    fetch('/api/auth-links')
      .then(r => r.json())
      .then(groups => {
        authGrid.innerHTML = '';
        const fragment = document.createDocumentFragment();

        groups.forEach(group => {
          group.items.forEach(it => {
            const card = document.createElement('div');
            card.className = 'grid-item';
            const a = document.createElement('a');
            a.href = it.url;
            a.target = '_blank';
            a.textContent = `${group.region} – ${it.name}`;
            card.appendChild(a);
            fragment.appendChild(card);
          });
        });

        authGrid.appendChild(fragment);
      })
      .catch(() => loadAccessAuthFromYAML());
  } else {
    loadAccessAuthFromYAML();
  }
}

function loadAccessAuthFromYAML() {
  fetch('resource/AccessInternetAuth.yaml')
    .then(r => r.text())
    .then(txt => {
      const doc = jsyaml.load(txt);
      const authGrid = document.getElementById('auth-grid');
      authGrid.innerHTML = '';

      const fragment = document.createDocumentFragment();

      doc.sections.forEach(sec => {
        sec.items.forEach(it => {
          const card = document.createElement('div');
          card.className = 'grid-item';
          const a = document.createElement('a');
          a.href = it.url;
          a.target = '_blank';
          a.textContent = `${sec.region} – ${it.name}`;
          card.appendChild(a);
          fragment.appendChild(card);
        });
      });
      authGrid.appendChild(fragment);
    })
    .catch(console.error);
}
