// Configurações (substitua com seus IDs reais)
const ANALYTICS_CONFIG = {
    GA_MEASUREMENT_ID: 'GA_MEASUREMENT_ID',
    FB_PIXEL_ID: 'FB_PIXEL_ID'
};

// Inicializar Google Analytics
function initGoogleAnalytics() {
    // Carregar script do Google Analytics
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.GA_MEASUREMENT_ID}`;
    document.head.appendChild(gaScript);

    // Configurar dataLayer
    window.dataLayer = window.dataLayer || [];
    function gtag() {
        dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', ANALYTICS_CONFIG.GA_MEASUREMENT_ID);
    
    console.log('Google Analytics inicializado');
}

// Inicializar Meta Pixel
function initMetaPixel() {
    !function(f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function() {
            n.callMethod ?
                n.callMethod.apply(n, arguments) : n.queue.push(arguments)
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    
    fbq('init', ANALYTICS_CONFIG.FB_PIXEL_ID);
    fbq('track', 'PageView');
    
    console.log('Meta Pixel inicializado');
}

// Inicializar todos os analytics quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Google Analytics
    initGoogleAnalytics();
    
    // Inicializar Meta Pixel
    initMetaPixel();
});

// Funções adicionais para tracking de eventos
const Analytics = {
    // Track custom events for Google Analytics
    trackEvent: function(category, action, label, value) {
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                'event_category': category,
                'event_label': label,
                'value': value
            });
        }
    },
    
    // Track custom events for Facebook Pixel
    trackFbEvent: function(eventName, parameters) {
        if (typeof fbq !== 'undefined') {
            fbq('track', eventName, parameters);
        }
    },
    
    // Track station play events
    trackStationPlay: function(stationName, stationId) {
        this.trackEvent('Station', 'Play', stationName);
        this.trackFbEvent('StationPlay', {
            station_name: stationName,
            station_id: stationId
        });
    },
    
    // Track favorite events
    trackFavorite: function(stationName, action) {
        this.trackEvent('Favorites', action, stationName);
        this.trackFbEvent('Favorite' + action, {
            station_name: stationName
        });
    }
};

// Exportar para uso global (se necessário)
window.Analytics = Analytics;