// ===== SESSION MANAGER =====
// Gestiona la comunicación con el background script y el modo de prueba

// Función para obtener mensajes i18n (Chrome extension API)
function getI18nMessage(key, fallback = '') {
    try {
        if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getMessage) {
            const message = chrome.i18n.getMessage(key);
            return message || fallback;
        }
    } catch (error) {
        console.warn(`⚠️ Error getting i18n message for key "${key}":`, error);
    }
    return fallback;
}

// Variable global para el estado actual del dragón
let currentDragonState = 'happy';

// Variables para el sistema de reality checks
let lastRealityCheckTime = 0; // Última vez que se mostró un reality check (en minutos)
let realityCheckIndex = 0; // Índice del próximo mensaje de reality check
const REALITY_CHECK_INTERVAL = 10; // Intervalo en minutos para mostrar reality checks

// Función para inicializar el estado del dragón
function initializeDragonState(initialState = 'happy') {
    currentDragonState = initialState;
    console.log(`🐉 Estado del dragón inicializado a: ${initialState}`);
}

// Función para obtener el estado actual del dragón
function getCurrentDragonState() {
    return currentDragonState;
}

// Función para aplicar un estado del dragón al UI - SOLO para cambios reales durante sesión activa
function applyDragonStateToUI(newState, previousState = null, isNaturalProgression = false) {
    const dragonVideo = document.getElementById('dragonVideo');
    const speechBubble = document.getElementById('textoResp');
    const speechText = speechBubble?.querySelector('.speech-text');
    
    if (dragonVideo && speechBubble && speechText && typeof DRAGON_STATES !== 'undefined') {
        const dragonState = DRAGON_STATES[newState];
        
        // Solo mostrar transición si es una progresión natural durante la sesión activa
        // NO para sincronización, refresh, o inicialización
        const shouldShowTransition = isNaturalProgression && previousState && previousState !== newState;
        
        console.log(`🔍 ANÁLISIS TRANSICIÓN: isNaturalProgression=${isNaturalProgression}, previousState=${previousState}, newState=${newState}, shouldShow=${shouldShowTransition}`);
        
        if (shouldShowTransition) {
            console.log('🎭 *** MOSTRANDO TRANSICIÓN LEGÍTIMA ***:', previousState, '→', newState);
            // Mostrar transición solo para cambios reales durante sesión activa
            if (typeof mostrarTransicionFase === 'function') {
                console.log('✅ Llamando a mostrarTransicionFase');
                mostrarTransicionFase(newState, previousState);
            } else {
                console.error('❌ mostrarTransicionFase NO está disponible');
            }
        } else {
            console.log('🔧 Aplicando estado sin transición:', newState);
        }
        
        // Actualizar video con transición suave (después de la pantalla de transición si la hay)
        const delay = shouldShowTransition ? 1500 : 0;
        setTimeout(() => {
            dragonVideo.style.opacity = '0.5';
            setTimeout(() => {
                dragonVideo.src = chrome.runtime.getURL(dragonState.video);
                dragonVideo.style.opacity = '1';
            }, 250);
            
            // Actualizar mensaje y estado del bocadillo (usando traducciones)
            const message = typeof UI_TEXTS.dragonMessages[newState] === 'function' 
                ? UI_TEXTS.dragonMessages[newState]() 
                : UI_TEXTS.dragonMessages[newState] || UI_TEXTS.dragonMessages['happy']();
            speechText.textContent = message;
            
            // Actualizar clases de estado
            speechBubble.className = speechBubble.className.replace(/state-\w+/, `state-${newState}`);
            
            // Reiniciar animación de habla para dar efecto de "nueva conversación"
            speechBubble.classList.remove('speaking');
            setTimeout(() => {
                speechBubble.classList.add('speaking');
            }, 50);
            
        }, delay);
        
        console.log('✅ Estado aplicado:', newState);
    } else {
        console.warn('❌ No se pudo aplicar estado - elementos faltantes');
    }
}

// Función para aplicar estado sin transición (para sincronización)
function applyDragonStateToUIWithoutTransition(newState) {
    const dragonVideo = document.getElementById('dragonVideo');
    const speechBubble = document.getElementById('textoResp');
    const speechText = speechBubble?.querySelector('.speech-text');
    
    if (dragonVideo && speechBubble && speechText && typeof DRAGON_STATES !== 'undefined') {
        const dragonState = DRAGON_STATES[newState];
        console.log('🔧 Sincronizando UI del dragón:', newState);
        
        // Actualizar video directamente
        dragonVideo.src = chrome.runtime.getURL(dragonState.video);
        
        // Actualizar mensaje y estado del bocadillo (usando traducciones)
        const message = typeof UI_TEXTS.dragonMessages[newState] === 'function' 
            ? UI_TEXTS.dragonMessages[newState]() 
            : UI_TEXTS.dragonMessages[newState] || UI_TEXTS.dragonMessages['happy']();
        speechText.textContent = message;
        
        // Actualizar clases de estado
        speechBubble.className = speechBubble.className.replace(/state-\w+/, `state-${newState}`);
        
        console.log('✅ UI sincronizado correctamente');
    } else {
        console.warn('❌ No se pudo sincronizar UI - elementos faltantes');
    }
}

// Función para verificar y mostrar reality checks cada 10 minutos
function checkAndShowRealityCheck(sessionDurationMinutes) {
    // Verificar si es hora de mostrar un reality check
    const minutosCompletos = Math.floor(sessionDurationMinutes);
    
    // Solo mostrar si han pasado al menos 10 minutos desde el último
    if (minutosCompletos > 0 && 
        minutosCompletos % REALITY_CHECK_INTERVAL === 0 && 
        minutosCompletos > lastRealityCheckTime) {
        
        lastRealityCheckTime = minutosCompletos;
        
        // Verificar que UI_TEXTS esté disponible
        if (typeof UI_TEXTS !== 'undefined' && UI_TEXTS.realityChecks) {
            const realityCheckFunc = UI_TEXTS.realityChecks[realityCheckIndex];
            const mensaje = typeof realityCheckFunc === 'function' ? realityCheckFunc() : realityCheckFunc;
            
            // Mostrar el reality check usando la misma UI que los mensajes del dragón
            if (typeof mostrarRealityCheck === 'function') {
                mostrarRealityCheck(mensaje);
                console.log(`🔔 Reality check mostrado (${minutosCompletos} min): ${mensaje}`);
            }
            
            // Avanzar al siguiente mensaje (con wraparound)
            realityCheckIndex = (realityCheckIndex + 1) % UI_TEXTS.realityChecks.length;
        }
    }
}

// Función para reiniciar el sistema de reality checks (al inicio de nueva sesión)
function resetRealityChecks() {
    lastRealityCheckTime = 0;
    realityCheckIndex = 0;
    console.log('🔄 Sistema de reality checks reiniciado');
}

// Función para reiniciar el estado del dragón al inicio de una nueva sesión
function resetDragonStateForNewSession() {
    currentDragonState = 'happy';
    console.log('🐉 Estado del dragón reiniciado a happy para nueva sesión');
}

// Función para actualizar el estado del dragón basado en tiempo de sesión
function updateDragonState(sessionDurationMinutes) {
    // NOTA: Los reality checks ahora se manejan centralmente desde el background script
    // Se han removido de aquí para evitar duplicación entre ventanas
    
    // Usar sessionMaxDuration del config-manager, con fallback a 30 minutos
    const maxDuration = (typeof sessionMaxDuration !== 'undefined') ? sessionMaxDuration : 30;
    
    console.log(`⚙️ CONFIGURACIÓN: sessionMaxDuration=${typeof sessionMaxDuration !== 'undefined' ? sessionMaxDuration : 'undefined'}, usando maxDuration=${maxDuration}`);
    
    // IMPORTANTE: El dragón solo puede avanzar hacia estados peores, nunca retroceder
    // Empezar con el estado actual del dragón como base
    let newState = currentDragonState;
    
    // Calcular límites basados en el tiempo máximo de sesión configurado
    const halfSessionLimit = maxDuration * 0.5;    // 50% del tiempo máximo (en minutos)
    const fullSessionLimit = maxDuration;           // 100% del tiempo máximo (en minutos)
    
    // Determinar el estado que corresponde según el tiempo transcurrido
    let timeBasedState = 'happy'; // Estado base según tiempo
    if (sessionDurationMinutes >= fullSessionLimit) {
        timeBasedState = 'angry';
    } else if (sessionDurationMinutes >= halfSessionLimit) {
        timeBasedState = 'tired';
    }
    
    console.log(`⏰ ANÁLISIS DE ESTADO: tiempo=${sessionDurationMinutes.toFixed(2)}min, limites=[tired≥${halfSessionLimit}, angry≥${fullSessionLimit}]`);
    console.log(`🎯 Estado calculado por tiempo: ${timeBasedState}, Estado actual: ${currentDragonState}`);
    
    // Definir jerarquía de estados (de mejor a peor)
    const stateHierarchy = { 'happy': 0, 'tired': 1, 'angry': 2 };
    
    // Solo avanzar si el nuevo estado es peor que el actual
    if (stateHierarchy[timeBasedState] > stateHierarchy[currentDragonState]) {
        newState = timeBasedState;
        console.log(`✅ CAMBIO DETECTADO: ${currentDragonState} → ${newState} (jerarquía: ${stateHierarchy[currentDragonState]} → ${stateHierarchy[newState]})`);
    } else {
        console.log(`❌ NO hay cambio: timeBasedState=${timeBasedState} (${stateHierarchy[timeBasedState]}) <= currentState=${currentDragonState} (${stateHierarchy[currentDragonState]})`);
    }
    
    // Solo actualizar si el estado cambió
    if (newState !== currentDragonState) {
        console.log(`🐉 PROGRESIÓN NATURAL: ${currentDragonState} → ${newState} (${sessionDurationMinutes.toFixed(2)} min)`);
        console.log(`📊 Límites: 50%=${halfSessionLimit}min, 100%=${fullSessionLimit}min, Max=${maxDuration}min`);
        
        const oldState = currentDragonState;
        
        // Aplicar el nuevo estado con transición (PROGRESIÓN NATURAL = true)
        applyDragonStateToUI(newState, oldState, true);
        
        // Actualizar variable global
        currentDragonState = newState;
        
        // Notificar al background script del cambio de estado
        chrome.runtime.sendMessage({
            action: 'updateDragonState',
            newState: newState
        }).catch(error => {
            console.log('No se pudo notificar cambio de estado al background script:', error);
        });
    }
}

// Función para mostrar indicador de modo de prueba
function mostrarIndicadorPrueba(sessionDurationMinutes) {
    let indicador = document.getElementById('indicadorPrueba');
    
    if (!indicador) {
        indicador = document.createElement('div');
        indicador.id = 'indicadorPrueba';
        indicador.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #ff6b35;
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            font-weight: bold;
            z-index: 999999;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 2px solid #fff;
        `;
        document.body.appendChild(indicador);
    }
    
    const minutos = Math.floor(sessionDurationMinutes);
    const segundos = Math.floor((sessionDurationMinutes % 1) * 60);
    indicador.innerHTML = `🧪 MODO PRUEBA<br>⏱️ ${minutos}:${segundos.toString().padStart(2, '0')}`;
}

// Función para ocultar indicador de modo de prueba
function ocultarIndicadorPrueba() {
    const indicador = document.getElementById('indicadorPrueba');
    if (indicador) {
        indicador.remove();
    }
}

// Función para manejar mensajes del background script
function setupBackgroundMessageHandler() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        // Actualización de tiempo de sesión para cambiar estado del dragón
        if (request.type === 'sessionTimeUpdate') {
            console.log('📊 Recibido sessionTimeUpdate:', {
                sessionDurationMinutes: request.sessionDurationMinutes,
                isPrimary: request.isPrimary,
                modoPrueba: request.modoPrueba,
                dragonState: request.dragonState,
                realityCheckMessage: request.realityCheckMessage,
                shouldShowDragon: typeof shouldShowDragon !== 'undefined' ? shouldShowDragon : 'undefined',
                dragonExists: !!document.getElementById('dragon-mascot')
            });
            
            // Si se recibe un mensaje de reality check, mostrarlo
            if (request.realityCheckMessage) {
                console.log(`🔔 Mostrando reality check sincronizado: ${request.realityCheckMessage}`);
                if (typeof mostrarRealityCheck === 'function') {
                    mostrarRealityCheck(request.realityCheckMessage);
                } else {
                    console.warn('⚠️ Función mostrarRealityCheck no disponible');
                }
            }
            
            // Verificar si es una ventana de juego que siempre debe mostrar el dragón
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
            
            // Si se recibe un estado del dragón específico, usarlo (para casos especiales)
            if (request.dragonState && request.dragonState !== currentDragonState) {
                console.log(`🔄 SINCRONIZACIÓN ESPECIAL: ${currentDragonState} → ${request.dragonState}`);
                
                const oldState = currentDragonState;
                currentDragonState = request.dragonState;
                
                // SINCRONIZACIÓN = NUNCA mostrar transición (isNaturalProgression = false)
                applyDragonStateToUI(currentDragonState, oldState, false);
            } else {
                // NUEVA LÓGICA: Calcular estado basado en tiempo recibido y configuración local
                // Esto evita desincronización entre background y content script
                updateDragonState(request.sessionDurationMinutes);
            }
            
            // Usar shouldShowDragon si está disponible, sino verificar si existe el dragón
            // IMPORTANTE: Las ventanas de juego SIEMPRE deben mostrar el dragón
            let showDragon = (typeof shouldShowDragon !== 'undefined') 
                ? shouldShowDragon 
                : document.getElementById('dragon-mascot') !== null;
            
            // Forzar mostrar dragón en ventanas de juego, incluso si shouldShowDragon es false
            if (isGameWindow) {
                showDragon = true;
                console.log('🎮 Ventana de juego detectada - forzando mostrar dragón:', hostname);
            }
            
            // NUEVA LÓGICA: Actualizar SIEMPRE si debe mostrar dragón O si es ventana de juego
            // Esto asegura que todas las ventanas del mismo dominio se mantengan sincronizadas
            const shouldUpdate = showDragon || isGameWindow;
            
            // Mostrar indicador de modo de prueba si está activo (independiente del dragón)
            if (request.modoPrueba) {
                mostrarIndicadorPrueba(request.sessionDurationMinutes);
            } else {
                ocultarIndicadorPrueba();
            }
            
            if (shouldUpdate) {
                console.log('🐉 Actualizando UI del dragón...', { 
                    isPrimary: request.isPrimary, 
                    isGameWindow, 
                    showDragon,
                    hostname: window.location.hostname,
                    url: window.location.href,
                    syncMode: 'TODAS_LAS_VENTANAS'
                });
                
                // Verificar si el dragón existe, si no existe, crearlo (para ventanas de juego o si se requiere)
                const dragonExists = !!document.getElementById('dragon-mascot');
                const containerExists = !!document.getElementById('breathyContainer');
                
                if (!containerExists && (isGameWindow || showDragon)) {
                    console.log('🆕 Dragón no existe en ventana de juego/casino, creándolo...', {
                        isGameWindow,
                        showDragon,
                        hostname: window.location.hostname,
                        url: window.location.href
                    });
                    
                    // Forzar creación del dragón con el estado correcto
                    if (typeof crearMascota === 'function') {
                        crearMascota('4-4', request.dragonState || currentDragonState || 'happy');
                    } else {
                        console.warn('⚠️ Función crearMascota no disponible, intentando creación alternativa');
                        
                        // Método alternativo: disparar evento de inicialización
                        if (typeof initializeDragon === 'function') {
                            initializeDragon();
                        }
                    }
                } else if (containerExists) {
                    console.log('✅ Dragón ya existe, no es necesario recrear');
                }
            } else {
                console.log('⏭️ Saltando actualización:', { 
                    isPrimary: request.isPrimary, 
                    isGameWindow, 
                    showDragon,
                    shouldUpdate,
                    hostname: window.location.hostname,
                    url: window.location.href,
                    reason: !showDragon && !isGameWindow ? 'No es ventana de juego y dragón no visible' : 'Condición no cumplida'
                });
            }
            
            sendResponse({ success: true });
            return;
        }
        
        // Health check para verificar si la extensión está funcionando
        if (request.type === 'healthCheck') {
            sendResponse({ 
                success: true, 
                dragonExists: !!document.getElementById('dragon-mascot'),
                hostname: window.location.hostname 
            });
            return;
        }
        
        // Actualización de configuración desde popup
        if (request.type === 'configChanged') {
            if (request.settings) {
                // Actualizar patrón de respiración
                if (request.settings.breathingPattern && typeof currentSettings !== 'undefined') {
                    currentSettings.breathingPattern = request.settings.breathingPattern;
                    console.log('🎯 Patrón de respiración actualizado:', request.settings.breathingPattern);
                }
                
                // Actualizar tiempo máximo de sesión
                if (request.settings.sessionDuration) {
                    if (typeof sessionMaxDuration !== 'undefined') {
                        sessionMaxDuration = request.settings.sessionDuration;
                        console.log('🐉 Tiempo máximo de sesión actualizado:', sessionMaxDuration, 'minutos');
                    }
                }
                
                // Actualizar configuración de respiración continua
                if (request.settings.continuousBreathing !== undefined && typeof currentSettings !== 'undefined') {
                    const oldContinuousBreathing = currentSettings.continuousBreathing;
                    currentSettings.continuousBreathing = request.settings.continuousBreathing;
                    console.log('🫁 Respiración continua actualizada:', request.settings.continuousBreathing);
                    
                    // Notificar cambio de respiración continua al script principal
                    window.dispatchEvent(new CustomEvent('continuousBreathingChanged', {
                        detail: {
                            enabled: request.settings.continuousBreathing,
                            previousValue: oldContinuousBreathing
                        }
                    }));
                }
                
                // Actualizar otras configuraciones si existen
                if (request.settings.mascotPosition && typeof currentSettings !== 'undefined') {
                    const oldPosition = currentSettings.mascotPosition;
                    currentSettings.mascotPosition = request.settings.mascotPosition;
                    
                    // Si cambió la posición, recrear la mascota
                    if (oldPosition !== currentSettings.mascotPosition && typeof crearMascota !== 'undefined') {
                        console.log('📍 Posición del dragón cambiada:', oldPosition, '→', currentSettings.mascotPosition);
                        const existingMascot = document.getElementById('breathyContainer');
                        if (existingMascot) {
                            crearMascota(currentSettings.breathingPattern, currentDragonState);
                        }
                    }
                }
            }
            sendResponse({ success: true });
            return;
        }
        
        // Actualización de estado de la mascota
        if (request.type === 'updateMascotState') {
            const speechBubble = document.getElementById('textoResp');
            const speechText = speechBubble?.querySelector('.speech-text');
            
            if (speechBubble && speechText && request.message) {
                // Actualizar el mensaje
                speechText.textContent = request.message;
                
                // Actualizar las clases de estado
                if (request.state) {
                    speechBubble.className = speechBubble.className.replace(/state-\w+/, `state-${request.state}`);
                }
                
                // Reiniciar animación de habla
                speechBubble.classList.remove('speaking');
                setTimeout(() => {
                    speechBubble.classList.add('speaking');
                }, 50);
            }
            
            sendResponse({ success: true });
            return;
        }
        
        // Manejo del cambio de modo de prueba
        if (request.type === 'modoPruebaChanged') {
            console.log(`🧪 Modo prueba ${request.modoPrueba ? 'activado' : 'desactivado'}`);
            
            // Mostrar/ocultar indicador inmediatamente
            if (request.modoPrueba) {
                // Obtener tiempo actual de sesión desde background script (aproximado)
                const sessionDuration = Date.now() / 60000; // Convertir a minutos como aproximación
                mostrarIndicadorPrueba(sessionDuration);
            } else {
                ocultarIndicadorPrueba();
            }
            
            sendResponse({ success: true });
            return;
        }
    });
}

// CSS adicional para transiciones de fase
function addTransitionCSS() {
    if (!document.getElementById('transitionCSS')) {
        const transitionStyle = document.createElement('style');
        transitionStyle.id = 'transitionCSS';
        transitionStyle.textContent = `
            @keyframes fadeIn {
                0% { opacity: 0; }
                100% { opacity: 1; }
            }
            
            @keyframes fadeOut {
                0% { opacity: 1; }
                100% { opacity: 0; }
            }
            
            @keyframes bounceIn {
                0% {
                    transform: scale(0.3);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.05);
                }
                70% {
                    transform: scale(0.9);
                }
                100% {
                    transform: scale(1);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(transitionStyle);
    }
}

// Auto-ejecutar CSS cuando se carga el módulo
addTransitionCSS();