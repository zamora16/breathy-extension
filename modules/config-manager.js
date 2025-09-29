/**
 * 🔧 GESTOR DE CONFIGURACIÓN
 * Este módulo centraliza toda la lógica de carga y guardado de configuración
 */

// Variables globales de configuración (accesibles desde content_script.js)
let currentSettings = { ...DEFAULT_SETTINGS };
let sessionMaxDuration = DEFAULT_SESSION_DURATION;

/**
 * 🔍 Verificar si estamos en un sitio donde la extensión debe funcionar
 * @returns {Boolean} true si es un sitio de casino o relevante para la extensión
 */
function isCasinoOrRelevantSite() {
    try {
        const hostname = window.location.hostname.toLowerCase();
        const url = window.location.href.toLowerCase();
        
        // Si existe la función isCasinoPage, usarla
        if (typeof isCasinoPage === 'function') {
            return isCasinoPage();
        }
        
        // Fallback: verificación básica de palabras clave de casino
        const casinoKeywords = [
            'casino', 'bet', 'poker', 'slots', 'gambling', 'apuesta', 'juego',
            'ruleta', 'blackjack', 'bingo', 'loteria', 'sport', 'wager',
            'codere', 'bet365', 'williamhill', 'pokerstars', 'bwin'
        ];
        
        return casinoKeywords.some(keyword => 
            hostname.includes(keyword) || url.includes(keyword)
        );
    } catch (error) {
        console.log('🔄 Error verificando sitio de casino:', error);
        return false;
    }
}

/**
 * 📥 Cargar configuración desde chrome.storage
 * @param {Function} callback - Función a ejecutar después de cargar la configuración
 */
function loadConfiguration(callback) {
    // Verificar si estamos en un sitio donde debería funcionar la extensión
    if (!isCasinoOrRelevantSite()) {
        console.log('🔄 No es un sitio de casino, omitiendo carga de configuración');
        if (callback && typeof callback === 'function') {
            callback();
        }
        return;
    }

    // Manejar errores de chrome.storage de forma segura
    try {
        chrome.storage.sync.get([
            'breathingPattern', 
            'mascotSettings', 
            'sessionDuration', 
            'mascotCustomPosition', 
            'continuousBreathing'
        ], (result) => {
            if (chrome.runtime.lastError) {
                console.log('🔄 Chrome storage no disponible:', chrome.runtime.lastError.message);
                if (callback && typeof callback === 'function') {
                    callback();
                }
                return;
            }
        // Cargar patrón de respiración
        if (result.breathingPattern) {
            currentSettings.breathingPattern = result.breathingPattern;
            console.log(UI_TEXTS.console.patternLoaded, result.breathingPattern);
        }
        
        // Cargar configuración de respiración continua
        if (result.continuousBreathing !== undefined) {
            currentSettings.continuousBreathing = result.continuousBreathing;
            console.log(UI_TEXTS.console.continuousBreathingLoaded, result.continuousBreathing);
        }
        
        // Cargar duración de sesión - IMPORTANTE: Verificar que realmente se carga
        if (result.sessionDuration && typeof result.sessionDuration === 'number') {
            sessionMaxDuration = result.sessionDuration;
            console.log(UI_TEXTS.console.sessionDurationLoaded, sessionMaxDuration, 'minutos');
        } else {
            // Si no hay configuración guardada, usar 30 minutos por defecto
            sessionMaxDuration = 30;
            console.log('⚠️ No se encontró configuración de duración, usando 30 minutos por defecto');
            
            // Guardar la configuración por defecto para futuras sesiones
            chrome.storage.sync.set({sessionDuration: 30}, () => {
                console.log('💾 Configuración por defecto de 30 minutos guardada');
            });
        }
        
        // Cargar posición personalizada del dragón
        if (result.mascotCustomPosition) {
            currentSettings.customPosition = result.mascotCustomPosition;
            console.log(UI_TEXTS.console.customPositionLoaded, result.mascotCustomPosition);
        }
        
        // Ejecutar callback si se proporciona
        if (callback && typeof callback === 'function') {
            callback();
        }
    });
    } catch (error) {
        console.log('🔄 Error accediendo a chrome.storage:', error);
        if (callback && typeof callback === 'function') {
            callback();
        }
    }
}

/**
 * 💾 Guardar posición personalizada del dragón
 * @param {Object} position - Objeto con coordenadas {x, y}
 */
function saveCustomPosition(position) {
    const customPosition = {
        x: position.x,
        y: position.y
    };
    
    chrome.storage.sync.set({
        mascotCustomPosition: customPosition
    }, () => {
        console.log('🐉 Posición personalizada guardada:', customPosition);
    });
    
    // Actualizar configuración local
    currentSettings.customPosition = customPosition;
}

/**
 * 💾 Guardar configuración general
 * @param {Object} settings - Objeto con configuraciones a guardar
 */
function saveSettings(settings) {
    chrome.storage.sync.set(settings, () => {
        console.log('⚙️ Configuración guardada:', settings);
        
        // Actualizar configuración local
        Object.assign(currentSettings, settings);
    });
}

/**
 * 📤 Obtener configuración actual
 * @returns {Object} Configuración actual completa
 */
function getCurrentSettings() {
    return {
        ...currentSettings,
        sessionMaxDuration: sessionMaxDuration
    };
}

/**
 * 🔄 Actualizar configuración local sin guardar
 * @param {Object} newSettings - Nuevas configuraciones
 */
function updateLocalSettings(newSettings) {
    Object.assign(currentSettings, newSettings);
}

/**
 * 🗑️ Resetear configuración a valores por defecto
 */
function resetToDefaults() {
    currentSettings = { ...DEFAULT_SETTINGS };
    sessionMaxDuration = DEFAULT_SESSION_DURATION;
    
    // Limpiar storage
    chrome.storage.sync.clear(() => {
        console.log('🔄 Configuración reseteada a valores por defecto');
    });
}

/**
 * 📋 Obtener lista de claves de configuración disponibles
 * @returns {Array} Array con las claves de configuración
 */
function getConfigurationKeys() {
    return [
        'breathingPattern',
        'mascotSettings', 
        'sessionDuration',
        'mascotCustomPosition',
        'continuousBreathing',
        'customProtectedDomains'
    ];
}

/**
 * 🎮 Obtener dominios personalizados guardados
 * @param {Function} callback - Función callback que recibe el array de dominios
 */
function getCustomDomains(callback) {
    // Verificar si estamos en un sitio donde debería funcionar la extensión
    if (!isCasinoOrRelevantSite()) {
        console.log('🔄 No es un sitio de casino, omitiendo carga de dominios personalizados');
        if (callback && typeof callback === 'function') {
            callback([]);
        }
        return;
    }

    try {
        chrome.storage.sync.get([CUSTOM_DOMAINS_STORAGE_KEY], (result) => {
            if (chrome.runtime.lastError) {
                console.log('🔄 Chrome storage no disponible para dominios personalizados:', chrome.runtime.lastError.message);
                if (callback && typeof callback === 'function') {
                    callback([]);
                }
                return;
            }

            const customDomains = result[CUSTOM_DOMAINS_STORAGE_KEY] || [];
            console.log('🎮 Dominios personalizados cargados:', customDomains);
            if (callback && typeof callback === 'function') {
                callback(customDomains);
            }
        });
    } catch (error) {
        console.log('🔄 Error accediendo a chrome.storage para dominios personalizados:', error);
        if (callback && typeof callback === 'function') {
            callback([]);
        }
    }
}

/**
 * 🎮 Agregar un nuevo dominio personalizado
 * @param {String} domain - Dominio a agregar
 * @param {Function} callback - Función callback opcional
 */
function addCustomDomain(domain, callback) {
    if (!domain || typeof domain !== 'string') {
        console.error('❌ Dominio inválido:', domain);
        return;
    }
    
    // Limpiar el dominio (quitar protocolo y www)
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();
    
    getCustomDomains((currentDomains) => {
        // Verificar si el dominio ya existe
        if (currentDomains.includes(cleanDomain)) {
            console.log('⚠️ El dominio ya existe:', cleanDomain);
            if (callback) callback(false, 'El dominio ya está registrado');
            return;
        }
        
        // Agregar el nuevo dominio
        const updatedDomains = [...currentDomains, cleanDomain];
        
        chrome.storage.sync.set({
            [CUSTOM_DOMAINS_STORAGE_KEY]: updatedDomains
        }, () => {
            console.log('✅ Dominio personalizado agregado:', cleanDomain);
            if (callback) callback(true, cleanDomain);
        });
    });
}

/**
 * 🎮 Eliminar un dominio personalizado
 * @param {String} domain - Dominio a eliminar
 * @param {Function} callback - Función callback opcional
 */
function removeCustomDomain(domain, callback) {
    getCustomDomains((currentDomains) => {
        const updatedDomains = currentDomains.filter(d => d !== domain);
        
        chrome.storage.sync.set({
            [CUSTOM_DOMAINS_STORAGE_KEY]: updatedDomains
        }, () => {
            console.log('🗑️ Dominio personalizado eliminado:', domain);
            if (callback) callback(true);
        });
    });
}