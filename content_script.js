// ===== BREATHY - CONTENT SCRIPT PRINCIPAL =====
// Los módulos (constants, config-manager, casino-detector, ui-manager,
// session-manager, tutorial-manager) se cargan antes según el orden del manifest.

/************ VARIABLES GLOBALES ************/
let sessionStartTime = null;
let shouldShowDragon = false;

// Configuración activa (copia de currentSettings tras la carga)
let CONFIG = {};

// Marca compartida entre pestañas: el popup de reflexión solo se muestra
// una vez por sesión de casino (el background la limpia al terminar la sesión)
const CASINO_SESSION_KEY = 'reflectionPopupShown_casinoSession';

/************ INICIALIZACIÓN ************/
loadConfiguration(() => {
    CONFIG = { ...currentSettings };

    const detectedByFunction = isGamblingWebsite();
    const gameWindow = window.isGameWindow();
    const shouldActivate = detectedByFunction || gameWindow;

    if (shouldActivate) {
        chrome.storage.local.get([CASINO_SESSION_KEY], (result) => {
            if (!result[CASINO_SESSION_KEY]) {
                // Primera entrada de la sesión: mostrar popup de reflexión
                window.showReflectionPopup(
                    () => markReflectionShown(activateOnCasino),
                    () => markReflectionShown()
                );
            } else {
                activateOnCasino();
            }
        });
    }

    // Manejador de mensajes del background script (siempre activo)
    setupBackgroundMessageHandler();

    // Listener para dominios personalizados registrados por el usuario
    setupCustomDomainListener();

    // Listener para cambios de respiración continua desde el popup
    setupContinuousBreathingListener();

    // Tutorial automático en sitios de casino (solo la primera vez)
    initializeTutorial(shouldActivate);
});

/**
 * Guardar la marca de popup mostrado y continuar con el flujo indicado.
 */
function markReflectionShown(next) {
    chrome.storage.local.set({ [CASINO_SESSION_KEY]: true }, () => {
        if (typeof next === 'function') next();
    });
}

/**
 * Notificar la detección al background y activar el dragón si corresponde.
 */
function activateOnCasino() {
    try {
        chrome.runtime.sendMessage({
            action: 'casinoDetected',
            hostname: window.location.hostname
        }, (response) => {
            if (chrome.runtime.lastError) {
                // Background no disponible: activar en ventanas de juego como fallback
                if (window.isGameWindow()) {
                    shouldShowDragon = true;
                    initializeExtension();
                }
                return;
            }

            const shouldShow = (response && response.isPrimary) || window.isGameWindow();
            if (shouldShow) {
                shouldShowDragon = true;
                initializeExtension();
            }
        });
    } catch (error) {
        if (window.isGameWindow()) {
            shouldShowDragon = true;
            initializeExtension();
        }
    }
}

function initializeExtension() {
    try {
        sessionStartTime = Date.now();

        resetDragonStateForNewSession();
        addAnimationCSS();

        // Crear mascota con estado happy; el background sincroniza el estado real
        crearMascota(CONFIG.breathingPattern || '4-4', 'happy');

        chrome.runtime.sendMessage({ action: 'getSessionStatus' }, () => {
            // El estado se sincroniza automáticamente vía sessionTimeUpdate
            void chrome.runtime.lastError;
        });
    } catch (error) {
        console.error('Breathy: error inicializando la extensión:', error);
    }
}

/************ LIMPIEZA ************/
function removeMascota() {
    const mascot = document.getElementById('breathyContainer');
    if (mascot) {
        mascot.remove();
    }
}

function cleanupExtension() {
    try {
        detenerRespiracionContinua();
        removeMascota();
    } catch (error) {
        // La página se está descargando: ignorar
    }
}

/************ DOMINIOS PERSONALIZADOS ************/
function setupCustomDomainListener() {
    window.addEventListener('breathyActivateCustomDomain', (event) => {
        if (shouldShowDragon) return;
        shouldShowDragon = true;

        try {
            chrome.runtime.sendMessage({
                action: 'customDomainDetected',
                hostname: event.detail.hostname
            }, (response) => {
                if (chrome.runtime.lastError) {
                    initializeExtension();
                    return;
                }
                if (response && response.isPrimary) {
                    initializeExtension();
                }
            });
        } catch (error) {
            initializeExtension();
        }
    });
}

/************ RESPIRACIÓN CONTINUA ************/
function setupContinuousBreathingListener() {
    window.addEventListener('continuousBreathingChanged', (event) => {
        const { enabled } = event.detail;
        CONFIG.continuousBreathing = enabled;

        const dragonContainer = document.getElementById('dragonVideoContainer');
        if (!dragonContainer) return;

        if (enabled) {
            aplicarRespiracionContinua(dragonContainer);
        } else {
            detenerRespiracionContinua();
        }
    });
}

/************ EVENTOS DE PÁGINA ************/
window.addEventListener('pagehide', cleanupExtension);

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && shouldShowDragon && !document.getElementById('breathyContainer')) {
        initializeExtension();
    }
});

/************ MASCOTA ************/
let mascotResizeHandler = null;

function crearMascota(patronRespiracion, estado = 'happy') {
    // Eliminar mascota existente si la hay
    const existingMascot = document.getElementById('breathyContainer');
    if (existingMascot) {
        existingMascot.remove();
    }

    const container = document.createElement('div');
    container.id = 'breathyContainer';

    // Posición según configuración y tamaño de ventana
    let positionStyles = '';
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if (CONFIG.customPosition) {
        // Posición personalizada (el usuario arrastró el dragón), acotada a la ventana
        const safeX = Math.max(10, Math.min(CONFIG.customPosition.x, windowWidth - 160));
        const safeY = Math.max(10, Math.min(CONFIG.customPosition.y, windowHeight - 210));
        positionStyles = `top: ${safeY}px; left: ${safeX}px;`;
    } else if (windowWidth < 500 || windowHeight < 400) {
        // Ventana pequeña (popups de juego): centro-derecha
        positionStyles = 'top: 50%; right: 10px; transform: translateY(-50%);';
    } else {
        positionStyles = 'bottom: 10px; right: 10px;';
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

    // Contenedor circular para el video del dragón
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

    mascotVideo.autoplay = true;
    mascotVideo.loop = true;
    mascotVideo.muted = true; // Necesario para autoplay
    mascotVideo.playsInline = true;

    const dragonState = DRAGON_STATES[estado] || DRAGON_STATES.happy;
    mascotVideo.src = chrome.runtime.getURL(dragonState.video);

    mascotVideo.onerror = () => {
        createFallbackMascot(container);
    };

    // Bocadillo de diálogo
    const speechBubble = document.createElement('div');
    speechBubble.id = 'textoResp';
    speechBubble.className = `dragon-speech-bubble speaking state-${estado} position-${CONFIG.mascotPosition || 'bottom-right'}`;
    speechBubble.style.cssText = 'margin-bottom: 15px;';

    const speechText = document.createElement('span');
    speechText.className = 'speech-text';
    const mensajeFn = UI_TEXTS.dragonMessages[estado] || UI_TEXTS.dragonMessages.happy;
    speechText.textContent = typeof mensajeFn === 'function' ? mensajeFn() : mensajeFn;

    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.textContent = '×';
    closeButton.title = getI18nMessage('hideSpeech', 'Ocultar conversación');

    speechBubble.appendChild(speechText);
    speechBubble.appendChild(closeButton);

    // Respetar la preferencia previa del usuario
    let speechHidden = false;
    try {
        speechHidden = localStorage.getItem('dragonSpeechHidden') === 'true';
    } catch (error) { /* storage bloqueado por el sitio */ }
    if (speechHidden) {
        speechBubble.classList.add('hidden');
    }

    const mascotContainer = document.createElement('div');
    mascotContainer.style.cssText = `
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        padding-top: 10px;
    `;

    // Botón para volver a mostrar el bocadillo
    const showSpeechButton = document.createElement('button');
    showSpeechButton.className = 'show-speech-button';
    showSpeechButton.textContent = '💬';
    showSpeechButton.title = getI18nMessage('showSpeech', 'Mostrar conversación del dragón');
    showSpeechButton.style.display = speechHidden ? 'block' : 'none';

    mascotContainer.appendChild(speechBubble);
    mascotContainer.appendChild(showSpeechButton);

    videoContainer.appendChild(mascotVideo);
    mascotContainer.appendChild(videoContainer);
    container.appendChild(mascotContainer);

    closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        speechBubble.classList.add('hidden');
        showSpeechButton.style.display = 'block';
        try {
            localStorage.setItem('dragonSpeechHidden', 'true');
        } catch (error) { /* ignorar */ }
    });

    showSpeechButton.addEventListener('click', (e) => {
        e.stopPropagation();
        speechBubble.classList.remove('hidden');
        showSpeechButton.style.display = 'none';
        try {
            localStorage.setItem('dragonSpeechHidden', 'false');
        } catch (error) { /* ignorar */ }

        speechBubble.classList.remove('speaking');
        setTimeout(() => {
            speechBubble.classList.add('speaking');
        }, 50);
    });

    speechBubble.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Arrastre del dragón
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    let dragStartTime = 0;
    let dragDistance = 0;
    let startPosition = { x: 0, y: 0 };

    container.addEventListener('mousedown', (e) => {
        // No iniciar arrastre desde el bocadillo o sus botones
        if (e.target.closest('#textoResp') || e.target.closest('.show-speech-button')) {
            return;
        }

        e.preventDefault();

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

    // Clic corto en el dragón → iniciar respiración guiada
    videoContainer.addEventListener('click', (e) => {
        e.stopPropagation();

        const clickDuration = Date.now() - dragStartTime;
        const wasQuickClick = clickDuration < 200;
        const wasSmallMovement = dragDistance < 10;

        if (wasQuickClick && wasSmallMovement) {
            iniciarRespiracion(CONFIG.breathingPattern);
        }
    });

    function handleMouseMove(e) {
        if (!isDragging) return;

        const currentDistance = Math.sqrt(
            Math.pow(e.clientX - startPosition.x, 2) +
            Math.pow(e.clientY - startPosition.y, 2)
        );
        dragDistance = Math.max(dragDistance, currentDistance);

        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        const maxX = window.innerWidth - container.offsetWidth;
        const maxY = window.innerHeight - container.offsetHeight;

        container.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
        container.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
        container.style.right = 'auto';
        container.style.bottom = 'auto';
    }

    function handleMouseUp() {
        if (dragDistance > 10) {
            const rect = container.getBoundingClientRect();
            saveCustomPosition({ x: rect.left, y: rect.top });
        }

        container.classList.remove('dragging');
        container.style.transition = 'all 0.3s ease';
        isDragging = false;

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

    document.body.appendChild(container);
    initializeDragonState(estado);

    // Reposicionar si la ventana cambia de tamaño y el dragón queda fuera
    if (mascotResizeHandler) {
        window.removeEventListener('resize', mascotResizeHandler);
    }
    let resizeTimeout;
    mascotResizeHandler = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const el = document.getElementById('breathyContainer');
            if (!el) return;

            const rect = el.getBoundingClientRect();
            const isVisible = rect.right > 0 && rect.bottom > 0 &&
                rect.left < window.innerWidth && rect.top < window.innerHeight;

            if (!isVisible || window.innerWidth < 500 || window.innerHeight < 400) {
                el.style.top = '50%';
                el.style.right = '10px';
                el.style.bottom = 'auto';
                el.style.left = 'auto';
                el.style.transform = 'translateY(-50%)';
            }
        }, 250);
    };
    window.addEventListener('resize', mascotResizeHandler);

    // Respiración continua si está habilitada
    if (CONFIG.continuousBreathing) {
        aplicarRespiracionContinua(videoContainer);
    }
}

// Mascota de emergencia si el video no carga
function createFallbackMascot(container) {
    container.textContent = '';

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

    const textoFallback = document.createElement('div');
    textoFallback.style.cssText = `
        margin-top: 8px;
        color: #fff;
        font-weight: bold;
        font-size: 12px;
        text-align: center;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
    `;
    textoFallback.textContent = getI18nMessage('clickToBreathe', 'Haz clic para respirar');

    container.appendChild(fallbackDiv);
    container.appendChild(textoFallback);
}

/************ RESPIRACIÓN CONTINUA (halo plateado) ************/
let continuousBreathingInterval = null;
let currentBreathingElement = null;

function parseBreathingPattern(pattern) {
    const parts = String(pattern).split('-').map(num => parseInt(num, 10));

    if (parts.length === 2 && parts.every(Number.isFinite)) {
        return {
            inhale: parts[0] * 1000,
            hold: 0,
            exhale: parts[1] * 1000,
            total: (parts[0] + parts[1]) * 1000
        };
    }
    if (parts.length === 3 && parts.every(Number.isFinite)) {
        return {
            inhale: parts[0] * 1000,
            hold: parts[1] * 1000,
            exhale: parts[2] * 1000,
            total: (parts[0] + parts[1] + parts[2]) * 1000
        };
    }
    return { inhale: 4000, hold: 0, exhale: 4000, total: 8000 };
}

function aplicarRespiracionContinua(element) {
    if (!element || !CONFIG.continuousBreathing) return;

    detenerRespiracionContinua();
    currentBreathingElement = element;

    const breathingTiming = parseBreathingPattern(CONFIG.breathingPattern || '4-4');

    // Halo plateado elegante
    const colorHaloPlateado = '#c0c5d0';
    const colorHaloPlateadoInterno = '#e2e8f0';
    const colorHaloPlateadoBrillo = '#f8fafc';

    const exhaleStyles = (el) => {
        el.style.boxShadow = `
            0 0 0 2px ${colorHaloPlateadoInterno}aa,
            0 0 0 4px ${colorHaloPlateado}88,
            0 0 0 6px ${colorHaloPlateado}55,
            0 0 15px ${colorHaloPlateado}77,
            0 0 30px ${colorHaloPlateado}44,
            0 0 45px ${colorHaloPlateadoBrillo}22,
            inset 0 0 8px ${colorHaloPlateadoBrillo}11
        `;
        el.style.filter = `
            contrast(1.05)
            brightness(1.1)
            saturate(0.95)
            drop-shadow(0 0 4px ${colorHaloPlateado}44)
        `;
    };

    function aplicarAnimacionRespiracion() {
        if (!currentBreathingElement || !CONFIG.continuousBreathing) return;

        // FASE 1: INHALAR
        currentBreathingElement.style.transition = `all ${breathingTiming.inhale}ms ease-in-out`;
        currentBreathingElement.style.transform = 'scale(1.08)';
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

        setTimeout(() => {
            if (!currentBreathingElement || !CONFIG.continuousBreathing) return;

            if (breathingTiming.hold > 0) {
                // FASE 2: MANTENER
                currentBreathingElement.style.transition = `all ${breathingTiming.hold}ms ease-in-out`;
                currentBreathingElement.style.transform = 'scale(1.08)';
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

                    // FASE 3: EXHALAR
                    currentBreathingElement.style.transition = `all ${breathingTiming.exhale}ms ease-in-out`;
                    currentBreathingElement.style.transform = 'scale(1)';
                    exhaleStyles(currentBreathingElement);
                }, breathingTiming.hold);
            } else {
                // FASE 3: EXHALAR (sin mantener)
                currentBreathingElement.style.transition = `all ${breathingTiming.exhale}ms ease-in-out`;
                currentBreathingElement.style.transform = 'scale(1)';
                exhaleStyles(currentBreathingElement);
            }
        }, breathingTiming.inhale);
    }

    aplicarAnimacionRespiracion();
    continuousBreathingInterval = setInterval(aplicarAnimacionRespiracion, breathingTiming.total);
}

function detenerRespiracionContinua() {
    if (continuousBreathingInterval) {
        clearInterval(continuousBreathingInterval);
        continuousBreathingInterval = null;
    }

    if (currentBreathingElement) {
        currentBreathingElement.style.transition = 'all 0.5s ease';
        currentBreathingElement.style.transform = 'scale(1)';
        currentBreathingElement.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
        currentBreathingElement.style.filter = 'contrast(1.3) brightness(1.2) saturate(1.1)';
        currentBreathingElement = null;
    }
}

/************ TUTORIAL ************/
/**
 * 🎓 Tutorial automático para nuevos usuarios (solo en sitios de casino, primera vez)
 * @param {Boolean} isCasinoSite - Resultado de la detección inicial
 */
function initializeTutorial(isCasinoSite) {
    if (!isCasinoSite || !window.TutorialManager) return;

    // Esperar a que la mascota esté visible antes de mostrar el tutorial
    setTimeout(() => {
        try {
            const tutorial = new window.TutorialManager();
            tutorial.startTutorial(); // Verifica internamente hasSeenTutorial
        } catch (error) {
            // Tutorial no disponible: no bloquear la extensión
        }
    }, 2000);
}
