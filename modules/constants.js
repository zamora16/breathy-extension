/**
 * 🎯 CONSTANTES Y CONFIGURACIÓN DE LA EXTENSIÓN
 * Este archivo centraliza todos los datos estáticos de la aplicación
 * (Usando sintaxis compatible con content scripts)
 */

// 🎰 Dominios de casinos españoles y principales internacionales
const CASINO_DOMAINS = [
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

// 🎮 Dominios personalizados registrados por el usuario
// Esta constante será utilizada como respaldo, los dominios reales se guardan en localStorage
const CUSTOM_DOMAINS_STORAGE_KEY = 'customProtectedDomains';

// 🫁 Patrones de respiración disponibles
const BREATHING_PATTERNS = {
    simple: {
        name: "Simple",
        pattern: "4-4",
        description: "Inhala 4 segundos, exhala 4 segundos"
    },
    relajante: {
        name: "Relajante", 
        pattern: "4-7-8",
        description: "Inhala 4, mantén 7, exhala 8 segundos"
    },
    equilibrio: {
        name: "Equilibrio",
        pattern: "4-4-4",
        description: "Inhala 4, mantén 4, exhala 4 segundos"
    }
};

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
    mascotPosition: 'bottom-right', // Siempre abajo derecha por defecto
    showReminders: true,
    reminderInterval: 30,
    mascotSize: 'medium',
    isDraggable: true, // Siempre arrastrable
    continuousBreathing: false
};

// ⏱️ Configuración de tiempo de sesión (en minutos)
const DEFAULT_SESSION_DURATION = 90; // 1 hora y 30 minutos por defecto

// 💬 Textos de la interfaz (centralizados con i18n)
// Función auxiliar para obtener traducciones (compatible con módulos)
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
        happy: () => getI18nMessage('dragonMessageHappy', 'Difruta de manera responsable, estoy aquí para acompañarte'),
        tired: () => getI18nMessage('dragonMessageTired', 'Has alcanzado la mitad de tu tiempo. ¿No crees que nos merecemos un descanso?'),
        angry: () => getI18nMessage('dragonMessageAngry', 'Se acabó el tiempo que te marcaste. Sé fiel a tu decisión')
    },
    
    // Reality checks que aparecen cada 10 minutos durante la sesión (usando i18n)
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
        () => getI18nMessage('realityCheck12', '¿Si estás jugando para sentirte mejor, es el peor momento para jugar'),
        () => getI18nMessage('realityCheck13', 'Si algún resultado te ha hecho sentir mal hoy, es señal de parar'),
        () => getI18nMessage('realityCheck14', 'Intentar recuperar lo perdido es una de las principales causas de grandes pérdidas'),
        () => getI18nMessage('realityCheck15', 'El juego nunca debe interferir con tus responsabilidades')
    ],
    
    // Botones y controles
    buttons: {
        closeSpeech: '✕',
        showSpeech: '💬',
        startBreathing: 'Iniciar Respiración',
        stopBreathing: 'Detener'
    },
    
    // Mensajes de debugging/consola
    console: {
        patternLoaded: '🎯 Patrón de respiración cargado:',
        continuousBreathingLoaded: '🫁 Respiración continua cargada:',
        sessionDurationLoaded: '🐉 Tiempo máximo de sesión cargado:',
        customPositionLoaded: '🐉 Posición personalizada cargada:',
        mascotCreated: '🐉 crearMascota llamada con patrón:',
        settingsUpdated: '⚙️ currentSettings.breathingPattern actual:'
    }
};

// 🎨 Estilos CSS reutilizables (como constantes)
const CSS_STYLES = {
    // Contenedor principal de la mascota
    mascotContainer: `
        position: fixed;
        width: 150px;
        min-height: 200px;
        z-index: 9999;
        cursor: grab;
        user-select: none;
        font-family: 'Segoe UI', sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        padding-bottom: 20px;
        transition: all 0.3s ease;
    `,
    
    // Contenedor del video del dragón
    videoContainer: `
        width: 160px;
        height: 160px;
        border-radius: 50%;
        overflow: hidden;
        position: relative;
        transition: all 0.5s ease;
        transform-origin: center;
        background: #000000;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        margin: 15px;
        flex-shrink: 0;
    `,
    
    // Video de la mascota
    mascotVideo: `
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        filter: 
            contrast(1.3) 
            brightness(1.2)
            saturate(1.1);
    `,
    
    // Posición por defecto
    defaultPosition: 'bottom: 10px; right: 10px;'
};

// 🔧 Configuración de comportamiento
const BEHAVIOR_CONFIG = {
    // Detección de clicks vs arrastrado
    quickClickThreshold: 200, // milisegundos
    smallMovementThreshold: 10, // píxeles
    
    // Animaciones y transiciones
    defaultTransitionDuration: 300, // milisegundos
    dragonTransitionDuration: 500, // milisegundos
    
    // Local storage keys
    storageKeys: {
        speechHidden: 'dragonSpeechHidden',
        customPosition: 'mascotCustomPosition'
    }
};