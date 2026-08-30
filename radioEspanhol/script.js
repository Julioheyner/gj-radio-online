 //LÓGICA DE LA WEB RADIO APP 
 (function() {
            "use strict";

            // ---------- Referencias del DOM ----------
            const sectionHome = document.getElementById('sectionHome');
            const sectionFav = document.getElementById('sectionFavorites');
            const navItems = document.querySelectorAll('.nav-item');
            const stationGrid = document.getElementById('stationGrid');
            const favoritesGrid = document.getElementById('favoritesGrid');
            const searchInput = document.getElementById('searchInput');
            const searchClear = document.getElementById('searchClear');
            const countrySelect = document.getElementById('countrySelect');
            const limitSelect = document.getElementById('limitSelect');
            const refreshBtn = document.getElementById('refreshBtn');
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            const resultsBar = document.getElementById('resultsBar');
            const favBadge = document.getElementById('favBadge');
            const connStatus = document.getElementById('connStatus');
            const connLabel = document.getElementById('connLabel');

            const player = document.getElementById('player');
            const playerCover = document.getElementById('playerCover');
            const playerTitle = document.getElementById('playerTitle');
            const playerSub = document.getElementById('playerSub');
            const securityIndicator = document.getElementById('securityIndicator');
            const visualizer = document.getElementById('visualizer');
            const playBtn = document.getElementById('playBtn');
            const muteBtn = document.getElementById('muteBtn');
            const closePlayerBtn = document.getElementById('closePlayerBtn');
            const scrollTopBtn = document.getElementById('scrollTopBtn');
            const audio = new Audio();
            audio.crossOrigin = 'anonymous';

            const toastContainer = document.getElementById('toastContainer');
            const modalOverlay = document.getElementById('modalOverlay');
            const modalCancel = document.getElementById('modalCancel');
            const modalConfirm = document.getElementById('modalConfirm');

            const themeToggle = document.getElementById('themeToggle');
            const themeIcon = document.getElementById('themeIcon');

            // Meta color del tema
            const themeColorMeta = document.getElementById('themeColorMeta');

            // Modal de compartir
            const shareModalOverlay = document.getElementById('shareModalOverlay');
            const shareModalClose = document.getElementById('shareModalClose');
            const shareAppBtn = document.getElementById('shareAppBtn');
            const copyLinkBtn = document.getElementById('copyLinkBtn');
            const shareBtns = shareModalOverlay.querySelectorAll('.share-modal-btn');

            function syncOpenOverlaysToViewport() {
                const vw = (window.visualViewport && window.visualViewport.width) || window.innerWidth;
                const vh = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
                document.querySelectorAll('#disclaimer-overlay, .share-modal-overlay.visible').forEach(el => {
                    el.style.width = vw + 'px';
                    el.style.height = vh + 'px';
                });
            }
            window.addEventListener('resize', syncOpenOverlaysToViewport);
            window.addEventListener('orientationchange', syncOpenOverlaysToViewport);
            if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', syncOpenOverlaysToViewport);
            }

            // ---------- Estado ----------
            const API_FALLBACK_SERVERS = [
                'https://de2.api.radio-browser.info',
                'https://at1.api.radio-browser.info',
                'https://nl1.api.radio-browser.info',
                'https://fr1.api.radio-browser.info'
            ];
            let apiBase = null;
            let stations = [];
            let favorites = [];
            let favoriteStations = []; // Almacena los datos completos de las emisoras favoritas
            
            try { 
                const stored = localStorage.getItem('gr_favs');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) {
                        favorites = parsed;
                    }
                }
                // Intenta cargar los datos completos de las favoritas
                const storedFavData = localStorage.getItem('gr_favs_data');
                if (storedFavData) {
                    const parsedData = JSON.parse(storedFavData);
                    if (Array.isArray(parsedData)) {
                        favoriteStations = parsedData;
                    }
                }
            } catch { 
                favorites = [];
                favoriteStations = [];
            }
            
            let currentStation = null;
            let currentCardEl = null;
            let isPlaying = false;
            let isMuted = false;
            let pendingDeleteId = null;
            let visualizerInterval = null;
            let visualizerBars = [];
            let currentLimit = parseInt(limitSelect.value, 10) || 96;
            let searchDebounce = null;
            let loadToken = 0;
            let isLoading = false;
            let hasMore = true;

            // ---------- Funciones de color del tema ----------
            function updateThemeColor(color, smooth = true) {
                if (!themeColorMeta) return;
                if (smooth) {
                    themeColorMeta.style.transition = 'all 0.5s ease';
                }
                themeColorMeta.content = color;
                try {
                    if (window.navigator && window.navigator.themeColor) {
                        window.navigator.themeColor = color;
                    }
                } catch (e) {}
            }

            function getCurrentThemeColor() {
                const isLight = document.documentElement.getAttribute('data-theme') === 'light';
                return isLight ? '#e9e1d2' : '#14100d';
            }

            function getGenreColor(station) {
                const tags = (station.tags || '').toLowerCase();
                const genreColors = {
                    'rock': '#e74c3c',
                    'pop': '#e67e22',
                    'jazz': '#f39c12',
                    'classical': '#8e44ad',
                    'electronic': '#3498db',
                    'hip hop': '#2ecc71',
                    'rap': '#2ecc71',
                    'reggae': '#1abc9c',
                    'blues': '#2980b9',
                    'country': '#d35400',
                    'folk': '#16a085',
                    'metal': '#7f8c8d',
                    'punk': '#c0392b',
                    'indie': '#27ae60',
                    'alternative': '#2c3e50',
                    'dance': '#f1c40f',
                    'house': '#9b59b6',
                    'techno': '#34495e',
                    'trance': '#8e44ad',
                    'ambient': '#2c3e50',
                    'news': '#e74c3c',
                    'talk': '#e67e22',
                    'sports': '#3498db',
                    'comedy': '#f1c40f'
                };
                for (const [genre, color] of Object.entries(genreColors)) {
                    if (tags.includes(genre)) {
                        return color;
                    }
                }
                return null;
            }

            function updateThemeColorByGenre(station) {
                if (station) {
                    const genreColor = getGenreColor(station);
                    if (genreColor) {
                        updateThemeColor(genreColor, true);
                        return;
                    }
                }
                updateThemeColor(getCurrentThemeColor(), true);
            }

            // ---------- Funciones auxiliares ----------
            function sanitize(s) { if (!s) return ''; return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
                    "'": '&#39;' })[c]); }

            // Valida que una URL proveniente de la API externa use un esquema seguro (http/https).
            // Bloquea esquemas peligrosos como javascript:, data:, vbscript:, file:, etc. que podrían
            // usarse para ejecutar código o abrir contenido malicioso si se insertaran en el DOM.
            function safeUrl(u) {
                if (!u) return '';
                try {
                    const parsed = new URL(String(u), window.location.href);
                    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                        return parsed.href;
                    }
                } catch { /* URL inválida */ }
                return '';
            }

            function showToast(msg, type = 'info') {
                toastContainer.querySelectorAll('.toast').forEach(t => t.remove());
                const el = document.createElement('div');
                el.className = `toast ${type}`;
                el.innerHTML =
                    `<i class="fas ${type==='success'?'fa-check-circle':type==='error'?'fa-exclamation-circle':type==='warning'?'fa-exclamation-triangle':'fa-info-circle'}"></i> ${sanitize(msg)}`;
                toastContainer.appendChild(el);
                requestAnimationFrame(() => el.classList.add('show'));
                setTimeout(() => {
                    el.classList.remove('show');
                    setTimeout(() => el.remove(), 300);
                }, 3000);
            }

            function setOnlineStatus() {
                const online = navigator.onLine;
                connStatus.classList.toggle('offline', !online);
                connLabel.textContent = online ? 'En línea' : 'Sin conexión';
            }
            window.addEventListener('online', () => { setOnlineStatus();
                showToast('Conexión restablecida', 'success'); });
            window.addEventListener('offline', () => { setOnlineStatus();
                showToast('Sin conexión a internet', 'warning'); });
            setOnlineStatus();

            function updateFavBadge() {
                if (favorites.length > 0) {
                    favBadge.style.display = 'flex';
                    favBadge.textContent = favorites.length > 99 ? '99+' : favorites.length;
                } else {
                    favBadge.style.display = 'none';
                }
            }

            // ---------- Tema ----------
            function applyTheme(theme) {
                if (theme === 'light') {
                    document.documentElement.setAttribute('data-theme', 'light');
                    themeIcon.className = 'fas fa-sun';
                    themeToggle.setAttribute('aria-pressed', 'true');
                    // El color de la barra de búsqueda en modo claro — tono claro y sofisticado
                    updateThemeColor('#e9e1d2');
                } else {
                    document.documentElement.removeAttribute('data-theme');
                    themeIcon.className = 'fas fa-moon';
                    themeToggle.setAttribute('aria-pressed', 'false');
                    updateThemeColor('#14100d');
                }
                try { localStorage.setItem('gr_theme', theme || 'dark'); } catch {}
            }

            const initialTheme = (() => {
                try {
                    const stored = localStorage.getItem('gr_theme');
                    if (stored) return stored;
                    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                } catch { return 'dark'; }
            })();
            applyTheme(initialTheme);

            themeToggle.addEventListener('click', () => {
                const cur = document.documentElement.getAttribute('data-theme') ? 'light' : 'dark';
                applyTheme(cur === 'dark' ? 'light' : 'dark');
            });

            // ---------- Navegación ----------
            function switchSection(target) {
                navItems.forEach(n => { n.classList.toggle('active', n.dataset.section === target);
                    n.setAttribute('aria-selected', n.dataset.section === target ? 'true' : 'false'); });
                document.querySelectorAll('.section').forEach(s => s.classList.toggle('active', s.id === target));
                if (target === 'sectionFavorites') renderFavorites();
            }
            navItems.forEach(item => {
                item.addEventListener('click', function() { switchSection(this.dataset.section); });
            });

            // ---------- Funciones de fetch ----------
            async function pingServer(base) {
                try {
                    const ctrl = new AbortController();
                    const timer = setTimeout(() => ctrl.abort(), 5000);
                    const res = await fetch(base + '/json/stats', { signal: ctrl.signal });
                    clearTimeout(timer);
                    return res.ok;
                } catch { return false; }
            }

            async function resolveApiBase() {
                if (apiBase) return apiBase;
                try {
                    const ctrl = new AbortController();
                    const timer = setTimeout(() => ctrl.abort(), 6000);
                    const res = await fetch('https://all.api.radio-browser.info/json/servers', { signal: ctrl.signal });
                    clearTimeout(timer);
                    if (res.ok) {
                        const list = await res.json();
                        const names = [...new Set((list || []).map(s => s.name))];
                        for (const name of names) {
                            const candidate = 'https://' + name;
                            if (await pingServer(candidate)) { apiBase = candidate; return apiBase; }
                        }
                    }
                } catch { /* continúa */ }
                for (const candidate of API_FALLBACK_SERVERS) {
                    if (await pingServer(candidate)) { apiBase = candidate; return apiBase; }
                }
                apiBase = API_FALLBACK_SERVERS[0];
                return apiBase;
            }

            async function fetchJSON(path, fallback = null) {
                const tryOnce = async (base) => {
                    try {
                        const ctrl = new AbortController();
                        const timer = setTimeout(() => ctrl.abort(), 12000);
                        const res = await fetch(base + path, { signal: ctrl.signal });
                        clearTimeout(timer);
                        if (!res.ok) return undefined;
                        return await res.json();
                    } catch { return undefined; }
                };

                const base = await resolveApiBase();
                let result = await tryOnce(base);
                if (result !== undefined) return result;

                apiBase = null;
                for (const candidate of API_FALLBACK_SERVERS) {
                    if (candidate === base) continue;
                    result = await tryOnce(candidate);
                    if (result !== undefined) { apiBase = candidate; return result; }
                }
                return fallback;
            }

            async function populateFilters() {
                const countries = await fetchJSON('/json/countries', []);
                if (countries.length) {
                    countries.sort((a, b) => a.name.localeCompare(b.name));
                    const frag = document.createDocumentFragment();
                    countries.slice(0, 200).forEach(c => {
                        const opt = document.createElement('option');
                        opt.value = c.name;
                        opt.textContent = c.name + ' (' + c.stationcount + ')';
                        frag.appendChild(opt);
                    });
                    countrySelect.appendChild(frag);
                } else {
                    showToast('No se pudo cargar la lista de países', 'warning');
                }
            }

            async function fetchStations(limit, query = '', country = '') {
                const params = [];
                if (query) params.push('name=' + encodeURIComponent(query));
                if (country) params.push('country=' + encodeURIComponent(country));
                params.push('limit=' + limit);
                params.push('hidebroken=true');
                params.push('order=votes&reverse=true');
                let path;
                if (params.length > 3) path = '/json/stations/search?' + params.join('&');
                else path = '/json/stations/topclick/' + limit;
                return await fetchJSON(path, null);
            }

            // ---------- Esqueletos ----------
            function renderSkeletons(count) {
                stationGrid.innerHTML = '';
                const frag = document.createDocumentFragment();
                for (let i = 0; i < count; i++) {
                    const sk = document.createElement('div');
                    sk.className = 'skeleton-card';
                    sk.innerHTML =
                        `<div class="skeleton-block skeleton-cover"></div><div class="skeleton-lines"><div class="skeleton-block skeleton-line w60"></div><div class="skeleton-block skeleton-line w40"></div><div class="skeleton-block skeleton-line w80"></div></div>`;
                    frag.appendChild(sk);
                }
                stationGrid.appendChild(frag);
            }

            // ---------- Renderizar emisoras ----------
            function renderStations(list, append = false) {
                if (!append) {
                    stationGrid.innerHTML = '';
                }
                
                if (!list || !list.length) {
                    if (!append) {
                        stationGrid.innerHTML =
                            `<div class="state-message"><i class="fas fa-satellite-dish big-icon"></i><h4>No se encontraron emisoras</h4><p>Prueba con otro nombre o país.</p></div>`;
                    }
                    return;
                }
                
                const frag = document.createDocumentFragment();
                list.forEach(st => {
                    const card = document.createElement('div');
                    card.className = 'station-card ripple';
                    card.setAttribute('role', 'button');
                    card.setAttribute('tabindex', '0');
                    card.setAttribute('aria-label', 'Reproducir ' + (st.name || 'emisora'));
                    const isFav = favorites.includes(st.stationuuid);
                    const faviconUrl = safeUrl(st.favicon);
                    const coverHtml = faviconUrl ?
                        `<img src="${sanitize(faviconUrl)}" alt="" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='<i class=\\'fas fa-compact-disc\\'></i>';">` :
                        '<i class="fas fa-compact-disc"></i>';
                    const tags = (st.tags || '').split(',').filter(Boolean).slice(0, 3).map(t =>
                        `<span>${sanitize(t)}</span>`).join('');
                    const bitrateTxt = st.bitrate ? (st.bitrate + 'kbps') : '';
                    
                    const favIcon = '<i class="fas fa-heart"></i>';
                    const favLabel = isFav ? 'Quitar de favoritos' : 'Agregar a favoritos';
                    
                    card.innerHTML = `
                        <div class="top">
                            <div class="cover">${coverHtml}</div>
                            <div class="info">
                                <h3>${sanitize(st.name)}</h3>
                                <div class="meta"><span class="live-dot"></span>${sanitize(st.country||'')}${st.codec?' • '+sanitize(st.codec):''}${bitrateTxt?' '+bitrateTxt:''}</div>
                                <div class="tags">${tags}</div>
                            </div>
                            <button class="fav-btn ${isFav?'active':''}" data-uuid="${st.stationuuid}" aria-label="${favLabel}" aria-pressed="${isFav}">${favIcon}</button>
                        </div>
                    `;
                    const activate = (e) => {
                        if (e.target.closest('.fav-btn')) return;
                        playStation(st, card);
                    };
                    card.addEventListener('click', activate);
                    card.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault();
                            activate(e); }
                    });
                    const favBtn = card.querySelector('.fav-btn');
                    favBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const uuid = favBtn.dataset.uuid;
                        const station = stations.find(s => s.stationuuid === uuid);
                        if (!station) return;
                        
                        toggleFavorite(station);
                        const nowFav = favorites.includes(uuid);
                        favBtn.classList.toggle('active', nowFav);
                        favBtn.setAttribute('aria-label', nowFav ? 'Quitar de favoritos' : 'Agregar a favoritos');
                        favBtn.setAttribute('aria-pressed', nowFav);
                    });
                    if (currentStation && currentStation.stationuuid === st.stationuuid) {
                        card.classList.add('playing');
                    }
                    frag.appendChild(card);
                });
                stationGrid.appendChild(frag);
            }

            // ---------- Renderizar favoritos ----------
            function renderFavorites() {
                updateFavBadge();
                
                // Usa los datos completos de las favoritas almacenados
                if (favoriteStations.length === 0) {
                    // Si no hay datos completos, intenta recuperarlos de las estaciones actuales
                    const favStations = stations.filter(s => favorites.includes(s.stationuuid));
                    if (favStations.length > 0) {
                        favoriteStations = favStations;
                        try {
                            localStorage.setItem('gr_favs_data', JSON.stringify(favoriteStations));
                        } catch {}
                    }
                }
                
                // Usa favoriteStations como fuente principal
                const favStations = favoriteStations.filter(s => favorites.includes(s.stationuuid));
                
                if (!favorites.length || favStations.length === 0) {
                    favoritesGrid.innerHTML = 
                        `<div class="state-message"><i class="fas fa-heart big-icon"></i><h4>Aún no hay favoritas</h4><p>Toca el corazón de cualquier emisora para guardarla aquí.</p></div>`;
                    return;
                }
                
                favoritesGrid.innerHTML = '';
                const frag = document.createDocumentFragment();
                favStations.forEach(st => {
                    const card = document.createElement('div');
                    card.className = 'station-card ripple';
                    card.setAttribute('role', 'button');
                    card.setAttribute('tabindex', '0');
                    card.setAttribute('aria-label', 'Reproducir ' + (st.name || 'emisora'));
                    
                    const coverHtml = safeUrl(st.favicon) ?
                        `<img src="${sanitize(safeUrl(st.favicon))}" alt="" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='<i class=\\'fas fa-compact-disc\\'></i>';">` :
                        '<i class="fas fa-compact-disc"></i>';
                    const tags = (st.tags || '').split(',').filter(Boolean).slice(0, 3).map(t =>
                        `<span>${sanitize(t)}</span>`).join('');
                    const bitrateTxt = st.bitrate ? (st.bitrate + 'kbps') : '';
                    
                    card.innerHTML = `
                        <div class="top">
                            <div class="cover">${coverHtml}</div>
                            <div class="info">
                                <h3>${sanitize(st.name)}</h3>
                                <div class="meta"><span class="live-dot"></span>${sanitize(st.country||'')}${st.codec?' • '+sanitize(st.codec):''}${bitrateTxt?' '+bitrateTxt:''}</div>
                                <div class="tags">${tags}</div>
                            </div>
                            <button class="fav-btn active" data-uuid="${st.stationuuid}" aria-label="Remover dos favoritos" aria-pressed="true"><i class="fas fa-trash-can"></i></button>
                        </div>
                    `;
                    const activate = (e) => {
                        if (e.target.closest('.fav-btn')) return;
                        playStation(st, card);
                    };
                    card.addEventListener('click', activate);
                    card.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault();
                            activate(e); }
                    });
                    const favBtn = card.querySelector('.fav-btn');
                    favBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const uuid = favBtn.dataset.uuid;
                        pendingDeleteId = uuid;
                        modalOverlay.classList.add('visible');
                        modalConfirm.focus();
                    });
                    if (currentStation && currentStation.stationuuid === st.stationuuid) {
                        card.classList.add('playing');
                    }
                    frag.appendChild(card);
                });
                favoritesGrid.appendChild(frag);
            }

            // ---------- Gestión de favoritos ----------
            function toggleFavorite(station) {
                const index = favorites.indexOf(station.stationuuid);
                if (index > -1) {
                    favorites.splice(index, 1);
                    // Elimina también de los datos completos
                    const dataIndex = favoriteStations.findIndex(s => s.stationuuid === station.stationuuid);
                    if (dataIndex > -1) {
                        favoriteStations.splice(dataIndex, 1);
                    }
                    showToast('Quitada de favoritos', 'warning');
                } else {
                    favorites.push(station.stationuuid);
                    // Almacena los datos completos de la estación
                    if (!favoriteStations.find(s => s.stationuuid === station.stationuuid)) {
                        favoriteStations.push(station);
                    }
                    showToast('Agregada a favoritos', 'success');
                }
                try { 
                    localStorage.setItem('gr_favs', JSON.stringify(favorites));
                    localStorage.setItem('gr_favs_data', JSON.stringify(favoriteStations));
                } catch {}
                updateFavBadge();
                if (sectionFav.classList.contains('active')) renderFavorites();
            }

            // ---------- Cargar emisoras (FUNCIÓN PRINCIPAL) ----------
            async function loadStations(append = false) {
                if (isLoading) return;
                isLoading = true;
                refreshBtn.disabled = true;
                loadMoreBtn.disabled = true;
                
                const token = ++loadToken;
                const query = searchInput.value.trim();
                const country = countrySelect.value;
                const limit = parseInt(limitSelect.value, 10) || 96;
                
                if (!append) {
                    renderSkeletons(8);
                }
                
                try {
                    const data = await fetchStations(limit, query, country);
                    
                    if (token !== loadToken) return;
                    
                    if (data && data.length) {
                        if (append) {
                            stations = [...stations, ...data];
                            renderStations(data, true);
                        } else {
                            stations = data;
                            renderStations(data);
                        }
                        hasMore = data.length === limit;
                        loadMoreBtn.style.display = hasMore ? 'inline-flex' : 'none';
                        resultsBar.textContent = `${stations.length} emisoras encontradas`;
                    } else {
                        if (!append) {
                            stationGrid.innerHTML =
                                `<div class="state-message"><i class="fas fa-satellite-dish big-icon"></i><h4>No se encontraron emisoras</h4><p>Prueba con otro nombre o país.</p></div>`;
                        }
                        hasMore = false;
                        loadMoreBtn.style.display = 'none';
                        resultsBar.textContent = '0 emisoras encontradas';
                    }
                } catch (error) {
                    console.error('Error loading stations:', error);
                    if (!append) {
                        stationGrid.innerHTML =
                            `<div class="state-message"><i class="fas fa-wifi big-icon"></i><h4>Error de conexión</h4><p>No se pudieron cargar las emisoras. Intenta nuevamente.</p><button class="retry-btn" id="retryBtn">Reintentar</button></div>`;
                        document.getElementById('retryBtn')?.addEventListener('click', () => loadStations(false));
                    }
                    showToast('Error al cargar las emisoras', 'error');
                } finally {
                    isLoading = false;
                    refreshBtn.disabled = false;
                    loadMoreBtn.disabled = false;
                }
            }

            // ---------- Funciones del reproductor ----------
            function playStation(station, cardEl) {
                const streamUrl = safeUrl(station && station.url);
                if (!station || !streamUrl) {
                    showToast('Esta emisora no tiene una URL válida o segura disponible', 'error');
                    return;
                }
                
                if (visualizerInterval) {
                    clearInterval(visualizerInterval);
                    visualizerInterval = null;
                }
                
                currentStation = station;
                currentCardEl = cardEl;
                
                document.querySelectorAll('.station-card').forEach(c => c.classList.remove('playing'));
                if (cardEl) cardEl.classList.add('playing');
                
                const playerFaviconUrl = safeUrl(station.favicon);
                playerCover.innerHTML = playerFaviconUrl ?
                    `<img src="${sanitize(playerFaviconUrl)}" alt="" onerror="this.style.display='none';this.parentElement.innerHTML='<i class=\\'fas fa-compact-disc\\'></i>';">` :
                    '<i class="fas fa-compact-disc"></i>';
                playerTitle.textContent = station.name || 'Emisora';
                playerSub.textContent = `${station.country || ''} ${station.codec || ''} ${station.bitrate ? station.bitrate + 'kbps' : ''}`.trim() || '—';
                
                const hasHttps = streamUrl.startsWith('https');
                const hasSsl = station.ssl_error === 0;
                if (hasHttps && hasSsl) {
                    securityIndicator.className = 'security safe';
                    securityIndicator.innerHTML = '<i class="fas fa-shield-alt"></i> Conexión segura';
                } else if (hasHttps && !hasSsl) {
                    securityIndicator.className = 'security partial';
                    securityIndicator.innerHTML = '<i class="fas fa-shield-alt"></i> SSL mixto';
                } else {
                    securityIndicator.className = 'security unsafe';
                    securityIndicator.innerHTML = '<i class="fas fa-shield-alt"></i> Conexión no segura';
                }
                
                audio.src = streamUrl;
                audio.muted = isMuted;
                
                audio.play().then(() => {
                    isPlaying = true;
                    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    player.classList.add('visible');
                    startVisualizer();
                    updateThemeColorByGenre(station);
                    showToast(`Reproduciendo: ${station.name}`, 'success');
                }).catch(err => {
                    console.error('Play error:', err);
                    showToast('No se pudo reproducir esta emisora', 'error');
                    isPlaying = false;
                    playBtn.innerHTML = '<i class="fas fa-play"></i>';
                });
            }

            function stopPlayer() {
                audio.pause();
                audio.src = '';
                isPlaying = false;
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
                if (visualizerInterval) {
                    clearInterval(visualizerInterval);
                    visualizerInterval = null;
                }
                player.classList.remove('visible');
                document.querySelectorAll('.station-card').forEach(c => c.classList.remove('playing'));
                updateThemeColor(getCurrentThemeColor(), true);
            }

            function togglePlay() {
                if (!currentStation) {
                    showToast('Selecciona una emisora primero', 'warning');
                    return;
                }
                if (isPlaying) {
                    audio.pause();
                    isPlaying = false;
                    playBtn.innerHTML = '<i class="fas fa-play"></i>';
                    if (visualizerInterval) {
                        clearInterval(visualizerInterval);
                        visualizerInterval = null;
                    }
                } else {
                    audio.play().then(() => {
                        isPlaying = true;
                        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                        startVisualizer();
                    }).catch(err => {
                        console.error('Play error:', err);
                        showToast('No se pudo reanudar la reproducción', 'error');
                    });
                }
            }

            // ---------- Visualizador ----------
            function startVisualizer() {
                if (visualizerInterval) clearInterval(visualizerInterval);
                visualizer.innerHTML = '';
                const barsCount = Math.min(16, Math.floor(visualizer.clientWidth / 4) || 8);
                visualizerBars = [];
                for (let i = 0; i < barsCount; i++) {
                    const bar = document.createElement('div');
                    bar.className = 'bar';
                    bar.style.height = Math.random() * 14 + 4 + 'px';
                    visualizer.appendChild(bar);
                    visualizerBars.push(bar);
                }
                // Actualiza las barras con menos frecuencia para reducir el consumo de CPU/GPU,
                // y se detiene cuando la pestaña está oculta (no aporta nada visible)
                visualizerInterval = setInterval(() => {
                    if (!isPlaying || document.hidden) return;
                    visualizerBars.forEach(bar => {
                        const h = Math.random() * 18 + 4;
                        bar.style.height = h + 'px';
                    });
                }, 200);
            }

            // ---------- Eventos ----------
            playBtn.addEventListener('click', togglePlay);
            
            muteBtn.addEventListener('click', () => {
                isMuted = !isMuted;
                audio.muted = isMuted;
                muteBtn.innerHTML = isMuted ? '<i class="fas fa-volume-off"></i>' : '<i class="fas fa-volume-up"></i>';
                muteBtn.setAttribute('aria-pressed', isMuted);
                showToast(isMuted ? 'Silenciado' : 'Sonido activado', 'info');
            });
            
            closePlayerBtn.addEventListener('click', stopPlayer);
            
            // ---------- Botón volver arriba ----------
            let scrollTopTicking = false;
            function updateScrollTopBtn() {
                scrollTopBtn.classList.toggle('show', window.scrollY > 400);
                scrollTopTicking = false;
            }
            window.addEventListener('scroll', () => {
                if (!scrollTopTicking) {
                    requestAnimationFrame(updateScrollTopBtn);
                    scrollTopTicking = true;
                }
            }, { passive: true });
            scrollTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            
            searchInput.addEventListener('input', () => {
                clearTimeout(searchDebounce);
                searchDebounce = setTimeout(() => loadStations(false), 500);
                searchClear.classList.toggle('show', searchInput.value.length > 0);
            });
            
            searchClear.addEventListener('click', () => {
                searchInput.value = '';
                searchClear.classList.remove('show');
                loadStations(false);
                searchInput.focus();
            });
            
            countrySelect.addEventListener('change', () => loadStations(false));
            limitSelect.addEventListener('change', () => {
                currentLimit = parseInt(limitSelect.value, 10) || 96;
                loadStations(false);
            });
            
            refreshBtn.addEventListener('click', () => {
                const icon = refreshBtn.querySelector('i');
                icon.classList.add('fa-spin');
                loadStations(false).finally(() => {
                    icon.classList.remove('fa-spin');
                });
            });
            
            loadMoreBtn.addEventListener('click', () => {
                if (hasMore && !isLoading) {
                    loadStations(true);
                }
            });

            // ---------- Modal de confirmación ----------
            modalCancel.addEventListener('click', () => {
                modalOverlay.classList.remove('visible');
                pendingDeleteId = null;
            });
            
            modalConfirm.addEventListener('click', () => {
                if (pendingDeleteId) {
                    const station = stations.find(s => s.stationuuid === pendingDeleteId);
                    if (station) {
                        toggleFavorite(station);
                        document.querySelectorAll(`.fav-btn[data-uuid="${pendingDeleteId}"]`).forEach(btn => {
                            btn.classList.remove('active');
                            btn.innerHTML = '<i class="fas fa-heart"></i>';
                            btn.setAttribute('aria-label', 'Adicionar aos favoritos');
                            btn.setAttribute('aria-pressed', 'false');
                        });
                    } else {
                        // Si no se encuentra en la lista de estaciones, intenta en los favoritos
                        const favStation = favoriteStations.find(s => s.stationuuid === pendingDeleteId);
                        if (favStation) {
                            toggleFavorite(favStation);
                        } else {
                            // Elimina solo de la lista de UUIDs
                            const index = favorites.indexOf(pendingDeleteId);
                            if (index > -1) {
                                favorites.splice(index, 1);
                                try { localStorage.setItem('gr_favs', JSON.stringify(favorites)); } catch {}
                                updateFavBadge();
                                if (sectionFav.classList.contains('active')) renderFavorites();
                                showToast('Quitada de favoritos', 'warning');
                            }
                        }
                        document.querySelectorAll(`.fav-btn[data-uuid="${pendingDeleteId}"]`).forEach(btn => {
                            btn.classList.remove('active');
                            btn.innerHTML = '<i class="fas fa-heart"></i>';
                            btn.setAttribute('aria-label', 'Agregar a favoritos');
                            btn.setAttribute('aria-pressed', 'false');
                        });
                    }
                    pendingDeleteId = null;
                }
                modalOverlay.classList.remove('visible');
            });
            
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    modalOverlay.classList.remove('visible');
                    pendingDeleteId = null;
                }
            });

            // ---------- Modal de compartir ----------
            shareAppBtn.addEventListener('click', () => {
                shareModalOverlay.classList.add('visible');
                syncOpenOverlaysToViewport();
            });
            
            shareModalClose.addEventListener('click', () => {
                shareModalOverlay.classList.remove('visible');
            });
            
            shareModalOverlay.addEventListener('click', (e) => {
                if (e.target === shareModalOverlay) {
                    shareModalOverlay.classList.remove('visible');
                }
            });
            
            shareBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const network = btn.dataset.network;
                    const url = encodeURIComponent(window.location.href);
                    const text = encodeURIComponent('🎵 ¡Escucha GJ Radio Online! Miles de emisoras del mundo en un solo lugar.');
                    let shareUrl = '';
                    switch(network) {
                        case 'whatsapp': shareUrl = `https://wa.me/?text=${text}%20${url}`; break;
                        case 'telegram': shareUrl = `https://t.me/share/url?url=${url}&text=${text}`; break;
                        case 'x': shareUrl = `https://x.com/intent/tweet?text=${text}&url=${url}`; break;
                        case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`; break;
                    }
                    if (shareUrl) {
                        // 'noopener' evita que la ventana abierta tenga acceso a window.opener
                        // (protección contra reverse tabnabbing)
                        window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
                    }
                });
            });
            
            copyLinkBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    showToast('Enlace copiado al portapapeles', 'success');
                    shareModalOverlay.classList.remove('visible');
                } catch {
                    const input = document.createElement('input');
                    input.value = window.location.href;
                    document.body.appendChild(input);
                    input.select();
                    document.execCommand('copy');
                    input.remove();
                    showToast('Enlace copiado al portapapeles', 'success');
                    shareModalOverlay.classList.remove('visible');
                }
            });

            // ---------- Atajos de teclado ----------
            document.addEventListener('keydown', (e) => {
                if (e.key === ' ' && !e.target.matches('input, select, textarea, button')) {
                    e.preventDefault();
                    togglePlay();
                }
                if (e.key === 'Escape') {
                    if (modalOverlay.classList.contains('visible')) {
                        modalOverlay.classList.remove('visible');
                        pendingDeleteId = null;
                    }
                    if (shareModalOverlay.classList.contains('visible')) {
                        shareModalOverlay.classList.remove('visible');
                    }
                }
            });

            // ---------- Manejadores de eventos de audio ----------
            audio.addEventListener('ended', () => {
                isPlaying = false;
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
                if (visualizerInterval) {
                    clearInterval(visualizerInterval);
                    visualizerInterval = null;
                }
                showToast('La transmisión ha terminado', 'info');
            });
            
            audio.addEventListener('error', (e) => {
                console.error('Audio error:', e);
                if (isPlaying) {
                    isPlaying = false;
                    playBtn.innerHTML = '<i class="fas fa-play"></i>';
                    if (visualizerInterval) {
                        clearInterval(visualizerInterval);
                        visualizerInterval = null;
                    }
                    showToast('Error en la transmisión', 'error');
                }
            });

            // ---------- Cambio de visibilidad para el color del tema ----------
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden && isPlaying && currentStation) {
                    const genreColor = getGenreColor(currentStation);
                    if (genreColor) {
                        updateThemeColor(genreColor, true);
                    }
                } else if (document.hidden) {
                    const baseColor = getCurrentThemeColor();
                    updateThemeColor(baseColor, true);
                }
            });

// ---------- Enlaces del aviso legal ----------
window.showDisclaimer = function(type, title) {
    const messages = {
        privacy: {
            title: 'Política de Privacidad',
            content: 'Este proyecto tiene carácter educativo. No recopilamos, almacenamos ni compartimos datos personales de los usuarios. Todas las transmisiones se realizan directamente desde las fuentes externas.'
        },
        terms: {
            title: 'Términos de Uso',
            content: 'Este proyecto tiene fines educativos y no debe utilizarse con propósitos comerciales. El contenido se proporciona "tal cual", sin garantías de ningún tipo.'
        },
        dmca: {
            title: 'Derechos de Autor',
            content: 'Este es un proyecto educativo que respeta los derechos de autor. Si usted es titular de derechos y cree que su contenido ha sido utilizado de manera inapropiada, contáctenos para su eliminación.'
        },
        about: {
            title: 'Acerca de',
            content: 'GJ Radio Online es un agregador de radios en línea desarrollado por Julio Gonzales con fines educativos. El proyecto utiliza la API de Radio Browser y es de código abierto.'
        }
    };
    
    const data = messages[type];
    if (!data) {
        showToast('Información disponible próximamente.', 'info');
        return;
    }
    
    const iconMap = {
        privacy: 'fa-shield-alt',
        terms: 'fa-file-contract',
        dmca: 'fa-copyright',
        about: 'fa-info-circle'
    };
    
    // Superposición
    const overlay = document.createElement('div');
    overlay.id = 'disclaimer-overlay';
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100dvh;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 20px;
        animation: disclaimerFadeIn 0.3s ease;
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
    `;
    
    // Modal con ajustes para evitar fondo extra
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: var(--bg-surface-glass);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1px solid var(--border-glass);
        border-radius: var(--radius-xl);
        max-width: 520px;
        width: 100%;
        padding: 32px 28px 28px;
        box-shadow: var(--shadow-glass);
        animation: disclaimerSlideUp 0.35s cubic-bezier(0.2, 0, 0, 1);
        position: relative;
        max-height: 90vh;
        overflow-y: auto;
        box-sizing: border-box;
        /* Asegura que la altura se ajuste al contenido */
        height: auto;
        min-height: unset;
        /* Para que el scroll no genere espacio extra */
        scrollbar-width: thin;
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
    `;
    
    modal.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 16px;">
            <div style="
                width: 44px;
                height: 44px;
                min-width: 44px;
                border-radius: var(--radius-sm);
                background: var(--accent-soft);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                color: var(--accent);
                border: 1px solid var(--border-glass);
            ">
                <i class="fas ${iconMap[type] || 'fa-info-circle'}"></i>
            </div>
            <div style="flex: 1;">
                <h2 style="
                    font-family: var(--font-display);
                    font-size: 20px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0 0 4px 0;
                    line-height: 1.2;
                ">${data.title}</h2>
                <div style="
                    width: 40px;
                    height: 3px;
                    border-radius: 99px;
                    background: var(--accent);
                    opacity: 0.6;
                "></div>
            </div>
        </div>

        <p style="
            font-family: var(--font);
            font-size: 15px;
            line-height: 1.7;
            color: var(--text-secondary);
            margin: 12px 0 24px 0;
            padding: 16px 20px;
            background: var(--bg-elevated-glass);
            border-radius: var(--radius-sm);
            border-left: 3px solid var(--accent);
        ">${data.content}</p>

        <div style="display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap;">
            <button onclick="closeDisclaimer()" style="
                font-family: var(--font);
                font-size: 14px;
                font-weight: 500;
                padding: 10px 28px;
                border-radius: var(--radius-full);
                border: 1px solid var(--border-glass);
                background: var(--bg-input-glass);
                color: var(--text-secondary);
                cursor: pointer;
                transition: var(--transition);
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
            " onmouseover="this.style.background='var(--border-glass)'" onmouseout="this.style.background='var(--bg-input-glass)'">
                Cerrar
            </button>
            <button onclick="closeDisclaimer()" style="
                font-family: var(--font);
                font-size: 14px;
                font-weight: 500;
                padding: 10px 28px;
                border-radius: var(--radius-full);
                border: none;
                background: var(--accent);
                color: #fff;
                cursor: pointer;
                transition: var(--transition);
                box-shadow: 0 4px 16px var(--accent-glow);
            " onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
                Entendido
            </button>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    if (typeof syncOpenOverlaysToViewport === 'function') syncOpenOverlaysToViewport();
    
    // Cerrar al hacer clic fuera
    overlay.addEventListener('click', function(e) {
        if (e.target === this) closeDisclaimer();
    });
    
    // Cerrar con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeDisclaimer();
    });
    
    // Inyectar estilos de animación si no existen
    if (!document.getElementById('disclaimer-styles')) {
        const style = document.createElement('style');
        style.id = 'disclaimer-styles';
        style.textContent = `
            @keyframes disclaimerFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes disclaimerSlideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px) scale(0.96);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            /* Personalización del scroll para que no se vea un fondo extra */
            #disclaimer-overlay .disclaimer-scroll::-webkit-scrollbar {
                width: 4px;
            }
            #disclaimer-overlay .disclaimer-scroll::-webkit-scrollbar-track {
                background: transparent;
            }
            #disclaimer-overlay .disclaimer-scroll::-webkit-scrollbar-thumb {
                background: var(--border-glass-strong);
                border-radius: 99px;
            }
        `;
        document.head.appendChild(style);
    }
};

// Función para cerrar el disclaimer
window.closeDisclaimer = function() {
    const overlay = document.getElementById('disclaimer-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.25s ease';
        setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 250);
    }
};
            // ---------- Inicialización ----------
            async function init() {
                await populateFilters();
                await loadStations(false);
                updateFavBadge();
                // Si hay favoritos, garantiza que los datos completos estén cargados
                if (favorites.length > 0 && favoriteStations.length === 0) {
                    // Intenta recuperarlos de las estaciones actuales
                    const favStations = stations.filter(s => favorites.includes(s.stationuuid));
                    if (favStations.length > 0) {
                        favoriteStations = favStations;
                        try {
                            localStorage.setItem('gr_favs_data', JSON.stringify(favoriteStations));
                        } catch {}
                    }
                }
                if (sectionFav.classList.contains('active')) {
                    renderFavorites();
                }
            }
            
            init().catch(err => {
                console.error('Init error:', err);
                showToast('Error al iniciar la aplicación', 'error');
            });

        })();
