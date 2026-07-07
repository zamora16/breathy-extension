/**
 * 🎨 GESTOR DE INTERFAZ DE USUARIO
 * Respiración guiada, popup de reflexión, transiciones y animaciones.
 */

// Añadir CSS de animaciones compartidas (una sola vez)
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

/**
 * Popup de reflexión al entrar a un casino.
 * Incluye dragón, mensaje, botón Salir y botón Empezar a jugar (con espera de 10s).
 * @param {Function} onContinue - callback al pulsar "Empezar a jugar"
 * @param {Function} onExit - callback al pulsar "Salir"
 */
function showReflectionPopup(onContinue, onExit) {
    addAnimationCSS();

    const existingOverlay = document.getElementById('reflectionOverlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'reflectionOverlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.92); z-index: 100000;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        font-family: 'Segoe UI', sans-serif; backdrop-filter: blur(7px);
        animation: fadeIn 0.5s ease-in-out;
    `;

    // Dragón grande (video)
    const dragonVideo = document.createElement('video');
    dragonVideo.style.cssText = `
        width: 220px; height: 220px; border-radius: 50%; object-fit: cover;
        filter: drop-shadow(0 8px 30px rgba(0,0,0,0.5)) contrast(1.3) brightness(1.2) saturate(1.1);
        margin-bottom: 30px;
    `;
    dragonVideo.autoplay = true;
    dragonVideo.loop = true;
    dragonVideo.muted = true;
    dragonVideo.playsInline = true;
    dragonVideo.src = chrome.runtime.getURL('assets/happy.webm');

    // Mensaje principal
    const message = document.createElement('div');
    message.style.cssText = `
        color: #fff; font-size: 2rem; font-weight: bold; text-align: center;
        margin-bottom: 32px; text-shadow: 0 2px 8px rgba(0,0,0,0.8);
        max-width: 420px; line-height: 1.4;
    `;
    const reflectionTitle = document.createElement('span');
    reflectionTitle.textContent = getI18nMessage('reflectionTitle', '¿Seguro que quieres entrar?');
    const reflectionQuestions = document.createElement('span');
    reflectionQuestions.style.cssText = 'font-size:1.1rem;font-weight:400;display:block;margin-top:8px;white-space:pre-line;';
    reflectionQuestions.textContent = getI18nMessage('reflectionQuestions', '¿Cómo te sientes ahora mismo?\n¿Cuánto tiempo llevas jugando hoy?');
    message.appendChild(reflectionTitle);
    message.appendChild(reflectionQuestions);

    // Contenedor de botones
    const buttonRow = document.createElement('div');
    buttonRow.style.cssText = 'display:flex;gap:24px;justify-content:center;flex-wrap:wrap;';

    // Botón Empezar a jugar (habilitado tras 10 segundos)
    const startPlayingLabel = getI18nMessage('startPlaying', 'Empezar a jugar');
    const continueBtn = document.createElement('button');
    continueBtn.textContent = `${startPlayingLabel} (10)`;
    continueBtn.disabled = true;
    continueBtn.style.cssText = `
        background: linear-gradient(135deg,#3b82f6,#1d4ed8); color:#fff; border:none;
        border-radius:50px; padding:16px 38px; font-size:1.2rem; font-weight:600;
        cursor:not-allowed; opacity:0.7; box-shadow:0 4px 15px rgba(59,130,246,0.3); transition:all 0.3s;
    `;
    let seconds = 10;
    const timer = setInterval(() => {
        seconds--;
        continueBtn.textContent = `${startPlayingLabel} (${seconds})`;
        if (seconds <= 0) {
            clearInterval(timer);
            continueBtn.textContent = startPlayingLabel;
            continueBtn.disabled = false;
            continueBtn.style.cursor = 'pointer';
            continueBtn.style.opacity = '1';
        }
    }, 1000);
    continueBtn.onclick = () => {
        if (continueBtn.disabled) return;
        clearInterval(timer);
        overlay.remove();
        if (typeof onContinue === 'function') onContinue();
    };

    // Botón Salir
    const exitBtn = document.createElement('button');
    exitBtn.textContent = getI18nMessage('exit', 'Salir');
    exitBtn.style.cssText = `
        background: linear-gradient(135deg,#10b981,#059669); color:#fff; border:none;
        border-radius:50px; padding:16px 38px; font-size:1.2rem; font-weight:600;
        cursor:pointer; box-shadow:0 4px 15px rgba(16,185,129,0.3); transition:all 0.3s;
    `;

    // Mensaje de refuerzo al decidir no jugar (inicialmente oculto)
    const stayMsg = document.createElement('div');
    stayMsg.style.cssText = 'color:#a7f3d0; font-size:1.2rem; font-weight:500; margin-top:32px; max-width:400px; text-align:center; min-height:48px; white-space:pre-line;';

    exitBtn.onclick = () => {
        clearInterval(timer);
        continueBtn.style.display = 'none';
        exitBtn.style.display = 'none';
        message.style.display = 'none';
        stayMsg.textContent = getI18nMessage(
            'reflectionStayMessage',
            '¡Enhorabuena! Has priorizado tu bienestar.\nSi quieres, puedes cerrar esta pestaña.\n¡Eres un ejemplo de autocuidado!'
        );
        if (typeof onExit === 'function') onExit();
    };

    buttonRow.appendChild(continueBtn);
    buttonRow.appendChild(exitBtn);
    overlay.appendChild(dragonVideo);
    overlay.appendChild(message);
    overlay.appendChild(buttonRow);
    overlay.appendChild(stayMsg);
    document.body.appendChild(overlay);
}

// Iniciar respiración guiada (para clics en el dragón)
function iniciarRespiracion(patron = '4-4') {
    const patronFinal = patron || currentSettings.breathingPattern || '4-4';
    crearOverlayRespiracion(patronFinal);
}

// Crear overlay de respiración de pantalla completa
function crearOverlayRespiracion(patron = '4-4') {
    addAnimationCSS();

    const existingOverlay = document.getElementById('breathingOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

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

    const dragonContainer = document.createElement('div');
    dragonContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.5s ease-in-out;
    `;

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

    // breath.webm se reproduce una vez, sin loop
    dragonVideo.autoplay = true;
    dragonVideo.loop = false;
    dragonVideo.muted = true;
    dragonVideo.playsInline = true;
    dragonVideo.src = chrome.runtime.getURL('assets/breath.webm');

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
        gap: 8px;
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

    // Animación de pulso del botón de iniciar
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

    // Efectos hover
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

    buttonContainer.appendChild(playButton);
    buttonContainer.appendChild(exitButton);

    dragonContainer.appendChild(dragonVideo);
    dragonContainer.appendChild(instructionText);
    dragonContainer.appendChild(buttonContainer);
    dragonContainer.appendChild(timeIndicator);
    overlay.appendChild(dragonContainer);

    document.body.appendChild(overlay);

    // Estado inicial (todo pausado)
    instructionText.textContent = getI18nMessage('prepareToBreath', 'Prepárate para respirar conmigo');
    instructionText.style.color = '#fff';
    dragonVideo.pause();

    playButton.addEventListener('click', () => {
        buttonContainer.style.display = 'none';
        timeIndicator.style.display = 'block';

        dragonVideo.play().catch(() => {});

        iniciarSesionRespiracion(patron, overlay, dragonVideo, instructionText, timeIndicator);
    });

    exitButton.addEventListener('click', () => {
        overlay.style.animation = 'fadeOut 0.5s ease-in-out';
        setTimeout(() => {
            overlay.remove();
        }, 500);
    });
}

// Sesión de respiración guiada (1 minuto)
function iniciarSesionRespiracion(patron, overlay, dragonVideo, instructionText, timeIndicator) {
    const patternParts = patron.split('-').map(n => parseInt(n, 10));
    let inhaleTime = 4, holdTime = 0, exhaleTime = 4;

    if (patternParts.length === 2 && patternParts.every(Number.isFinite)) {
        [inhaleTime, exhaleTime] = patternParts;
    } else if (patternParts.length === 3 && patternParts.every(Number.isFinite)) {
        [inhaleTime, holdTime, exhaleTime] = patternParts;
    }

    const sessionDuration = 60; // 1 minuto
    let remainingTime = sessionDuration;
    let currentPhase = 'inhale';
    let cycleTimeRemaining = inhaleTime;

    function updateTimeIndicator() {
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        timeIndicator.textContent = `${getI18nMessage('timeRemaining', 'Tiempo restante:')} ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    function breatheCycle() {
        if (currentPhase === 'inhale') {
            instructionText.textContent = getI18nMessage('inhaleDeep', 'Inhala profundo');
            instructionText.style.color = '#4ade80';

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

    const mainTimer = setInterval(() => {
        remainingTime--;
        cycleTimeRemaining--;
        updateTimeIndicator();

        if (remainingTime <= 0) {
            clearInterval(mainTimer);
            finalizarSesionRespiracion(overlay);
            return;
        }

        if (cycleTimeRemaining <= 0) {
            if (currentPhase === 'inhale') {
                currentPhase = holdTime > 0 ? 'hold' : 'exhale';
            } else if (currentPhase === 'hold') {
                currentPhase = 'exhale';
            } else {
                currentPhase = 'inhale';
            }
            breatheCycle();
        }
    }, 1000);

    updateTimeIndicator();
    breatheCycle();

    // Permitir cerrar con ESC
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            clearInterval(mainTimer);

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

// Pantalla final de la sesión de respiración con reflexión
function finalizarSesionRespiracion(overlay) {
    const dragonVideo = overlay.querySelector('video');
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

    const instruction = overlay.querySelector('#breathingInstruction');
    const timeIndicator = overlay.querySelector('#timeIndicator');

    if (!instruction || !timeIndicator) {
        overlay.remove();
        return;
    }

    instruction.textContent = getI18nMessage('excellentFeelBetter', '¡Excelente! Te sientes mejor 🧘‍♀️');
    instruction.style.color = '#4ade80';
    timeIndicator.textContent = getI18nMessage('sessionCompleted', 'Sesión completada');

    const reflectionContainer = document.createElement('div');
    reflectionContainer.style.cssText = `
        margin-top: 40px;
        text-align: center;
        animation: fadeIn 0.5s ease-in-out 1s both;
    `;

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
        white-space: pre-line;
    `;
    reflectionText.textContent = getI18nMessage('reflectionPrompt', 'Ahora que has parado a respirar,\npiensa tranquilamente...\n¿De verdad deseas seguir jugando?');

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

    // Botón de dejarlo por ahora
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

    continueButton.addEventListener('click', () => {
        overlay.style.animation = 'fadeOut 0.5s ease-in-out';
        setTimeout(() => {
            overlay.remove();
        }, 500);
    });

    closeButton.addEventListener('click', () => {
        reflectionText.textContent = [
            getI18nMessage('thanksForSelfCare', '¡Gracias por cuidarte! 💚'),
            getI18nMessage('closeTabManually', 'Por favor, cierra esta pestaña para completar tu momento de cuidado personal'),
            getI18nMessage('closeTabShortcut', 'Presiona Ctrl+W o haz clic en la X de la pestaña')
        ].join('\n');
        buttonContainer.style.display = 'none';

        // Botón de cambio de opinión
        setTimeout(() => {
            const backButton = document.createElement('button');
            backButton.textContent = getI18nMessage('changedMyMind', 'He cambiado de opinión, volver al juego');
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

    buttonContainer.appendChild(continueButton);
    buttonContainer.appendChild(closeButton);
    reflectionContainer.appendChild(reflectionText);
    reflectionContainer.appendChild(buttonContainer);

    const dragonContainer = overlay.querySelector('div');
    dragonContainer.appendChild(reflectionContainer);
}

// Pantalla de transición al cambiar de fase (tired/angry)
function mostrarTransicionFase(nuevoEstado, estadoAnterior) {
    addAnimationCSS();

    const existingOverlay = document.getElementById('phaseTransitionOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

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

    const dragonState = DRAGON_STATES[nuevoEstado] || DRAGON_STATES['happy'];
    const mensaje = typeof UI_TEXTS.dragonMessages[nuevoEstado] === 'function'
        ? UI_TEXTS.dragonMessages[nuevoEstado]()
        : UI_TEXTS.dragonMessages[nuevoEstado];
    const colorFondo = dragonState.color;

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

    btnRespiro.addEventListener('click', () => {
        overlay.remove();
        iniciarRespiracion(currentSettings.breathingPattern);
    });

    btnSalir.addEventListener('click', () => {
        mensajePrincipal.textContent = getI18nMessage('wellDoneBreakTime', '¡Bien hecho! Es hora de tomar un descanso 👋');
        mensajePrincipal.style.color = '#4ade80';

        botonesContainer.textContent = '';
        const suggestion = document.createElement('div');
        suggestion.style.cssText = `
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 20px;
            color: #fff;
            text-align: center;
            font-size: 16px;
            line-height: 1.5;
            max-width: 400px;
        `;
        const suggestionLabel = document.createElement('strong');
        suggestionLabel.textContent = `💡 ${getI18nMessage('suggestionLabel', 'Sugerencia:')}`;
        const suggestionText = document.createElement('span');
        suggestionText.style.cssText = 'display:block;margin-top:6px;white-space:pre-line;';
        suggestionText.textContent = `${getI18nMessage('closeTabSuggestion', 'Cierra esta pestaña y toma un descanso.')}\n${getI18nMessage('wellbeingImportant', 'Tu bienestar es lo más importante.')}`;
        suggestion.appendChild(suggestionLabel);
        suggestion.appendChild(suggestionText);
        botonesContainer.appendChild(suggestion);

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

    container.appendChild(dragonVideo);
    container.appendChild(mensajePrincipal);

    botonesContainer.appendChild(btnRespiro);
    botonesContainer.appendChild(btnSalir);
    if (btnSeguir) {
        botonesContainer.appendChild(btnSeguir);
    }

    container.appendChild(botonesContainer);
    overlay.appendChild(container);

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
 * Mostrar un reality check en el bocadillo del dragón
 * @param {string} mensaje - El mensaje del reality check
 */
function mostrarRealityCheck(mensaje) {
    const speechBubble = document.getElementById('textoResp');
    const speechText = speechBubble?.querySelector('.speech-text');
    const showSpeechButton = document.querySelector('.show-speech-button');

    if (!speechBubble || !speechText) return;

    // Si el bocadillo está oculto, mostrarlo para el reality check
    if (speechBubble.classList.contains('hidden')) {
        speechBubble.classList.remove('hidden');
        if (showSpeechButton) {
            showSpeechButton.style.display = 'none';
        }
        try {
            localStorage.setItem('dragonSpeechHidden', 'false');
        } catch (error) { /* storage bloqueado por el sitio */ }
    }

    speechText.textContent = mensaje;
    speechBubble.className = speechBubble.className.replace(/state-\w+/, 'state-reality-check');

    speechBubble.classList.remove('speaking');
    speechBubble.classList.add('reality-check-highlight');

    setTimeout(() => {
        speechBubble.classList.add('speaking');
    }, 50);

    setTimeout(() => {
        speechBubble.classList.remove('reality-check-highlight');
    }, 3000);
}

// Exports globales para el content script principal
window.showReflectionPopup = showReflectionPopup;
window.addAnimationCSS = addAnimationCSS;
window.iniciarRespiracion = iniciarRespiracion;
window.mostrarTransicionFase = mostrarTransicionFase;
