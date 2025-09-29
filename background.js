// Background Service Worker para la extensión Breathy
// Maneja el seguimiento de tiempo y las notificaciones

// Variables de seguimiento
let sessionStartTime = null;
let activeTabId = null;
let lastActivityTime = null;
let sessionUpdateTimer = null; // Timer para actualizaciones de estado del dragón
let activeCasinoTabs = new Map(); // Mapa de pestañas de casino activas: tabId -> {hostname, startTime, dragonState}
let currentDragonState = 'happy'; // Estado actual del dragón para la sesión activa

// Variables globales para reality checks (sincronizadas entre todas las ventanas)
let globalLastRealityCheckTime = 0;
let globalRealityCheckIndex = 0;

// Variables globales para sincronización del estado del dragón
let globalDragonState = 'happy';
let globalLastStateCheckTime = 0;

// Variables para prevenir cambios de estado repetidos
let lastStateChangeTime = 0;
let stateChangeThreshold = 5; // Reducir a 5 segundos para no interferir con cambios legítimos

// Variables del modo de prueba
let modoPruebaActivo = false;
let modoPruebaTimer = null;

// Escuchar cuando se activa una pestaña
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    handleTabChange(tab);
});

// Escuchar cuando se actualiza una pestaña
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        handleTabChange(tab);
        
        // Verificación adicional para inyección dinámica en casos especiales
        const hostname = new URL(tab.url).hostname;
        const isCasinoSite = await checkIfCasinoSite(hostname, tab.url);
        
        if (isCasinoSite) {
            console.log('🎰 Verificando si la extensión está activa en casino:', hostname);
            
            // Enviar mensaje de prueba para verificar si la extensión está funcionando
            try {
                await chrome.tabs.sendMessage(tabId, { type: 'healthCheck' });
                console.log('✅ Extensión activa en:', hostname);
            } catch (error) {
                console.log('⚠️ Extensión no responde, intentando reinyección:', hostname);
                
                // Intentar reinyectar solo si no es un iframe restringido
                try {
                    await chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        func: () => {
                            if (!document.getElementById('dragon-mascot')) {
                                console.log('🔄 Reinyectando extensión en ventana de casino');
                                // Forzar reinicialización si la extensión no está presente
                                if (typeof inicializarExtension === 'function') {
                                    inicializarExtension();
                                }
                            }
                        }
                    });
                } catch (injectionError) {
                    console.log('❌ No se pudo reinyectar en:', hostname, injectionError);
                }
            }
        }
    }
});

// Escuchar cuando se cierra una pestaña
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    console.log('🗂️ Pestaña cerrada:', tabId);
    
    // Si es una pestaña de casino activa, terminar su sesión
    if (activeCasinoTabs.has(tabId)) {
        console.log('🚪 Pestaña de casino cerrada, terminando su sesión:', tabId);
        endCasinoSessionForTab(tabId);
    }
    
    // Si era la pestaña activa actual, limpiar
    if (activeTabId === tabId) {
        console.log('🚪 Pestaña activa cerrada, limpiando variables globales');
        activeTabId = null;
        sessionStartTime = null;
        if (sessionUpdateTimer) {
            clearInterval(sessionUpdateTimer);
            sessionUpdateTimer = null;
        }
    }
});

// Escuchar cuando se reemplaza una pestaña (navegación)
chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
    console.log('🔄 Pestaña reemplazada:', removedTabId, '→', addedTabId);
    
    // Si la pestaña removida era de casino, terminar su sesión
    if (activeCasinoTabs.has(removedTabId)) {
        console.log('🚪 Pestaña de casino reemplazada, terminando sesión:', removedTabId);
        endCasinoSessionForTab(removedTabId);
    }
    
    // Actualizar referencias si era la pestaña activa
    if (activeTabId === removedTabId) {
        activeTabId = addedTabId;
    }
});

// Función principal para manejar cambios de pestaña
async function handleTabChange(tab) {
    if (!tab.url) return;
    
    const hostname = new URL(tab.url).hostname;
    const isCasinoSite = await checkIfCasinoSite(hostname, tab.url);
    
    console.log('🔍 Analizando pestaña:', tab.id, hostname, 'Es casino:', isCasinoSite);
    console.log('📊 Estado actual activeCasinoTabs:', Array.from(activeCasinoTabs.entries()));
    
    if (isCasinoSite) {
        // Verificar si esta pestaña ya tiene una sesión activa PARA EL MISMO DOMINIO BASE
        const existingCasinoTab = activeCasinoTabs.get(tab.id);
        const baseDomain = getBaseDomain(hostname);
        
        if (existingCasinoTab) {
            // La pestaña ya tiene sesión - verificar si es navegación interna
            const existingBaseDomain = getBaseDomain(existingCasinoTab.hostname);
            
            if (existingBaseDomain === baseDomain) {
                console.log('🎰 Navegación interna en misma pestaña - manteniendo sesión:', 
                    { 
                        from: existingCasinoTab.hostname, 
                        to: hostname,
                        baseDomain,
                        tabId: tab.id
                    });
                
                // Solo actualizar el hostname, mantener todo lo demás
                activeCasinoTabs.set(tab.id, {
                    hostname: hostname,
                    baseDomain: baseDomain,
                    startTime: existingCasinoTab.startTime, // Mantener tiempo original
                    isPrimary: existingCasinoTab.isPrimary || false,
                    dragonState: existingCasinoTab.dragonState || 'happy' // Mantener estado del dragón
                });
                
                // Actualizar estado del dragón global
                currentDragonState = existingCasinoTab.dragonState || 'happy';
                
                // Actualizar variables globales (aunque probablemente ya estén bien)
                activeTabId = tab.id;
                sessionStartTime = existingCasinoTab.startTime;
                
                // Solo reiniciar timer para actualizaciones de estado del dragón
                if (sessionUpdateTimer) {
                    clearInterval(sessionUpdateTimer);
                }
                startSessionTimer();
                
                return; // Importante: salir aquí para no crear nueva sesión
            } else {
                // Cambio a dominio diferente - terminar sesión anterior
                console.log('🔄 Cambio de casino en misma pestaña:', {
                    from: existingBaseDomain,
                    to: baseDomain,
                    tabId: tab.id
                });
                
                endCasinoSessionForTab(tab.id);
                // Continuar para crear nueva sesión abajo
            }
        }
        
        // Si llegamos aquí, necesitamos crear nueva sesión o buscar en otras pestañas
        if (!activeCasinoTabs.has(tab.id)) {
            // Verificar si hay otra pestaña con sesión activa del mismo dominio base
            let existingSessionForDomain = null;
            for (const [tabId, casinoInfo] of activeCasinoTabs) {
                if (getBaseDomain(casinoInfo.hostname) === baseDomain) {
                    existingSessionForDomain = { tabId, casinoInfo };
                    break;
                }
            }
            
            if (existingSessionForDomain) {
                console.log('🎰 Navegación interna detectada - transfiriendo sesión de otra pestaña:', 
                    { 
                        from: existingSessionForDomain.casinoInfo.hostname, 
                        to: hostname,
                        baseDomain,
                        fromTab: existingSessionForDomain.tabId,
                        toTab: tab.id
                    });
                
                // Determinar si esta nueva ventana debería ser primaria
                // Las ventanas de juego deberían ser primarias
                const url = tab.url.toLowerCase();
                const isGameWindow = hostname.includes('cachedownload') || 
                                   hostname.includes('juegos') || 
                                   hostname.includes('casino') || 
                                   hostname.includes('games') || 
                                   hostname.includes('slots') ||
                                   hostname.includes('apuestas') ||
                                   hostname.includes('mobile') ||
                                   hostname.includes('m.') ||
                                   url.includes('casinogames') ||
                                   url.includes('casino') ||
                                   url.includes('slots') ||
                                   url.includes('juegos') ||
                                   url.includes('games') ||
                                   url.includes('poker') ||
                                   url.includes('ruleta') ||
                                   url.includes('blackjack');
                
                const shouldBePrimary = isGameWindow || !existingSessionForDomain.casinoInfo.isPrimary;
                
                console.log('🎮 Evaluando si debe ser primaria:', {
                    hostname,
                    isGameWindow,
                    existingPrimary: existingSessionForDomain.casinoInfo.isPrimary,
                    shouldBePrimary
                });
                
                // Transferir la sesión a la nueva pestaña
                activeCasinoTabs.set(tab.id, {
                    hostname: hostname,
                    baseDomain: baseDomain,
                    startTime: existingSessionForDomain.casinoInfo.startTime, // Mantener tiempo original
                    isPrimary: shouldBePrimary,
                    dragonState: existingSessionForDomain.casinoInfo.dragonState || 'happy' // Transferir estado del dragón
                });
                
                // Si esta ventana se convierte en primaria, marcar la anterior como secundaria
                if (shouldBePrimary && existingSessionForDomain.casinoInfo.isPrimary) {
                    console.log('👑 Transfiriendo primacía de', existingSessionForDomain.tabId, 'a', tab.id);
                    activeCasinoTabs.set(existingSessionForDomain.tabId, {
                        ...existingSessionForDomain.casinoInfo,
                        isPrimary: false
                    });
                }
                
                // Actualizar estado del dragón global
                currentDragonState = existingSessionForDomain.casinoInfo.dragonState || 'happy';
                
                // Remover la sesión de la pestaña anterior
                activeCasinoTabs.delete(existingSessionForDomain.tabId);
                
                // Actualizar variables globales
                activeTabId = tab.id;
                sessionStartTime = existingSessionForDomain.casinoInfo.startTime;
                
                // Reiniciar timer para la nueva pestaña
                if (sessionUpdateTimer) {
                    clearInterval(sessionUpdateTimer);
                }
                startSessionTimer();
            } else {
                console.log('🎰 Nuevo casino detectado en pestaña:', tab.id, hostname);
                startCasinoSession(tab.id, hostname);
            }
        }
    } else {
        // Si esta pestaña tenía un casino y ahora no, terminar su sesión
        if (activeCasinoTabs.has(tab.id)) {
            console.log('✅ Pestaña navegó fuera del casino, terminando sesión:', tab.id);
            endCasinoSessionForTab(tab.id);
        }
        
        // Si era la pestaña activa, limpiar variables globales y timer
        if (activeTabId === tab.id) {
            activeTabId = null;
            sessionStartTime = null;
            if (sessionUpdateTimer) {
                clearInterval(sessionUpdateTimer);
                sessionUpdateTimer = null;
            }
        }
    }
}

// Verificar si es un sitio de casino
async function checkIfCasinoSite(hostname, url = '') {
    console.log('🔍 Verificando sitio:', hostname, 'URL:', url);
    
    const casinoDomains = [
        "bet365.es", "888sport.es", "pokerstars.es", "winamax.es",
        "betfair.es", "bwin.es", "codere.es", "sportium.es",
        "betsson.es", "luckia.es", "marca.es", "as.com",
        "paf.es", "pastón.es", "goldenpark.es", "casino.com",
        "casinobarcelona.es", "gran-casino-madrid.es", "williamhill.es",
        "interwetten.es", "bet365.com", "pokerstars.com",
        "888casino.com", "bwin.com",
        // Subdominios específicos de juegos y aplicaciones móviles
        "m.apuestas.codere.es", "cachedownload.sportium.es",
        "juegos.codere.es", "casino.codere.es", "live.sportium.es",
        "games.bet365.es", "casino.bwin.es", "slots.luckia.es",
        // Dominios adicionales de Codere
        "apuestas.codere.es", "m.codere.es", "mobile.codere.es",
        "slots.codere.es", "deportes.codere.es", "live.codere.es",
        "app.codere.es", "www.codere.es",
        // Más subdominios comunes de otros casinos
        "m.bet365.es", "mobile.bet365.es", "apps.bet365.es",
        "m.bwin.es", "mobile.bwin.es", "casino.bet365.es",
        "poker.bet365.es", "vegas.bet365.es", "bingo.bet365.es",
        "m.pokerstars.es", "mobile.pokerstars.es", "live.pokerstars.es",
        "casino.pokerstars.es", "poker.pokerstars.es",
        "m.luckia.es", "mobile.luckia.es", "casino.luckia.es",
        "poker.luckia.es", "deportes.luckia.es",
        // Dominios de otros casinos importantes
        "yobingo.es", "kirolbet.es", "retabet.es", "suertia.es",
        "rivalo.es", "marathonbet.es", "versus.es", "wanabet.es",
        "betway.es", "zebet.es", "versus.es", "circus.be"
    ];
    
    const cleanHostname = hostname.toLowerCase();
    
    // Verificación mejorada para subdominios usando dominio base universal
    const isMatch = casinoDomains.some(domain => {
        const cleanDomain = domain.toLowerCase();
        
        // Verificación exacta
        if (cleanHostname === cleanDomain) return true;
        
        // Verificación de subdominio
        if (cleanHostname.endsWith('.' + cleanDomain)) return true;
        
        // Verificación de contención
        if (cleanHostname.includes(cleanDomain)) return true;
        
        // Verificación de dominio base universal
        const universalBaseDomain = getUniversalBaseDomain(cleanHostname);
        const knownBaseDomain = getUniversalBaseDomain(cleanDomain);
        if (universalBaseDomain === knownBaseDomain) return true;
        
        return false;
    });
    
    // Verificación adicional por palabras clave para detectar nuevos casinos
    if (!isMatch) {
        // Primero verificar si es un sitio que debe ser excluido (buscadores, noticias, etc.)
        const excludedSites = [
            // Buscadores principales - múltiples variaciones
            'google.com', 'google.es', 'google.co', 'www.google',
            'bing.com', 'yahoo.com', 'yahoo.es',
            'duckduckgo.com', 'yandex.com', 'baidu.com', 'ask.com',
            // Sitios de noticias y medios
            'wikipedia.org', 'wiki', 'reddit.com', 'youtube.com', 
            'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com',
            'news', 'noticias', 'periodico', 'diario', 'blog', 'forum',
            // Sitios informativos de deportes (no de apuestas)
            'espn.com', 'marca.com', 'as.com', 'sport.es', 'mundodeportivo.com',
            'cope.es', 'cadenaser.com', 'antena3.com', 'telecinco.es',
            // Tiendas online y otros
            'amazon.com', 'amazon.es', 'ebay.com', 'aliexpress.com'
        ];
        
        const isExcludedSite = excludedSites.some(excludedSite => {
            const isMatch = cleanHostname.includes(excludedSite);
            if (isMatch) {
                console.log('🔍 Coincidencia de exclusión:', excludedSite, 'en hostname:', cleanHostname);
            }
            return isMatch;
        });
        
        if (isExcludedSite) {
            console.log('🚫 Sitio excluido de detección de casino:', hostname);
            return false;
        }
        
        // Debug adicional para Google
        if (cleanHostname.includes('google')) {
            console.log('🔍 DEBUG - Hostname detectado como Google:', hostname, 'URL completa:', url);
            return false;
        }
        
        const casinoKeywords = ['casino', 'bet', 'poker', 'slots', 'gambling', 'apuesta', 'juego', 'ruleta', 'blackjack'];
        const containsKeyword = casinoKeywords.some(keyword => cleanHostname.includes(keyword));
        
        if (containsKeyword) {
            console.log('🎰 Posible casino detectado por palabra clave en:', hostname);
            return true;
        }
    }
    
    return isMatch;
}

// Función para extraer el dominio base (ej: bet365.es de cualquier subdominio)
function getBaseDomain(hostname) {
    const casinoDomains = [
        "bet365.es", "888sport.es", "pokerstars.es", "winamax.es",
        "betfair.es", "bwin.es", "codere.es", "sportium.es",
        "betsson.es", "luckia.es", "marca.es", "as.com",
        "paf.es", "pastón.es", "goldenpark.es", "casino.com",
        "casinobarcelona.es", "gran-casino-madrid.es", "williamhill.es",
        "interwetten.es", "bet365.com", "pokerstars.com",
        "888casino.com", "bwin.com",
        // Subdominios específicos de juegos y aplicaciones móviles
        "m.apuestas.codere.es", "cachedownload.sportium.es",
        "juegos.codere.es", "casino.codere.es", "live.sportium.es",
        "games.bet365.es", "casino.bwin.es", "slots.luckia.es"
    ];
    
    // Buscar qué dominio de casino coincide con el hostname
    let foundDomain = null;
    for (const domain of casinoDomains) {
        if (hostname.includes(domain)) {
            foundDomain = domain;
            break;
        }
    }
    
    if (foundDomain) {
        // Para dominios específicos de Codere, normalizar a codere.es
        if (foundDomain.includes('codere.es')) {
            return 'codere.es';
        }
        
        // Para dominios específicos de Sportium, normalizar a sportium.es
        if (foundDomain.includes('sportium.es')) {
            return 'sportium.es';
        }
        
        // Para otros dominios, usar tal como están
        return foundDomain;
    }
    
    // Si no encuentra coincidencia, usar función universal para extraer dominio base
    return getUniversalBaseDomain(hostname);
}

/**
 * 🌐 Función universal para extraer dominio base de cualquier hostname
 * Ejemplos:
 * - m.apuestas.codere.es → codere.es
 * - casino.bet365.es → bet365.es
 * - juegos.luckia.es → luckia.es
 * - www.bwin.es → bwin.es
 */
function getUniversalBaseDomain(hostname) {
    const cleanHostname = hostname.toLowerCase();
    
    // Lista de subdominios comunes que queremos ignorar para extraer el dominio base
    const commonSubdomains = [
        'www', 'm', 'mobile', 'app', 'apps', 'play', 'games', 'casino', 
        'slots', 'poker', 'live', 'sports', 'deportes', 'apuestas', 
        'juegos', 'ruleta', 'blackjack', 'bingo', 'vegas', 'movil'
    ];
    
    // Dividir el hostname en partes
    const parts = cleanHostname.split('.');
    
    // Si tiene menos de 2 partes, devolver tal como está
    if (parts.length < 2) {
        return cleanHostname;
    }
    
    // Para casos como 'domain.es' o 'domain.com', devolver tal como está
    if (parts.length === 2) {
        return cleanHostname;
    }
    
    // Para casos con múltiples subdominios
    // Buscar desde el final hacia atrás para encontrar el dominio principal
    let baseDomainParts = [];
    
    // Siempre tomar los últimos 2 elementos (dominio + TLD)
    baseDomainParts = parts.slice(-2);
    
    // Verificar si el tercer elemento desde el final es parte del dominio principal
    // (casos como 'codere.es', 'bet365.es', etc.)
    if (parts.length >= 3) {
        const thirdFromEnd = parts[parts.length - 3];
        
        // Si no es un subdominio común, probablemente es parte del dominio principal
        if (!commonSubdomains.includes(thirdFromEnd)) {
            baseDomainParts = parts.slice(-3);
        }
    }
    
    const result = baseDomainParts.join('.');
    console.log(`🌐 getUniversalBaseDomain: ${hostname} → ${result}`);
    return result;
}

// Iniciar sesión de casino
async function startCasinoSession(tabId, hostname) {
    const now = Date.now();
    const baseDomain = getBaseDomain(hostname);
    
    console.log('🎯 startCasinoSession llamado:', { tabId, hostname, baseDomain });
    
    // Verificar si esta pestaña ya tiene una sesión (no debería, pero por seguridad)
    if (activeCasinoTabs.has(tabId)) {
        console.log('⚠️ Pestaña ya tiene sesión activa, saltando...');
        return;
    }
    
    // Verificar si ya hay una pestaña principal para este dominio
    let existingPrimaryTab = null;
    for (const [existingTabId, casinoInfo] of activeCasinoTabs) {
        if (casinoInfo.baseDomain === baseDomain && casinoInfo.isPrimary) {
            existingPrimaryTab = { tabId: existingTabId, info: casinoInfo };
            break;
        }
    }
    
    // Determinar si esta será la pestaña principal
    const isPrimary = !existingPrimaryTab;
    
    // Solo reiniciar reality checks si es la primera pestaña del dominio (nueva sesión)
    if (isPrimary) {
        globalLastRealityCheckTime = 0;
        globalRealityCheckIndex = 0;
        globalDragonState = 'happy'; // Reiniciar estado global del dragón
        globalLastStateCheckTime = 0;
        lastStateChangeTime = 0; // Resetear también el control de cambios de estado
        console.log('🔄 Reality checks y estado del dragón globales reiniciados para nueva sesión');
    }
    
    // Registrar esta pestaña como casino activo
    activeCasinoTabs.set(tabId, {
        hostname: hostname,
        baseDomain: baseDomain,
        startTime: existingPrimaryTab ? existingPrimaryTab.info.startTime : now,
        isPrimary: isPrimary,
        dragonState: existingPrimaryTab ? existingPrimaryTab.info.dragonState : 'happy'
    });
    
    // Establecer estado del dragón global
    currentDragonState = existingPrimaryTab ? existingPrimaryTab.info.dragonState : 'happy';
    
    // Establecer como pestaña activa actual
    activeTabId = tabId;
    sessionStartTime = existingPrimaryTab ? existingPrimaryTab.info.startTime : now;
    lastActivityTime = now;
    
    console.log('⏰ ✅ SESIÓN REGISTRADA:', {
        tabId,
        hostname,
        baseDomain,
        isPrimary,
        tiempo: new Date(sessionStartTime).toLocaleTimeString(),
        totalCasinoTabs: activeCasinoTabs.size
    });
    
    // Solo guardar inicio de sesión si es la pestaña principal (primera del dominio)
    if (isPrimary) {
        saveCasinoSession(baseDomain, now, 'start', tabId);
    }
    
    // Programar recordatorios
    scheduleReminders();
    
    // Iniciar timer para actualizaciones de estado del dragón
    startSessionTimer();
}

// Función para iniciar timer de actualizaciones de sesión
function startSessionTimer() {
    // Limpiar timer anterior si existe
    if (sessionUpdateTimer) {
        clearInterval(sessionUpdateTimer);
    }
    
    // Determinar intervalo basado en modo de prueba
    const intervalo = modoPruebaActivo ? 1000 : 30000; // 1s en prueba, 30s normal
    const multiplicador = modoPruebaActivo ? 60 : 1; // 1 segundo = 1 minuto en prueba
    
    // Enviar actualización
    sessionUpdateTimer = setInterval(() => {
        if (sessionStartTime && activeTabId) {
            const now = Date.now();
            let sessionDurationMinutes = (now - sessionStartTime) / (1000 * 60);
            
            // En modo de prueba, acelerar el tiempo
            if (modoPruebaActivo) {
                sessionDurationMinutes = sessionDurationMinutes * multiplicador;
            }
            
            // Verificar si necesita cambiar el estado del dragón
            // PROBLEMA: Necesitamos obtener la configuración real del usuario
            // Por ahora, revertir a la lógica original donde cada ventana calcula su estado
            // basado en su propia configuración
            
            // En lugar de calcular aquí, enviamos el tiempo y dejamos que cada ventana
            // calcule según su configuración específica
            
            // Verificar reality checks globales
            const minutosCompletos = Math.floor(sessionDurationMinutes);
            let realityCheckMessage = null;
            
            // Solo mostrar si han pasado al menos 10 minutos desde el último
            if (minutosCompletos > 0 && 
                minutosCompletos % 10 === 0 && 
                minutosCompletos > globalLastRealityCheckTime) {
                
                globalLastRealityCheckTime = minutosCompletos;
                
                // Mensajes de reality check usando i18n
                const realityChecks = [
                    chrome.i18n.getMessage('realityCheck1') || '¿Cómo te sientes hasta ahora? Recuerda que puedes tomar un descanso',
                    chrome.i18n.getMessage('realityCheck2') || '¿Estás jugando con dinero que puedes permitirte perder?',
                    chrome.i18n.getMessage('realityCheck3') || 'Tómate un momento para hacer unas respiraciones profundas',
                    chrome.i18n.getMessage('realityCheck4') || 'Los juegos están diseñados para que sientas que estás cerca de ganar. No caigas en la trampa',
                    chrome.i18n.getMessage('realityCheck5') || 'Recuerda: el juego debe ser diversión, no una forma de ganar dinero',
                    chrome.i18n.getMessage('realityCheck6') || '¿Hace cuánto que estás jugando? El tiempo vuela',
                    chrome.i18n.getMessage('realityCheck7') || 'Pregúntate: ¿este dinero lo necesito para algo importante?'
                ];
                
                realityCheckMessage = realityChecks[globalRealityCheckIndex];
                globalRealityCheckIndex = (globalRealityCheckIndex + 1) % realityChecks.length;
                
                console.log(`🔔 Reality check programado (${minutosCompletos} min): ${realityCheckMessage}`);
            }
            
            // Calcular estado del dragón globalmente (similar a reality checks)
            // Usar configuración por defecto de 30 minutos como fallback
            const maxDuration = 30; // Fallback por defecto
            const halfSessionLimit = maxDuration * 0.5;    // 15 minutos para tired
            const fullSessionLimit = maxDuration;           // 30 minutos para angry
            
            // Determinar el estado que corresponde según el tiempo transcurrido
            let calculatedDragonState = 'happy';
            if (sessionDurationMinutes >= fullSessionLimit) {
                calculatedDragonState = 'angry';
            } else if (sessionDurationMinutes >= halfSessionLimit) {
                calculatedDragonState = 'tired';
            }
            
            // Solo cambiar el estado global si es una progresión (no retroceso)
            const stateHierarchy = { 'happy': 0, 'tired': 1, 'angry': 2 };
            if (stateHierarchy[calculatedDragonState] > stateHierarchy[globalDragonState]) {
                console.log(`🐉 CAMBIO DE ESTADO GLOBAL: ${globalDragonState} → ${calculatedDragonState} (${sessionDurationMinutes.toFixed(2)} min)`);
                console.log(`📊 Límites globales: tired≥${halfSessionLimit}min, angry≥${fullSessionLimit}min`);
                globalDragonState = calculatedDragonState;
                currentDragonState = calculatedDragonState; // Actualizar también el estado actual
                globalLastStateCheckTime = minutosCompletos;
            }
            
            // Enviar actualización a TODAS las pestañas del mismo dominio de casino
            if (activeTabId && activeCasinoTabs.has(activeTabId)) {
                const currentBaseDomain = activeCasinoTabs.get(activeTabId).baseDomain;
                
                // Enviar a todas las pestañas del mismo dominio
                for (const [tabId, casinoInfo] of activeCasinoTabs) {
                    if (casinoInfo.baseDomain === currentBaseDomain) {
                        chrome.tabs.sendMessage(tabId, {
                            type: 'sessionTimeUpdate',
                            sessionDurationMinutes: sessionDurationMinutes,
                            modoPrueba: modoPruebaActivo,
                            isPrimary: casinoInfo.isPrimary,
                            // NO enviar dragonState - cada content script debe calcular su propio estado
                            realityCheckMessage: realityCheckMessage
                        }).catch(error => {
                            console.log(`❌ No se pudo enviar actualización a pestaña ${tabId}:`, error);
                        });
                    }
                }
                
                console.log(`🔄 Actualizaciones enviadas a ${Array.from(activeCasinoTabs.entries()).filter(([_, info]) => info.baseDomain === currentBaseDomain).length} pestañas del dominio ${currentBaseDomain}`);
            } else {
                // Fallback: enviar solo a pestaña activa (código original)
                chrome.tabs.sendMessage(activeTabId, {
                    type: 'sessionTimeUpdate',
                    sessionDurationMinutes: sessionDurationMinutes,
                    modoPrueba: modoPruebaActivo,
                    isPrimary: activeCasinoTabs.get(activeTabId)?.isPrimary || false,
                    dragonState: currentDragonState,
                    realityCheckMessage: realityCheckMessage
                }).catch(error => {
                    console.log('No se pudo enviar actualización de tiempo:', error);
                });
            }
            
            const tipoModo = modoPruebaActivo ? '🧪 PRUEBA' : '🐉';
            console.log(`${tipoModo} Actualización de estado: ${sessionDurationMinutes.toFixed(2)} min`);
        }
    }, intervalo);
    
    // También enviar una actualización inmediata a todas las pestañas del dominio
    setTimeout(() => {
        if (sessionStartTime && activeTabId && activeCasinoTabs.has(activeTabId)) {
            const currentBaseDomain = activeCasinoTabs.get(activeTabId).baseDomain;
            
            // Enviar a todas las pestañas del mismo dominio
            for (const [tabId, casinoInfo] of activeCasinoTabs) {
                if (casinoInfo.baseDomain === currentBaseDomain) {
                    chrome.tabs.sendMessage(tabId, {
                        type: 'sessionTimeUpdate',
                        sessionDurationMinutes: 0,
                        dragonState: currentDragonState,
                        isPrimary: casinoInfo.isPrimary
                    }).catch(error => {
                        console.log(`No se pudo enviar actualización inicial a pestaña ${tabId}:`, error);
                    });
                }
            }
            
            console.log(`🚀 Actualizaciones iniciales enviadas a pestañas del dominio ${currentBaseDomain}`);
        } else if (sessionStartTime && activeTabId) {
            // Fallback original
            chrome.tabs.sendMessage(activeTabId, {
                type: 'sessionTimeUpdate',
                sessionDurationMinutes: 0,
                dragonState: currentDragonState,
                isPrimary: activeCasinoTabs.get(activeTabId)?.isPrimary || false
            }).catch(error => {
                console.log('No se pudo enviar actualización inicial:', error);
            });
        }
    }, 1000); // Después de 1 segundo para que la página haya cargado
}



// Terminar sesión de casino para una pestaña específica
async function endCasinoSessionForTab(tabId) {
    if (!activeCasinoTabs.has(tabId)) {
        console.log('⚠️ No hay sesión activa para pestaña:', tabId);
        return;
    }
    
    const casinoTab = activeCasinoTabs.get(tabId);
    const now = Date.now();
    const sessionDuration = now - casinoTab.startTime;
    const baseDomain = casinoTab.baseDomain || getBaseDomain(casinoTab.hostname);
    
    console.log('🏁 Cerrando pestaña de casino:', {
        tabId,
        hostname: casinoTab.hostname,
        baseDomain,
        isPrimary: casinoTab.isPrimary,
        duracion: Math.round(sessionDuration / 1000 / 60) + ' minutos'
    });
    
    // Si es pestaña primaria, necesitamos promover otra pestaña o terminar sesión
    if (casinoTab.isPrimary) {
        // Buscar otra pestaña del mismo dominio para promover a principal
        let newPrimaryTab = null;
        for (const [otherTabId, otherCasinoInfo] of activeCasinoTabs) {
            if (otherTabId !== tabId && otherCasinoInfo.baseDomain === baseDomain) {
                newPrimaryTab = { tabId: otherTabId, info: otherCasinoInfo };
                break;
            }
        }
        
        if (newPrimaryTab) {
            // Promover otra pestaña a principal
            activeCasinoTabs.set(newPrimaryTab.tabId, {
                ...newPrimaryTab.info,
                isPrimary: true
            });
            
            console.log('👑 Nueva pestaña principal promovida:', {
                tabId: newPrimaryTab.tabId,
                hostname: newPrimaryTab.info.hostname
            });
            
            // Solo remover la pestaña actual
            activeCasinoTabs.delete(tabId);
        } else {
            // Era la única pestaña, terminar sesión completa
            console.log('🏁 Terminando sesión completa - era la única pestaña');
            saveCasinoSession(baseDomain, now, 'end', tabId, sessionDuration);
            activeCasinoTabs.delete(tabId);
        }
    } else {
        // Pestaña secundaria, solo remover
        console.log('📄 Cerrando pestaña secundaria');
        activeCasinoTabs.delete(tabId);
    }
    
    console.log('📊 Pestañas de casino restantes:', activeCasinoTabs.size);
}

// Terminar sesión de casino (función legacy para compatibilidad)
async function endCasinoSession() {
    if (activeTabId) {
        await endCasinoSessionForTab(activeTabId);
    }
    
    // Limpiar variables globales
    sessionStartTime = null;
    activeTabId = null;
    lastActivityTime = null;
    
    // Limpiar timer de actualizaciones de dragón
    if (sessionUpdateTimer) {
        clearInterval(sessionUpdateTimer);
        sessionUpdateTimer = null;
    }
    
    // Cancelar recordatorios pendientes
    clearScheduledReminders();
}



// Guardar datos de la sesión
async function saveCasinoSession(hostname, timestamp, type, tabId, duration = null) {
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Obtener datos existentes
        const result = await chrome.storage.local.get(['casinoSessions', 'dailyStats']);
        const sessions = result.casinoSessions || [];
        const dailyStats = result.dailyStats || {};
        
        // Guardar sesión
        if (type === 'start') {
            sessions.push({
                id: `session_${timestamp}`,
                tabId: tabId, // ✅ NUEVO: Asociar sesión con pestaña específica
                hostname,
                startTime: timestamp,
                endTime: null,
                duration: null
            });
            
            // ✅ CORREGIDO: Contar sesión al INICIAR, no al terminar
            if (!dailyStats[today]) {
                dailyStats[today] = { totalTime: 0, sessions: 0 };
            }
            dailyStats[today].sessions += 1;
            
        } else if (type === 'end' && sessions.length > 0) {
            // Buscar la sesión específica de esta pestaña
            const sessionIndex = sessions.findIndex(s => s.tabId === tabId && !s.endTime);
            if (sessionIndex !== -1) {
                const session = sessions[sessionIndex];
                session.endTime = timestamp;
                session.duration = duration;
                
                // ✅ CORREGIDO: Solo sumar tiempo al terminar, sesiones ya se contaron al iniciar
                if (!dailyStats[today]) {
                    dailyStats[today] = { totalTime: 0, sessions: 0 };
                }
                dailyStats[today].totalTime += duration;
                
                console.log('💾 Sesión terminada y guardada:', {
                    tabId,
                    duracion: Math.round(duration/1000/60) + ' min'
                });
            } else {
                console.log('⚠️ No se encontró sesión activa para pestaña:', tabId);
            }
        }
        
        // Guardar datos actualizados
        await chrome.storage.local.set({
            casinoSessions: sessions.slice(-100), // Mantener solo las últimas 100 sesiones
            dailyStats: dailyStats
        });
        
        console.log('💾 Storage actualizado:', { 
            type, 
            tabId,
            sesionesHoy: dailyStats[today]?.sessions || 0,
            tiempoHoy: Math.round((dailyStats[today]?.totalTime || 0)/1000/60) + ' min'
        });
        
    } catch (error) {
        console.error('Error guardando sesión:', error);
    }
}

// Variables para recordatorios
let reminderTimeouts = [];

// Programar recordatorios
function scheduleReminders() {
    clearScheduledReminders();
    
    // Recordatorio a los 30 minutos
    reminderTimeouts.push(setTimeout(() => {
        showNotification('⏰ Llevas 30 minutos jugando', 'reminder');
    }, 30 * 60 * 1000));
    
    // Recordatorio a la 1 hora
    reminderTimeouts.push(setTimeout(() => {
        showNotification('🤔 Ya es 1 hora. ¿Cómo te sientes?', 'warning');
    }, 60 * 60 * 1000));
    
    // Alerta a las 2 horas
    reminderTimeouts.push(setTimeout(() => {
        showNotification('🛑 2 horas jugando. Es momento de parar', 'critical');
    }, 2 * 60 * 60 * 1000));
}

// Limpiar recordatorios programados
function clearScheduledReminders() {
    reminderTimeouts.forEach(timeout => clearTimeout(timeout));
    reminderTimeouts = [];
}

// Mostrar notificación y actualizar estado de Breathy
function showNotification(message, type = 'info') {
    console.log('🔔 Notificación:', message, `(${type})`);
    
    // Determinar estado de Breathy según el tipo
    let mascotState = 'happy';
    if (type === 'warning') mascotState = 'tired';
    if (type === 'critical') mascotState = 'angry';
    
    // Enviar mensaje a content script para actualizar Breathy
    if (activeTabId) {
        chrome.tabs.sendMessage(activeTabId, {
            type: 'updateMascotState',
            state: mascotState,
            message: message
        }).catch(() => {
            console.log('No se pudo comunicar con content script');
        });
    }
    
    // En el futuro se puede agregar chrome.notifications aquí
}

// Limpiar datos antiguos periódicamente (una vez al día)
function cleanupOldData() {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    chrome.storage.local.get(['casinoSessions', 'dailyStats'], (result) => {
        if (result.casinoSessions) {
            const sessions = result.casinoSessions;
            
            // ✅ NUEVO: Cerrar sesiones huérfanas (más de 4 horas sin cerrar)
            const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000);
            let sesionesCorregidas = 0;
            
            sessions.forEach(session => {
                if (session.startTime && !session.endTime && session.startTime < fourHoursAgo) {
                    // Cerrar sesión huérfana estimando 2 horas de duración máxima
                    const estimatedEndTime = session.startTime + (2 * 60 * 60 * 1000);
                    const estimatedDuration = 2 * 60 * 60 * 1000; // 2 horas
                    
                    session.endTime = estimatedEndTime;
                    session.duration = estimatedDuration;
                    
                    // Actualizar estadísticas diarias
                    const sessionDay = new Date(session.startTime).toISOString().split('T')[0];
                    
                    chrome.storage.local.get(['dailyStats'], (statsResult) => {
                        const dailyStats = statsResult.dailyStats || {};
                        if (!dailyStats[sessionDay]) {
                            dailyStats[sessionDay] = { totalTime: 0, sessions: 0 };
                        }
                        dailyStats[sessionDay].totalTime += estimatedDuration;
                        
                        chrome.storage.local.set({ dailyStats });
                    });
                    
                    sesionesCorregidas++;
                    console.log('🔧 Sesión huérfana corregida:', {
                        id: session.id,
                        tabId: session.tabId || 'legacy',
                        hostname: session.hostname
                    });
                }
            });
            
            // Filtrar sesiones antiguas
            const recentSessions = sessions.filter(
                session => session.startTime > oneWeekAgo
            );
            
            chrome.storage.local.set({ casinoSessions: recentSessions });
            console.log(`🧹 Limpieza completada: ${sesionesCorregidas} sesiones corregidas, datos antiguos eliminados`);
        }
    });
}

// Ejecutar limpieza al iniciar y luego cada 24 horas
cleanupOldData();
setInterval(cleanupOldData, 24 * 60 * 60 * 1000);

// Manejar cierre/suspensión del navegador
chrome.runtime.onSuspend.addListener(() => {
    console.log('💤 Extension suspendida, terminando sesión activa');
    endCasinoSession();
});

// Función para notificar el estado del modo prueba a todas las pestañas del dominio actual
function notificarModoPruebaATodas() {
    if (!activeTabId || !activeCasinoTabs.has(activeTabId)) {
        // FALLBACK: Si no hay activeTabId válido, usar la primera pestaña de casino disponible
        if (activeCasinoTabs.size > 0) {
            const firstEntry = activeCasinoTabs.entries().next().value;
            const firstTabId = firstEntry[0];
            const firstTabInfo = firstEntry[1];
            
            // Notificar a todas las pestañas del dominio de esta primera pestaña
            for (const [tabId, casinoInfo] of activeCasinoTabs) {
                if (casinoInfo.baseDomain === firstTabInfo.baseDomain) {
                    chrome.tabs.sendMessage(tabId, {
                        type: 'modoPruebaChanged',
                        modoPrueba: modoPruebaActivo,
                        timestamp: Date.now()
                    }).catch(error => {
                        console.log(`❌ No se pudo notificar modo prueba a pestaña ${tabId}:`, error);
                    });
                }
            }
        }
        return;
    }
    
    const currentBaseDomain = activeCasinoTabs.get(activeTabId).baseDomain;
    console.log(`🧪 Notificando modo prueba (${modoPruebaActivo ? 'ACTIVO' : 'INACTIVO'}) a pestañas del dominio: ${currentBaseDomain}`);
    
    // Enviar notificación inmediata a todas las pestañas del mismo dominio
    for (const [tabId, casinoInfo] of activeCasinoTabs) {
        if (casinoInfo.baseDomain === currentBaseDomain) {
            chrome.tabs.sendMessage(tabId, {
                type: 'modoPruebaChanged',
                modoPrueba: modoPruebaActivo,
                timestamp: Date.now()
            }).catch(error => {
                console.log(`❌ No se pudo notificar modo prueba a pestaña ${tabId}:`, error);
            });
        }
    }
}

// Listener para mensajes desde content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Mensaje recibido:', request.action, request);
    
    if (request.action === 'getSessionStatus') {
        const status = {
            sessionActive: !!sessionStartTime,
            activeTabId,
            sessionDuration: sessionStartTime ? Date.now() - sessionStartTime : 0,
            startTime: sessionStartTime ? new Date(sessionStartTime).toLocaleTimeString() : null,
            hostname: sessionStartTime ? 'Casino activo' : 'No activo',
            dragonState: currentDragonState
        };
        
        console.log('📊 Estado actual de sesión:', status);
        sendResponse(status);
        return true;
    }
    
    // Mensajes desde content scripts
    if (request.action === 'casinoDetected') {
        console.log('🎰 Casino detectado por content script:', request.hostname);
        startCasinoSession(sender.tab.id, request.hostname);
        
        // Enviar de vuelta si es pestaña principal
        const tabInfo = activeCasinoTabs.get(sender.tab.id);
        const isPrimary = tabInfo?.isPrimary || false;
        
        sendResponse({ 
            success: true, 
            message: 'Sesión iniciada',
            isPrimary: isPrimary
        });
        return true;
    }
    
    // Manejo de dominios personalizados
    if (request.action === 'customDomainDetected') {
        console.log('🎮 Dominio personalizado detectado por content script:', request.hostname);
        startCasinoSession(sender.tab.id, request.hostname);
        
        // Enviar de vuelta si es pestaña principal
        const tabInfo = activeCasinoTabs.get(sender.tab.id);
        const isPrimary = tabInfo?.isPrimary || false;
        
        sendResponse({ 
            success: true, 
            message: 'Sesión iniciada para dominio personalizado',
            isPrimary: isPrimary
        });
        return true;
    }
    
    // REMOVIDO: casinoLeft manejado ahora solo por detección de pestaña/URL
    // El content script ya no envía este mensaje para evitar falsos positivos
    
    // Manejar actualización del estado del dragón
    if (request.action === 'updateDragonState') {
        console.log('🐉 Actualizando estado del dragón:', request.newState);
        currentDragonState = request.newState;
        
        // Actualizar también en el registro de la pestaña activa
        if (activeTabId && activeCasinoTabs.has(activeTabId)) {
            const tabInfo = activeCasinoTabs.get(activeTabId);
            activeCasinoTabs.set(activeTabId, {
                ...tabInfo,
                dragonState: request.newState
            });
        }
        
        sendResponse({ success: true });
        return true;
    }
    
    // Manejar modo de prueba
    if (request.type === 'activarModoPrueba') {
        console.log('🧪 Activando modo de prueba por', request.duracion / 1000, 'segundos');
        modoPruebaActivo = true;
        
        // NUEVO: Si el request viene de una pestaña específica, usarla como referencia temporal
        const originalActiveTabId = activeTabId;
        if (sender.tab && sender.tab.id && activeCasinoTabs.has(sender.tab.id)) {
            activeTabId = sender.tab.id;
        }
        
        // Notificar inmediatamente a todas las pestañas del dominio actual
        notificarModoPruebaATodas();
        
        // Restaurar activeTabId original si se cambió
        if (originalActiveTabId !== activeTabId) {
            activeTabId = originalActiveTabId;
        }
        
        // Reiniciar timer con nueva configuración
        if (sessionStartTime && activeTabId) {
            startSessionTimer();
        }
        
        // Auto-desactivar después del tiempo especificado
        if (modoPruebaTimer) clearTimeout(modoPruebaTimer);
        modoPruebaTimer = setTimeout(() => {
            console.log('🧪 Modo de prueba terminado automáticamente');
            modoPruebaActivo = false;
            notificarModoPruebaATodas();
            if (sessionStartTime && activeTabId) {
                startSessionTimer(); // Volver al timer normal
            }
        }, request.duracion);
        
        sendResponse({ success: true });
        return true;
    }
    
    if (request.type === 'desactivarModoPrueba') {
        console.log('🧪 Desactivando modo de prueba manualmente');
        modoPruebaActivo = false;
        
        // NUEVO: Si el request viene de una pestaña específica, usarla como referencia temporal
        const originalActiveTabId = activeTabId;
        if (sender.tab && sender.tab.id && activeCasinoTabs.has(sender.tab.id)) {
            activeTabId = sender.tab.id;
        }
        
        // Notificar desactivación a todas las pestañas
        notificarModoPruebaATodas();
        
        // Restaurar activeTabId original si se cambió
        if (originalActiveTabId !== activeTabId) {
            activeTabId = originalActiveTabId;
        }
        
        if (modoPruebaTimer) {
            clearTimeout(modoPruebaTimer);
            modoPruebaTimer = null;
        }
        
        // Reiniciar timer con configuración normal
        if (sessionStartTime && activeTabId) {
            startSessionTimer();
        }
        
        sendResponse({ success: true });
        return true;
    }
    
    if (request.action === 'casinoHeartbeat') {
        console.log('💓 Heartbeat desde casino:', request.hostname);
        lastActivityTime = Date.now();
        sendResponse({ success: true });
        return true;
    }
    
    return false;
});

console.log('✅ Background script configurado correctamente');
