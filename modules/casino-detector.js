/**
 * 🎰 DETECTOR DE CASINOS
 * Este módulo centraliza la lógica de detección de sitios web de casinos y apuestas
 */

/**
 * 🔍 Verificar si la página actual es un sitio de casino
 * @param {Array} casinoDomains - Array de dominios de casino (opcional, usa CASINO_DOMAINS por defecto)
 * @returns {Boolean} true si es un sitio de casino
 */
function isCasinoPage(casinoDomains = CASINO_DOMAINS) {
    const currentHostname = window.location.hostname.toLowerCase();
    const currentUrl = window.location.href.toLowerCase();
    
    // Verificar por dominio exacto o subdominio en dominios de casino predefinidos
    const isDomainMatch = casinoDomains.some(domain => {
        const cleanDomain = domain.replace(/^https?:\/\//, '').toLowerCase();
        
        // Verificación exacta
        if (currentHostname === cleanDomain) return true;
        
        // Verificación de subdominio (.domain.com)
        if (currentHostname.endsWith('.' + cleanDomain)) return true;
        
        // Verificación de contención (para casos como m.apuestas.codere.es contiene codere.es)
        if (currentHostname.includes(cleanDomain)) return true;
        
        // Verificación de dominio base (extraer dominio principal)
        const baseDomain = cleanDomain.split('.').slice(-2).join('.');
        const currentBaseDomain = currentHostname.split('.').slice(-2).join('.');
        if (currentBaseDomain === baseDomain) return true;
        
        return false;
    });
    
    if (isDomainMatch) {
        console.log('🎰 Sitio de casino detectado por dominio:', currentHostname);
        return true;
    }
    
    // Verificar dominios personalizados del usuario (función asíncrona encapsulada)
    let isCustomDomain = false;
    if (typeof getCustomDomains === 'function') {
        getCustomDomains((customDomains) => {
            isCustomDomain = customDomains.some(domain => {
                return currentHostname === domain || 
                       currentHostname.endsWith('.' + domain) ||
                       currentHostname.includes(domain);
            });
            
            if (isCustomDomain) {
                console.log('🎮 Sitio personalizado detectado:', currentHostname);
                // Activar Breathy inmediatamente
                window.dispatchEvent(new CustomEvent('breathyActivateCustomDomain', {
                    detail: { hostname: currentHostname }
                }));
            }
        });
    }
    
    // Verificar por palabras clave en el dominio/URL para detectar nuevos casinos
    const casinoKeywords = [
        'casino', 'bet', 'poker', 'slots', 'gambling', 'apuesta', 'juego',
        'ruleta', 'blackjack', 'bingo', 'loteria', 'sport', 'wager'
    ];
    
    const isKeywordMatch = casinoKeywords.some(keyword => 
        currentHostname.includes(keyword) || currentUrl.includes(keyword)
    );
    
    if (isKeywordMatch) {
        console.log('🎯 Posible sitio de casino detectado por palabra clave:', currentHostname);
        // Solo activar para dominios que parezcan confiables (no aplicar a sitios como "sportscenter" de noticias)
        return isLikelyGamblingRealSite(currentHostname, currentUrl);
    }
    
    return false;
}

/**
 * 🔎 Verificar si un sitio con palabras clave es realmente de apuestas
 * @param {String} hostname - Nombre del host
 * @param {String} url - URL completa
 * @returns {Boolean} true si parece un sitio de apuestas real
 */
function isLikelyGamblingRealSite(hostname, url) {
    // Excluir buscadores y sitios que claramente no son de apuestas
    const excludeKeywords = [
        // Buscadores principales
        'google.com', 'google.es', 'bing.com', 'yahoo.com', 'yahoo.es',
        'duckduckgo.com', 'yandex.com', 'baidu.com', 'ask.com',
        // Sitios de noticias y medios
        'news', 'noticias', 'periodico', 'diario', 'sport.es', 'deportes', 
        'information', 'wiki', 'blog', 'forum', 'reddit', 'youtube', 
        'twitter', 'facebook', 'instagram', 'google', 'yahoo', 'bing',
        // Medios deportivos informativos (no de apuestas)
        'espn.com', 'marca.com', 'mundodeportivo.com', 'cope.es',
        'cadenaser.com', 'antena3.com', 'telecinco.es',
        // Otros sitios comunes
        'amazon', 'ebay', 'aliexpress'
    ];
    
    const isExcluded = excludeKeywords.some(keyword => 
        hostname.includes(keyword) || url.includes(keyword)
    );
    
    if (isExcluded) {
        console.log('🚫 Sitio excluido de detección:', hostname);
        return false;
    }
    
    // Indicadores adicionales de sitios de apuestas reales
    const gamblingIndicators = [
        '.bet', '.casino', 'register', 'login', 'deposit', 'withdrawal',
        'jackpot', 'bonus', 'promocion', 'apuesta', 'dinero'
    ];
    
    const hasGamblingIndicators = gamblingIndicators.some(indicator => 
        hostname.includes(indicator) || url.includes(indicator)
    );
    
    return hasGamblingIndicators;
}

/**
 * 📊 Obtener información detallada sobre el sitio detectado
 * @returns {Object} Información del sitio actual
 */
function getSiteInfo() {
    const hostname = window.location.hostname;
    const isCasino = isCasinoPage();
    
    return {
        hostname: hostname,
        url: window.location.href,
        isCasinoSite: isCasino,
        detectionMethod: getDetectionMethod(hostname),
        timestamp: new Date().toISOString()
    };
}

/**
 * 🔍 Obtener el método de detección usado
 * @param {String} hostname - Nombre del host  
 * @returns {String} Método de detección usado
 */
function getDetectionMethod(hostname) {
    const cleanHostname = hostname.toLowerCase();
    
    // Verificar si está en la lista de dominios conocidos
    const isDomainMatch = CASINO_DOMAINS.some(domain => {
        const cleanDomain = domain.replace(/^https?:\/\//, '').toLowerCase();
        return cleanHostname === cleanDomain || 
               cleanHostname.endsWith('.' + cleanDomain) ||
               cleanHostname.includes(cleanDomain);
    });
    
    if (isDomainMatch) {
        return 'known_domain';
    }
    
    // Verificar por palabras clave
    const casinoKeywords = [
        'casino', 'bet', 'poker', 'slots', 'gambling', 'apuesta', 'juego'
    ];
    
    const hasKeywords = casinoKeywords.some(keyword => cleanHostname.includes(keyword));
    
    if (hasKeywords) {
        return 'keyword_detection';
    }
    
    return 'not_detected';
}

/**
 * 📝 Registrar detección de casino para debugging
 * @param {Boolean} force - Forzar registro aunque no sea casino
 */
function logCasinoDetection(force = false) {
    const siteInfo = getSiteInfo();
    
    if (siteInfo.isCasinoSite || force) {
        console.log('🎰 Detección de casino:', siteInfo);
    }
}

/**
 * 🆕 Añadir dominio a la lista de casinos (para extensión dinámica)
 * @param {String} domain - Dominio a añadir
 */
function addCasinoDomain(domain) {
    if (domain && !CASINO_DOMAINS.includes(domain)) {
        CASINO_DOMAINS.push(domain);
        console.log('🎰 Nuevo dominio de casino añadido:', domain);
        
        // Aquí podrías guardar en storage para persistencia
        // saveSettings({ customCasinoDomains: CASINO_DOMAINS });
    }
}

/**
 * 🚀 Inicializar detector de casinos
 */
function initializeCasinoDetector() {
    console.log('🔧 Detector de casinos inicializado');
    
    // Log de detección inicial
    logCasinoDetection();
    
    // Verificar dominios personalizados
    checkCustomDomains();
    
    // Escuchar cambios de URL para SPAs
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            console.log('🔄 URL cambió, re-evaluando detección de casino');
            logCasinoDetection();
            checkCustomDomains(); // También verificar dominios personalizados en cambios de URL
        }
    }).observe(document, { subtree: true, childList: true });
}

// Alias para compatibilidad con el content script refactorizado
function isGamblingWebsite() {
    return isCasinoPage();
}

/**
 * 🎮 Verificar si el sitio actual está en la lista de dominios personalizados
 */
function checkCustomDomains() {
    if (typeof getCustomDomains === 'function') {
        getCustomDomains((customDomains) => {
            const currentHostname = window.location.hostname.toLowerCase();
            
            const isCustomDomain = customDomains.some(domain => {
                return currentHostname === domain || 
                       currentHostname.endsWith('.' + domain) ||
                       currentHostname.includes(domain);
            });
            
            if (isCustomDomain) {
                console.log('🎮 Sitio personalizado detectado:', currentHostname);
                // Disparar evento para activar Breathy
                window.dispatchEvent(new CustomEvent('breathyActivateCustomDomain', {
                    detail: { hostname: currentHostname, isCustomDomain: true }
                }));
            }
        });
    }
}

/**
 * 🎮 Verificar si el dominio actual es personalizado (función síncrona con callback)
 * @param {Function} callback - Función que recibe el resultado (boolean)
 */
function isCustomDomain(callback) {
    const currentHostname = window.location.hostname.toLowerCase();
    
    if (typeof getCustomDomains === 'function') {
        getCustomDomains((customDomains) => {
            const isCustom = customDomains.some(domain => {
                return currentHostname === domain || 
                       currentHostname.endsWith('.' + domain) ||
                       currentHostname.includes(domain);
            });
            
            if (callback && typeof callback === 'function') {
                callback(isCustom);
            }
        });
    } else {
        if (callback && typeof callback === 'function') {
            callback(false);
        }
    }
}

/**
 * 🎮 Verificar si la ventana actual es una ventana de juego (subdominio de casino)
 * @param {String} hostname - Hostname opcional (usa window.location.hostname por defecto)
 * @param {String} url - URL opcional (usa window.location.href por defecto)
 * @returns {Boolean} true si es una ventana de juego
 */
function isGameWindow(hostname = null, url = null) {
    const currentHostname = (hostname || window.location.hostname).toLowerCase();
    const currentUrl = (url || window.location.href).toLowerCase();
    
    // EXCLUIR sitios de búsqueda y otros no-gambling antes de cualquier detección
    const excludedSites = [
        'google.com', 'google.es', 'google.co', 'www.google',
        'bing.com', 'yahoo.com', 'yahoo.es',
        'duckduckgo.com', 'yandex.com', 'baidu.com', 'ask.com',
        'wikipedia.org', 'reddit.com', 'youtube.com', 
        'facebook.com', 'twitter.com', 'instagram.com',
        'news', 'noticias', 'blog', 'forum',
        'espn.com', 'marca.com', 'amazon.com', 'ebay.com'
    ];
    
    const isExcludedSite = excludedSites.some(excludedSite => 
        currentHostname.includes(excludedSite)
    );
    
    if (isExcludedSite) {
        console.log('🚫 Sitio excluido de detección de ventana de juego:', currentHostname);
        return false;
    }
    
    // Patrones universales de ventanas de juego
    const gameWindowPatterns = [
        // Patrones de hostname
        'cachedownload',  // Sportium específico
        'casino',        // Universal
        'games',         // Universal
        'slots',         // Universal
        'apuestas',      // Codere específico
        'poker',         // Poker específico
        'bingo',         // Bingo específico
        
        // Patrones adicionales para Codere según tu ejemplo
        'csbgonlinereports'  // Codere específico según la URL que proporcionaste
    ];
    
    // Verificar patrones en hostname
    const hostnameMatch = gameWindowPatterns.some(pattern => 
        currentHostname.includes(pattern)
    );
    
    if (hostnameMatch) {
        console.log('🎮 Ventana de juego detectada por hostname:', currentHostname);
        return true;
    }
    
    // Patrones de URL (más específicos)
    const urlPatterns = [
        'casinogames',
        'casino',
        'slots',
        'juegos',
        'games',
        'poker',
        'ruleta',
        'blackjack',
        'roulette',
        'baccarat',
        'tragamonedas',
        'slot',
        'gameid=',       // Muchos casinos usan este parámetro
        'game=',         // Parámetro alternativo
        'launch',        // URLs de lanzamiento
        'play'           // URLs de juego
    ];
    
    // Verificar patrones en URL
    const urlMatch = urlPatterns.some(pattern => 
        currentUrl.includes(pattern)
    );
    
    if (urlMatch) {
        console.log('🎮 Ventana de juego detectada por URL:', currentUrl);
        return true;
    }
    
    return false;
}