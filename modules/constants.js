/**
 * CONSTANTES Y CONFIGURACIÓN DE LA EXTENSIÓN
 * Centraliza los datos estáticos compartidos por content scripts y service worker.
 * (Sintaxis compatible con content scripts y con importScripts en el service worker)
 */

// 🎰 Dominios de casinos - España, LATAM, Reino Unido y principales internacionales
const CASINO_DOMAINS = [
    // === ESPAÑA ===
    "bet365.es", "888sport.es", "pokerstars.es", "winamax.es",
    "betfair.es", "bwin.es", "codere.es", "sportium.es",
    "betsson.es", "luckia.es", "paf.es", "xn--pastn-bta.es",
    "goldenpark.es", "casino.com", "casinobarcelona.es",
    "gran-casino-madrid.es", "williamhill.es", "interwetten.es",
    "yobingo.es", "kirolbet.es", "retabet.es", "suertia.es",
    "rivalo.es", "marathonbet.es", "versus.es", "wanabet.es",
    "betway.es", "zebet.es", "circus.be",

    // === MÉXICO ===
    "caliente.mx", "codere.mx", "bet365.mx", "rushbet.mx",
    "strendus.mx", "winpot.mx", "sportium.mx",

    // === ARGENTINA ===
    "codere.com.ar", "betsson.com.ar", "bet365.com.ar", "betway.com.ar",
    "bplay.com.ar", "casinoclub.com.ar",

    // === COLOMBIA ===
    "wplay.co", "rushbet.co", "betplay.com.co", "codere.com.co",
    "zamba.com", "luckia.co",

    // === CHILE ===
    "enjoybet.cl", "rushbet.cl", "1xbet.cl",

    // === PERÚ ===
    "apuestastotales.com", "inkabet.pe", "doradobet.pe", "rushbet.pe",

    // === REINO UNIDO ===
    "bet365.com", "williamhill.com", "ladbrokes.com", "coral.co.uk",
    "paddypower.com", "skybet.com", "betfair.com", "888casino.com",
    "betvictor.com", "unibet.co.uk", "32red.com", "casumo.com",
    "leovegas.com", "mrgreen.com", "grosvenorcasinos.com",
    "gentingbet.com", "betfred.com", "mansion.com", "partypoker.com",
    "casinoluck.com", "slotsmillion.com", "slotsmagic.com",
    "casinoeuropa.com", "meccabingo.com", "sunbingo.co.uk", "galabingo.com",

    // === MULTI-REGIÓN (Globales) ===
    "betway.com", "betsson.com", "bwin.com", "pokerstars.com",
    "rivalo.com", "sportingbet.com"
];

// 🚫 Sitios que nunca deben tratarse como casinos aunque contengan palabras clave
const EXCLUDED_HOSTNAMES = [
    // Buscadores
    'google.com', 'google.es', 'bing.com', 'yahoo.com', 'yahoo.es',
    'duckduckgo.com', 'yandex.com', 'baidu.com', 'ask.com',
    // Redes sociales y medios
    'wikipedia.org', 'reddit.com', 'youtube.com', 'facebook.com',
    'twitter.com', 'x.com', 'instagram.com', 'linkedin.com', 'tiktok.com',
    // Prensa deportiva (informativa, no de apuestas)
    'espn.com', 'marca.com', 'marca.es', 'as.com', 'sport.es',
    'mundodeportivo.com', 'cope.es', 'cadenaser.com', 'antena3.com',
    'telecinco.es',
    // Comercio
    'amazon.com', 'amazon.es', 'ebay.com', 'aliexpress.com'
];

// 🎯 Palabras clave que por sí solas identifican un sitio de juego
const STRONG_CASINO_KEYWORDS = ['casino', 'apuestas', 'gambling', 'tragamonedas'];

// 🎯 Palabras clave que requieren una segunda señal (indicador de juego en la URL)
const WEAK_CASINO_KEYWORDS = ['bet', 'poker', 'slots', 'apuesta', 'ruleta', 'blackjack', 'bingo', 'wager'];

// 🎯 Segundas señales: términos de juego real en la URL
const GAMBLING_URL_INDICATORS = [
    'jackpot', 'deposit', 'withdrawal', 'bonus-casino', 'freespin',
    'apuesta', 'wager', 'tragamonedas', 'sportsbook'
];

/**
 * Comprueba si un hostname coincide con un dominio (exacto o subdominio).
 */
function hostnameMatchesDomain(hostname, domain) {
    return hostname === domain || hostname.endsWith('.' + domain);
}

/**
 * Comprueba si el hostname pertenece a un casino conocido de la lista.
 */
function matchesKnownCasino(hostname) {
    const clean = hostname.toLowerCase();
    return CASINO_DOMAINS.some(domain => hostnameMatchesDomain(clean, domain));
}

/**
 * Comprueba si el hostname está en la lista de exclusión.
 */
function isExcludedHostname(hostname) {
    const clean = hostname.toLowerCase();
    return EXCLUDED_HOSTNAMES.some(domain => hostnameMatchesDomain(clean, domain));
}

/**
 * Detección heurística para casinos que no están en la lista.
 * Palabras fuertes activan solas; palabras débiles necesitan una segunda señal en la URL.
 */
function looksLikeCasinoSite(hostname, url = '') {
    const cleanHostname = hostname.toLowerCase();
    if (isExcludedHostname(cleanHostname)) return false;

    if (STRONG_CASINO_KEYWORDS.some(kw => cleanHostname.includes(kw))) return true;

    const cleanUrl = url.toLowerCase();
    const hasWeakKeyword = WEAK_CASINO_KEYWORDS.some(kw => cleanHostname.includes(kw));
    const hasSecondSignal = GAMBLING_URL_INDICATORS.some(ind => cleanUrl.includes(ind));
    return hasWeakKeyword && hasSecondSignal;
}

// 🎮 Clave de almacenamiento de dominios personalizados del usuario
const CUSTOM_DOMAINS_STORAGE_KEY = 'customProtectedDomains';

// ⏸️ Pausa de emergencia: timestamp (ms) hasta el que los casinos están bloqueados
const EMERGENCY_PAUSE_KEY = 'emergencyPauseUntil';

// 🆘 Recursos de ayuda profesional (nombres y URLs localizados vía i18n)
const HELP_RESOURCE_KEYS = [
    { nameKey: 'helpLink1Name', urlKey: 'helpLink1Url' },
    { nameKey: 'helpLink2Name', urlKey: 'helpLink2Url' },
    { nameKey: 'helpLink3Name', urlKey: 'helpLink3Url' }
];

// 🐉 Estados del dragón según tiempo de sesión
const DRAGON_STATES = {
    happy: {
        video: 'assets/happy.webm',
        color: '#4ade80' // Verde
    },
    tired: {
        video: 'assets/tired.webm',
        color: '#fbbf24' // Amarillo
    },
    angry: {
        video: 'assets/angry.webm',
        color: '#ef4444' // Rojo
    }
};

// ⚙️ Configuración por defecto de la extensión
const DEFAULT_SETTINGS = {
    breathingPattern: '4-4',
    mascotPosition: 'bottom-right',
    showReminders: true,
    reminderInterval: 30,
    mascotSize: 'medium',
    isDraggable: true,
    continuousBreathing: false
};

// ⏱️ Duración máxima de sesión por defecto (en minutos)
const DEFAULT_SESSION_DURATION = 90;

// 💬 Helper de traducciones (compatible con content scripts y service worker)
function getI18nMessage(key, fallback) {
    try {
        return chrome.i18n.getMessage(key) || fallback;
    } catch (error) {
        return fallback;
    }
}

const UI_TEXTS = {
    // Mensajes del dragón por estado
    dragonMessages: {
        happy: () => getI18nMessage('dragonMessageHappy', 'Disfruta de manera responsable, estoy aquí para acompañarte'),
        tired: () => getI18nMessage('dragonMessageTired', 'Has alcanzado la mitad de tu tiempo. ¿No crees que nos merecemos un descanso?'),
        angry: () => getI18nMessage('dragonMessageAngry', 'Se acabó el tiempo que te marcaste. Sé fiel a tu decisión')
    },

    // Reality checks que aparecen cada 10 minutos durante la sesión
    realityChecks: [
        () => getI18nMessage('realityCheck1', '¿Cómo te sientes hasta ahora? Recuerda que puedes tomar un descanso'),
        () => getI18nMessage('realityCheck2', '¿Estás jugando con dinero que puedes permitirte perder?'),
        () => getI18nMessage('realityCheck3', 'Tómate un momento para hacer unas respiraciones profundas'),
        () => getI18nMessage('realityCheck4', 'Los juegos están diseñados para que sientas que estás cerca de ganar. No caigas en la trampa'),
        () => getI18nMessage('realityCheck5', 'Recuerda: el juego debe ser diversión, no una forma de ganar dinero'),
        () => getI18nMessage('realityCheck6', '¿Hace cuánto que estás jugando? El tiempo vuela'),
        () => getI18nMessage('realityCheck7', 'Pregúntate: ¿este dinero lo necesito para algo importante?'),
        () => getI18nMessage('realityCheck8', '¿Te sientes en control de tus decisiones de juego?'),
        () => getI18nMessage('realityCheck9', '¿Tenías algo que hacer después? No dejes que se te pase la hora'),
        () => getI18nMessage('realityCheck10', 'Antes de seguir jugando, asegúrate de haberte marcado un límite de pérdidas'),
        () => getI18nMessage('realityCheck11', 'Recuerda: no hay ninguna estrategia que garantice ganar, todo es suerte'),
        () => getI18nMessage('realityCheck12', 'Si estás jugando para sentirte mejor, es el peor momento para jugar'),
        () => getI18nMessage('realityCheck13', 'Si algún resultado te ha hecho sentir mal hoy, es señal de parar'),
        () => getI18nMessage('realityCheck14', 'Intentar recuperar lo perdido es una de las principales causas de grandes pérdidas'),
        () => getI18nMessage('realityCheck15', 'El juego nunca debe interferir con tus responsabilidades')
    ]
};
