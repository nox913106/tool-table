
    let historyStack = [];



    // DOM Elements

    const grid = document.getElementById('grid');

    const loadingSpinner = document.getElementById('loading-spinner');

    const backButton = document.getElementById('back-button');

    const sidebar = document.getElementById('sidebar');

    const menuToggle = document.getElementById('menu-toggle');

    const sidebarOverlay = document.getElementById('sidebar-overlay');

    const themeToggle = document.getElementById('theme-toggle');

    const htmlElement = document.documentElement;



    document.addEventListener('DOMContentLoaded', () => {

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

        // Update icon

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



          loadAndRender(el.dataset.file);

          closeSidebar();

        });

      });



      // --- Back Button ---

      backButton.addEventListener('click', () => {

        if (historyStack.length > 1) {

          historyStack.pop();

          const prev = historyStack[historyStack.length - 1];

          loadAndRender(prev, false);

        }

      });



      // --- Init Data ---

      loadAccessAuth();

    });



    // --- UI Helpers ---



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



    // --- Data Logic ---



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



    async function searchByName(keyword) {

      showLoading(true);

      try {

        const roots = ['1.yaml', '2.yaml', '3.yaml', '4.yaml'];

        const results = await Promise.all(roots.map(r => gatherItemsFromFile(r)));

        let all = results.flat();



        const filtered = all.filter(it => it.name && it.name.toLowerCase().includes(keyword));

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

        const roots = ['1.yaml', '2.yaml', '3.yaml', '4.yaml'];

        const results = await Promise.all(roots.map(r => gatherItemsFromFile(r)));

        let all = results.flat();



        const filtered = all.filter(it => it.icon === icon);

        renderGrid(filtered);

        historyStack = [];

        updateBackButton();

      } finally {

        showLoading(false);

      }

    }



    function loadAndRender(yamlFile, push = true) {

      if (push) historyStack.push(yamlFile);

      updateBackButton();

      showLoading(true);



      fetch(`resource/${yamlFile}`)

        .then(r => {

          if (!r.ok) throw new Error('Network response was not ok');

          return r.text();

        })

        .then(txt => {

          const data = jsyaml.load(txt);

          renderGrid(data.items || []);

        })

        .catch(err => {

          console.error('Fetch error:', err);

          grid.innerHTML = `<div style="color: #ff6b6b; grid-column: 1/-1;">讀取失敗: ${err.message}</div>`;

        })

        .finally(() => showLoading(false));

    }



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



        if (item.file) {

          card.addEventListener('click', () => {

            loadAndRender(item.file);

          });

        } else if (item.url) {

          card.addEventListener('click', () => window.open(item.url, '_blank'));

        }

        fragment.appendChild(card);

      });



      grid.appendChild(fragment);

    }



    function loadAccessAuth() {

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

