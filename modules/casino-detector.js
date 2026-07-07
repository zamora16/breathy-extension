/**
 * 🎰 DETECTOR DE CASINOS
 * Centraliza la lógica de detección de sitios web de casinos y apuestas.
 * Usa las listas y heurísticas compartidas de constants.js.
 */

/**
 * 🔍 Verificar si la página actual es un sitio de casino
 * @returns {Boolean} true si es un sitio de casino
 */
function isCasinoPage() {
    const currentHostname = window.location.hostname.toLowerCase();
    const currentUrl = window.location.href.toLowerCase();

    // 1. Dominio conocido (exacto o subdominio)
    if (matchesKnownCasino(currentHostname)) {
        return true;
    }

    // 2. Dominios personalizados del usuario (asíncrono: dispara un evento si coincide)
    checkCustomDomains();

    // 3. Heurística por palabras clave para casinos no listados
    return looksLikeCasinoSite(currentHostname, currentUrl);
}

// Alias usado por el content script principal
function isGamblingWebsite() {
    return isCasinoPage();
}

/**
 * 🎮 Verificar si el sitio actual está en la lista de dominios personalizados.
 * Si coincide, dispara el evento 'breathyActivateCustomDomain'.
 */
function checkCustomDomains() {
    if (typeof getCustomDomains !== 'function') return;

    getCustomDomains((customDomains) => {
        const currentHostname = window.location.hostname.toLowerCase();
        const isCustom = customDomains.some(domain =>
            hostnameMatchesDomain(currentHostname, domain)
        );

        if (isCustom) {
            window.dispatchEvent(new CustomEvent('breathyActivateCustomDomain', {
                detail: { hostname: currentHostname, isCustomDomain: true }
            }));
        }
    });
}

/**
 * 🎮 Verificar si la ventana actual es una ventana de juego
 * (popups de juego de casinos: subdominios tipo casino.*, slots.*, cachedownload.*)
 * @param {String} hostname - Hostname opcional (usa window.location.hostname por defecto)
 * @param {String} url - URL opcional (usa window.location.href por defecto)
 * @returns {Boolean} true si es una ventana de juego
 */
function isGameWindow(hostname = null, url = null) {
    const currentHostname = (hostname || window.location.hostname).toLowerCase();
    const currentUrl = (url || window.location.href).toLowerCase();

    if (isExcludedHostname(currentHostname)) return false;

    // Patrones de hostname típicos de ventanas de juego
    const gameWindowHostPatterns = [
        'cachedownload',   // Sportium
        'casino', 'games', 'slots', 'apuestas', 'poker', 'bingo', 'juegos',
        'csbgonlinereports' // Codere
    ];

    if (gameWindowHostPatterns.some(pattern => currentHostname.includes(pattern))) {
        return true;
    }

    // Patrones de URL específicos de lanzadores de juegos
    // (solo señales inequívocas para evitar falsos positivos)
    const gameLaunchUrlPatterns = ['casinogames', 'gameid='];
    return gameLaunchUrlPatterns.some(pattern => currentUrl.includes(pattern));
}

// Exponer para uso desde otros módulos del content script
window.isGameWindow = isGameWindow;
