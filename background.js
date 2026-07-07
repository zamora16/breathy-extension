// Background Service Worker — Breathy Extension
// Usa chrome.alarms + chrome.storage.session para sobrevivir a los reinicios
// del service worker (los timers de JS no son fiables en MV3).

importScripts('modules/constants.js');

// ─── Constantes ───────────────────────────────────────────────────────────────
const TICK_ALARM = 'breathy-session-tick';
const CLEANUP_ALARM = 'breathy-daily-cleanup';
const STATE_KEY = 'bgSessionState';
const REFLECTION_FLAG_KEY = 'reflectionPopupShown_casinoSession';
const REALITY_CHECK_INTERVAL_MIN = 10;
const REMINDER_MINUTES = [30, 60, 120];

// ─── Estado de sesión (espejo en memoria, persistido en storage.session) ─────
function createEmptyState() {
    return {
        sessionStartTime: null,
        activeTabId: null,
        casinoTabs: {},          // tabId → { hostname, baseDomain, startTime, isPrimary, dragonState }
        dragonState: 'happy',
        lastRealityCheckMinute: 0,
        realityCheckIndex: 0,
        remindersShown: [],
        nightNoticeShown: false,
        dailyLimitNotifiedMinute: 0,
        lastUpdateSent: { baseDomain: null, duration: null, dragonState: null }
    };
}

// Clave de día en hora local (dailyStats usa YYYY-MM-DD)
function localDateKey(ts = Date.now()) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

let state = createEmptyState();
let statePromise = null;

function ensureState() {
    if (!statePromise) {
        statePromise = chrome.storage.session.get([STATE_KEY]).then((result) => {
            if (result[STATE_KEY]) {
                state = { ...createEmptyState(), ...result[STATE_KEY] };
            }
            return state;
        }).catch(() => state);
    }
    return statePromise;
}

function persistState() {
    chrome.storage.session.set({ [STATE_KEY]: state }).catch(() => {});
}

// ─── Configuración del usuario ────────────────────────────────────────────────
let sessionDurationMinutesConfig = DEFAULT_SESSION_DURATION;
let dailyLimitMinutesConfig = 0;   // 0 = sin límite diario
let emergencyPauseUntil = 0;       // timestamp; 0 = sin pausa activa

function loadSessionDurationConfig() {
    chrome.storage.sync.get(['sessionDuration', 'dailyLimit', EMERGENCY_PAUSE_KEY], (result) => {
        if (chrome.runtime.lastError) return;
        if (typeof result.sessionDuration === 'number' && result.sessionDuration > 0) {
            sessionDurationMinutesConfig = result.sessionDuration;
        }
        if (typeof result.dailyLimit === 'number' && result.dailyLimit >= 0) {
            dailyLimitMinutesConfig = result.dailyLimit;
        }
        if (typeof result[EMERGENCY_PAUSE_KEY] === 'number') {
            emergencyPauseUntil = result[EMERGENCY_PAUSE_KEY];
        }
    });
}

loadSessionDurationConfig();

// Dominios personalizados del usuario (cache invalidada por onChanged)
let customDomainsCache = null;

function getCustomDomainsList() {
    if (customDomainsCache) return Promise.resolve(customDomainsCache);
    return chrome.storage.sync.get([CUSTOM_DOMAINS_STORAGE_KEY]).then((result) => {
        customDomainsCache = result[CUSTOM_DOMAINS_STORAGE_KEY] || [];
        return customDomainsCache;
    }).catch(() => []);
}

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    if (changes.sessionDuration) {
        const value = changes.sessionDuration.newValue;
        if (typeof value === 'number' && value > 0) {
            sessionDurationMinutesConfig = value;
        }
    }
    if (changes.dailyLimit) {
        const value = changes.dailyLimit.newValue;
        dailyLimitMinutesConfig = (typeof value === 'number' && value >= 0) ? value : 0;
    }
    if (changes[EMERGENCY_PAUSE_KEY]) {
        emergencyPauseUntil = changes[EMERGENCY_PAUSE_KEY].newValue || 0;
        if (Date.now() < emergencyPauseUntil) {
            // Pausa recién activada: cerrar todas las sesiones en curso
            endAllCasinoSessions();
        }
    }
    if (changes[CUSTOM_DOMAINS_STORAGE_KEY]) {
        customDomainsCache = changes[CUSTOM_DOMAINS_STORAGE_KEY].newValue || [];
    }
});

async function endAllCasinoSessions() {
    await ensureState();
    for (const tabId of Object.keys(state.casinoTabs)) {
        await endCasinoSessionForTab(Number(tabId));
    }
}

// ─── Detección de casinos ─────────────────────────────────────────────────────
async function checkIfCasinoSite(hostname, url = '') {
    const clean = hostname.toLowerCase();

    if (matchesKnownCasino(clean)) return true;

    const customDomains = await getCustomDomainsList();
    if (customDomains.some(domain => hostnameMatchesDomain(clean, domain))) return true;

    return looksLikeCasinoSite(clean, url);
}

// ─── Dominio base ─────────────────────────────────────────────────────────────
function getBaseDomain(hostname) {
    const clean = hostname.toLowerCase();

    for (const base of CASINO_DOMAINS) {
        if (clean === base || clean.endsWith('.' + base)) return base;
    }
    return getUniversalBaseDomain(clean);
}

function getUniversalBaseDomain(hostname) {
    const commonSubdomains = [
        'www', 'm', 'mobile', 'app', 'apps', 'play', 'games', 'casino',
        'slots', 'poker', 'live', 'sports', 'deportes', 'apuestas',
        'juegos', 'ruleta', 'blackjack', 'bingo', 'vegas', 'movil'
    ];
    const parts = hostname.toLowerCase().split('.');
    if (parts.length <= 2) return hostname.toLowerCase();

    const thirdFromEnd = parts[parts.length - 3];
    if (!commonSubdomains.includes(thirdFromEnd)) {
        return parts.slice(-3).join('.');
    }
    return parts.slice(-2).join('.');
}

// ─── Listeners de pestañas ────────────────────────────────────────────────────
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        await handleTabChange(tab);
    } catch (error) {
        // La pestaña se cerró antes de poder consultarla
    }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        await handleTabChange(tab);
    }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
    await ensureState();
    if (state.casinoTabs[tabId]) {
        await endCasinoSessionForTab(tabId);
    }
    if (state.activeTabId === tabId) {
        state.activeTabId = null;
        persistState();
    }
});

chrome.tabs.onReplaced.addListener(async (addedTabId, removedTabId) => {
    await ensureState();
    if (state.casinoTabs[removedTabId]) {
        state.casinoTabs[addedTabId] = state.casinoTabs[removedTabId];
        delete state.casinoTabs[removedTabId];
    }
    if (state.activeTabId === removedTabId) {
        state.activeTabId = addedTabId;
    }
    persistState();
});

// ─── Lógica de cambio de pestaña ──────────────────────────────────────────────
async function handleTabChange(tab) {
    if (!tab.url || !/^https?:/.test(tab.url)) return;

    // Con la pausa de emergencia activa no se inician sesiones
    // (el content script muestra el bloqueo)
    if (Date.now() < emergencyPauseUntil) return;

    await ensureState();

    let hostname;
    try {
        hostname = new URL(tab.url).hostname;
    } catch (error) {
        return;
    }

    const isCasinoSite = await checkIfCasinoSite(hostname, tab.url);
    const existingCasinoTab = state.casinoTabs[tab.id];
    const baseDomain = getBaseDomain(hostname);

    if (!isCasinoSite) {
        if (existingCasinoTab) {
            await endCasinoSessionForTab(tab.id);
        }
        return;
    }

    if (existingCasinoTab) {
        if (existingCasinoTab.baseDomain === baseDomain) {
            // Navegación interna: mantener sesión, actualizar hostname
            state.casinoTabs[tab.id] = { ...existingCasinoTab, hostname, baseDomain };
            state.activeTabId = tab.id;
            state.sessionStartTime = existingCasinoTab.startTime;
            persistState();
            ensureTickAlarm();
            return;
        }
        // Cambio a otro casino en la misma pestaña: la sesión global continúa
        await endCasinoSessionForTab(tab.id, true);
    }

    // Buscar sesión activa del mismo dominio en otra pestaña
    let existingSessionTabId = null;
    for (const [tabId, info] of Object.entries(state.casinoTabs)) {
        if (info.baseDomain === baseDomain) {
            existingSessionTabId = Number(tabId);
            break;
        }
    }

    if (existingSessionTabId !== null) {
        // Transferir la sesión a la nueva pestaña
        const existingInfo = state.casinoTabs[existingSessionTabId];
        const isGameWin = isGameWindowUrl(hostname, tab.url);
        const shouldBePrimary = isGameWin || !existingInfo.isPrimary;

        state.casinoTabs[tab.id] = {
            hostname,
            baseDomain,
            startTime: existingInfo.startTime,
            isPrimary: shouldBePrimary,
            dragonState: existingInfo.dragonState || 'happy'
        };
        delete state.casinoTabs[existingSessionTabId];

        state.activeTabId = tab.id;
        state.sessionStartTime = existingInfo.startTime;
        persistState();
        ensureTickAlarm();
    } else {
        await startCasinoSession(tab.id, hostname);
    }
}

// Heurística de ventana de juego (subdominios/lanzadores de juego de casinos)
function isGameWindowUrl(hostname, url) {
    const cleanHostname = hostname.toLowerCase();
    const cleanUrl = (url || '').toLowerCase();
    const hostPatterns = ['cachedownload', 'casino', 'games', 'slots', 'apuestas', 'poker', 'bingo', 'juegos'];
    if (hostPatterns.some(p => cleanHostname.includes(p))) return true;
    return cleanUrl.includes('casinogames') || cleanUrl.includes('gameid=');
}

// ─── Gestión de sesiones ──────────────────────────────────────────────────────
async function startCasinoSession(tabId, hostname) {
    await ensureState();
    if (state.casinoTabs[tabId]) return;

    const now = Date.now();
    const baseDomain = getBaseDomain(hostname);

    let existingPrimary = null;
    for (const info of Object.values(state.casinoTabs)) {
        if (info.baseDomain === baseDomain && info.isPrimary) {
            existingPrimary = info;
            break;
        }
    }

    const isPrimary = !existingPrimary;

    if (isPrimary && !state.sessionStartTime) {
        // Sesión totalmente nueva: reiniciar contadores
        state.dragonState = 'happy';
        state.lastRealityCheckMinute = 0;
        state.realityCheckIndex = 0;
        state.remindersShown = [];
        state.nightNoticeShown = false;
        state.dailyLimitNotifiedMinute = 0;
    }

    const startTime = existingPrimary
        ? existingPrimary.startTime
        : (state.sessionStartTime || now);

    state.casinoTabs[tabId] = {
        hostname,
        baseDomain,
        startTime,
        isPrimary,
        dragonState: state.dragonState
    };

    state.activeTabId = tabId;
    state.sessionStartTime = startTime;
    persistState();

    if (isPrimary) {
        await saveCasinoSession(baseDomain, now, 'start', tabId);
    }

    ensureTickAlarm();

    // Primera actualización inmediata (el alarm periódico tarda en dispararse)
    setTimeout(() => {
        sessionTick().catch(() => {});
    }, 500);
}

async function endCasinoSessionForTab(tabId, preserveGlobalState = false) {
    await ensureState();
    const tabInfo = state.casinoTabs[tabId];
    if (!tabInfo) return;

    const now = Date.now();

    if (tabInfo.isPrimary) {
        await saveCasinoSession(tabInfo.baseDomain, now, 'end', tabId, now - tabInfo.startTime);
    }

    delete state.casinoTabs[tabId];

    const remainingTabs = Object.entries(state.casinoTabs);

    if (remainingTabs.length === 0) {
        state.activeTabId = null;
        if (!preserveGlobalState) {
            state.sessionStartTime = null;
            state.dragonState = 'happy';
            state.lastRealityCheckMinute = 0;
            state.realityCheckIndex = 0;
            state.remindersShown = [];
            state.nightNoticeShown = false;
            state.dailyLimitNotifiedMinute = 0;
            chrome.alarms.clear(TICK_ALARM);
            // Permitir que el popup de reflexión aparezca en la próxima sesión
            chrome.storage.local.remove(REFLECTION_FLAG_KEY).catch(() => {});
        }
    } else if (tabInfo.isPrimary) {
        // Promover otra pestaña del mismo dominio a principal
        for (const [remainingTabId, remainingInfo] of remainingTabs) {
            if (remainingInfo.baseDomain === tabInfo.baseDomain) {
                state.casinoTabs[remainingTabId] = { ...remainingInfo, isPrimary: true };
                state.activeTabId = Number(remainingTabId);
                break;
            }
        }
    }

    persistState();
}

// ─── Tick periódico de sesión (chrome.alarms) ─────────────────────────────────
function ensureTickAlarm() {
    chrome.alarms.get(TICK_ALARM, (alarm) => {
        if (!alarm) {
            chrome.alarms.create(TICK_ALARM, { periodInMinutes: 0.5 });
        }
    });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === TICK_ALARM) {
        await sessionTick();
    } else if (alarm.name === CLEANUP_ALARM) {
        await cleanupOldData();
    }
});

async function sessionTick() {
    await ensureState();

    if (!state.sessionStartTime || Object.keys(state.casinoTabs).length === 0) {
        chrome.alarms.clear(TICK_ALARM);
        return;
    }

    const now = Date.now();
    const sessionDurationMinutes = (now - state.sessionStartTime) / 60000;
    const fullMinutes = Math.floor(sessionDurationMinutes);
    const maxDuration = sessionDurationMinutesConfig;

    // Reality check cada 10 minutos
    let realityCheckMessage = null;
    if (fullMinutes > 0 &&
        fullMinutes % REALITY_CHECK_INTERVAL_MIN === 0 &&
        fullMinutes > state.lastRealityCheckMinute) {
        state.lastRealityCheckMinute = fullMinutes;
        const check = UI_TEXTS.realityChecks[state.realityCheckIndex % UI_TEXTS.realityChecks.length];
        realityCheckMessage = typeof check === 'function' ? check() : check;
        state.realityCheckIndex = (state.realityCheckIndex + 1) % UI_TEXTS.realityChecks.length;
    }

    // Estado del dragón según el límite configurado: tired ≥ 50%, angry ≥ 100%
    let calculatedState = 'happy';
    if (sessionDurationMinutes >= maxDuration) {
        calculatedState = 'angry';
    } else if (sessionDurationMinutes >= maxDuration * 0.5) {
        calculatedState = 'tired';
    }

    const stateHierarchy = { happy: 0, tired: 1, angry: 2 };
    if (stateHierarchy[calculatedState] > stateHierarchy[state.dragonState]) {
        state.dragonState = calculatedState;
    }

    // Recordatorios puntuales (30 min / 1 h / 2 h)
    for (const reminderMinute of REMINDER_MINUTES) {
        if (fullMinutes >= reminderMinute && !state.remindersShown.includes(reminderMinute)) {
            state.remindersShown.push(reminderMinute);
            sendReminder(reminderMinute);
        }
    }

    // Aviso nocturno: jugar de madrugada es un marcador de riesgo
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6 && !state.nightNoticeShown && state.activeTabId) {
        state.nightNoticeShown = true;
        chrome.tabs.sendMessage(state.activeTabId, {
            type: 'updateMascotState',
            state: 'tired',
            message: getI18nMessage('realityCheckNight', 'Es de madrugada. Jugar a estas horas aumenta el riesgo. ¿No sería mejor descansar?')
        }).catch(() => {});
    }

    // Límite diario acumulado (todas las sesiones de hoy + la actual)
    let dailyLimitExceeded = false;
    if (dailyLimitMinutesConfig > 0) {
        try {
            const result = await chrome.storage.local.get(['dailyStats']);
            const todayEnded = result.dailyStats?.[localDateKey()]?.totalTime || 0;
            const totalTodayMinutes = (todayEnded + (now - state.sessionStartTime)) / 60000;

            if (totalTodayMinutes >= dailyLimitMinutesConfig) {
                dailyLimitExceeded = true;
                state.dragonState = 'angry';

                // Recordar cada 10 minutos mientras siga jugando
                const totalFloor = Math.floor(totalTodayMinutes);
                if (state.dailyLimitNotifiedMinute === 0 ||
                    totalFloor - state.dailyLimitNotifiedMinute >= REALITY_CHECK_INTERVAL_MIN) {
                    state.dailyLimitNotifiedMinute = totalFloor;
                    if (state.activeTabId) {
                        chrome.tabs.sendMessage(state.activeTabId, {
                            type: 'updateMascotState',
                            state: 'angry',
                            message: getI18nMessage('dailyLimitReached', 'Has alcanzado tu límite diario de juego. Es momento de parar por hoy')
                        }).catch(() => {});
                    }
                }
            }
        } catch (error) {
            // Storage no disponible: omitir el chequeo en este tick
        }
    }

    // Enviar actualización a las pestañas del dominio activo (si algo cambió)
    const activeInfo = state.casinoTabs[state.activeTabId];
    const currentBaseDomain = activeInfo ? activeInfo.baseDomain : null;

    const changed =
        state.lastUpdateSent.baseDomain !== currentBaseDomain ||
        state.lastUpdateSent.duration !== fullMinutes ||
        state.lastUpdateSent.dragonState !== state.dragonState ||
        realityCheckMessage !== null;

    if (changed && currentBaseDomain) {
        for (const [tabId, info] of Object.entries(state.casinoTabs)) {
            if (info.baseDomain === currentBaseDomain) {
                const update = {
                    type: 'sessionTimeUpdate',
                    sessionDurationMinutes,
                    isPrimary: info.isPrimary,
                    realityCheckMessage
                };
                // Forzar el estado visual solo cuando se supera el límite diario
                // (el estado por tiempo de sesión lo calcula cada pestaña)
                if (dailyLimitExceeded) {
                    update.dragonState = 'angry';
                }
                chrome.tabs.sendMessage(Number(tabId), update).catch(() => {});
            }
        }
        state.lastUpdateSent = {
            baseDomain: currentBaseDomain,
            duration: fullMinutes,
            dragonState: state.dragonState
        };
    }

    persistState();
}

function sendReminder(reminderMinute) {
    const messages = {
        30: {
            state: 'happy',
            text: getI18nMessage('reminder30', '¡Llevas 30 minutos jugando!')
        },
        60: {
            state: 'tired',
            text: getI18nMessage('reminder60', 'Ya es 1 hora. ¿Cómo te sientes?')
        },
        120: {
            state: 'angry',
            text: getI18nMessage('reminder120', '2 horas jugando. Es momento de parar')
        }
    };

    const reminder = messages[reminderMinute];
    if (!reminder || !state.activeTabId) return;

    chrome.tabs.sendMessage(state.activeTabId, {
        type: 'updateMascotState',
        state: reminder.state,
        message: reminder.text
    }).catch(() => {});
}

// ─── Persistencia de historial de sesiones ────────────────────────────────────
async function saveCasinoSession(hostname, timestamp, type, tabId, duration = null) {
    try {
        const today = localDateKey();
        const result = await chrome.storage.local.get(['casinoSessions', 'dailyStats']);
        const sessions = result.casinoSessions || [];
        const dailyStats = result.dailyStats || {};

        if (type === 'start') {
            sessions.push({ id: `session_${timestamp}`, tabId, hostname, startTime: timestamp, endTime: null, duration: null });
            if (!dailyStats[today]) dailyStats[today] = { totalTime: 0, sessions: 0 };
            dailyStats[today].sessions += 1;
        } else if (type === 'end' && sessions.length > 0) {
            const idx = sessions.findIndex(s => s.tabId === tabId && !s.endTime);
            if (idx !== -1) {
                sessions[idx].endTime = timestamp;
                sessions[idx].duration = duration;
                if (!dailyStats[today]) dailyStats[today] = { totalTime: 0, sessions: 0 };
                dailyStats[today].totalTime += duration;
            }
        }

        await chrome.storage.local.set({
            casinoSessions: sessions.slice(-100),
            dailyStats
        });
    } catch (error) {
        console.error('Breathy: error guardando sesión:', error);
    }
}

// ─── Limpieza de datos antiguos ───────────────────────────────────────────────
async function cleanupOldData() {
    try {
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;

        const result = await chrome.storage.local.get(['casinoSessions', 'dailyStats']);
        const sessions = result.casinoSessions || [];
        const dailyStats = result.dailyStats || {};

        // Cerrar sesiones huérfanas (sin endTime tras más de 4 horas)
        for (const session of sessions) {
            if (session.startTime && !session.endTime && session.startTime < fourHoursAgo) {
                session.endTime = session.startTime + 2 * 60 * 60 * 1000;
                session.duration = 2 * 60 * 60 * 1000;

                const sessionDay = localDateKey(session.startTime);
                if (!dailyStats[sessionDay]) dailyStats[sessionDay] = { totalTime: 0, sessions: 0 };
                dailyStats[sessionDay].totalTime += session.duration;
            }
        }

        // Conservar solo estadísticas de los últimos 30 días
        const thirtyDaysAgo = localDateKey(Date.now() - 30 * 24 * 60 * 60 * 1000);
        for (const day of Object.keys(dailyStats)) {
            if (day < thirtyDaysAgo) delete dailyStats[day];
        }

        await chrome.storage.local.set({
            casinoSessions: sessions.filter(s => s.startTime > oneWeekAgo),
            dailyStats
        });
    } catch (error) {
        console.error('Breathy: error limpiando datos antiguos:', error);
    }
}

function scheduleCleanupAlarm() {
    chrome.alarms.get(CLEANUP_ALARM, (alarm) => {
        if (!alarm) {
            chrome.alarms.create(CLEANUP_ALARM, { periodInMinutes: 24 * 60, delayInMinutes: 5 });
        }
    });
}

chrome.runtime.onInstalled.addListener(() => {
    scheduleCleanupAlarm();
    cleanupOldData();
});

chrome.runtime.onStartup.addListener(() => {
    scheduleCleanupAlarm();
});

// ─── Mensajes desde content scripts ───────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
        await ensureState();

        if (request.action === 'getSessionStatus') {
            sendResponse({
                sessionActive: !!state.sessionStartTime,
                activeTabId: state.activeTabId,
                sessionDuration: state.sessionStartTime ? Date.now() - state.sessionStartTime : 0,
                dragonState: state.dragonState
            });
            return;
        }

        if (request.action === 'casinoDetected' || request.action === 'customDomainDetected') {
            if (Date.now() < emergencyPauseUntil) {
                sendResponse({ success: false, paused: true });
                return;
            }
            if (sender.tab?.id != null && request.hostname) {
                await startCasinoSession(sender.tab.id, request.hostname);
                const tabInfo = state.casinoTabs[sender.tab.id];
                sendResponse({ success: true, isPrimary: tabInfo?.isPrimary || false });
            } else {
                sendResponse({ success: false });
            }
            return;
        }

        if (request.action === 'updateDragonState') {
            const stateHierarchy = { happy: 0, tired: 1, angry: 2 };
            if (stateHierarchy[request.newState] !== undefined &&
                stateHierarchy[request.newState] > stateHierarchy[state.dragonState]) {
                state.dragonState = request.newState;
            }
            if (state.activeTabId && state.casinoTabs[state.activeTabId]) {
                state.casinoTabs[state.activeTabId].dragonState = state.dragonState;
            }
            persistState();
            sendResponse({ success: true });
            return;
        }

        sendResponse({ success: false });
    })();

    return true; // Respuesta asíncrona
});
