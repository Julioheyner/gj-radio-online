 //==============================
 // EFECTO DE LA IMAGEN DEL HERO 
 //==============================

    document.addEventListener('DOMContentLoaded', function() {
        const heroSection = document.getElementById('hero-section');
        
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            
            if (heroSection) {
                if (scrolled > 50) {
                    heroSection.classList.add('scrolled');
                } else {
                    heroSection.classList.remove('scrolled');
                }
            }
        });
    });
    
    // =================================================
    // CONFIGURACIONES DE SEGURIDAD Y PALETA DE COLORES
    // =================================================
    
    const API_BASE = "https://de1.api.radio-browser.info/json";
    const radioListEl = document.getElementById('radio-list');
    const favoritesListEl = document.getElementById('favorites-list');
    const searchInput = document.getElementById('search');
    const limitSelect = document.getElementById('limit');
    const btnRefresh = document.getElementById('btn-refresh');
    const countrySelect = document.getElementById('country');
    const tagSelect = document.getElementById('tag');
    
    const audio = document.getElementById('audio');
    const playBtn = document.getElementById('play-btn');
    const muteBtn = document.getElementById('mute-btn');
    const playerCover = document.getElementById('player-cover');
    const playerCoverFallback = document.getElementById('player-cover-fallback');
    const playerTitle = document.getElementById('player-title');
    const playerSub = document.getElementById('player-sub');
    const playerState = document.getElementById('player-state');
    const visualizer = document.getElementById('visualizer');
    const securityIndicator = document.getElementById('security-indicator');
    
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    
    let stations = [];
    let currentStation = null;
    let favorites = JSON.parse(localStorage.getItem('gr_favs') || "[]");
    let visualizerBars = [];
    let visualizerInterval;
    let isPlaying = false;
    let pendingDeleteStationId = null;
    let currentlyPlayingCard = null;
    
    //========================
    //  MODAL DE CONFIRMACIÓN
    //========================

    const confirmationModal = document.getElementById('confirmation-modal');
    const cancelBtn = document.querySelector('.cancel-btn');
    const deleteBtn = document.querySelector('.delete-btn');
    const disclaimerModal = document.getElementById('disclaimer-modal');
    const disclaimerTitle = document.getElementById('disclaimer-title');
    const disclaimerContent = document.getElementById('disclaimer-content');
    
    // =======================
    // 1. SEGURIDAD AVANZADA
    // =======================
    
    const SECURITY_CONFIG = {
      ALLOWED_AUDIO_DOMAINS: [
        'radio-browser.info', 'stream.radio-browser.info', 'radio-browser.net', 'stream.radio-browser.net',
        'icecast', 'stream', 'radio', 'live', 'broadcast', 'listen'
      ],
      ALLOWED_PROTOCOLS: ['http:', 'https:'],
      SUSPICIOUS_PATTERNS: [
        /javascript:/i, /data:text\/html/i, /<script/i, /onerror=/i, /onload=/i, /document\./i, /window\./i
      ]
    };
    
    function sanitizeHTML(text) {
      if (typeof text !== 'string') return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    function checkAudioURLSecurity(url) {
      if (!url || typeof url !== 'string') return 'unsafe';
      
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.toLowerCase();
        
        if (!SECURITY_CONFIG.ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
          console.warn('Protocolo no permitido:', urlObj.protocol);
          return 'unsafe';
        }
        for (const pattern of SECURITY_CONFIG.SUSPICIOUS_PATTERNS) {
          if (pattern.test(url)) {
            console.warn('URL contiene patrón sospechoso:', pattern);
            return 'unsafe';
          }
        }
        
        for (const allowed of SECURITY_CONFIG.ALLOWED_AUDIO_DOMAINS) {
          if (domain.includes(allowed)) {
            return 'safe';
          }
        }
        
        console.warn('Dominio de audio no verificado por el filtro riguroso:', domain);
        return 'partial';
        
      } catch (error) {
        console.warn('URL inválida o error de parse:', error);
        return 'unsafe';
      }
    }
    
    function escapeHtml(s){ 
        if(!s) return ''; 
        return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); 
    }
    
// ============================
// 2. CONTENIDO LEGAL (Footer)
// ============================

const LEGAL_CONTENT = {
    privacy: `
        <section>
            
            <div>
                <p style="font-size: 0.77rem">*Información sobre Recolección de Datos:</p>
                <p style="font-size: 0.77rem">Esta aplicación funciona como un agregador educativo de estaciones de radio en línea. Con fines de transparencia, informamos que:</p>
                
                <ul style="font-size: 0.77rem">
                    <li><strong>No recolectamos datos personales identificables</strong> (nombre, correo electrónico, ubicación, etc.)</li>
                    <li><strong>No utilizamos cookies de rastreo</strong> o tecnologías similares</li>
                    <li><strong>No compartimos datos</strong> con terceros, ya que no recolectamos información sensible</li>
                </ul>
                
                <p style="font-size: 0.77rem">*Almacenamiento Local (visitante):</p>
                <p style="font-size: 0.77rem">La aplicación utiliza tecnologías estándar del navegador (LocalStorage) para mejorar su experiencia:</p>
                
                <ul style="font-size: 0.77rem">
                    <li><strong>Estaciones favoritas:</strong> IDs técnicos de las radios para reconstruir su lista</li>
                    <li><strong>Preferencia de tema:</strong> Configuración visual (claro/oscuro)</li>
                    <li><strong>Configuraciones de reproducción:</strong> Volumen y otras preferencias temporales</li>
                </ul>
                
                <p style="font-size: 0.77rem">Información Técnica sobre Streaming:</p>
                <p style="font-size: 0.77rem">Las transmisiones de audio se establecen directamente entre su dispositivo y los servidores de las estaciones de radio. Este proceso:</p>
                
                <ul style="font-size: 0.77rem">
                    <li><strong>Está sujeto a las políticas de privacidad de cada estación</strong></li>
                    <li><strong>Utiliza conexiones estándar HTTPS cuando están disponibles</strong></li>
                </ul>
                
                <p style="font-size: 0.77rem">*Derechos del Usuario Visitante:</p>
                <p style="font-size: 0.77rem">Puede limpiar todos los datos locales en cualquier momento a través de la configuración de su navegador.</p>
            </div>
        </section>
    `,
    
    terms: `
        <section>
            
            <div>
                <p><strong>Finalidad Educativa</strong></p>
                <p style="font-size: 0.77rem">Esta aplicación se proporciona como un proyecto educativo para demostración de tecnologías web. Al utilizarla, usted reconoce que:</p>
                
                <ul style="font-size: 0.77rem">
                    <li><strong>El servicio se proporciona "tal cual está"</strong></li>
                    <li><strong>No hay garantías de disponibilidad continua o corrección de fallos</strong></li>
                    <li><strong>La aplicación funciona como agregador de enlaces públicos</strong></li>
                </ul>
                
                <p style="font-size: 0.77rem"><strong>Responsabilidades del Usuario:</strong></p>
                <p style="font-size: 0.77rem">Con fines educativos sobre el uso responsable de tecnología, usted acepta:</p>
                
                <ul style="font-size: 0.77rem">
                    <li><strong>Utilizar la aplicación solo para fines lícitos y educativos</strong></li>
                    <li><strong>Respetar los derechos de propiedad intelectual de las estaciones</strong></li>
                    <li><strong>Comprender que el contenido transmitido es responsabilidad de las estaciones</strong></li>
                </ul>
                
                <p style="font-size: 0.77rem"><strong>Limitaciones Educativas:</strong></p>
                <ul style="font-size: 0.77rem">
                    <li><strong>No somos responsables de la disponibilidad o calidad de las transmisiones</strong></li>
                    <li><strong>El listado de estaciones se obtiene de fuentes públicas de terceros</strong></li>
                    <li><strong>Podemos modificar o descontinuar el servicio con fines educativos</strong></li>
                </ul>
                
                <p style="font-size: 0.77rem"><strong>Contenido de Terceros:</strong></p>
                <p style="font-size: 0.77rem">Las estaciones de radio son entidades independientes. Recomendamos verificar los términos de uso de cada estación.</p>
            </div>
        </section>
    `,
    
    dmca: `
        <section>
            
            <div>
                <p style="font-size: 0.77rem">Política DMCA - Cumplimiento Educativo</p>
                
                <p style="font-size: 0.77rem"><strong>Aviso Informativo sobre DMCA:</strong></p>
                <p style="font-size: 0.77rem">La Digital Millennium Copyright Act (DMCA) es una ley estadounidense que aborda los derechos de autor en el entorno digital. Esta aplicación:</p>
                
                <ul style="font-size: 0.77rem">
                    <li><strong>Respetamos los derechos de autor</strong> y apoyamos la protección legal del contenido</li>
                    <li><strong>No alojamos contenido de audio</strong>, solo proporcionamos enlaces a transmisiones públicas</li>
                    <li><strong>Somos un servicio técnico</strong> que utiliza datos de la API pública de Radio Browser</li>
                </ul>
                
                <p style="font-size: 0.77rem"><strong>Procedimiento Técnico DMCA:</strong></p>
                <p style="font-size: 0.77rem">Para efectos de cumplimiento y educación sobre DMCA, el proceso es:</p>
                
                <ol style="font-size: 0.77rem">
                    <li><strong>Identificación del enlace</strong> que considera infractor</strong></li>
                    <li><strong>Verificación en Radio-Browser.info</strong> (fuente primaria de datos)</strong></li>
                    <li><strong>Contacto directo con la estación</strong> de radio transmisora</strong></li>
                    <li><strong>Notificación formal por escrito</strong> a nuestro contacto educativo</strong></li>
                </ol>
                
                <p style="font-size: 0.77rem"><strong>Información Requerida para Notificación DMCA:</strong></p>
                <p style="font-size: 0.77rem">Para fines educativos sobre notificaciones DMCA apropiadas, estas deben incluir:</p>
                
                <ul style="font-size: 0.77rem">
                    <li><strong>Firma física o electrónica del propietario de derechos</strong></li>
                    <li><strong>Identificación de la obra protegida supuestamente infringida</strong></li>
                    <li><strong>URL específica del enlace en nuestra aplicación</strong></li>
                    <li><strong>Información de contacto del reclamante</strong></li>
                    <li><strong>Declaración de buena fe sobre la reclamación</strong></li>
                </ul>
                
                <p style="font-size: 0.77rem"><strong>Límites Técnicos del Servicio:</strong></p>
                <p style="font-size: 0.77rem">Debido a nuestra naturaleza técnica como agregador educativo:</p>
                
                <ul style="font-size: 0.77rem">
                    <li><strong>No podemos controlar el contenido de las transmisiones en vivo</strong></li>
                    <li><strong>Los enlaces se actualizan automáticamente desde fuentes públicas</strong></li>
                    <li><strong>Solo podemos remover enlaces específicos de nuestra caché temporal</strong></li>
                </ul>
                
                <p style="font-size: 0.77rem"><strong>Contacto para Notificaciones DMCA:</strong></p>
                <p style="font-size: 0.77rem">Para notificaciones formales relacionadas con DMCA:</p>
                <p style="font-size: 0.77rem">Email: <strong>juliogonzales.dev@proton.me</strong></p>
                <p>
                    <p style=" font-size: 0.77rem; font-style: italic; font-weight: 600; margin-top: 10px">Nota: Este es un proyecto educativo. Las notificaciones DMCA serán procesadas como material de estudio sobre cumplimiento legal digital.</p>
                </p>
            </div>
        </section>
    `,
    
    about: `
        <section>
            
            <div>
                <p style="font-size: 0.77rem">Sobre Este Proyecto Educativo</p>
                <p style="font-size: 0.77rem">Este proyecto fue desarrollado como demostración educativa de:</p>
                
                <ul style="font-size: 0.77rem">
                    <li>Desarrollo web moderno con JavaScript</strong></li>
                    <li>Consumo responsable de APIs públicas</strong></li>
                    <li>Buenas prácticas de seguridad front-end</strong></li>
                    <li>Diseño de interfaces responsivas</strong></li>
                    <li>Cumplimiento normativo digital (incluyendo DMCA)</strong></li>
                </ul>
                
                <p style="font-size: 0.77rem"><strong>Tecnologías Utilizadas (Stack Educativo):</strong></p>
                <ul style="font-size: 0.77rem">
                    <li><strong>Front-end:</strong> JavaScript vanilla, HTML5, CSS3</li>
                    <li><strong>API:</strong> Radio Browser (fuente pública de datos)</li>
                    <li><strong>Almacenamiento:</strong> LocalStorage del navegador</li>
                    <li><strong>Reproducción:</strong> Web Audio API y HTML5 Audio</li>
                </ul>
                
                <p style="font-size: 0.77rem"><strong>Funcionalidades Demostradas:</strong></p>
                <ul style="font-size: 0.77rem">
                    <li><strong>Reproducción de audio vía Web Audio API</strong></li>
                    <li><strong>Almacenamiento local con LocalStorage</strong></li>
                    <li><strong>Filtrado y búsqueda en el cliente</strong></li>
                    <li><strong>Protección contra XSS y validación de URLs</strong></li>
                    <li><strong>Diseño responsivo y temas accesibles</strong></li>
                    <li><strong>Implementación de políticas legales educativas</strong></li>
                </ul>
                
                <p style="font-size: 0.77rem"><strong>Transparencia Técnica:</strong></p>
                <ul style="font-size: 0.77rem">
                    <li><strong>Código abierto con fines educativos</strong></li>
                    <li><strong>Sin servidores propios para streaming</strong></li>
                    <li><strong>Sin recolección de datos analíticos</strong></li>
                    <li><strong>Dependencia solo de APIs públicas</strong></li>
                    <li><strong>Políticas legales con enfoque educativo</strong></li>
                </ul>
                
                <p style="font-size: 0.77rem"><strong>Finalidad del Desarrollo:</strong></p>
                <p style="font-size: 0.77rem">*Proyecto creado por <strong>Julio Gonzales</strong> como material educativo para demostrar:</p>
                <ul style="font-size: 0.77rem">
                    <li><strong>Arquitectura de aplicaciones web estáticas</strong></li>
                    <li><strong>Buenas prácticas de seguridad en front-end</strong></li>
                    <li><strong>Consumo ético de APIs públicas</strong></li>
                    <li><strong>Transparencia en políticas de datos</strong></li>
                    <li><strong>Cumplimiento normativo digital educativo</strong></li>
                </ul>
                
                <p style="font-size: 0.77rem">*Nota Educativa:</p>
                <p style="font-size: 0.77rem"><strong>Este proyecto no tiene fines comerciales y sirve solo para demostración técnica y educativa sobre desarrollo web y normativas digitales.</strong></p>
            </div>
        </section>
    `
};

    
    function showDisclaimer(type, title) {
        disclaimerTitle.textContent = title;
        disclaimerContent.innerHTML = LEGAL_CONTENT[type] || '<p>Contenido no encontrado.</p>';
        disclaimerModal.classList.add('show');
    }
    
    function hideDisclaimerModal() {
        disclaimerModal.classList.remove('show');
    }
    
    // =========================
    // 3. LÓGICA DE LA  WEB APP
    // =========================
    
    function showToast(message, type = 'info', duration = 4000) {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation-circle' : 'info-circle'}"></i> <span>${sanitizeHTML(message)}</span>`;
        toast.className = `toast ${type}`;
        
        toastContainer.appendChild(toast);
        
        toast.offsetHeight;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }
    
    function showPlayer() {
        const playerContainer = document.getElementById('player-container');
        playerContainer.style.display = 'block';
        playerContainer.setAttribute('aria-hidden', 'false');
        document.body.style.paddingBottom = 'var(--player-height)';
    }
    
    function hidePlayer() {
        const playerContainer = document.getElementById('player-container');
        playerContainer.style.display = 'none';
        playerContainer.setAttribute('aria-hidden', 'true');
        document.body.style.paddingBottom = '0';
    }
    
    // ====================================
    // 4. INDICADOR CIRCULAR VERDE MODERNO
    // ====================================
    
    /*** Actualiza el indicador visual de qué radio está sonando actualmente
     * @param {HTMLElement} cardElement Elemento de la tarjeta que está sonando
     * @param {boolean} isPlaying Si la música está realmente sonando
     */
    function updatePlayingIndicator(cardElement = null, isPlaying = true) {
        // Elimina el indicador de todas las tarjetas
        const allCards = document.querySelectorAll('.radio-item');
        allCards.forEach(card => {
            card.classList.remove('playing', 'playing-paused');
            const existingIndicator = card.querySelector('.playing-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }
        });
        
        // Si no hay tarjeta sonando, limpia la referencia
        if (!cardElement) {
            currentlyPlayingCard = null;
            return;
        }
        
        // Agrega el indicador a la tarjeta actual con el estado correcto
        if (isPlaying) {
            cardElement.classList.add('playing');
        } else {
            cardElement.classList.add('playing-paused');
        }
        
        // Crea el indicador circular verde moderno en la parte inferior izquierda
        const playingIndicator = document.createElement('div');
        playingIndicator.className = 'playing-indicator';
        playingIndicator.innerHTML = `
            <div class="pulse-circle ${!isPlaying ? 'paused' : ''}"></div>
            <div class="sound-waves ${!isPlaying ? 'paused' : ''}">
                <div class="wave"></div>
                <div class="wave"></div>
                <div class="wave"></div>
            </div>
        `;
        
        cardElement.appendChild(playingIndicator);
        currentlyPlayingCard = cardElement;
        
        // Agrega efecto de resalte sutil en la tarjeta solo cuando está sonando
        if (isPlaying) {
            cardElement.style.borderColor = 'var(--accent-color)';
            cardElement.style.boxShadow = '0 8px 30px color-mix(in srgb, var(--accent-color) 30%, transparent)';
        } else {
            cardElement.style.borderColor = 'color-mix(in srgb, var(--accent-color) 30%, transparent)';
            cardElement.style.boxShadow = '0 4px 15px color-mix(in srgb, var(--accent-color) 15%, transparent)';
        }
    }
    
    /* Elimina todos los indicadores de reproducción */
    function clearAllPlayingIndicators() {
        const allCards = document.querySelectorAll('.radio-item');
        allCards.forEach(card => {
            card.classList.remove('playing', 'playing-paused');
            card.style.borderColor = '';
            card.style.boxShadow = '';
            const existingIndicator = card.querySelector('.playing-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }
        });
        currentlyPlayingCard = null;
    }
    
    //========
    // TEMAS
    //========

    const themes = ["dark", "light"];
    
    function applyTheme(name) {
        if (!name || name === "dark") {
            document.documentElement.removeAttribute('data-theme');
            themeIcon.className = 'fas fa-moon'; 
        } else if (name === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            themeIcon.className = 'fas fa-sun'; 
        }
        localStorage.setItem('gr_theme', name || 'dark');
    }
    
    const savedTheme = localStorage.getItem('gr_theme') || 'dark';
    applyTheme(savedTheme);
    
    themeToggle.addEventListener('click', () => {
        const cur = localStorage.getItem('gr_theme') || 'dark';
        const idx = themes.indexOf(cur);
        const next = themes[(idx + 1) % themes.length];
        applyTheme(next);
        showToast(`Tema cambiado a ${next === 'dark' ? 'Oscuro' : 'Claro'}`, 'info');
    });
    
    // Fetch helper with timeout
    async function fetchJSON(url, fallback = null) {
        try {
            const controller = new AbortController();
            const id = setTimeout(()=>controller.abort(), 15000);
            const res = await fetch(url, {signal: controller.signal});
            clearTimeout(id);
            if (!res.ok) return fallback;
            return await res.json();
        } catch (err) {
            console.warn("fetch err", err, url);
            return fallback;
        }
    }
    
    // Popula selects (countries y tags)
    async function populateFilters() {
        const countries = await fetchJSON(API_BASE + '/countries', []);
        if (countries && countries.length) {
            const sortedCountries = countries.sort((a, b) => {
                return a.name.localeCompare(b.name, 'es');
            }).slice(0, 300);
            
            sortedCountries.forEach(c => {
                const opt = document.createElement('option');
                opt.value = sanitizeHTML(c.name);
                opt.textContent = `${sanitizeHTML(c.name)} (${c.stationcount})`;
                countrySelect.appendChild(opt);
            });
        }
    
        const tags = await fetchJSON(API_BASE + '/tags', []);
        if (tags && tags.length) {
            const topTags = tags.sort((a,b)=>b.stationcount - a.stationcount).slice(0,120);
            topTags.forEach(t=>{
                const opt=document.createElement('option');
                opt.value = sanitizeHTML(t.name);
                opt.textContent = `${sanitizeHTML(t.name)} (${t.stationcount})`;
                tagSelect.appendChild(opt);
            });
        }
    }
    
    // CORRECCIÓN APLICADA: Ahora comienza con 50 estaciones
    async function fetchTopStations(limit = 50, query = "", country = "", tag = "") {
        try {
            let endpoint = '';
            const params = [];
    
            if (query && query.trim().length > 0) {
                params.push(`name=${encodeURIComponent(query.trim())}`);
            }
            if (country) params.push(`country=${encodeURIComponent(country)}`);
            if (tag) params.push(`tag=${encodeURIComponent(tag)}`);
            
            params.push(`limit=${limit}`);
            params.push('hidebroken=true');
            params.push('order=votes&reverse=true');
    
            if (params.length > 2) {
                endpoint = `${API_BASE}/stations/search?${params.join('&')}`;
            } else {
                endpoint = `${API_BASE}/stations/topclick/${limit}`;
            }
            
            return await fetchJSON(endpoint, []);
        } catch (err) {
            console.error("fetchTopStations err", err);
            return [];
        }
    }
    
    // Render stations
    function renderStations(list) {
        radioListEl.innerHTML = "";
        if (!list || list.length === 0) {
            radioListEl.innerHTML = "<div style='color:var(--muted); text-align:center; padding: 40px;'>No se encontraron estaciones. Intenta cambiar los filtros.</div>";
            return;
        }
        list.forEach(st => {
            const card = document.createElement('div'); 
            card.className = 'radio-item';
            
            // Agrega data attribute para identificación única
            card.setAttribute('data-station-uuid', st.stationuuid);
            
            const safeName = escapeHtml(st.name);
            const safeCountry = escapeHtml(st.country || '');
            const safeTags = (st.tags||'').split(',').slice(0,3).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('');
            const favicon = escapeHtml(st.favicon || '');
            
            const fallbackIconHTML = `<i class="fas fa-compact-disc"></i>`;
            const cardContent = favicon ? `<img src="${favicon}" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 512 512\\'><path fill=\\'${getComputedStyle(document.documentElement).getPropertyValue('--icon-fallback-color').trim().replace('#', '%23')}\\' d=\\'M499.1 6.3c8.1 6 12.9 15.6 12.9 25.7v72c0 22.1-17.9 40-40 40H48c-22.1 0-40-17.9-40-40V32c0-10.1 4.8-19.7 12.9-25.7s18.4-8.4 28.1-5.6L256 100 471.1 12.6c9.7-2.8 19.9-.4 28.1 5.6zM504 312V248c0-22.1-17.9-40-40-40H48c-22.1 0-40 17.9-40 40v64c0 22.1 17.9 40 40 40H464c22.1 0 40-17.9 40-40zm-48 104H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H464c17.7 0 32-14.3 32-32s-14.3-32-32-32z\'/></svg>'">` : fallbackIconHTML;
            
            card.innerHTML = `
                <div class="radio-meta">
                    <div class="radio-cover" style="${favicon?`background-image:url(${favicon})`:'none'};">
                        ${cardContent}
                    </div>
                    <div class="radio-details">
                        <h3>${safeName}</h3>
                        <p>${safeCountry} • ${st.codec || ''} • ${st.bitrate || ''}kbps</p>
                        <div class="station-tags">${safeTags}</div>
                    </div>
                    <button class="fav-btn ${favorites.includes(st.stationuuid) ? 'active' : ''}" title="Favorito" aria-label="Favorito">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            `;
            
            card.addEventListener('click', (e)=>{
                if (e.target.closest('.fav-btn')) return;
                playStation(st, card);
            });
            
            const favBtn = card.querySelector('.fav-btn');
            favBtn.addEventListener('click', (e)=>{
                e.stopPropagation();
                toggleFavorite(st);
                favBtn.classList.toggle('active');
                updateFavoritesSection();
            });
            
            radioListEl.appendChild(card);
        });
    }
    
    // Inicializar visualizador de barras vertical
    function initVisualizer() {
        if (visualizerInterval) {
            clearInterval(visualizerInterval);
            visualizerInterval = null;
        }
    
        visualizer.innerHTML = '';
        visualizerBars = [];
        
        for (let i = 0; i < 16; i++) {
            const bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.height = '5px';
            visualizer.appendChild(bar);
            visualizerBars.push(bar);
        }
        
        visualizerInterval = setInterval(() => {
            if (audio && !audio.paused && isPlaying && !audio.muted) {
                visualizerBars.forEach(bar => {
                    const height = Math.random() * 100;
                    bar.style.height = `${5 + height * 0.35}px`;
                    bar.style.opacity = 0.7 + Math.random() * 0.3;
                });
            } else {
                visualizerBars.forEach(bar => {
                    bar.style.height = '5px';
                    bar.style.opacity = 0.3;
                });
            }
        }, 150);
    }
    
    function stopVisualizer() {
        if (visualizerInterval) {
            clearInterval(visualizerInterval);
            visualizerInterval = null;
        }
        visualizerBars.forEach(bar => {
            bar.style.height = '5px';
            bar.style.opacity = '0.3';
        });
    }
    
    // Función playStation mejorada con indicador visual
    function playStation(st, cardElement = null) {
        const src = st.url_resolved || st.url || st.url_direct;
        
        if (!src) { 
            showToast('Esta estación no tiene URL de transmisión disponible.', 'error');
            securityIndicator.className = 'security-check unsafe';
            securityIndicator.innerHTML = '<i class="fas fa-times-circle"></i> URL Ausente';
            return; 
        }
        
        currentStation = st;
        
        stopVisualizer();
        
        // Actualiza el indicador visual antes de intentar reproducir (estado "cargando")
        updatePlayingIndicator(cardElement, false);
    
        const securityStatus = checkAudioURLSecurity(src);
        
        if (securityStatus === 'unsafe') {
            showToast('Radio Bloqueada: Enlace malicioso detectado. Busque otra estación.', 'error', 8000);
            securityIndicator.className = 'security-check unsafe';
            securityIndicator.innerHTML = `<i class="fas fa-times-circle"></i> ¡ENLACE PELIGROSO!`;
            audio.pause();
            audio.src = '';
            playerState.textContent = 'Bloqueado';
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            isPlaying = false;
            clearAllPlayingIndicators();
            return;
        }
    
        securityIndicator.className = 'security-check';
        securityIndicator.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Verificando URL...';
    
        audio.src = src;
        showPlayer();
        
        audio.play().then(() => {
            playerTitle.textContent = escapeHtml(st.name);
            playerSub.textContent = `${escapeHtml(st.country || '—')} • ${escapeHtml(st.language || '—')}`;
            playerState.textContent = 'Reproduciendo';
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            isPlaying = true;
            
            if (st.favicon) {
                playerCover.src = st.favicon;
                playerCover.style.display = 'block';
                playerCoverFallback.style.display = 'none';
            } else {
                playerCover.src = '';
                playerCover.style.display = 'none';
                playerCoverFallback.style.display = 'flex';
            }
    
            if (securityStatus === 'safe') {
                securityIndicator.className = 'security-check safe';
                securityIndicator.innerHTML = `<i class="fas fa-check-circle"></i> Enlace Seguro`;
            } else {
                securityIndicator.className = 'security-check partial';
                securityIndicator.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Enlace no Verificado (Reproduciendo)`;
            }
    
            showToast(`Reproduciendo: ${st.name}`, 'success');
            
            // ACTUALIZA: Ahora el indicador muestra que está realmente reproduciendo
            updatePlayingIndicator(cardElement, true);
            
            if (visualizerBars.length === 0 || !visualizerInterval) {
                initVisualizer();
            }
            
        }).catch(err => {
            console.warn("Play error", err);
            playerState.textContent = 'Error';
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            isPlaying = false;
            
            stopVisualizer();
            clearAllPlayingIndicators();
    
            securityIndicator.className = 'security-check unsafe';
            securityIndicator.innerHTML = `<i class="fas fa-times-circle"></i> Error en la Transmisión`;
    
            let errorMsg = "Error al reproducir (Codec/Red).";
            if (err.name === "NotAllowedError") {
                errorMsg = "Permiso denegado (autoplay). Haga clic en reproducir nuevamente.";
            }
            
            showToast(errorMsg, 'error');
        });
    }
    
    // Play/pause
    playBtn.addEventListener('click', ()=>{
        if (!audio.src) { 
            if (stations.length) {
                playStation(stations[0]); 
            } else {
                showToast('No hay estaciones disponibles para reproducir.', 'warning');
            }
            return; 
        }
        
        if (audio.paused) {
            audio.play().then(() => {
                playerState.textContent = 'Reproduciendo';
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                isPlaying = true;
                
                const status = checkAudioURLSecurity(audio.src);
                if (status === 'safe') {
                    securityIndicator.className = 'security-check safe';
                    securityIndicator.innerHTML = `<i class="fas fa-check-circle"></i> Enlace Seguro`;
                } else if (status === 'partial') {
                    securityIndicator.className = 'security-check partial';
                    securityIndicator.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Enlace no Verificado (Reproduciendo)`;
                }
                
                // ACTUALIZA: Reactiva el indicador cuando la música vuelve a sonar
                if (currentStation && currentlyPlayingCard) {
                    updatePlayingIndicator(currentlyPlayingCard, true);
                }
                
                if (visualizerBars.length === 0 || !visualizerInterval) {
                    initVisualizer();
                }
                
            }).catch(err => {
                console.warn("Play error", err);
                showToast("Error al reanudar la reproducción.", 'error');
                stopVisualizer();
            });
        } else {
            audio.pause();
            playerState.textContent = audio.muted ? 'Silenciado' : 'Pausado';
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            isPlaying = false;
            stopVisualizer();
            
            // ACTUALIZA: Cambia el indicador a estado pausado
            if (currentlyPlayingCard) {
                updatePlayingIndicator(currentlyPlayingCard, false);
            }
        }
    });
    
    // NUEVO: Función toggleMute actualizada para controlar el indicador
    function toggleMute() {
        if (!audio.src) {
            showToast('No hay estaciones sonando para silenciar.', 'warning');
            return;
        }
        
        audio.muted = !audio.muted;
        
        if (audio.muted) {
            muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            muteBtn.title = 'Reactivar sonido';
            playerState.textContent = 'Silenciado';
            showToast('Audio silenciado', 'info');
            
            // ACTUALIZA: Para el indicador cuando mudo
            if (currentlyPlayingCard && !audio.paused) {
                updatePlayingIndicator(currentlyPlayingCard, false);
            }
        } else {
            muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            muteBtn.title = 'Silenciar';
            playerState.textContent = audio.paused ? 'Pausado' : 'Reproduciendo';
            showToast('Audio reactivado', 'info');
            
            // ACTUALIZA: Reactiva el indicador cuando quita el mudo (si no está pausado)
            if (currentlyPlayingCard && !audio.paused) {
                updatePlayingIndicator(currentlyPlayingCard, true);
            }
        }
    }
    muteBtn.addEventListener('click', toggleMute);
    
    audio.addEventListener('error', (e)=>{ 
        playerState.textContent='Error'; 
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        isPlaying = false;
        securityIndicator.className = 'security-check unsafe';
        securityIndicator.innerHTML = `<i class="fas fa-times-circle"></i> Error en la Transmisión`;
        showToast(`Error de audio: La transmisión falló.`, 'error');
        stopVisualizer();
        clearAllPlayingIndicators();
    });
    
    // Favorites
    function toggleFavorite(st) {
        const id = st.stationuuid;
        if (!favorites.includes(id)) {
            favorites.push(id);
            showToast('Agregado a favoritos', 'success');
        } else {
            favorites = favorites.filter(x => x !== id);
            showToast('Eliminado de favoritos', 'info');
        }
        localStorage.setItem('gr_favs', JSON.stringify(favorites));
    }
    
    function hideConfirmationModal() {
      confirmationModal.classList.remove('show');
      pendingDeleteStationId = null;
    }
    
    function showConfirmationModal(stationId) {
      pendingDeleteStationId = stationId;
      confirmationModal.classList.add('show');
      
      setTimeout(() => {
        cancelBtn.focus();
      }, 100);
    }
    
    cancelBtn.addEventListener('click', hideConfirmationModal);
    
    deleteBtn.addEventListener('click', () => {
      if (pendingDeleteStationId) {
        removeFavorite(pendingDeleteStationId);
        hideConfirmationModal();
      }
    });
    
    function removeFavorite(stationId) {
      favorites = favorites.filter(x => x !== stationId);
      localStorage.setItem('gr_favs', JSON.stringify(favorites));
      updateFavoritesSection();
      showToast('Radio eliminada de favoritos', 'info');
      updateFavoriteButtonsInMainList();
    }
    
    async function updateFavoritesSection() {
        favoritesListEl.innerHTML = '';
        if (favorites.length === 0) {
            favoritesListEl.innerHTML = '<div style="color:var(--muted); text-align:center; padding: 20px;">Aún no hay estaciones favoritas.</div>';
            return;
        }
        
        for (const id of favorites) {
            try {
                const stationsData = await fetchJSON(`${API_BASE}/stations/byuuid?uuids=${id}`, []);
                
                if (!stationsData || stationsData.length === 0) {
                    continue;
                }
                
                const st = stationsData[0];
                
                const btn = document.createElement('div');
                btn.className = 'radio-item';
                btn.style.padding = '12px';
                btn.setAttribute('data-station-uuid', st.stationuuid);
                
                const safeName = escapeHtml(st.name);
                const favicon = escapeHtml(st.favicon || '');
                
                const fallbackIconHTML = `<i class="fas fa-compact-disc"></i>`;
                const cardContent = favicon ? `<img src="${favicon}" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 512 512\\'><path fill=\\'${getComputedStyle(document.documentElement).getPropertyValue('--icon-fallback-color').trim().replace('#', '%23')}\\' d=\\'M499.1 6.3c8.1 6 12.9 15.6 12.9 25.7v72c0 22.1-17.9 40-40 40H48c-22.1 0-40-17.9-40-40V32c0-10.1 4.8-19.7 12.9-25.7s18.4-8.4 28.1-5.6L256 100 471.1 12.6c9.7-2.8 19.9-.4 28.1 5.6zM504 312V248c0-22.1-17.9-40-40-40H48c-22.1 0-40 17.9-40 40v64c0 22.1 17.9 40 40 40H464c22.1 0 40-17.9 40-40zm-48 104H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H464c17.7 0 32-14.3 32-32s-14.3-32-32-32z\'/></svg>'">` : fallbackIconHTML;
                const style = favicon ? `background-image:url(${favicon})` : 'none';
                
                btn.innerHTML = `
                    <div class="radio-meta">
                        <div class="radio-cover" style="${style};">
                            ${cardContent}
                        </div>
                        <div class="radio-details">
                            <h3>${safeName}</h3>
                            <p>${escapeHtml(st.country || '')} • ${st.codec || ''} • ${st.bitrate || ''}kbps</p>
                            <div class="station-tags"></div> </div>
                        <div class="favorite-actions" style="display: flex; gap: 8px; align-items: center;">
                            <button class="small-btn play-fav" title="Reproducir">
                                <i class="fas fa-play"></i>
                            </button>
                            <button class="small-btn delete-fav" title="Eliminar de favoritos" style="color: var(--error);">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>`;
                
                btn.querySelector('.play-fav').addEventListener('click', (e) => {
                    e.stopPropagation();
                    playStation(st, btn);
                });
                
                btn.querySelector('.delete-fav').addEventListener('click', (e) => {
                    e.stopPropagation();
                    showConfirmationModal(st.stationuuid);
                });
                
                btn.addEventListener('click', (e) => {
                    if (e.target.closest('.small-btn')) return;
                    playStation(st, btn);
                });
                
                favoritesListEl.appendChild(btn);
            } catch (err) {
                console.warn('Error al cargar favorito:', err);
            }
        }
    }
    
    function updateFavoriteButtonsInMainList() {
        const favButtons = document.querySelectorAll('.fav-btn');
        favButtons.forEach(btn => {
            const stationItem = btn.closest('.radio-item');
            if (stationItem) {
                const stationNameElement = stationItem.querySelector('.radio-details h3');
                if (stationNameElement) {
                    const stationName = stationNameElement.textContent;
                    const station = stations.find(s => s.name === stationName);
                    if (station) {
                        btn.classList.toggle('active', favorites.includes(station.stationuuid));
                    }
                }
            }
        });
    }
    
    // Comienza con 50 estaciones y fallback explícito
    async function loadStations() {
        const q = searchInput.value.trim();
        const limit = parseInt(limitSelect.value, 10) || 50; // Fallback explícito para 50
        const country = countrySelect.value || '';
        const tag = tagSelect.value || '';
        
        radioListEl.innerHTML = '<div style="color:var(--muted); text-align:center; padding: 40px;"><div class="loading"></div> Cargando estaciones…</div>';
        
        try {
            const list = await fetchTopStations(limit, q, country, tag);
            stations = list || [];
            renderStations(stations);
            
            if (stations.length > 0) {
                showToast(`${stations.length} estaciones cargadas`, 'success');
            } else {
                showToast('No se encontraron estaciones con los filtros actuales', 'warning');
            }
        } catch (error) {
            showToast('Error al cargar estaciones. Verifique su conexión.', 'error');
        }
    }
    
    // Init
    async function init() {
        hidePlayer();
        
        btnRefresh.addEventListener('click', loadStations);
        
        // Implementación de búsqueda en tiempo real con debounce
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                loadStations();
            }, 500);
        });
        
        countrySelect.addEventListener('change', loadStations);
        tagSelect.addEventListener('change', loadStations);
        limitSelect.addEventListener('change', loadStations);
        
        initVisualizer(); 
        stopVisualizer();
    
        securityIndicator.className = 'security-check';
        securityIndicator.innerHTML = '<i class="fas fa-shield-alt"></i> Verificación Pendiente...';
    
        await populateFilters();
        await updateFavoritesSection();
        await loadStations();
    }
    
    // startup
    init();   


