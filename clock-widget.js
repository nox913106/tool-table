(function () {
    let timeOffset = 0;
    const clockWeekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

    function createFlipTile(id) {
        const tile = document.createElement('div');
        tile.className = 'flip-tile';
        tile.id = id;
        tile.innerHTML = `
      <div class="flip-card card-top static-top"><span></span></div>
      <div class="flip-card card-bottom static-bottom"><span></span></div>
      <div class="flip-card card-top flip-leaf-front"><span></span></div>
      <div class="flip-card card-bottom flip-leaf-back"><span></span></div>
    `;
        return tile;
    }

    function initTileValue(tile, val) {
        tile.dataset.val = val;
        tile.querySelector('.static-top span').innerText = val;
        tile.querySelector('.static-bottom span').innerText = val;
        tile.querySelector('.flip-leaf-front span').innerText = val;
        tile.querySelector('.flip-leaf-back span').innerText = val;
    }

    function updateFlipTile(tile, newVal) {
        const oldVal = tile.dataset.val;
        if (newVal === oldVal) return;

        const staticTop = tile.querySelector('.static-top span');
        const staticBottom = tile.querySelector('.static-bottom span');
        const leafFront = tile.querySelector('.flip-leaf-front span');
        const leafBack = tile.querySelector('.flip-leaf-back span');

        staticTop.innerText = newVal;
        staticBottom.innerText = oldVal;
        leafFront.innerText = oldVal;
        leafBack.innerText = newVal;

        tile.classList.remove('flipping');
        void tile.offsetWidth;
        tile.classList.add('flipping');

        const onAnimEnd = () => {
            staticBottom.innerText = newVal;
            tile.classList.remove('flipping');
        };

        tile.querySelector('.flip-leaf-back').addEventListener('animationend', onAnimEnd, { once: true });
        tile.dataset.val = newVal;
    }

    function createColon() {
        const colon = document.createElement('div');
        colon.className = 'flip-colon';
        return colon;
    }

    async function syncTime() {
        return new Promise((resolve) => {
            const scriptId = 'time-sync-script';
            const existingScript = document.getElementById(scriptId);
            if (existingScript) existingScript.remove();

            const callbackName = 'timeCallback';
            window[callbackName] = function (data) {
                try {
                    const serverTime = new Date(data.currentUtcTime).getTime();
                    if (!isNaN(serverTime)) {
                        timeOffset = serverTime - new Date().getTime();
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                } catch (e) {
                    resolve(false);
                } finally {
                    cleanup();
                }
            };

            const apiUrl = `https://timeapi.io/api/TimeZone/ip?jsonp=${callbackName}`;
            const timer = setTimeout(() => { resolve(false); cleanup(); }, 5000);

            function cleanup() {
                clearTimeout(timer);
                try { delete window[callbackName]; } catch (e) { }
                const script = document.getElementById(scriptId);
                if (script) script.remove();
            }

            const script = document.createElement('script');
            script.id = scriptId;
            script.src = apiUrl;
            script.onerror = () => { resolve(false); cleanup(); };
            document.head.appendChild(script);
        });
    }

    window.loadLocationInfo = function (json) {
        if (!json) return;
        const locationCard = document.getElementById('location-info');
        const locationText = document.getElementById('location-text');
        const ipCard = document.getElementById('ip-info');
        const ipText = document.getElementById('ip-text');

        const ip = json.ip || '';
        const city = json.city || '未知';
        const countryCode = json.country || '';

        if (city && countryCode) {
            locationText.innerText = `${city}, ${countryCode}`;
            locationCard.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${city}, ${countryCode}`)}`;
            locationCard.style.display = 'flex';
        }

        if (ip) {
            ipText.innerText = `IP: ${ip}`;
            ipCard.href = `https://ipinfo.io/${ip}`;
            ipCard.style.display = 'flex';
        }
    };

    const locationScript = document.createElement('script');
    locationScript.src = 'https://ipinfo.io?callback=loadLocationInfo';
    document.head.appendChild(locationScript);

    async function initializeClock() {
        await syncTime();

        const timeContainer = document.getElementById('time-display');
        const now = new Date(new Date().getTime() + timeOffset);
        const h = ('0' + now.getHours()).slice(-2);
        const m = ('0' + now.getMinutes()).slice(-2);
        const s = ('0' + now.getSeconds()).slice(-2);

        const hEl = createFlipTile('hour');
        const mEl = createFlipTile('minute');
        const sEl = createFlipTile('second');

        initTileValue(hEl, h);
        initTileValue(mEl, m);
        initTileValue(sEl, s);

        timeContainer.appendChild(hEl);
        timeContainer.appendChild(createColon());
        timeContainer.appendChild(mEl);
        timeContainer.appendChild(createColon());
        timeContainer.appendChild(sEl);

        setInterval(() => {
            const now = new Date(new Date().getTime() + timeOffset);
            const hStr = ('0' + now.getHours()).slice(-2);
            const mStr = ('0' + now.getMinutes()).slice(-2);
            const sStr = ('0' + now.getSeconds()).slice(-2);

            const year = now.getFullYear();
            const month = ('0' + (now.getMonth() + 1)).slice(-2);
            const day = ('0' + now.getDate()).slice(-2);
            const weekday = clockWeekdays[now.getDay()];

            updateFlipTile(hEl, hStr);
            updateFlipTile(mEl, mStr);
            updateFlipTile(sEl, sStr);

            document.getElementById('date-display').innerText = `${year}-${month}-${day} ${weekday}`;
        }, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeClock);
    } else {
        initializeClock();
    }
})();
