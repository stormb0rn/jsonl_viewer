document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const results = document.getElementById('results');
    const historyList = document.getElementById('historyList');

    // Drag and drop handlers
    dropZone.addEventListener('click', () => fileInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // 新增布局切换功能
    document.querySelectorAll('.layout-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const cols = parseInt(btn.dataset.cols);
            results.style.gridTemplateColumns = `repeat(${cols}, minmax(300px, 1fr))`;
        });
    });

    // 历史记录功能
    const HISTORY_KEY = 'jsonl_viewer_history';
    const MAX_HISTORY = 5;

    function updateHistory(filename) {
        let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        history = [filename, ...history.filter(item => item !== filename)].slice(0, MAX_HISTORY);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        historyList.innerHTML = history.map(file => 
            `<li class="history-item" onclick="handleHistoryClick('${file}')">
                📄 ${file}
            </li>`
        ).join('');
    }

    async function handleHistoryClick(filename) {
        try {
            const response = await fetch(filename);
            const file = new File([await response.blob()], filename);
            handleFiles([file]);
        } catch (error) {
            alert('无法加载历史文件: ' + error.message);
        }
    }

    async function handleFiles(files) {
        if (files.length === 0) return;
        
        try {
            const file = files[0];
            updateHistory(file.name);
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());
            results.innerHTML = '';

            lines.forEach((line, index) => {
                try {
                    const data = JSON.parse(line);
                    createCard(data, index + 1);
                } catch (error) {
                    console.error(`Error parsing line ${index + 1}:`, error);
                }
            });
        } catch (error) {
            alert('Error reading file: ' + error.message);
        }
    }

    function createCard(data, index) {
        const card = document.createElement('div');
        card.className = 'json-card';
        
        const title = document.createElement('h3');
        title.textContent = `Entry #${index}`;
        card.appendChild(title);

        Object.entries(data).forEach(([key, value]) => {
            const propDiv = document.createElement('div');
            propDiv.className = 'json-property';
            
            const label = document.createElement('div');
            label.className = 'property-label';
            label.textContent = key.replace(/_/g, ' ').toUpperCase();
            
            const val = document.createElement('div');
            val.className = 'property-value';
            
            if (Array.isArray(value)) {
                val.textContent = value.join(', ');
            } else if (typeof value === 'object') {
                val.textContent = JSON.stringify(value, null, 2);
            } else {
                val.textContent = value;
            }

            if (key === 'gemini_caption') {
                propDiv.classList.add('caption');
                label.classList.add('caption-label');
            }

            propDiv.appendChild(label);
            propDiv.appendChild(val);
            card.appendChild(propDiv);
        });

        results.appendChild(card);
    }

    renderHistory();
});
