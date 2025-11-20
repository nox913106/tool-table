// JSON 檔案列表
const jsonFiles = [
    'company_system.json',
    'operations_tools.json',
    'fortigate_local.json',
    'fortigate_china.json',
    'fortigate_indonesia.json',
    'fortigate_vietnam.json',
    'fortigate_india.json',
    'cloud_systems.json',
    'jumpserver.json',
    'documentation.json',
    'meetings.json',
    'tools_pages.json'
];

// 圖標列表，從 /Max-Tool/upload-max-tool/icon/ 路徑中選取
const iconList = [
    'icon1.png', 
    'icon2.png', 
    'icon3.png', 
    'fortinet-icon.png', 
    'ruckus-icon.png'
];

// 加載下拉選單中的檔案選項
const fileSelect = document.getElementById('fileSelect');
jsonFiles.forEach(file => {
    const option = document.createElement('option');
    option.value = file;
    option.textContent = file;
    fileSelect.appendChild(option);
});

let currentFileData = null; // 當前選中的檔案資料
let selectedFile = '';

// 當選擇檔案時觸發
fileSelect.addEventListener('change', (e) => {
    selectedFile = e.target.value;
    if (selectedFile) {
        fetch(`resource/${selectedFile}`)
            .then(response => response.json())
            .then(data => {
                currentFileData = data;
                displayFileContent(data);
            });
    }
});

// 顯示檔案內容，依照類別顯示
function displayFileContent(data) {
    const fileContentDiv = document.getElementById('fileContent');
    fileContentDiv.innerHTML = ''; // 清空之前的內容

    // 添加類別標題
    const categoryTitle = document.createElement('h2');
    categoryTitle.textContent = `類別: ${data.category}`;
    fileContentDiv.appendChild(categoryTitle);

    // 動態生成檔案內容，提供編輯功能
    data.items.forEach((item, index) => {
        const container = document.createElement('div');
        container.classList.add('item-container');

        // 顯示 name
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = item.name;
        nameInput.placeholder = '名稱';
        nameInput.classList.add('name-input');
        container.appendChild(nameInput);

        // 顯示 url
        const urlInput = document.createElement('input');
        urlInput.type = 'text';
        urlInput.value = item.url;
        urlInput.placeholder = 'URL';
        urlInput.classList.add('url-input');
        container.appendChild(urlInput);

        // 顯示 icon，下拉選單選擇圖標
        const iconSelect = document.createElement('select');
        iconList.forEach(icon => {
            const option = document.createElement('option');
            option.value = `/Max-Tool/upload-max-tool/icon/${icon}`;
            option.textContent = icon;
            if (item.icon === `/Max-Tool/upload-max-tool/icon/${icon}`) {
                option.selected = true;
            }
            iconSelect.appendChild(option);
        });
        container.appendChild(iconSelect);

        // 刪除按鈕
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '刪除';
        deleteButton.onclick = () => {
            currentFileData.items.splice(index, 1);
            displayFileContent(currentFileData);
        };
        container.appendChild(deleteButton);

        fileContentDiv.appendChild(container);
    });

    // 顯示編輯區域和用戶名輸入框
    document.getElementById('userInputSection').style.display = 'block';
}

// 儲存變更按鈕
document.getElementById('saveChanges').addEventListener('click', () => {
    const username = document.getElementById('username').value;
    if (!username) {
        alert('請輸入使用者名稱！');
        return;
    }

    // 進行備份
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const backupFileName = `resource/${selectedFile.replace('.json', '')}bk${username}${timestamp}.json`;
    fetch(`resource/${selectedFile}`)
        .then(response => response.json())
        .then(originalData => {
            const blob = new Blob([JSON.stringify(originalData, null, 2)], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = backupFileName;
            link.click();
        });

    // 更新資料
    const updatedItems = [];
    const containers = document.querySelectorAll('.item-container');
    containers.forEach(container => {
        const name = container.querySelector('.name-input').value;
        const url = container.querySelector('.url-input').value;
        const icon = container.querySelector('select').value;

        updatedItems.push({ name, url, icon });
    });

    currentFileData.items = updatedItems;

    // 將變更寫回 JSON 檔案
    const blob = new Blob([JSON.stringify(currentFileData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `resource/${selectedFile}`;
    link.click();

    alert('變更已保存');
});

