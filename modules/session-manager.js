// ===== SESSION MANAGER =====
// Gestiona la comunicación con el background script y el estado del dragón

// Estado actual del dragón (fuente de verdad en el content script)
let currentDragonState = 'happy';

// Función para inicializar el estado del dragón
function initializeDragonState(initialState = 'happy') {
    currentDragonState = initialState;
}

// Aplicar un estado del dragón al UI.
// Muestra la pantalla de transición solo en progresiones naturales durante la sesión.
function applyDragonStateToUI(newState, previousState = null, isNaturalProgression = false) {
    const dragonVideo = document.getElementById('dragonVideo');
    const speechBubble = document.getElementById('textoResp');
    const speechText = speechBubble?.querySelector('.speech-text');

    if (!dragonVideo || !speechBubble || !speechText || typeof DRAGON_STATES === 'undefined') {
        return;
    }

    const dragonState = DRAGON_STATES[newState];
    const shouldShowTransition = isNaturalProgression && previousState && previousState !== newState;

    if (shouldShowTransition && typeof mostrarTransicionFase === 'function') {
        mostrarTransicionFase(newState, previousState);
    }

    // Actualizar video con transición suave (tras la pantalla de transición si la hay)
    const delay = shouldShowTransition ? 1500 : 0;
    setTimeout(() => {
        dragonVideo.style.opacity = '0.5';
        setTimeout(() => {
            dragonVideo.src = chrome.runtime.getURL(dragonState.video);
            dragonVideo.style.opacity = '1';
        }, 250);

        const message = typeof UI_TEXTS.dragonMessages[newState] === 'function'
            ? UI_TEXTS.dragonMessages[newState]()
            : UI_TEXTS.dragonMessages[newState];
        speechText.textContent = message;

        speechBubble.className = speechBubble.className.replace(/state-\w+/, `state-${newState}`);

        // Reiniciar animación de habla
        speechBubble.classList.remove('speaking');
        setTimeout(() => {
            speechBubble.classList.add('speaking');
        }, 50);
    }, delay);
}

// Reiniciar el estado del dragón al inicio de una nueva sesión
function resetDragonStateForNewSession() {
    currentDragonState = 'happy';
}

// Actualizar el estado del dragón según el tiempo de sesión transcurrido
function updateDragonState(sessionDurationMinutes) {
    const maxDuration = (typeof sessionMaxDuration !== 'undefined') ? sessionMaxDuration : DEFAULT_SESSION_DURATION;

    // Límites: tired al 50% del tiempo configurado, angry al 100%
    const halfSessionLimit = maxDuration * 0.5;
    const fullSessionLimit = maxDuration;

    let timeBasedState = 'happy';
    if (sessionDurationMinutes >= fullSessionLimit) {
        timeBasedState = 'angry';
    } else if (sessionDurationMinutes >= halfSessionLimit) {
        timeBasedState = 'tired';
    }

    // El dragón solo avanza hacia estados peores, nunca retrocede durante la sesión
    const stateHierarchy = { happy: 0, tired: 1, angry: 2 };
    if (stateHierarchy[timeBasedState] <= stateHierarchy[currentDragonState]) {
        return;
    }

    const oldState = currentDragonState;
    currentDragonState = timeBasedState;
    applyDragonStateToUI(timeBasedState, oldState, true);

    // Notificar al background script del cambio de estado
    try {
        chrome.runtime.sendMessage({
            action: 'updateDragonState',
            newState: timeBasedState
        }).catch(() => {});
    } catch (error) {
        // Contexto invalidado: ignorar
    }
}

// Manejar mensajes del background script
function setupBackgroundMessageHandler() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        // Actualización periódica del tiempo de sesión
        if (request.type === 'sessionTimeUpdate') {
            if (request.realityCheckMessage && typeof mostrarRealityCheck === 'function') {
                mostrarRealityCheck(request.realityCheckMessage);
            }

            const gameWindow = (typeof window.isGameWindow === 'function') && window.isGameWindow();

            // Sincronización de estado explícita desde el background (sin transición)
            if (request.dragonState && request.dragonState !== currentDragonState) {
                const oldState = currentDragonState;
                currentDragonState = request.dragonState;
                applyDragonStateToUI(currentDragonState, oldState, false);
            } else {
                // Calcular estado con el tiempo recibido y la configuración local
                updateDragonState(request.sessionDurationMinutes);
            }

            const showDragon = (typeof shouldShowDragon !== 'undefined' && shouldShowDragon) || gameWindow;

            // Crear el dragón si debe mostrarse y aún no existe (p. ej. ventanas de juego)
            if (showDragon && !document.getElementById('breathyContainer') && typeof crearMascota === 'function') {
                crearMascota(currentSettings?.breathingPattern || '4-4', request.dragonState || currentDragonState || 'happy');
            }

            sendResponse({ success: true });
            return;
        }

        // Health check
        if (request.type === 'healthCheck') {
            sendResponse({
                success: true,
                dragonExists: !!document.getElementById('breathyContainer'),
                hostname: window.location.hostname
            });
            return;
        }

        // Actualización de configuración desde el popup
        if (request.type === 'configChanged') {
            if (request.settings) {
                if (request.settings.breathingPattern && typeof currentSettings !== 'undefined') {
                    currentSettings.breathingPattern = request.settings.breathingPattern;
                }

                if (request.settings.sessionDuration && typeof sessionMaxDuration !== 'undefined') {
                    sessionMaxDuration = request.settings.sessionDuration;
                }

                if (request.settings.continuousBreathing !== undefined && typeof currentSettings !== 'undefined') {
                    const previousValue = currentSettings.continuousBreathing;
                    currentSettings.continuousBreathing = request.settings.continuousBreathing;

                    window.dispatchEvent(new CustomEvent('continuousBreathingChanged', {
                        detail: {
                            enabled: request.settings.continuousBreathing,
                            previousValue
                        }
                    }));
                }
            }
            sendResponse({ success: true });
            return;
        }

        // Mensaje puntual para el bocadillo del dragón (recordatorios del background)
        if (request.type === 'updateMascotState') {
            const speechBubble = document.getElementById('textoResp');
            const speechText = speechBubble?.querySelector('.speech-text');

            if (speechBubble && speechText && request.message) {
                speechText.textContent = request.message;

                if (request.state) {
                    speechBubble.className = speechBubble.className.replace(/state-\w+/, `state-${request.state}`);
                }

                speechBubble.classList.remove('speaking');
                setTimeout(() => {
                    speechBubble.classList.add('speaking');
                }, 50);
            }

            sendResponse({ success: true });
            return;
        }
    });
}
