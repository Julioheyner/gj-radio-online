DOCUMENTACION.md

```markdown
# 📚 Documentación Técnica - GJ Radio Online

## 📖 Índice

1. [Arquitectura del Sistema](#-arquitectura-del-sistema)
2. [Estructura de Archivos](#-estructura-de-archivos)
3. [API Reference](#-api-reference)
4. [Configuración](#-configuración)
5. [Manejo de Estados](#-manejo-de-estados)
6. [Sistema de Seguridad](#-sistema-de-seguridad)
7. [Optimizaciones](#-optimizaciones)
8. [Troubleshooting](#-troubleshooting)

## 🏗️ Arquitectura del Sistema

### Diagrama de Componentes
```

┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│Interfaz      │    │   Controlador    │    │     Modelo      │
│de Usuario    │◄──►│   Principal      │◄──►│    de Datos     │
││    │                  │    │                 │
│- HTML/CSS/JS   │    │ - Gestión Estado │    │ - LocalStorage  │
│- Componentes   │    │ - Eventos        │    │ - API Externa   │
│- Responsive    │    │ - Lógica App     │    │ - Cache         │
└─────────────────┘└──────────────────┘    └─────────────────┘
│                       │                       │
└───────────────────────┼───────────────────────┘
│
┌───────▼───────┐
│   API Radio   │
│   Browser     │
└───────────────┘

```

### Flujo de Datos
1. **Inicialización**: Carga de configuración y favoritos
2. **Búsqueda**: Petición a API con filtros aplicados
3. **Renderizado**: Creación dinámica de elementos DOM
4. **Reproducción**: Gestión de streams de audio
5. **Persistencia**: Guardado automático en localStorage

## 📁 Estructura de Archivos

### index.html
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <!-- Metadatos SEO -->
    <!-- Preload de recursos -->
    <!-- Estilos CSS -->
</head>
<body>
    <header>/* Navegación y tema */</header>
    <main>
        <section id="hero-section">/* Hero image */</section>
        <section class="controls">/* Filtros y búsqueda */</section>
        <section class="favorites-section">/* Lista favoritos */</section>
        <section class="radio-section">/* Lista general */</section>
    </main>
    <div id="player-container">/* Reproductor flotante */</div>
    <footer>/* Información legal y enlaces */</footer>
</body>
</html>
```

CSS Architecture

```css
:root {
    /* Sistema de Design Tokens */
    --bg-color: #1a1a1a;
    --card-color: #2d2d2d;
    --accent-color: #3B82F6;
    /* ... más variables */
}

/* Componentes modulares */
.radio-item { /* Tarjeta de estación */ }
.player-wrapper { /* Contenedor reproductor */ }
.controls { /* Panel de filtros */ }
```

🔌 API Reference

Endpoints Utilizados

GET /stations/topclick/{limit}

```javascript
// Obtiene las estaciones más populares
const response = await fetch(`${API_BASE}/stations/topclick/50`);
```

GET /stations/search

```javascript
// Búsqueda con filtros
const params = new URLSearchParams({
    name: query,
    country: country,
    tag: genre,
    limit: limit,
    hidebroken: true,
    order: 'votes',
    reverse: true
});
```

GET /countries

```javascript
// Lista de países disponibles
const countries = await fetch(`${API_BASE}/countries`);
```

GET /tags

```javascript
// Lista de géneros/tags
const tags = await fetch(`${API_BASE}/tags`);
```

Modelo de Datos de Estación

```javascript
{
    stationuuid: "string",      // ID único
    name: "string",            // Nombre estación
    url: "string",             // URL del stream
    url_resolved: "string",    // URL resuelta
    homepage: "string",        // Sitio web
    favicon: "string",         // URL del icono
    tags: "string",           // Etiquetas separadas por coma
    country: "string",        // País
    countrycode: "string",    // Código país
    state: "string",          // Estado/región
    language: "string",       // Idioma
    votes: number,           // Votos
    codec: "string",         // Codec de audio
    bitrate: number,         // Bitrate en kbps
    lastcheckok: number      // Última verificación exitosa
}
```

⚙️ Configuración

Variables de Entorno (Configuración)

```javascript
const CONFIG = {
    API_BASE: "https://de1.api.radio-browser.info/json",
    DEFAULT_LIMIT: 50,
    REQUEST_TIMEOUT: 15000,
    THEMES: ["dark", "light"]
};
```

Sistema de Temas

```javascript
function applyTheme(name) {
    if (name === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('gr_theme', name);
}
```

Configuración de Seguridad

```javascript
const SECURITY_CONFIG = {
    ALLOWED_AUDIO_DOMAINS: [
        'radio-browser.info',
        'stream.radio-browser.info',
        // ... más dominios permitidos
    ],
    ALLOWED_PROTOCOLS: ['http:', 'https:'],
    SUSPICIOUS_PATTERNS: [
        /javascript:/i,
        /data:text\/html/i,
        // ... más patrones maliciosos
    ]
};
```

🔄 Manejo de Estados

Estado de la Aplicación

```javascript
let appState = {
    stations: [],           // Lista de estaciones cargadas
    currentStation: null,   // Estación actual reproduciendo
    favorites: [],         // IDs de estaciones favoritas
    isPlaying: false,      // Estado de reproducción
    currentTheme: 'dark',  // Tema activo
    filters: {            // Filtros aplicados
        search: '',
        country: '',
        tag: '',
        limit: 50
    }
};
```

Persistencia Local

```javascript
// Guardar favoritos
localStorage.setItem('gr_favs', JSON.stringify(favorites));

// Cargar favoritos
const favorites = JSON.parse(localStorage.getItem('gr_favs') || "[]");

// Guardar tema
localStorage.setItem('gr_theme', theme);
```

Gestión de Eventos

```javascript
// Eventos del reproductor
audio.addEventListener('play', handlePlay);
audio.addEventListener('pause', handlePause);
audio.addEventListener('error', handleAudioError);

// Eventos de interfaz
searchInput.addEventListener('input', debounce(handleSearch, 300));
themeToggle.addEventListener('click', toggleTheme);
```

🛡️ Sistema de Seguridad

Sanitización de HTML

```javascript
function sanitizeHTML(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

Validación de URLs

```javascript
function checkAudioURLSecurity(url) {
    try {
        const urlObj = new URL(url);
        
        // Verificar protocolo
        if (!SECURITY_CONFIG.ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
            return 'unsafe';
        }
        
        // Verificar patrones maliciosos
        for (const pattern of SECURITY_CONFIG.SUSPICIOUS_PATTERNS) {
            if (pattern.test(url)) return 'unsafe';
        }
        
        // Verificar dominio
        const domain = urlObj.hostname.toLowerCase();
        for (const allowed of SECURITY_CONFIG.ALLOWED_AUDIO_DOMAINS) {
            if (domain.includes(allowed)) return 'safe';
        }
        
        return 'partial';
    } catch (error) {
        return 'unsafe';
    }
}
```

Protección XSS

· Escapado de HTML: Uso de textContent en lugar de innerHTML
· Validación de datos: Sanitización de entradas de usuario
· Content Security Policy: Restricción de recursos externos

⚡ Optimizaciones

Rendimiento

```javascript
// Debounce para búsquedas
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Lazy loading de imágenes
const images = document.querySelectorAll('img[data-src]');
const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
        }
    });
});
```

Cache y Offline

```javascript
// Cache de respuestas API
const cache = new Map();

async function fetchWithCache(url) {
    if (cache.has(url)) {
        return cache.get(url);
    }
    
    const response = await fetch(url);
    const data = await response.json();
    cache.set(url, data);
    
    return data;
}
```

Accesibilidad

```html
<!-- ARIA labels -->
<button aria-label="Reproducir/Pausar">
<button aria-label="Estación favorita">

<!-- Navegación por teclado -->
<div tabindex="0" role="button">

<!-- Contraste adecuado -->
/* Cumple WCAG AA */
```

🐛 Troubleshooting

Problemas Comunes y Soluciones

1. Error de Reproducción de Audio

Síntoma: El reproductor muestra "Error en la Transmisión"

```javascript
// Causas posibles:
// - Codec no compatible
// - URL de stream inválida
// - Restricciones CORS
// - Problemas de red

// Solución:
audio.addEventListener('error', (e) => {
    console.error('Audio error:', e);
    showToast('Error de transmisión. Intenta otra estación.', 'error');
});
```

2. Favoritos No Se Guardan

Síntoma: Los favoritos desaparecen al recargar

```javascript
// Verificar:
// - localStorage disponible
// - Cuotas de almacenamiento
// - Datos corruptos

function verifyStorage() {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
    } catch (e) {
        console.error('Storage unavailable:', e);
        return false;
    }
}
```

3. Problemas de Rendimiento

Síntoma: La aplicación se vuelve lenta con muchas estaciones

```javascript
// Soluciones:
// - Virtual scrolling para listas largas
// - Limitar número de estaciones
// - Optimizar re-renderizados

function renderStationsOptimized(list) {
    // Usar documentFragment para actualizaciones batch
    const fragment = document.createDocumentFragment();
    list.forEach(station => {
        const element = createStationElement(station);
        fragment.appendChild(element);
    });
    radioListEl.innerHTML = '';
    radioListEl.appendChild(fragment);
}
```

4. Problemas de CORS

Síntoma: No se cargan las estaciones

```javascript
// Configuración:
// - Usar proxy si es necesario
// - Verificar headers de respuesta
// - Usar mode: 'cors' en fetch

async function fetchJSON(url) {
    try {
        const response = await fetch(url, {
            mode: 'cors',
            credentials: 'omit'
        });
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}
```

Debugging

Console Commands Útiles

```javascript
// Debug del estado actual
console.log('Stations:', stations);
console.log('Favorites:', favorites);
console.log('Current Station:', currentStation);

// Verificar configuración
console.log('Theme:', localStorage.getItem('gr_theme'));
console.log('Security Config:', SECURITY_CONFIG);

// Monitorear eventos de audio
audio.addEventListener('loadstart', () => console.log('Audio loading...'));
audio.addEventListener('canplay', () => console.log('Audio ready to play'));
```

Herramientas de Desarrollo

· Network Tab: Verificar requests a API
· Application Tab: Inspeccionar localStorage
· Console: Logs de errores y warnings
· Performance Tab: Analizar rendimiento

🔮 Roadmap

Próximas Características

· Sistema de Playlists - Crear listas de reproducción personalizadas
· Búsqueda por Voz - Comandos de voz para controlar la aplicación
· Modo Offline - Cache de estaciones favoritas
· Estadísticas - Seguimiento de hábitos de escucha
· API Propia - Backend para funcionalidades avanzadas
· Aplicación PWA - Instalación como app nativa

Mejoras Técnicas

· TypeScript - Tipado estático para mejor desarrollo
· Tests Unitarios - Suite de pruebas automatizadas
· Bundle Optimization - Mejor empaquetado de recursos
· Service Worker - Cache avanzado y funcionalidades offline

---

📞 Soporte

Si necesitas ayuda o tienes preguntas:

1. Consulta la documentación primero
2. Revisa los issues en GitHub
3. Abre un nuevo issue si no encuentras solución
4. Contacta al desarrollador para consultas específicas

¡Happy Coding! 🎵

```
