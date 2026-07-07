/**
 * 🔧 GESTOR DE CONFIGURACIÓN
 * Centraliza la carga y guardado de configuración en chrome.storage.
 */

// Variables globales de configuración (accesibles desde content_script.js)
let currentSettings = { ...DEFAULT_SETTINGS };
let sessionMaxDuration = DEFAULT_SESSION_DURATION;

/**
 * 🔍 Verificar si estamos en un sitio donde la extensión debe trabajar.
 * Evita tocar chrome.storage en cada página que visita el usuario.
 */
function isCasinoOrRelevantSite() {
    try {
        if (typeof isCasinoPage === 'function') {
            return isCasinoPage();
        }
        return looksLikeCasinoSite(window.location.hostname, window.location.href);
    } catch (error) {
        return false;
    }
}

/**
 * 📥 Cargar configuración desde chrome.storage
 * @param {Function} callback - Función a ejecutar después de cargar la configuración
 */
function loadConfiguration(callback) {
    const done = () => {
        if (typeof callback === 'function') callback();
    };

    if (!isCasinoOrRelevantSite()) {
        done();
        return;
    }

    try {
        chrome.storage.sync.get([
            'breathingPattern',
            'sessionDuration',
            'mascotCustomPosition',
            'continuousBreathing'
        ], (result) => {
            if (chrome.runtime.lastError) {
                done();
                return;
            }

            if (result.breathingPattern) {
                currentSettings.breathingPattern = result.breathingPattern;
            }

            if (result.continuousBreathing !== undefined) {
                currentSettings.continuousBreathing = result.continuousBreathing;
            }

            if (typeof result.sessionDuration === 'number' && result.sessionDuration > 0) {
                sessionMaxDuration = result.sessionDuration;
            } else {
                sessionMaxDuration = DEFAULT_SESSION_DURATION;
            }

            if (result.mascotCustomPosition) {
                currentSettings.customPosition = result.mascotCustomPosition;
            }

            done();
        });
    } catch (error) {
        done();
    }
}

/**
 * 💾 Guardar posición personalizada del dragón
 * @param {Object} position - Objeto con coordenadas {x, y}
 */
function saveCustomPosition(position) {
    const customPosition = { x: position.x, y: position.y };

    try {
        chrome.storage.sync.set({ mascotCustomPosition: customPosition });
    } catch (error) {
        // Contexto de extensión invalidado: mantener solo en memoria
    }

    currentSettings.customPosition = customPosition;
}

/**
 * 🎮 Obtener dominios personalizados guardados
 * @param {Function} callback - Recibe el array de dominios
 */
function getCustomDomains(callback) {
    const done = (domains) => {
        if (typeof callback === 'function') callback(domains);
    };

    try {
        chrome.storage.sync.get([CUSTOM_DOMAINS_STORAGE_KEY], (result) => {
            if (chrome.runtime.lastError) {
                done([]);
                return;
            }
            done(result[CUSTOM_DOMAINS_STORAGE_KEY] || []);
        });
    } catch (error) {
        done([]);
    }
}
