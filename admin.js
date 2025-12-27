/**
 * Tool Table Admin Panel JavaScript
 * Handles tree navigation, node CRUD, and auth links management
 */

// ============ State ============
let selectedNodeId = null;
let treeData = [];
let iconList = [];

// ============ DOM Elements ============
const treeContainer = document.getElementById('tree-container');
const nodeForm = document.getElementById('node-form');
const editorPlaceholder = document.getElementById('editor-placeholder');
const authTbody = document.getElementById('auth-tbody');

// ============ Initialization ============
document.addEventListener('DOMContentLoaded', async () => {
    await loadIcons();
    await loadTree();
    await loadAuthLinks();
    await loadIconGallery();
    setupEventListeners();
    setupThemeToggle();
});

function setupEventListeners() {
    // Node form
    nodeForm.addEventListener('submit', handleNodeSubmit);
    document.getElementById('btn-delete').addEventListener('click', handleNodeDelete);
    document.getElementById('btn-add-child').addEventListener('click', openAddChildModal);
    document.getElementById('btn-add-root').addEventListener('click', handleAddRoot);

    // Node type toggle
    document.querySelectorAll('input[name="node-type"]').forEach(radio => {
        radio.addEventListener('change', toggleUrlField);
    });

    // Icon preview
    document.getElementById('node-icon').addEventListener('change', updateIconPreview);

    // Tree search
    document.getElementById('tree-search').addEventListener('input', handleTreeSearch);

    // Auth form
    document.getElementById('btn-add-auth').addEventListener('click', openAuthModal);
    document.getElementById('auth-form').addEventListener('submit', handleAuthSubmit);

    // Add Child form
    document.getElementById('add-child-form').addEventListener('submit', handleAddChildSubmit);
    document.querySelectorAll('input[name="add-child-type"]').forEach(radio => {
        radio.addEventListener('change', toggleAddChildUrlField);
    });

    // Icon upload
    document.getElementById('btn-upload-icon').addEventListener('click', () => {
        document.getElementById('icon-upload-input').click();
    });
    document.getElementById('icon-upload-input').addEventListener('change', handleIconUpload);
}

function setupThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    toggle.textContent = saved === 'dark' ? '🌙' : '☀️';

    toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        toggle.textContent = next === 'dark' ? '🌙' : '☀️';
    });
}

// ============ Tree Operations ============
async function loadTree() {
    try {
        const res = await fetch('/api/nodes/tree');
        treeData = await res.json();
        renderTree(treeData);
    } catch (err) {
        console.error('Failed to load tree:', err);
        treeContainer.innerHTML = '<p class="loading">載入失敗</p>';
    }
}

function renderTree(nodes, container = treeContainer, isRoot = true) {
    container.innerHTML = '';

    if (nodes.length === 0 && isRoot) {
        container.innerHTML = '<p class="loading">尚無資料</p>';
        return;
    }

    nodes.forEach(node => {
        const item = document.createElement('div');
        item.className = 'tree-item';
        item.dataset.id = node.id;

        const hasChildren = node.children && node.children.length > 0;
        const isFolder = node.node_type === 'folder';

        // Create the node element
        const nodeEl = document.createElement('div');
        nodeEl.className = 'tree-node';
        nodeEl.dataset.id = node.id;
        nodeEl.innerHTML = `
            <span class="tree-toggle">${hasChildren ? '▶' : (isFolder ? '·' : '')}</span>
            ${node.icon ? `<img class="tree-icon" src="/resource/icon/${node.icon}" alt="">` : ''}
            <span class="tree-name">${node.name}</span>
            <span class="tree-type">${isFolder ? '📁' : '🔗'}</span>
        `;

        // Attach event listener directly to this node element ONLY
        nodeEl.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(nodeEl.dataset.id);
            selectNode(id);

            // Toggle expand/collapse only if has children
            if (hasChildren) {
                item.classList.toggle('expanded');
            }
        });

        item.appendChild(nodeEl);

        if (hasChildren) {
            const childContainer = document.createElement('div');
            childContainer.className = 'tree-children';
            renderTree(node.children, childContainer, false);
            item.appendChild(childContainer);
        }

        container.appendChild(item);
    });
}

function handleTreeSearch(e) {
    const query = e.target.value.toLowerCase();
    const items = treeContainer.querySelectorAll('.tree-item');

    items.forEach(item => {
        const name = item.querySelector('.tree-name').textContent.toLowerCase();
        const match = name.includes(query);
        item.style.display = match || !query ? '' : 'none';

        if (match && query) {
            // Expand parents
            let parent = item.parentElement;
            while (parent) {
                if (parent.classList.contains('tree-item')) {
                    parent.classList.add('expanded');
                    parent.style.display = '';
                }
                parent = parent.parentElement;
            }
        }
    });
}

// ============ Node Selection & Editing ============
async function selectNode(id) {
    selectedNodeId = id;

    // Update tree selection
    treeContainer.querySelectorAll('.tree-node').forEach(n => n.classList.remove('selected'));
    const selectedNode = treeContainer.querySelector(`.tree-node[data-id="${id}"]`);
    if (selectedNode) selectedNode.classList.add('selected');

    // Load node data
    try {
        const res = await fetch(`/api/nodes/${id}`);
        const node = await res.json();
        populateForm(node);
    } catch (err) {
        console.error('Failed to load node:', err);
    }
}

function populateForm(node) {
    editorPlaceholder.style.display = 'none';
    nodeForm.style.display = 'block';

    document.getElementById('form-title').textContent = '編輯節點';
    document.getElementById('node-code').textContent = node.code;
    document.getElementById('node-id').value = node.id;
    document.getElementById('node-name').value = node.name;
    document.getElementById('node-sort').value = node.sort_order || 0;
    document.getElementById('node-active').checked = node.is_active !== false;

    // Node type
    document.querySelector(`input[name="node-type"][value="${node.node_type}"]`).checked = true;
    toggleUrlField();

    if (node.node_type === 'link') {
        document.getElementById('node-url').value = node.url || '';
    }

    // Icon
    const iconSelect = document.getElementById('node-icon');
    iconSelect.value = node.icon || '';
    updateIconPreview();

    // Show/hide buttons
    document.getElementById('btn-add-child').style.display = node.node_type === 'folder' ? '' : 'none';
}

function toggleUrlField() {
    const isLink = document.querySelector('input[name="node-type"]:checked').value === 'link';
    document.getElementById('url-group').style.display = isLink ? '' : 'none';
    document.getElementById('node-url').required = isLink;
}

function updateIconPreview() {
    const icon = document.getElementById('node-icon').value;
    const preview = document.getElementById('icon-preview');

    if (icon) {
        preview.src = `/resource/icon/${icon}`;
        preview.style.display = '';
    } else {
        preview.style.display = 'none';
    }
}

// ============ Node CRUD ============
async function handleNodeSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('node-id').value;
    const nodeType = document.querySelector('input[name="node-type"]:checked').value;

    const data = {
        name: document.getElementById('node-name').value,
        node_type: nodeType,
        icon: document.getElementById('node-icon').value || null,
        url: nodeType === 'link' ? document.getElementById('node-url').value : null,
        sort_order: parseInt(document.getElementById('node-sort').value) || 0,
        is_active: document.getElementById('node-active').checked
    };

    try {
        const res = await fetch(`/api/nodes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showMessage('✓ 已儲存');
            await loadTree();
            selectNode(parseInt(id));
        } else {
            const err = await res.json();
            showMessage('✗ ' + (err.detail || '儲存失敗'), true);
        }
    } catch (err) {
        showMessage('✗ 儲存失敗', true);
    }
}

async function handleNodeDelete() {
    if (!selectedNodeId) return;

    const confirmed = await showConfirm('確認刪除', '確定要刪除此節點嗎？\n（子節點也會被刪除）');
    if (!confirmed) return;

    try {
        const res = await fetch(`/api/nodes/${selectedNodeId}`, { method: 'DELETE' });

        if (res.ok) {
            showMessage('✓ 已刪除');
            selectedNodeId = null;
            nodeForm.style.display = 'none';
            editorPlaceholder.style.display = 'flex';
            await loadTree();
        }
    } catch (err) {
        showMessage('✗ 刪除失敗', true);
    }
}

// Add Child Modal Functions
function openAddChildModal() {
    if (!selectedNodeId) return;
    document.getElementById('add-child-modal').style.display = 'flex';
    document.getElementById('add-child-name').value = '';
    document.getElementById('add-child-url').value = '';
    document.querySelector('input[name="add-child-type"][value="folder"]').checked = true;
    toggleAddChildUrlField();
    document.getElementById('add-child-name').focus();
}

function closeAddChildModal() {
    document.getElementById('add-child-modal').style.display = 'none';
}

function toggleAddChildUrlField() {
    const isLink = document.querySelector('input[name="add-child-type"]:checked').value === 'link';
    const urlGroup = document.getElementById('add-child-url-group');
    const urlInput = document.getElementById('add-child-url');
    urlGroup.style.display = isLink ? '' : 'none';
    urlInput.required = isLink;
}

async function handleAddChildSubmit(e) {
    e.preventDefault();
    if (!selectedNodeId) return;

    const nodeType = document.querySelector('input[name="add-child-type"]:checked').value;
    const name = document.getElementById('add-child-name').value;
    const url = nodeType === 'link' ? document.getElementById('add-child-url').value : null;

    try {
        const res = await fetch('/api/nodes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                parent_id: selectedNodeId,
                name: name,
                node_type: nodeType,
                url: url
            })
        });

        if (res.ok) {
            const newNode = await res.json();
            showMessage('✓ 已新增');
            closeAddChildModal();
            await loadTree();

            // Expand parent and select new node
            const parentItem = treeContainer.querySelector(`.tree-item[data-id="${selectedNodeId}"]`);
            if (parentItem) parentItem.classList.add('expanded');

            selectNode(newNode.id);
        } else {
            const err = await res.json();
            showMessage('✗ ' + (err.detail || '新增失敗'), true);
        }
    } catch (err) {
        showMessage('✗ 新增失敗', true);
    }
}

async function handleAddChild() {
    openAddChildModal();
}

async function handleAddRoot() {
    const name = await showPrompt('新增根節點', '輸入新根節點名稱:');
    if (!name) return;

    try {
        const res = await fetch('/api/nodes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                parent_id: null,
                name: name,
                node_type: 'folder'
            })
        });

        if (res.ok) {
            const newNode = await res.json();
            showMessage('✓ 已新增根節點');
            await loadTree();
            selectNode(newNode.id);
        }
    } catch (err) {
        showMessage('✗ 新增失敗', true);
    }
}

// ============ Icons ============
async function loadIcons() {
    try {
        const res = await fetch('/api/icons');
        iconList = await res.json();

        const select = document.getElementById('node-icon');
        // Clear existing options except the first "無" option
        while (select.options.length > 1) {
            select.remove(1);
        }

        iconList.forEach(icon => {
            const option = document.createElement('option');
            // API now returns objects with name property
            const iconName = typeof icon === 'string' ? icon : icon.name;
            option.value = iconName;
            option.textContent = iconName;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Failed to load icons:', err);
    }
}

// ============ Auth Links ============
async function loadAuthLinks() {
    try {
        const res = await fetch('/api/auth-links/all');
        const links = await res.json();
        renderAuthTable(links);

        // Populate region datalist
        const regions = [...new Set(links.map(l => l.region))];
        const datalist = document.getElementById('region-list');
        datalist.innerHTML = regions.map(r => `< option value = "${r}" > `).join('');
    } catch (err) {
        console.error('Failed to load auth links:', err);
        authTbody.innerHTML = '<tr><td colspan="4">載入失敗</td></tr>';
    }
}

function renderAuthTable(links) {
    if (links.length === 0) {
        authTbody.innerHTML = '<tr><td colspan="4">尚無資料</td></tr>';
        return;
    }

    authTbody.innerHTML = links.map(link => `
      <tr>
      <td>${escapeHtml(link.region)}</td>
      <td>${escapeHtml(link.name)}</td>
      <td><a href="${escapeHtml(link.url)}" target="_blank">${escapeHtml(link.url)}</a></td>
      <td class="actions">
        <button class="btn btn-sm btn-secondary" onclick="editAuthLink(${link.id})">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="deleteAuthLink(${link.id})">🗑️</button>
      </td>
    </tr>
    `).join('');
}

function openAuthModal(link = null) {
    document.getElementById('auth-modal').style.display = 'flex';
    document.getElementById('auth-modal-title').textContent = link ? '編輯驗證連結' : '新增驗證連結';
    document.getElementById('auth-id').value = link?.id || '';
    document.getElementById('auth-region').value = link?.region || '';
    document.getElementById('auth-name').value = link?.name || '';
    document.getElementById('auth-url').value = link?.url || '';
}

function closeAuthModal() {
    document.getElementById('auth-modal').style.display = 'none';
}

async function editAuthLink(id) {
    try {
        const res = await fetch(`/api/auth-links/${id}`);
        const link = await res.json();
        openAuthModal(link);
    } catch (err) {
        showMessage('✗ 載入失敗', true);
    }
}

async function deleteAuthLink(id) {
    const confirmed = await showConfirm('確認刪除', '確定要刪除此連結嗎？');
    if (!confirmed) return;

    try {
        const res = await fetch(`/api/auth-links/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showMessage('✓ 已刪除');
            await loadAuthLinks();
        }
    } catch (err) {
        showMessage('✗ 刪除失敗', true);
    }
}

async function handleAuthSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('auth-id').value;
    const data = {
        region: document.getElementById('auth-region').value,
        name: document.getElementById('auth-name').value,
        url: document.getElementById('auth-url').value
    };

    try {
        const url = id ? `/api/auth-links/${id}` : '/api/auth-links';
        const method = id ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showMessage('✓ 已儲存');
            closeAuthModal();
            await loadAuthLinks();
        } else {
            showMessage('✗ 儲存失敗', true);
        }
    } catch (err) {
        showMessage('✗ 儲存失敗', true);
    }
}

// ============ Utilities ============
function showMessage(msg, isError = false) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        border - radius: 8px;
        background: ${isError ? 'var(--danger)' : 'var(--success)'};
        color: white;
        font - weight: 500;
        z - index: 9999;
        animation: fadeIn 0.2s;
        `;
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ Custom Modal Dialogs ============
function showConfirm(title, message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        modal.style.display = 'flex';

        const yesBtn = document.getElementById('confirm-yes');
        const noBtn = document.getElementById('confirm-no');

        const cleanup = () => {
            modal.style.display = 'none';
            yesBtn.removeEventListener('click', onYes);
            noBtn.removeEventListener('click', onNo);
        };

        const onYes = () => { cleanup(); resolve(true); };
        const onNo = () => { cleanup(); resolve(false); };

        yesBtn.addEventListener('click', onYes);
        noBtn.addEventListener('click', onNo);
    });
}

function showPrompt(title, message, defaultValue = '') {
    return new Promise((resolve) => {
        const modal = document.getElementById('prompt-modal');
        document.getElementById('prompt-title').textContent = title;
        document.getElementById('prompt-message').textContent = message;
        const input = document.getElementById('prompt-input');
        input.value = defaultValue;
        modal.style.display = 'flex';
        input.focus();

        const okBtn = document.getElementById('prompt-ok');
        const cancelBtn = document.getElementById('prompt-cancel');

        const cleanup = () => {
            modal.style.display = 'none';
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            input.removeEventListener('keydown', onKeydown);
        };

        const onOk = () => { cleanup(); resolve(input.value || null); };
        const onCancel = () => { cleanup(); resolve(null); };
        const onKeydown = (e) => { if (e.key === 'Enter') onOk(); if (e.key === 'Escape') onCancel(); };

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        input.addEventListener('keydown', onKeydown);
    });
}

// ============ Icon Gallery ============
async function loadIconGallery() {
    const gallery = document.getElementById('icon-gallery');
    if (!gallery) return;

    try {
        const res = await fetch('/api/icons');
        const icons = await res.json();

        if (icons.length === 0) {
            gallery.innerHTML = '<div style="color: var(--text-secondary);">沒有圖示</div>';
            return;
        }

        gallery.innerHTML = icons.map(icon => `
            <div class="icon-card" data-name="${escapeHtml(icon.name)}">
                <div class="icon-card-actions">
                    <button class="btn btn-sm btn-secondary" onclick="renameIcon('${escapeHtml(icon.name)}')" title="重新命名">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteIcon('${escapeHtml(icon.name)}')" title="刪除">🗑️</button>
                </div>
                <img src="/resource/icon/${encodeURIComponent(icon.name)}" alt="${escapeHtml(icon.name)}" onerror="this.style.display='none'">
                <div class="icon-name" title="${escapeHtml(icon.name)}">${escapeHtml(icon.name)}</div>
                <div class="icon-size">${formatFileSize(icon.size)}</div>
            </div>
        `).join('');
    } catch (err) {
        gallery.innerHTML = '<div style="color: var(--danger);">載入失敗</div>';
    }
}

async function handleIconUpload(e) {
    const files = e.target.files;
    if (!files.length) return;

    for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/icons', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                showMessage(`✓ ${file.name} 已上傳`);
            } else {
                const err = await res.json();
                showMessage(`✗ ${file.name}: ${err.detail}`, true);
            }
        } catch (err) {
            showMessage(`✗ ${file.name} 上傳失敗`, true);
        }
    }

    // Clear input and reload
    e.target.value = '';
    await loadIconGallery();
    await loadIcons(); // Refresh dropdown
}

async function deleteIcon(filename) {
    const confirmed = await showConfirm('確認刪除', `確定要刪除圖示 "${filename}" 嗎？`);
    if (!confirmed) return;

    try {
        const res = await fetch(`/api/icons/${encodeURIComponent(filename)}`, { method: 'DELETE' });
        if (res.ok) {
            showMessage('✓ 圖示已刪除');
            await loadIconGallery();
            await loadIcons();
        } else {
            const err = await res.json();
            showMessage('✗ ' + err.detail, true);
        }
    } catch (err) {
        showMessage('✗ 刪除失敗', true);
    }
}

async function renameIcon(filename) {
    const newName = await showPrompt('重新命名', `輸入新檔名（含副檔名）:`, filename);
    if (!newName || newName === filename) return;

    try {
        const res = await fetch(`/api/icons/${encodeURIComponent(filename)}?new_name=${encodeURIComponent(newName)}`, {
            method: 'PUT'
        });
        if (res.ok) {
            showMessage('✓ 圖示已重新命名');
            await loadIconGallery();
            await loadIcons();
        } else {
            const err = await res.json();
            showMessage('✗ ' + err.detail, true);
        }
    } catch (err) {
        showMessage('✗ 重新命名失敗', true);
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
