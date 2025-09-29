// ===== EXTENSIÓN DE CONTROL DE JUEGO - VERSIÓN REFACTORIZADA =====
// Archivo principal que utiliza módulos organizados

console.log('🚀 Breathy Content Script cargándose en:', window.location.hostname, window.location.href);
console.log('📊 Verificando disponibilidad de módulos...');

/************ VARIABLES GLOBALES ************/
// NOTA: currentDragonState ahora se declara en session-manager.js para centralizar la gestión de estado
let sessionStartTime = null;
let shouldShowDragon = false;

// Variable global para configuración (accesible desde las funciones)
let CONFIG = {};

/************ VERIFICACIÓN DE MÓDULOS ************/
// Verificar que todas las funciones necesarias estén disponibles
function waitForModules() {
    return new Promise((resolve) => {
        const checkModules = () => {
            const modulesReady = 
                typeof isGamblingWebsite !== 'undefined' &&
                typeof loadConfiguration !== 'undefined' &&
                typeof setupBackgroundMessageHandler !== 'undefined' &&
                typeof sessionMaxDuration !== 'undefined' &&
                typeof currentSettings !== 'undefined' &&
                typeof DRAGON_STATES !== 'undefined' &&
                typeof addAnimationCSS !== 'undefined' &&
                typeof iniciarRespiracion !== 'undefined' &&
                typeof mostrarTransicionFase !== 'undefined' &&
                typeof resetDragonStateForNewSession !== 'undefined';
            
            if (modulesReady) {
                console.log('✅ Todos los módulos cargados correctamente');
                resolve();
            } else {
                console.log('⏳ Esperando a que se carguen los módulos...');
                setTimeout(checkModules, 100);
            }
        };
        checkModules();
    });
}

/************ INICIALIZACIÓN ************/
// Esperar a que los módulos se carguen antes de inicializar
waitForModules().then(() => {
    loadConfiguration(() => {
        console.log('🔧 Configuración cargada exitosamente');
        
        // Copiar configuración a variable global CONFIG
        CONFIG = { ...currentSettings };
        console.log('📋 CONFIG actualizado:', CONFIG);
        
    const detectedByFunction = isGamblingWebsite();
    
    // Verificación adicional para ventanas de juego específicas
    const hostname = window.location.hostname.toLowerCase();
    const url = window.location.href.toLowerCase();
    
    // Usar función centralizada para detectar ventanas de juego
    const isGameWindow = (typeof window.isGameWindow === 'function') ? 
                       window.isGameWindow(hostname, url) : 
                       // Fallback si la función no está disponible
                       (hostname.includes('cachedownload') || 
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
                        url.includes('blackjack'));
    
    const shouldActivate = detectedByFunction || isGameWindow;
    
    console.log('🔍 Detección de casino:', {
        hostname: window.location.hostname,
        detectedByFunction,
        isGameWindow,
        shouldActivate
    });
        
    if (shouldActivate) {
        console.log('🎰 Sitio de apuestas detectado, activando extensión...');
        
        // Notificar al background script
        try {
            if (chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({
                    action: 'casinoDetected',
                    hostname: window.location.hostname
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log('🔄 Error de contexto al detectar casino:', chrome.runtime.lastError.message);
                        return;
                    }
                    
                    // Verificar si es una ventana de juego
                    const hostname = window.location.hostname.toLowerCase();
                    const url = window.location.href.toLowerCase();
                    
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
                    
                    // Mostrar dragón si es pestaña principal O si es ventana de juego
                    const shouldShow = (response && response.isPrimary) || isGameWindow;
                    
                    if (shouldShow) {
                        shouldShowDragon = true;
                        console.log('🐉 Mostrando dragón:', { 
                            isPrimary: response?.isPrimary, 
                            isGameWindow,
                            hostname: window.location.hostname 
                        });
                        
                        // Inicializar extensión
                        initializeExtension();
                        startContinuousMonitoring();
                    } else {
                        console.log('🌐 Pestaña secundaria - sin dragón');
                    }
                });
            }
        } catch (error) {
            console.log('🔄 Error comunicando con background:', error);
            
            // Verificar si es una ventana de juego para el fallback
            const isGameWindow = window.location.hostname.includes('cachedownload') || 
                               window.location.hostname.includes('juegos') || 
                               window.location.hostname.includes('casino') || 
                               window.location.hostname.includes('games') || 
                               window.location.hostname.includes('slots');
            
            // Fallback: mostrar dragón si es ventana de juego o como último recurso
            if (isGameWindow) {
                console.log('🎮 Ventana de juego detectada - mostrando dragón en fallback');
                shouldShowDragon = true;
                initializeExtension();
                startContinuousMonitoring();
            } else {
                console.log('🌐 Sitio regular - sin dragón en fallback');
            }
        }
    } else {
        console.log('🌐 Sitio regular detectado por función, pero verificando ventana de juego...');
        
        // Verificación adicional para ventanas de juego que no fueron detectadas
        const isGameWindow = window.location.hostname.includes('cachedownload') || 
                           window.location.hostname.includes('juegos') || 
                           window.location.hostname.includes('casino') || 
                           window.location.hostname.includes('games') || 
                           window.location.hostname.includes('slots');
        
        if (isGameWindow) {
            console.log('🎮 Ventana de juego no detectada por función principal - activando manualmente');
            shouldShowDragon = true;
            
            // Notificar al background script como dominio personalizado
            try {
                chrome.runtime.sendMessage({
                    action: 'customDomainDetected',
                    hostname: window.location.hostname
                }, (response) => {
                    console.log('📤 Respuesta de dominio personalizado:', response);
                });
            } catch (error) {
                console.log('🔄 Error notificando dominio personalizado:', error);
            }
            
            initializeExtension();
            startContinuousMonitoring();
        } else {
            console.log('🌐 Sitio completamente regular - extensión en modo pasivo');
        }
    }        // Solicitar permisos de notificación si están habilitadas
        if (CONFIG?.pushNotifications && 'Notification' in window) {
            Notification.requestPermission();
        }
        
        console.log('🚀 Content Script Refactorizado cargado - Líneas reducidas de 1720 a ~180');
        
        // Configurar manejador de mensajes del background script
        setupBackgroundMessageHandler();
        
        // Verificación final para ventanas de juego una vez que el DOM esté listo
        document.addEventListener('DOMContentLoaded', () => {
            const isGameWindow = window.location.hostname.includes('cachedownload') || 
                               window.location.hostname.includes('juegos') || 
                               window.location.hostname.includes('casino') || 
                               window.location.hostname.includes('games') || 
                               window.location.hostname.includes('slots');
            
            if (isGameWindow && !document.getElementById('dragon-mascot')) {
                console.log('🔄 DOM listo: Verificando si necesita crear dragón en ventana de juego');
                console.log('🔍 shouldShowDragon:', shouldShowDragon);
                
                if (shouldShowDragon && typeof crearMascota === 'function') {
                    console.log('🆕 Creando dragón tardíamente en ventana de juego');
                    crearMascota('4-4', currentDragonState || 'happy');
                }
            }
        });
        
        // Si el DOM ya está listo, ejecutar inmediatamente
        if (document.readyState === 'loading') {
            // DOM aún no está listo, el listener de arriba se encargará
        } else {
            // DOM ya está listo, ejecutar verificación inmediata
            setTimeout(() => {
                const isGameWindow = window.location.hostname.includes('cachedownload') || 
                                   window.location.hostname.includes('juegos') || 
                                   window.location.hostname.includes('casino') || 
                                   window.location.hostname.includes('games') || 
                                   window.location.hostname.includes('slots');
                
                if (isGameWindow && !document.getElementById('dragon-mascot')) {
                    console.log('🔄 DOM ya listo: Verificando si necesita crear dragón en ventana de juego');
                    console.log('🔍 shouldShowDragon:', shouldShowDragon);
                    
                    if (shouldShowDragon && typeof crearMascota === 'function') {
                        console.log('🆕 Creando dragón tardíamente en ventana de juego (DOM listo)');
                        crearMascota('4-4', currentDragonState || 'happy');
                    }
                }
            }, 1000);
        }
        
        // Configurar listener para dominios personalizados
        setupCustomDomainListener();
        
        // Configurar listener para cambios de configuración de respiración continua
        setupContinuousBreathingListener();
        
        // Inicializar tutorial automático solo en sitios de casino (primera visita)
        initializeTutorial();
    });
});

function initializeExtension() {
    try {
        console.log('🐉 Iniciando extensión Breathy en:', window.location.hostname);
        console.log('📋 Configuración actual:', CONFIG);
        
        sessionStartTime = Date.now();
        
        // Reiniciar sistema de reality checks para nueva sesión
        if (typeof resetRealityChecks === 'function') {
            resetRealityChecks();
        }
        
        // Reiniciar estado del dragón para nueva sesión
        if (typeof resetDragonStateForNewSession === 'function') {
            resetDragonStateForNewSession();
        }
        
        // Agregar CSS de animaciones usando el módulo UI
        addAnimationCSS();

        // Crear mascota inicialmente con estado happy, luego sincronizar con background
        console.log('🐉 Creando mascota del dragón...');
        crearMascota(CONFIG.breathingPattern || '4-4', 'happy');
        
        // Solicitar estado actual del dragón al background script
        chrome.runtime.sendMessage({ action: 'getSessionStatus' }, (response) => {
            console.log('📊 Respuesta del background script:', response);
            if (response && response.sessionActive) {
                console.log('🔄 Sesión activa detectada, esperando sincronización de estado...');
                // El estado se sincronizará automáticamente via sessionTimeUpdate
            }
        });
        
        console.log('✅ Extensión inicializada correctamente');    } catch (error) {
        console.error('❌ Error inicializando extensión:', error);
    }
}

/************ FUNCIONES AUXILIARES ************/
function createSpeechBubble(message, duration = 3000) {
    const textoResp = document.getElementById('textoResp');
    if (textoResp) {
        const speechText = textoResp.querySelector('.speech-text');
        if (speechText) {
            speechText.textContent = message;
            
            // Mostrar bocadillo si está oculto
            if (textoResp.classList.contains('hidden')) {
                textoResp.classList.remove('hidden');
                setTimeout(() => {
                    textoResp.classList.add('hidden');
                }, duration);
            }
        }
    }
}

// FUNCIÓN ELIMINADA: updateMascotState() - Se usa updateDragonState() del session-manager.js
// para evitar duplicación de lógica y problemas de sincronización de estado

function removeMascota() {
    const mascot = document.getElementById('breathyContainer');
    if (mascot) {
        mascot.remove();
        console.log('🗑️ Mascota removida');
    }
}

/************ GESTIÓN DE NOTIFICACIONES ************/
function showDesktopNotification(title, message, iconType = 'info') {
    if (!CONFIG.pushNotifications) return;
    
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body: message,
            icon: chrome.runtime.getURL(`assets/${iconType}.webm`),
            tag: 'gambling-control-extension'
        });
        
        setTimeout(() => notification.close(), 5000);
    }
}

/************ DETECCIÓN DE COMPORTAMIENTO ************/
function detectGamblingBehavior() {
    const indicators = document.querySelectorAll('[class*="bet"], [class*="stake"], [class*="spin"], [id*="bet"]');
    
    if (indicators.length > 0 && CONFIG.interventionMode) {
        triggerMindfulnessIntervention();
        return true;
    }
    
    return false;
}

function triggerMindfulnessIntervention() {
    const messages = [
        "¿Estás siendo consciente de tus decisiones?",
        "Tómate un momento para respirar profundo",
        "¿Cómo te sientes en este momento?",
        "Recuerda tus límites y objetivos"
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    createSpeechBubble(randomMessage, 4000);
    // ELIMINADO: updateMascotState('tired') - No debe forzar estado, se maneja por tiempo de sesión
    
    showDesktopNotification('Recordatorio Mindful', randomMessage, 'breath');
}

/************ MONITOREO Y LIMPIEZA ************/
function startContinuousMonitoring() {
    setInterval(() => {
        detectGamblingBehavior();
    }, 30000);
}

function cleanupExtension() {
    try {
        detenerRespiracionContinua();
        removeMascota();
        
        if (sessionStartTime) {
            const duration = Math.round((Date.now() - sessionStartTime) / 1000);
            console.log(`🏁 Sesión finalizada. Duración: ${duration}s`);
        }
        
    } catch (error) {
        console.error('❌ Error durante limpieza:', error);
    }
}

/************ CONFIGURACIÓN DE DOMINIOS PERSONALIZADOS ************/
function setupCustomDomainListener() {
    // Escuchar evento personalizado para activar Breathy en dominios personalizados
    window.addEventListener('breathyActivateCustomDomain', (event) => {
        console.log('🎮 Evento de dominio personalizado recibido:', event.detail);
        
        if (!shouldShowDragon) {
            shouldShowDragon = true;
            console.log('🐉 Activando Breathy para dominio personalizado:', event.detail.hostname);
            
            // Notificar al background script
            try {
                if (chrome.runtime && chrome.runtime.sendMessage) {
                    chrome.runtime.sendMessage({
                        action: 'customDomainDetected',
                        hostname: event.detail.hostname
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.log('🔄 Error de contexto al detectar dominio personalizado:', chrome.runtime.lastError.message);
                            return;
                        }
                        
                        if (response && response.isPrimary) {
                            console.log('🐉 Pestaña principal - mostrando dragón para dominio personalizado');
                            initializeExtension();
                            startContinuousMonitoring();
                        } else {
                            console.log('🌐 Pestaña secundaria - sin dragón para dominio personalizado');
                        }
                    });
                }
            } catch (error) {
                console.log('🔄 Error comunicando con background:', error);
                // Fallback: mostrar dragón de todas formas
                initializeExtension();
                startContinuousMonitoring();
            }
        }
    });
    
    console.log('🎮 Listener para dominios personalizados configurado');
}

/************ CONFIGURACIÓN DE RESPIRACIÓN CONTINUA ************/
function setupContinuousBreathingListener() {
    // Escuchar evento personalizado para cambios en respiración continua
    window.addEventListener('continuousBreathingChanged', (event) => {
        console.log('🫁 Evento de cambio de respiración continua recibido:', event.detail);
        
        const { enabled, previousValue } = event.detail;
        
        // Actualizar CONFIG global
        CONFIG.continuousBreathing = enabled;
        
        console.log(`🫁 Respiración continua ${enabled ? 'activada' : 'desactivada'} (anterior: ${previousValue})`);
        
        // Encontrar el contenedor del dragón
        const dragonContainer = document.getElementById('dragonVideoContainer');
        
        if (dragonContainer) {
            if (enabled) {
                // Activar respiración continua
                console.log('▶️ Iniciando respiración continua');
                aplicarRespiracionContinua(dragonContainer);
            } else {
                // Desactivar respiración continua
                console.log('⏹️ Deteniendo respiración continua');
                detenerRespiracionContinua();
            }
        } else {
            console.log('🔍 No se encontró contenedor del dragón para aplicar respiración continua');
        }
    });
    
    console.log('🫁 Listener para cambios de respiración continua configurado');
}

/************ EVENTOS ************/
// Los mensajes del background script se manejan en session-manager.js

window.addEventListener('beforeunload', cleanupExtension);
window.addEventListener('pagehide', cleanupExtension); // Alternativa moderna a 'unload'

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isGamblingWebsite() && !document.getElementById('breathyContainer')) {
        initializeExtension();
    }
});

// ======= FUNCIÓN CREAR MASCOTA (ORIGINAL) =======
function crearMascota(patronRespiracion, estado = 'happy') {
    console.log('🐉 crearMascota llamada con patrón:', patronRespiracion, 'estado:', estado);
    console.log('⚙️ CONFIG.breathingPattern actual:', CONFIG.breathingPattern);
    
    // Eliminar Breathy existente si existe
    const existingMascot = document.getElementById('breathyContainer');
    if (existingMascot) {
        existingMascot.remove();
    }

    // Crear contenedor principal
    const container = document.createElement('div');
    container.id = 'breathyContainer';
    
    // Ajustar posición según configuración y tamaño de ventana
    let positionStyles = '';
    
    // Obtener dimensiones de la ventana
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    console.log('📐 Dimensiones de ventana:', { windowWidth, windowHeight });
    
    // Si hay una posición personalizada guardada (el usuario arrastró el dragón), usarla
    if (CONFIG.customPosition) {
        // Verificar que la posición personalizada sea visible en la ventana actual
        const customX = CONFIG.customPosition.x;
        const customY = CONFIG.customPosition.y;
        
        // Asegurar que esté dentro de los límites visibles (con margen de 150px para el dragón)
        const safeX = Math.max(10, Math.min(customX, windowWidth - 160));
        const safeY = Math.max(10, Math.min(customY, windowHeight - 210));
        
        positionStyles = `top: ${safeY}px; left: ${safeX}px;`;
        console.log('📍 Usando posición personalizada ajustada:', { original: {x: customX, y: customY}, safe: {x: safeX, y: safeY} });
    } else {
        // Posición por defecto adaptativa según tamaño de ventana
        if (windowWidth < 500 || windowHeight < 400) {
            // Ventana pequeña: posicionar en centro-derecha para mejor visibilidad
            positionStyles = 'top: 50%; right: 10px; transform: translateY(-50%);';
            console.log('📱 Ventana pequeña detectada - posición centro-derecha');
        } else {
            // Ventana normal: posición bottom-right tradicional
            positionStyles = 'bottom: 10px; right: 10px;';
            console.log('🖥️ Ventana normal - posición bottom-right');
        }
    }
    
    container.style.cssText = `
        position: fixed;
        ${positionStyles}
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
    `;
    
    // Crear contenedor circular para el video del dragón
    const videoContainer = document.createElement('div');
    videoContainer.id = 'dragonVideoContainer';
    videoContainer.style.cssText = `
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
    `;

    // Crear video de Breathy dragón
    const mascotVideo = document.createElement('video');
    mascotVideo.id = 'dragonVideo';
    mascotVideo.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        filter: 
            contrast(1.3) 
            brightness(1.2)
            saturate(1.1);
    `;
    
    // Configurar video
    mascotVideo.autoplay = true;
    mascotVideo.loop = true;
    mascotVideo.muted = true; // Necesario para autoplay
    mascotVideo.playsInline = true;
    
    // Establecer video según estado
    const dragonState = DRAGON_STATES[estado];
    const videoUrl = chrome.runtime.getURL(dragonState.video);
    mascotVideo.src = videoUrl;
    
    // Manejar errores de carga
    mascotVideo.onerror = () => {
        console.warn('Error cargando video de Breathy, usando fallback');
        createFallbackMascot(container, estado);
        return;
    };
    
    // Texto de instrucción/estado con bocadillo de diálogo
    const speechBubble = document.createElement('div');
    speechBubble.id = 'textoResp';
    speechBubble.className = `dragon-speech-bubble speaking state-${estado} position-${CONFIG.mascotPosition}`;
    speechBubble.style.cssText = `
        margin-bottom: 15px;
    `;
    
    const speechText = document.createElement('span');
    speechText.className = 'speech-text';
    // Ejecutar función si es necesario para obtener mensaje traducido
    const mensaje = typeof UI_TEXTS.dragonMessages[estado] === 'function' 
        ? UI_TEXTS.dragonMessages[estado]() 
        : UI_TEXTS.dragonMessages[estado] || 
          (typeof UI_TEXTS.dragonMessages['happy'] === 'function' 
            ? UI_TEXTS.dragonMessages['happy']() 
            : UI_TEXTS.dragonMessages['happy']);
    speechText.textContent = mensaje;
    
    // Botón de cerrar bocadillo
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '×';
    closeButton.title = 'Ocultar conversación';
    
    speechBubble.appendChild(speechText);
    speechBubble.appendChild(closeButton);
    
    // Verificar si el usuario ha ocultado el bocadillo anteriormente
    const speechHidden = localStorage.getItem('dragonSpeechHidden') === 'true';
    if (speechHidden) {
        speechBubble.classList.add('hidden');
    }
    
    // Ensamblar Breathy - bocadillo siempre arriba del dragón
    const mascotContainer = document.createElement('div');
    mascotContainer.style.cssText = `
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        padding-top: 10px;
    `;
    
    // Botón para mostrar el bocadillo cuando está oculto
    const showSpeechButton = document.createElement('button');
    showSpeechButton.className = 'show-speech-button';
    showSpeechButton.innerHTML = '💬';
    showSpeechButton.title = 'Mostrar conversación del dragón';
    showSpeechButton.style.display = speechHidden ? 'block' : 'none';
    
    mascotContainer.appendChild(speechBubble);
    mascotContainer.appendChild(showSpeechButton);
    
    // Añadir video al contenedor circular
    videoContainer.appendChild(mascotVideo);
    mascotContainer.appendChild(videoContainer);
    
    container.appendChild(mascotContainer);
    
    // Event listeners para ocultar/mostrar bocadillo
    closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        speechBubble.classList.add('hidden');
        showSpeechButton.style.display = 'block';
        localStorage.setItem('dragonSpeechHidden', 'true');
    });
    
    showSpeechButton.addEventListener('click', (e) => {
        e.stopPropagation();
        speechBubble.classList.remove('hidden');
        showSpeechButton.style.display = 'none';
        localStorage.setItem('dragonSpeechHidden', 'false');
        
        // Reiniciar animación de aparición
        speechBubble.classList.remove('speaking');
        setTimeout(() => {
            speechBubble.classList.add('speaking');
        }, 50);
    });
    
    // Event listener para clics en el bocadillo (para expandir/mostrar más información)
    speechBubble.addEventListener('click', (e) => {
        e.stopPropagation();
        // Aquí puedes agregar funcionalidad adicional para el bocadillo si es necesario
        // Por ejemplo, mostrar más información, cambiar el mensaje, etc.
        console.log('🗨️ Clic en bocadillo del dragón');
    });
    
    // Variables para el arrastre
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    let dragStartTime = 0;
    let dragDistance = 0;
    let startPosition = { x: 0, y: 0 };
    
    // Event listeners para el arrastre del contenedor
    container.addEventListener('mousedown', (e) => {
        // Solo permitir arrastre si el clic NO es en el bocadillo o sus botones
        if (e.target.closest('#textoResp') || e.target.closest('.show-speech-button')) {
            return; // No hacer nada si se hace clic en el bocadillo
        }
        
        e.preventDefault();
        
        // Inicializar variables de arrastre
        dragStartTime = Date.now();
        isDragging = true;
        dragDistance = 0;
        
        const rect = container.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        startPosition.x = e.clientX;
        startPosition.y = e.clientY;
        
        container.classList.add('dragging');
        container.style.transition = 'none';
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });
    
    // Event listener específico para clics en el video del dragón
    videoContainer.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Solo iniciar respiración si fue un clic corto y sin arrastre significativo
        const clickDuration = Date.now() - dragStartTime;
        const wasQuickClick = clickDuration < 200; // Menos de 200ms
        const wasSmallMovement = dragDistance < 10; // Menos de 10 píxeles
        
        if (wasQuickClick && wasSmallMovement) {
            console.log('🐉 Clic detectado - iniciando respiración usando módulo UI');
            iniciarRespiracion(CONFIG.breathingPattern);
        } else {
            console.log('🐉 Arrastre detectado - no se inicia respiración');
        }
    });
    
    function handleMouseMove(e) {
        if (isDragging) {
            // Calcular distancia de arrastre
            const currentDistance = Math.sqrt(
                Math.pow(e.clientX - startPosition.x, 2) + 
                Math.pow(e.clientY - startPosition.y, 2)
            );
            dragDistance = Math.max(dragDistance, currentDistance);
            
            // Calcular nueva posición
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            
            // Limitar a los bordes de la ventana
            const maxX = window.innerWidth - container.offsetWidth;
            const maxY = window.innerHeight - container.offsetHeight;
            
            const clampedX = Math.max(0, Math.min(newX, maxX));
            const clampedY = Math.max(0, Math.min(newY, maxY));
            
            // Actualizar posición
            container.style.left = clampedX + 'px';
            container.style.top = clampedY + 'px';
            container.style.right = 'auto';
            container.style.bottom = 'auto';
        }
    }
    
    function handleMouseUp(e) {
        // Verificar si fue un arrastre significativo para guardar posición
        if (dragDistance > 10) {
            // Si se arrastró, guardar nueva posición personalizada
            const rect = container.getBoundingClientRect();
            const customPosition = {
                x: rect.left,
                y: rect.top
            };
            
            // Guardar posición personalizada usando el gestor de configuración
            saveCustomPosition(customPosition);
            
            console.log('🐉 Nueva posición guardada:', customPosition);
        }
        
        // Restaurar cursor y transiciones
        container.classList.remove('dragging');
        container.style.transition = 'all 0.3s ease';
        isDragging = false;
        
        // Remover event listeners globales
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }
    
    // Efectos hover
    container.addEventListener('mouseenter', () => {
        if (!isDragging) {
            mascotVideo.style.transform = 'scale(1.1)';
            mascotVideo.style.filter = `
                drop-shadow(0 6px 20px rgba(0, 0, 0, 0.4))
                contrast(1.3) 
                brightness(1.2)
                saturate(1.1)
            `;
        }
    });
    
    container.addEventListener('mouseleave', () => {
        if (!isDragging) {
            mascotVideo.style.transform = 'scale(1)';
            mascotVideo.style.filter = `
                drop-shadow(0 4px 15px rgba(0, 0, 0, 0.3))
                contrast(1.3) 
                brightness(1.2)
                saturate(1.1)
            `;
        }
    });
    
    // Agregar al DOM
    document.body.appendChild(container);
    initializeDragonState(estado);
    console.log(`🐉 Breathy dragón creada en estado: ${estado}`);
    
    // Listener para reposicionar dragón cuando cambia el tamaño de ventana
    const handleResize = () => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        console.log('🔄 Ventana redimensionada:', { newWidth, newHeight });
        
        // Verificar si el dragón sigue siendo visible
        const rect = container.getBoundingClientRect();
        const isVisible = rect.right > 0 && rect.bottom > 0 && 
                         rect.left < newWidth && rect.top < newHeight;
        
        console.log('👁️ Dragón visible después de redimensión:', isVisible, rect);
        
        if (!isVisible || newWidth < 500 || newHeight < 400) {
            // Reposicionar para ventana pequeña o si no es visible
            console.log('🔧 Reposicionando dragón para mejor visibilidad');
            container.style.top = '50%';
            container.style.right = '10px';
            container.style.bottom = 'auto';
            container.style.left = 'auto';
            container.style.transform = 'translateY(-50%)';
        }
    };
    
    // Agregar listener de resize con debounce
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(handleResize, 250);
    });
    
    // Test de visibilidad para debug
    setTimeout(() => {
        const testElement = document.getElementById('dragon-mascot');
        const containerElement = document.getElementById('breathyContainer');
        
        if (containerElement) {
            const rect = containerElement.getBoundingClientRect();
            const windowInfo = {
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight
            };
            
            console.log('🔍 TEST DE VISIBILIDAD COMPLETO:', {
                containerExists: !!containerElement,
                dragonExists: !!testElement,
                rect: {
                    top: rect.top,
                    right: rect.right,
                    bottom: rect.bottom,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                },
                window: windowInfo,
                isInViewport: rect.right > 0 && rect.bottom > 0 && 
                             rect.left < windowInfo.windowWidth && rect.top < windowInfo.windowHeight,
                computedStyle: window.getComputedStyle(containerElement).position,
                visible: containerElement.style.display !== 'none',
                opacity: window.getComputedStyle(containerElement).opacity
            });
            
            // Forzar posición visible para test
            if (rect.left >= window.innerWidth || rect.top >= window.innerHeight) {
                console.log('🚨 Dragón fuera del viewport - forzando posición visible');
                containerElement.style.cssText = `
                    position: fixed !important;
                    top: 20px !important;
                    right: 20px !important;
                    z-index: 999999 !important;
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    background: rgba(255, 0, 0, 0.5) !important;
                    border: 3px solid yellow !important;
                    width: 150px !important;
                    min-height: 200px !important;
                `;
                console.log('🧪 Posición forzada aplicada para test');
            }
        } else {
            console.log('❌ TEST: Elemento breathyContainer no encontrado en DOM');
        }
    }, 2000);
    
    // Aplicar respiración continua si está habilitada
    if (CONFIG.continuousBreathing) {
        aplicarRespiracionContinua(videoContainer);
    }
}

// Función fallback si no se puede cargar el video
function createFallbackMascot(container) {
    container.innerHTML = '';
    
    // Crear círculo simple como fallback
    const fallbackDiv = document.createElement('div');
    fallbackDiv.style.cssText = `
        width: 160px;
        height: 160px;
        border-radius: 50%;
        background: linear-gradient(135deg, #ff6b6b, #ee5a24);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 64px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        animation: gentlePulse 4s infinite;
    `;
    fallbackDiv.textContent = '🐉';
    
    // Texto simple
    const textoFallback = document.createElement('div');
    textoFallback.style.cssText = `
        margin-top: 8px;
        color: #fff;
        font-weight: bold;
        font-size: 12px;
        text-align: center;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
    `;
    textoFallback.textContent = 'Haz clic para respirar';
    
    container.appendChild(fallbackDiv);
    container.appendChild(textoFallback);
    console.log('🔄 Usando Breathy fallback');
}

// Variables para respiración continua
let continuousBreathingInterval = null;
let currentBreathingElement = null;

// Función para parsear patrones de respiración
function parseBreathingPattern(pattern) {
    const parts = pattern.split('-').map(num => parseInt(num));
    
    switch (parts.length) {
        case 2: // "4-4" - Inhalar-Exhalar
            return {
                inhale: parts[0] * 1000,
                hold: 0,
                exhale: parts[1] * 1000,
                total: (parts[0] + parts[1]) * 1000
            };
        case 3: // "4-4-4" o "4-7-8" - Inhalar-Mantener-Exhalar
            return {
                inhale: parts[0] * 1000,
                hold: parts[1] * 1000,
                exhale: parts[2] * 1000,
                total: (parts[0] + parts[1] + parts[2]) * 1000
            };
        default:
            // Patrón por defecto si no se puede parsear
            return {
                inhale: 4000,
                hold: 0,
                exhale: 4000,
                total: 8000
            };
    }
}

// Función para aplicar respiración continua
function aplicarRespiracionContinua(element) {
    if (!element || !CONFIG.continuousBreathing) return;
    
    detenerRespiracionContinua(); // Limpiar anterior si existe
    currentBreathingElement = element;
    
    // Obtener patrón de respiración actual
    const pattern = CONFIG.breathingPattern || '4-4';
    const breathingTiming = parseBreathingPattern(pattern);
    
    console.log('🫁 Usando patrón de respiración:', pattern, breathingTiming);
    
    // Efecto de halo plateado elegante - sin colores variables
    const colorHaloPlateado = '#c0c5d0';  // Plateado base
    const colorHaloPlateadoInterno = '#e2e8f0'; // Plateado más claro interno
    const colorHaloPlateadoBrillo = '#f8fafc'; // Brillo plateado muy suave
    
    // Función para crear una animación de respiración
    function aplicarAnimacionRespiracion() {
        if (!currentBreathingElement || !CONFIG.continuousBreathing) return;
        
        // FASE 1: INHALAR - Halo plateado intenso
        currentBreathingElement.style.transition = `all ${breathingTiming.inhale}ms ease-in-out`;
        currentBreathingElement.style.transform = 'scale(1.08)'; // Reducido de 1.12 a 1.08
        currentBreathingElement.style.boxShadow = `
            0 0 0 3px ${colorHaloPlateadoInterno}dd,
            0 0 0 6px ${colorHaloPlateado}bb,
            0 0 0 9px ${colorHaloPlateado}88,
            0 0 25px ${colorHaloPlateado}aa,
            0 0 45px ${colorHaloPlateado}77,
            0 0 65px ${colorHaloPlateadoBrillo}44,
            inset 0 0 15px ${colorHaloPlateadoBrillo}33
        `;
        currentBreathingElement.style.filter = `
            contrast(1.15) 
            brightness(1.2)
            saturate(0.9)
            drop-shadow(0 0 8px ${colorHaloPlateado}66)
        `;
        
        // Programar siguiente fase después de inhalar
        setTimeout(() => {
            if (!currentBreathingElement || !CONFIG.continuousBreathing) return;
            
            if (breathingTiming.hold > 0) {
                // FASE 2: MANTENER - Halo plateado estable
                currentBreathingElement.style.transition = `all ${breathingTiming.hold}ms ease-in-out`;
                currentBreathingElement.style.transform = 'scale(1.08)'; // Mantener el mismo tamaño reducido
                currentBreathingElement.style.boxShadow = `
                    0 0 0 3px ${colorHaloPlateadoInterno}cc,
                    0 0 0 6px ${colorHaloPlateado}aa,
                    0 0 0 9px ${colorHaloPlateado}77,
                    0 0 20px ${colorHaloPlateado}99,
                    0 0 40px ${colorHaloPlateado}66,
                    0 0 60px ${colorHaloPlateadoBrillo}33,
                    inset 0 0 12px ${colorHaloPlateadoBrillo}22
                `;
                
                setTimeout(() => {
                    if (!currentBreathingElement || !CONFIG.continuousBreathing) return;
                    
                    // FASE 3: EXHALAR - Halo plateado suave
                    currentBreathingElement.style.transition = `all ${breathingTiming.exhale}ms ease-in-out`;
                    currentBreathingElement.style.transform = 'scale(1)';
                    currentBreathingElement.style.boxShadow = `
                        0 0 0 2px ${colorHaloPlateadoInterno}aa,
                        0 0 0 4px ${colorHaloPlateado}88,
                        0 0 0 6px ${colorHaloPlateado}55,
                        0 0 15px ${colorHaloPlateado}77,
                        0 0 30px ${colorHaloPlateado}44,
                        0 0 45px ${colorHaloPlateadoBrillo}22,
                        inset 0 0 8px ${colorHaloPlateadoBrillo}11
                    `;
                    currentBreathingElement.style.filter = `
                        contrast(1.05) 
                        brightness(1.1)
                        saturate(0.95)
                        drop-shadow(0 0 4px ${colorHaloPlateado}44)
                    `;
                }, breathingTiming.hold);
                
            } else {
                // FASE 3: EXHALAR (sin mantener) - Halo plateado suave
                currentBreathingElement.style.transition = `all ${breathingTiming.exhale}ms ease-in-out`;
                currentBreathingElement.style.transform = 'scale(1)';
                currentBreathingElement.style.boxShadow = `
                    0 0 0 2px ${colorHaloPlateadoInterno}aa,
                    0 0 0 4px ${colorHaloPlateado}88,
                    0 0 0 6px ${colorHaloPlateado}55,
                    0 0 15px ${colorHaloPlateado}77,
                    0 0 30px ${colorHaloPlateado}44,
                    0 0 45px ${colorHaloPlateadoBrillo}22,
                    inset 0 0 8px ${colorHaloPlateadoBrillo}11
                `;
                currentBreathingElement.style.filter = `
                    contrast(1.05) 
                    brightness(1.1)
                    saturate(0.95)
                    drop-shadow(0 0 4px ${colorHaloPlateado}44)
                `;
            }
        }, breathingTiming.inhale);
    }
    
    // Ejecutar primera animación inmediatamente
    aplicarAnimacionRespiracion();
    
    // Configurar intervalo para repetir la animación
    continuousBreathingInterval = setInterval(aplicarAnimacionRespiracion, breathingTiming.total);
}

// Función para detener respiración continua
function detenerRespiracionContinua() {
    if (continuousBreathingInterval) {
        clearInterval(continuousBreathingInterval);
        continuousBreathingInterval = null;
        console.log('🛑 Respiración continua detenida');
    }
    
    // Restaurar elemento a estado normal
    if (currentBreathingElement) {
        currentBreathingElement.style.transition = 'all 0.5s ease';
        currentBreathingElement.style.transform = 'scale(1)';
        currentBreathingElement.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
        currentBreathingElement.style.filter = 'contrast(1.3) brightness(1.2) saturate(1.1)';
        currentBreathingElement = null;
    }
}

/**
 * 🎓 Inicializar tutorial automático para nuevos usuarios (solo en sitios de casino)
 */
async function initializeTutorial() {
    try {
        // Tutorial automático solo aparece en sitios de casino y solo la primera vez
        const isRelevantSite = await CasinoDetector.isCasinoSite(window.location.hostname);
        
        if (isRelevantSite) {
            // Esperar a que se cargue el tutorial manager
            setTimeout(async () => {
                try {
                    // Cargar el tutorial manager si no está cargado
                    if (!window.TutorialManager) {
                        // Verificar que no se esté cargando ya
                        if (!document.querySelector('script[src*="tutorial-manager.js"]')) {
                            const script = document.createElement('script');
                            script.src = chrome.runtime.getURL('modules/tutorial-manager.js');
                            document.head.appendChild(script);
                            
                            // Esperar a que se cargue
                            await new Promise(resolve => {
                                script.onload = resolve;
                                script.onerror = resolve; // Continuar aunque falle
                            });
                        } else {
                            // Esperar a que termine de cargar
                            await new Promise(resolve => {
                                const checkLoad = () => {
                                    if (window.TutorialManager) {
                                        resolve();
                                    } else {
                                        setTimeout(checkLoad, 100);
                                    }
                                };
                                checkLoad();
                            });
                        }
                    }
                    
                    // Mostrar tutorial automático solo la primera vez
                    if (window.TutorialManager) {
                        const tutorial = new window.TutorialManager();
                        tutorial.startTutorial(); // Este verifica hasSeenTutorial
                    }
                } catch (error) {
                    console.log('ℹ️ Tutorial automático no disponible:', error.message);
                }
            }, 2000);
        }
        
        // NOTA: El tutorial manual (desde popup) funciona en cualquier sitio web
    } catch (error) {
        console.log('ℹ️ No se pudo inicializar tutorial automático:', error.message);
    }
}