/**
 * 🎨 GESTOR DE INTERFAZ DE USUARIO
 * Este módulo contiene toda la UI original del content script
 * Incluyendo respiración guiada, transiciones y animaciones
 */

// Función para añadir CSS de animaciones - ORIGINAL COMPLETA
function addAnimationCSS() {
    if (document.getElementById('breathyAnimationCSS')) return;
    
    const style = document.createElement('style');
    style.id = 'breathyAnimationCSS';
    style.textContent = `
        @keyframes gentlePulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
        }
        
        @keyframes breatheIn {
            0% { transform: scale(1); }
            100% { transform: scale(1.1); }
        }
        
        @keyframes breatheOut {
            0% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); background: rgba(0, 0, 0, 0.7); }
            50% { transform: scale(1.05); background: rgba(0, 0, 0, 0.9); }
        }

        @keyframes fadeIn {
            0% { opacity: 0; transform: scale(0.9); }
            100% { opacity: 1; transform: scale(1); }
        }

        @keyframes fadeOut {
            0% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0.9); }
        }
        
        /* Estilos para arrastrar el dragón */
        #breathyContainer:active {
            cursor: grabbing !important;
        }
        
        #breathyContainer.dragging {
            cursor: grabbing !important;
            z-index: 10000;
            opacity: 0.9;
        }
        
        #breathyContainer.dragging video {
            pointer-events: none;
        }
        
        /* Transición suave al soltar */
        #breathyContainer:not(.dragging) {
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}

// Función para iniciar respiración guiada (para clics en el dragón) - ORIGINAL
function iniciarRespiracion(patron = '4-4') {
    console.log('🚀 iniciarRespiracion llamada con patrón:', patron);
    console.log('⚙️ Configuración actual breathingPattern:', currentSettings.breathingPattern);
    
    // Usar el patrón de la configuración actual si no se especifica uno
    const patronFinal = patron || currentSettings.breathingPattern || '4-4';
    console.log('🎯 Patrón final a usar:', patronFinal);
    
    // Crear overlay de pantalla completa para respiración
    crearOverlayRespiracion(patronFinal);
}

// Función para crear overlay de respiración - ORIGINAL COMPLETA
function crearOverlayRespiracion(patron = '4-4') {
    // Asegurar que las animaciones CSS estén cargadas
    addAnimationCSS();
    
    // Eliminar overlay existente si existe
    const existingOverlay = document.getElementById('breathingOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Crear overlay de pantalla completa
    const overlay = document.createElement('div');
    overlay.id = 'breathingOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        z-index: 99999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: 'Segoe UI', sans-serif;
        backdrop-filter: blur(5px);
    `;

    // Crear contenedor de dragón grande
    const dragonContainer = document.createElement('div');
    dragonContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.5s ease-in-out;
    `;

    // Video del dragón más grande
    const dragonVideo = document.createElement('video');
    dragonVideo.style.cssText = `
        width: 300px;
        height: 300px;
        border-radius: 50%;
        object-fit: cover;
        filter: 
            drop-shadow(0 8px 30px rgba(0, 0, 0, 0.5))
            contrast(1.3) 
            brightness(1.2)
            saturate(1.1);
        transition: transform 0.3s ease;
    `;
    
    // Configurar video (usar breath.webm para respiración)
    dragonVideo.autoplay = true;
    dragonVideo.loop = false; // Sin loop para breath - se reproduce una vez y se pausa
    dragonVideo.muted = true;
    dragonVideo.playsInline = true;
    const videoUrl = chrome.runtime.getURL('assets/breath.webm');
    dragonVideo.src = videoUrl;

    // Texto de instrucciones
    const instructionText = document.createElement('div');
    instructionText.id = 'breathingInstruction';
    instructionText.style.cssText = `
        margin-top: 50px;
        color: #fff;
        font-size: 28px;
        font-weight: bold;
        text-align: center;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
        transition: all 0.3s ease;
    `;

    // Indicador de tiempo restante
    const timeIndicator = document.createElement('div');
    timeIndicator.id = 'timeIndicator';
    timeIndicator.style.cssText = `
        margin-top: 20px;
        color: #ccc;
        font-size: 18px;
        text-align: center;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        display: none;
    `;

    // Contenedor de botones
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        margin-top: 30px;
        display: flex;
        gap: 15px;
        justify-content: center;
        flex-wrap: wrap;
    `;

    // Botón de iniciar respiración
    const playButton = document.createElement('button');
    playButton.id = 'breathingPlayButton';
    playButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.68L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/>
        </svg>
        ${getI18nMessage('startBreathing', 'Iniciar Respiración')}
    `;
    playButton.style.cssText = `
        background: linear-gradient(135deg, #4ade80, #22c55e);
        color: white;
        border: none;
        border-radius: 50px;
        padding: 15px 30px;
        font-size: 18px;
        font-weight: 600;
        font-family: 'Segoe UI', sans-serif;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(74, 222, 128, 0.3);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        animation: pulseGlow 2s ease-in-out infinite;
    `;

    // Botón de salir/cancelar
    const exitButton = document.createElement('button');
    exitButton.id = 'breathingExitButton';
    exitButton.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
        ${getI18nMessage('exit', 'Salir')}
    `;
    exitButton.style.cssText = `
        background: linear-gradient(135deg, #6b7280, #4b5563);
        color: white;
        border: none;
        border-radius: 50px;
        padding: 15px 25px;
        font-size: 16px;
        font-weight: 600;
        font-family: 'Segoe UI', sans-serif;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(107, 114, 128, 0.3);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        opacity: 0.9;
    `;

    // Añadir animación de pulso al CSS global si no existe
    if (!document.getElementById('breathingButtonCSS')) {
        const buttonStyle = document.createElement('style');
        buttonStyle.id = 'breathingButtonCSS';
        buttonStyle.textContent = `
            @keyframes pulseGlow {
                0%, 100% {
                    transform: scale(1);
                    box-shadow: 0 4px 20px rgba(74, 222, 128, 0.3);
                }
                50% {
                    transform: scale(1.02);
                    box-shadow: 0 6px 30px rgba(74, 222, 128, 0.5);
                }
            }
        `;
        document.head.appendChild(buttonStyle);
    }

    // Efectos hover del botón de iniciar
    playButton.addEventListener('mouseenter', () => {
        playButton.style.animation = 'none';
        playButton.style.transform = 'translateY(-2px) scale(1.05)';
        playButton.style.boxShadow = '0 8px 35px rgba(74, 222, 128, 0.6)';
    });
    playButton.addEventListener('mouseleave', () => {
        playButton.style.animation = 'pulseGlow 2s ease-in-out infinite';
        playButton.style.transform = 'translateY(0) scale(1)';
        playButton.style.boxShadow = '0 4px 20px rgba(74, 222, 128, 0.3)';
    });

    // Efectos hover del botón de salir
    exitButton.addEventListener('mouseenter', () => {
        exitButton.style.transform = 'translateY(-2px) scale(1.05)';
        exitButton.style.boxShadow = '0 6px 25px rgba(107, 114, 128, 0.5)';
        exitButton.style.opacity = '1';
    });
    exitButton.addEventListener('mouseleave', () => {
        exitButton.style.transform = 'translateY(0) scale(1)';
        exitButton.style.boxShadow = '0 4px 15px rgba(107, 114, 128, 0.3)';
        exitButton.style.opacity = '0.9';
    });

    // Añadir botones al contenedor
    buttonContainer.appendChild(playButton);
    buttonContainer.appendChild(exitButton);

    // Ensamblar elementos
    dragonContainer.appendChild(dragonVideo);
    dragonContainer.appendChild(instructionText);
    dragonContainer.appendChild(buttonContainer);
    dragonContainer.appendChild(timeIndicator);
    overlay.appendChild(dragonContainer);

    // Agregar al DOM
    document.body.appendChild(overlay);

    // Configurar estado inicial (todo pausado)
    instructionText.textContent = getI18nMessage('prepareToBreath', 'Prepárate para respirar conmigo');
    instructionText.style.color = '#fff';
    
    // Pausar el video inicialmente
    dragonVideo.pause();
    
    // Configurar evento del botón de play
    playButton.addEventListener('click', () => {
        // Ocultar botones y mostrar indicador de tiempo
        buttonContainer.style.display = 'none';
        timeIndicator.style.display = 'block';
        
        // Reproducir el video del dragón
        dragonVideo.play().catch(e => {
            console.warn('Error reproduciendo video de respiración:', e);
        });
        
        // Iniciar sesión de respiración
        iniciarSesionRespiracion(patron, overlay, dragonVideo, instructionText, timeIndicator);
    });

    // Configurar evento del botón de salir
    exitButton.addEventListener('click', () => {
        // Cerrar overlay con animación suave
        overlay.style.animation = 'fadeOut 0.5s ease-in-out';
        setTimeout(() => {
            overlay.remove();
        }, 500);
    });
}

// Función para iniciar sesión de respiración - ORIGINAL COMPLETA
function iniciarSesionRespiracion(patron, overlay, dragonVideo, instructionText, timeIndicator) {
    console.log('🫁 Iniciando sesión de respiración con patrón:', patron);
    
    const patternParts = patron.split('-').map(n => parseInt(n));
    let inhaleTime, holdTime, exhaleTime;
    
    // Determinar el tipo de patrón
    if (patternParts.length === 2) {
        // Patrón simple: inhalar-exhalar (ej: 4-4)
        [inhaleTime, exhaleTime] = patternParts;
        holdTime = 0;
        console.log('🫁 Patrón simple detectado: inhalar', inhaleTime + 's, exhalar', exhaleTime + 's');
    } else if (patternParts.length === 3) {
        // Patrón completo: inhalar-retener-exhalar (ej: 4-7-8, 4-4-4)
        [inhaleTime, holdTime, exhaleTime] = patternParts;
        console.log('🫁 Patrón completo detectado: inhalar', inhaleTime + 's, mantener', holdTime + 's, exhalar', exhaleTime + 's');
    }
    
    const sessionDuration = 60; // 1 minuto
    let remainingTime = sessionDuration;
    let currentPhase = 'inhale'; // 'inhale', 'hold', 'exhale'
    let cycleTimeRemaining = inhaleTime;

    // Actualizar indicador de tiempo
    function updateTimeIndicator() {
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        timeIndicator.textContent = `${getI18nMessage('timeRemaining', 'Tiempo restante:')} ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Función de respiración
    function breatheCycle() {
        if (currentPhase === 'inhale') {
            instructionText.textContent = getI18nMessage('inhaleDeep', 'Inhala profundo');
            instructionText.style.color = '#4ade80';
            
            // Animación gradual de expansión durante la inhalación
            dragonVideo.style.transition = `transform ${inhaleTime}s ease-in-out`;
            dragonVideo.style.transform = 'scale(1.3)';
            dragonVideo.style.filter = `
                drop-shadow(0 8px 30px rgba(74, 222, 128, 0.3))
                contrast(1.3) 
                brightness(1.3)
                saturate(1.2)
            `;
            cycleTimeRemaining = inhaleTime;
        } else if (currentPhase === 'hold') {
            instructionText.textContent = getI18nMessage('holdBreath', 'Mantén');
            instructionText.style.color = '#a78bfa';
            
            // Mantener el tamaño expandido sin transición
            dragonVideo.style.transition = 'none';
            dragonVideo.style.transform = 'scale(1.3)';
            dragonVideo.style.filter = `
                drop-shadow(0 8px 30px rgba(167, 139, 250, 0.3))
                contrast(1.2) 
                brightness(1.2)
                saturate(1.1)
            `;
            cycleTimeRemaining = holdTime;
        } else if (currentPhase === 'exhale') {
            instructionText.textContent = getI18nMessage('exhaleSlow', 'Exhala lento');
            instructionText.style.color = '#fbbf24';
            
            // Animación gradual de contracción durante la exhalación
            dragonVideo.style.transition = `transform ${exhaleTime}s ease-in-out`;
            dragonVideo.style.transform = 'scale(1.0)';
            dragonVideo.style.filter = `
                drop-shadow(0 8px 30px rgba(251, 191, 36, 0.3))
                contrast(1.3) 
                brightness(1.1)
                saturate(1.1)
            `;
            cycleTimeRemaining = exhaleTime;
        }
    }

    // Timer principal
    const mainTimer = setInterval(() => {
        remainingTime--;
        cycleTimeRemaining--;
        updateTimeIndicator();

        // Verificar si la sesión debe terminar
        if (remainingTime <= 0) {
            clearInterval(mainTimer);
            finalizarSesionRespiracion(overlay);
            return;
        }

        if (cycleTimeRemaining <= 0) {
            // Avanzar a la siguiente fase
            if (currentPhase === 'inhale') {
                if (holdTime > 0) {
                    currentPhase = 'hold';
                } else {
                    currentPhase = 'exhale';
                }
            } else if (currentPhase === 'hold') {
                currentPhase = 'exhale';
            } else if (currentPhase === 'exhale') {
                currentPhase = 'inhale';
            }
            breatheCycle();
        }
    }, 1000);

    // Inicializar
    updateTimeIndicator();
    breatheCycle();

    // Permitir cerrar con ESC
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            clearInterval(mainTimer);
            
            // Resetear el video al primer fotograma antes de finalizar
            if (dragonVideo) {
                dragonVideo.currentTime = 0;
                dragonVideo.pause();
                dragonVideo.style.transition = 'all 0.5s ease';
                dragonVideo.style.transform = 'scale(1.0)';
                dragonVideo.style.filter = `
                    drop-shadow(0 8px 30px rgba(0, 0, 0, 0.5))
                    contrast(1.3) 
                    brightness(1.2)
                    saturate(1.1)
                `;
            }
            
            finalizarSesionRespiracion(overlay);
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

// Función para finalizar sesión de respiración - ORIGINAL COMPLETA
function finalizarSesionRespiracion(overlay) {
    // Resetear el video al primer fotograma y pausarlo
    const dragonVideo = overlay.querySelector('video');
    if (dragonVideo) {
        dragonVideo.currentTime = 0;
        dragonVideo.pause();
        // Resetear transformaciones y filtros
        dragonVideo.style.transition = 'all 0.5s ease';
        dragonVideo.style.transform = 'scale(1.0)';
        dragonVideo.style.filter = `
            drop-shadow(0 8px 30px rgba(0, 0, 0, 0.5))
            contrast(1.3) 
            brightness(1.2)
            saturate(1.1)
        `;
    }

    // Mostrar mensaje de finalización con opciones de reflexión
    const instruction = overlay.querySelector('#breathingInstruction');
    const timeIndicator = overlay.querySelector('#timeIndicator');
    
    if (instruction && timeIndicator) {
        instruction.textContent = getI18nMessage('excellentFeelBetter', '¡Excelente! Te sientes mejor 🧘‍♀️');
        instruction.style.color = '#4ade80';
        timeIndicator.textContent = getI18nMessage('sessionCompleted', 'Sesión completada');
        
        // Crear contenedor para la reflexión
        const reflectionContainer = document.createElement('div');
        reflectionContainer.style.cssText = `
            margin-top: 40px;
            text-align: center;
            animation: fadeIn 0.5s ease-in-out 1s both;
        `;

        // Mensaje de reflexión
        const reflectionText = document.createElement('div');
        reflectionText.style.cssText = `
            color: #fff;
            font-size: 20px;
            font-weight: 500;
            margin-bottom: 30px;
            line-height: 1.4;
            max-width: 500px;
            margin-left: auto;
            margin-right: auto;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        `;
        reflectionText.innerHTML = getI18nMessage('reflectionPrompt', 'Ahora que has parado a respirar,<br><strong>piensa tranquilamente...</strong><br>¿De verdad deseas seguir jugando?').replace(/\n/g, '<br>');

        // Contenedor de botones
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
        `;

        // Botón de continuar jugando
        const continueButton = document.createElement('button');
        continueButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            ${getI18nMessage('continueGambling', 'Gracias, pero deseo seguir')}
        `;
        continueButton.style.cssText = `
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            border: none;
            border-radius: 50px;
            padding: 12px 25px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            font-family: 'Segoe UI', sans-serif;
        `;

        // Botón de cerrar pestaña
        const closeButton = document.createElement('button');
        closeButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            ${getI18nMessage('stopGambling', 'Mejor lo dejo por ahora')}
        `;
        closeButton.style.cssText = `
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            border: none;
            border-radius: 50px;
            padding: 12px 25px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            font-family: 'Segoe UI', sans-serif;
        `;

        // Efectos hover para los botones
        [continueButton, closeButton].forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px) scale(1.05)';
                button.style.boxShadow = button === continueButton ? 
                    '0 6px 20px rgba(59, 130, 246, 0.4)' : 
                    '0 6px 20px rgba(16, 185, 129, 0.4)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0) scale(1)';
                button.style.boxShadow = button === continueButton ? 
                    '0 4px 15px rgba(59, 130, 246, 0.3)' : 
                    '0 4px 15px rgba(16, 185, 129, 0.3)';
            });
        });

        // Eventos de los botones
        continueButton.addEventListener('click', () => {
            // Cerrar overlay y continuar jugando
            overlay.style.animation = 'fadeOut 0.5s ease-in-out';
            setTimeout(() => {
                overlay.remove();
            }, 500);
        });

        closeButton.addEventListener('click', () => {
            // Mostrar mensaje de despedida directo
            reflectionText.innerHTML = `
                ¡Gracias por cuidarte! 💚<br>
                <span style="font-size: 18px; color: #fbbf24;">
                    Por favor, cierra esta pestaña manualmente<br>
                    para completar tu momento de cuidado personal
                </span><br>
                <span style="font-size: 16px; color: #ccc; margin-top: 10px; display: block;">
                    Presiona Ctrl+W o haz clic en la X de la pestaña
                </span>
            `;
            buttonContainer.style.display = 'none';
            
            // Añadir el botón de cambio de opinión después de un momento
            setTimeout(() => {
                const backButton = document.createElement('button');
                backButton.innerHTML = 'He cambiado de opinión, volver al juego';
                backButton.style.cssText = `
                    background: rgba(255, 255, 255, 0.1);
                    color: #ccc;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 25px;
                    padding: 8px 20px;
                    font-size: 14px;
                    cursor: pointer;
                    margin-top: 20px;
                    transition: all 0.3s ease;
                    font-family: 'Segoe UI', sans-serif;
                `;
                
                backButton.addEventListener('mouseenter', () => {
                    backButton.style.background = 'rgba(255, 255, 255, 0.2)';
                    backButton.style.color = '#fff';
                });
                
                backButton.addEventListener('mouseleave', () => {
                    backButton.style.background = 'rgba(255, 255, 255, 0.1)';
                    backButton.style.color = '#ccc';
                });
                
                backButton.addEventListener('click', () => {
                    overlay.style.animation = 'fadeOut 0.5s ease-in-out';
                    setTimeout(() => {
                        overlay.remove();
                    }, 500);
                });
                
                reflectionContainer.appendChild(backButton);
            }, 1000);
        });

        // Ensamblar elementos de reflexión
        buttonContainer.appendChild(continueButton);
        buttonContainer.appendChild(closeButton);
        reflectionContainer.appendChild(reflectionText);
        reflectionContainer.appendChild(buttonContainer);

        // Añadir al overlay
        const dragonContainer = overlay.querySelector('div');
        dragonContainer.appendChild(reflectionContainer);
        
    } else {
        // Fallback si no se encuentran los elementos
        overlay.remove();
    }
}

// Función para mostrar transición de fase - ORIGINAL COMPLETA
function mostrarTransicionFase(nuevoEstado, estadoAnterior) {
    console.log(`🎭 *** EJECUTANDO TRANSICIÓN DE FASE ***: ${estadoAnterior} → ${nuevoEstado}`);
    console.log(`🎭 Creando overlay de pantalla completa para transición...`);
    
    // Eliminar overlay existente si existe
    const existingOverlay = document.getElementById('phaseTransitionOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Crear overlay de pantalla completa
    const overlay = document.createElement('div');
    overlay.id = 'phaseTransitionOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        z-index: 99999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: 'Segoe UI', sans-serif;
        backdrop-filter: blur(10px);
        animation: fadeIn 0.5s ease-in-out;
    `;

    // Obtener configuración del estado desde constants.js
    const dragonState = DRAGON_STATES[nuevoEstado] || DRAGON_STATES['happy']; // Fallback a happy si no existe
    
    // Usar mensajes de UI_TEXTS y colores de DRAGON_STATES (ejecutar función si es necesario)
    const mensaje = typeof UI_TEXTS.dragonMessages[nuevoEstado] === 'function' 
        ? UI_TEXTS.dragonMessages[nuevoEstado]() 
        : UI_TEXTS.dragonMessages[nuevoEstado] || 
          (typeof UI_TEXTS.dragonMessages['happy'] === 'function' 
            ? UI_TEXTS.dragonMessages['happy']() 
            : UI_TEXTS.dragonMessages['happy']);
    const colorFondo = dragonState.color;

    // Crear contenedor principal
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        max-width: 600px;
        padding: 40px;
    `;

    // Video del dragón grande centrado
    const dragonVideo = document.createElement('video');
    dragonVideo.style.cssText = `
        width: 350px;
        height: 350px;
        border-radius: 50%;
        object-fit: cover;
        filter: 
            drop-shadow(0 12px 40px rgba(0, 0, 0, 0.6))
            contrast(1.4) 
            brightness(1.3)
            saturate(1.2);
        transition: all 0.5s ease;
        margin-bottom: 30px;
        border: 5px solid ${colorFondo};
        box-shadow: 0 0 30px ${colorFondo}50;
    `;
    
    dragonVideo.autoplay = true;
    dragonVideo.loop = true;
    dragonVideo.muted = true;
    dragonVideo.playsInline = true;
    dragonVideo.src = chrome.runtime.getURL(dragonState.video);

    // Mensaje principal
    const mensajePrincipal = document.createElement('div');
    mensajePrincipal.style.cssText = `
        color: white;
        font-size: 32px;
        font-weight: bold;
        text-align: center;
        text-shadow: 0 3px 10px rgba(0, 0, 0, 0.8);
        margin-bottom: 40px;
        line-height: 1.3;
        max-width: 500px;
    `;
    mensajePrincipal.textContent = mensaje;

    // Contenedor de botones
    const botonesContainer = document.createElement('div');
    botonesContainer.style.cssText = `
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
        justify-content: center;
        margin-top: 20px;
    `;

    // Botón "Tomar un respiro"
    const btnRespiro = document.createElement('button');
    btnRespiro.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
        </svg>
        ${getI18nMessage('takeABreak', 'Tomar un respiro')}
    `;
    btnRespiro.style.cssText = `
        background: linear-gradient(135deg, #4ade80, #22c55e);
        color: white;
        border: none;
        border-radius: 50px;
        padding: 15px 30px;
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 6px 25px rgba(74, 222, 128, 0.4);
        transition: all 0.3s ease;
        min-width: 200px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    `;

    // Botón "Quiero dejar de jugar"
    const btnSalir = document.createElement('button');
    btnSalir.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
            <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
        </svg>
        ${getI18nMessage('wantToStopPlaying', 'Quiero dejar de jugar')}
    `;
    btnSalir.style.cssText = `
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        border: none;
        border-radius: 50px;
        padding: 15px 30px;
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 6px 25px rgba(239, 68, 68, 0.4);
        transition: all 0.3s ease;
        min-width: 200px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    `;

    // Botón "Seguir jugando" (solo para tired, no para angry)
    let btnSeguir = null;
    if (nuevoEstado === 'tired') {
        btnSeguir = document.createElement('button');
        btnSeguir.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
                <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.68L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/>
            </svg>
            ${getI18nMessage('continueGamblingShort', 'Seguir jugando')}
        `;
        btnSeguir.style.cssText = `
            background: linear-gradient(135deg, #6b7280, #4b5563);
            color: white;
            border: none;
            border-radius: 50px;
            padding: 15px 30px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 6px 25px rgba(107, 114, 128, 0.4);
            transition: all 0.3s ease;
            min-width: 200px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        `;
    }

    // Efectos hover para los botones
    [btnRespiro, btnSalir, btnSeguir].filter(btn => btn).forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-3px) scale(1.05)';
            btn.style.boxShadow = btn.style.boxShadow.replace('0.4)', '0.6)');
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translateY(0) scale(1)';
            btn.style.boxShadow = btn.style.boxShadow.replace('0.6)', '0.4)');
        });
    });

    // Event listeners
    btnRespiro.addEventListener('click', () => {
        overlay.remove();
        iniciarRespiracion(currentSettings.breathingPattern);
    });

    btnSalir.addEventListener('click', () => {
        // Mostrar mensaje de despedida y sugerir cerrar pestaña
        mensajePrincipal.textContent = getI18nMessage('wellDoneBreakTime', '¡Bien hecho! Es hora de tomar un descanso 👋');
        mensajePrincipal.style.color = '#4ade80';
        
        botonesContainer.innerHTML = `
            <div style="
                background: rgba(255,255,255,0.1);
                border-radius: 15px;
                padding: 20px;
                color: #fff;
                text-align: center;
                font-size: 16px;
                line-height: 1.5;
                max-width: 400px;
            ">
                💡 <strong>${getI18nMessage('suggestionLabel', 'Sugerencia:')}</strong><br>
                ${getI18nMessage('closeTabSuggestion', 'Cierra esta pestaña y toma un descanso.')}<br>
                ${getI18nMessage('wellbeingImportant', 'Tu bienestar es lo más importante.')}
            </div>
        `;

        setTimeout(() => {
            overlay.style.animation = 'fadeOut 0.5s ease-out forwards';
            setTimeout(() => {
                overlay.remove();
            }, 500);
        }, 4000);
    });

    if (btnSeguir) {
        btnSeguir.addEventListener('click', () => {
            overlay.style.animation = 'fadeOut 0.5s ease-out forwards';
            setTimeout(() => {
                overlay.remove();
            }, 500);
        });
    }

    // Ensamblar elementos
    container.appendChild(dragonVideo);
    container.appendChild(mensajePrincipal);
    
    botonesContainer.appendChild(btnRespiro);
    botonesContainer.appendChild(btnSalir);
    if (btnSeguir) {
        botonesContainer.appendChild(btnSeguir);
    }
    
    container.appendChild(botonesContainer);
    overlay.appendChild(container);

    // Agregar al DOM
    document.body.appendChild(overlay);

    // Permitir cerrar con ESC
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            overlay.style.animation = 'fadeOut 0.5s ease-out forwards';
            setTimeout(() => {
                overlay.remove();
            }, 500);
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

/**
 * Función para mostrar reality checks usando la misma UI que los mensajes del dragón
 * @param {string} mensaje - El mensaje del reality check a mostrar
 */
function mostrarRealityCheck(mensaje) {
    const speechBubble = document.getElementById('textoResp');
    const speechText = speechBubble?.querySelector('.speech-text');
    const showSpeechButton = document.querySelector('.show-speech-button');
    
    if (speechBubble && speechText) {
        // Si el bocadillo está oculto, mostrarlo automáticamente para el reality check
        const estabaCerrado = speechBubble.classList.contains('hidden');
        if (estabaCerrado) {
            speechBubble.classList.remove('hidden');
            if (showSpeechButton) {
                showSpeechButton.style.display = 'none';
            }
            localStorage.setItem('dragonSpeechHidden', 'false');
            console.log('🔔 Bocadillo abierto automáticamente para reality check');
        }
        
        // Actualizar el mensaje con el reality check
        speechText.textContent = mensaje;
        
        // Aplicar estilo especial para reality checks
        speechBubble.className = speechBubble.className.replace(/state-\w+/, 'state-reality-check');
        
        // Reiniciar animación de habla para dar efecto de "nueva conversación"
        speechBubble.classList.remove('speaking');
        speechBubble.classList.add('reality-check-highlight');
        
        setTimeout(() => {
            speechBubble.classList.add('speaking');
        }, 50);
        
        // Remover el highlight después de 3 segundos, pero mantener el mensaje
        setTimeout(() => {
            speechBubble.classList.remove('reality-check-highlight');
        }, 3000);
        
        console.log('🔔 Reality check mostrado:', mensaje);
    } else {
        console.warn('❌ No se pudo mostrar reality check - elementos DOM no encontrados');
    }
}