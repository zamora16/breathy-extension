// Popup de configuración de Breathy

// 🌍 Helper de i18n
function i18n(key, substitutions) {
    return chrome.i18n.getMessage(key, substitutions);
}

// Configuración por defecto
const DEFAULT_SETTINGS = {
    breathingPattern: '4-4',
    continuousBreathing: false,
    sessionDuration: 90, // tiempo máximo de sesión en minutos
    dailyLimit: 0        // límite diario acumulado en minutos (0 = sin límite)
};

// Pausa de emergencia (misma clave que usan content script y background)
const EMERGENCY_PAUSE_KEY = 'emergencyPauseUntil';

// Recursos de ayuda profesional (localizados vía i18n)
const HELP_RESOURCE_KEYS = [
    { nameKey: 'helpLink1Name', urlKey: 'helpLink1Url' },
    { nameKey: 'helpLink2Name', urlKey: 'helpLink2Url' },
    { nameKey: 'helpLink3Name', urlKey: 'helpLink3Url' }
];

// Clave de día en hora local (mismo formato que el background)
function localDateKey(ts = Date.now()) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

document.addEventListener('DOMContentLoaded', () => {
    aplicarTraducciones();
    renderHelpLinks();
    cargarConfiguracion();
    cargarEstadisticas();
    cargarEstadoPausa();
    setupEventListeners();

    // Refrescar el tiempo de sesión mientras el popup esté abierto
    setInterval(cargarEstadisticas, 10000);
});

// 🆘 Enlaces a recursos de ayuda en el pie del popup
function renderHelpLinks() {
    const container = document.getElementById('helpLinks');
    if (!container) return;

    HELP_RESOURCE_KEYS.forEach(({ nameKey, urlKey }) => {
        const name = i18n(nameKey);
        const url = i18n(urlKey);
        if (!name || !url) return;

        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = name;
        container.appendChild(link);
    });
}

// 🌍 Aplicar traducciones dinámicamente
function aplicarTraducciones() {
    document.querySelectorAll('[data-i18n]').forEach(elemento => {
        const texto = i18n(elemento.getAttribute('data-i18n'));
        if (texto) {
            elemento.textContent = texto;
        }
    });

    document.querySelectorAll('[data-i18n-title]').forEach(elemento => {
        const texto = i18n(elemento.getAttribute('data-i18n-title'));
        if (texto) {
            elemento.setAttribute('title', texto);
        }
    });

    const title = document.querySelector('title');
    if (title) title.textContent = i18n('extensionName') || 'Breathy';

    traducirOpcionesSelect();
}

// 🌍 Traducir opciones de los selects
function traducirOpcionesSelect() {
    const patronSelect = document.getElementById('patron');
    if (patronSelect) {
        patronSelect.querySelectorAll('option').forEach(opcion => {
            if (opcion.value === '4-4') opcion.textContent = `${i18n('simple')} (4-4)`;
            if (opcion.value === '4-7-8') opcion.textContent = `${i18n('relaxing')} (4-7-8)`;
            if (opcion.value === '4-4-4') opcion.textContent = `${i18n('balanced')} (4-4-4)`;
        });
    }

    const formatDuration = (valor) => {
        const horas = Math.floor(valor / 60);
        const minutos = valor % 60;
        if (horas === 0) return `${minutos} ${i18n('minutes')}`;
        if (minutos === 0) return `${horas} ${horas === 1 ? i18n('hour') : i18n('hours')}`;
        return `${horas} ${horas === 1 ? i18n('hour') : i18n('hours')} ${minutos} ${i18n('minutes')}`;
    };

    const tiempoSelect = document.getElementById('tiempoMaximoSesion');
    if (tiempoSelect) {
        tiempoSelect.querySelectorAll('option').forEach(opcion => {
            opcion.textContent = formatDuration(parseInt(opcion.value, 10));
        });
    }

    const limiteSelect = document.getElementById('limiteDiario');
    if (limiteSelect) {
        limiteSelect.querySelectorAll('option').forEach(opcion => {
            const valor = parseInt(opcion.value, 10);
            opcion.textContent = valor === 0 ? i18n('noLimit') : formatDuration(valor);
        });
    }
}

function setupEventListeners() {
    document.getElementById('guardar').addEventListener('click', guardarConfiguracion);
    document.getElementById('mostrarTutorial').addEventListener('click', mostrarTutorial);
    document.getElementById('registrarSitio').addEventListener('click', registrarSitioActual);
    document.getElementById('gestionarSitios').addEventListener('click', toggleGestionSitios);
    document.getElementById('activarPausa').addEventListener('click', activarPausaEmergencia);

    cargarDominiosRegistrados();
}

// Cargar configuración guardada
function cargarConfiguracion() {
    chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS), (result) => {
        const settings = { ...DEFAULT_SETTINGS, ...result };

        const patronSelect = document.getElementById('patron');
        if (patronSelect) {
            patronSelect.value = settings.breathingPattern;
            if (!patronSelect.value) patronSelect.selectedIndex = 0;
        }

        const tiempoMaximoSelect = document.getElementById('tiempoMaximoSesion');
        if (tiempoMaximoSelect) {
            tiempoMaximoSelect.value = String(settings.sessionDuration);
            if (!tiempoMaximoSelect.value) tiempoMaximoSelect.value = '90';
        }

        const limiteDiarioSelect = document.getElementById('limiteDiario');
        if (limiteDiarioSelect) {
            limiteDiarioSelect.value = String(settings.dailyLimit || 0);
            if (!limiteDiarioSelect.value) limiteDiarioSelect.value = '0';
        }

        const respiracionContinuaCheckbox = document.getElementById('respiracionContinua');
        if (respiracionContinuaCheckbox) {
            respiracionContinuaCheckbox.checked = !!settings.continuousBreathing;
        }
    });
}

// Cargar estadísticas: sesión actual, total de hoy, semana y racha sin jugar
async function cargarEstadisticas() {
    const tiempoElement = document.getElementById('tiempoHoy');

    try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const result = await chrome.storage.local.get(['casinoSessions', 'dailyStats']);
        const sessions = result.casinoSessions || [];
        const dailyStats = result.dailyStats || {};
        const now = Date.now();

        // Sesión activa de la pestaña actual
        const sesionActual = activeTab
            ? sessions.find(s => s.tabId === activeTab.id && !s.endTime)
            : null;
        tiempoElement.textContent = sesionActual
            ? formatearTiempo(now - sesionActual.startTime)
            : i18n('noActiveSession');

        // Tiempo de sesiones abiertas (aún sin volcar a dailyStats)
        const openSessionsMs = sessions
            .filter(s => !s.endTime)
            .reduce((sum, s) => sum + Math.max(0, now - s.startTime), 0);

        // Total de hoy
        const todayKey = localDateKey();
        const todayEndedMs = dailyStats[todayKey]?.totalTime || 0;
        document.getElementById('tiempoTotalHoy').textContent =
            formatearTiempo(todayEndedMs + openSessionsMs);

        // Total de los últimos 7 días
        let weekMs = openSessionsMs;
        for (let i = 0; i < 7; i++) {
            const key = localDateKey(now - i * 24 * 60 * 60 * 1000);
            weekMs += dailyStats[key]?.totalTime || 0;
        }
        document.getElementById('tiempoSemana').textContent = formatearTiempo(weekMs);

        // Racha de días sin jugar (solo se muestra si hay historial y racha >= 1)
        const rachaRow = document.getElementById('rachaRow');
        const hasHistory = Object.values(dailyStats).some(d => (d.totalTime || 0) > 0 || (d.sessions || 0) > 0);
        const playedToday = todayEndedMs + openSessionsMs > 0 ||
            (dailyStats[todayKey]?.sessions || 0) > 0;

        if (hasHistory && !playedToday) {
            let streak = 0;
            for (let i = 1; i <= 30; i++) {
                const key = localDateKey(now - i * 24 * 60 * 60 * 1000);
                const day = dailyStats[key];
                if (day && ((day.totalTime || 0) > 0 || (day.sessions || 0) > 0)) break;
                streak++;
            }
            document.getElementById('rachaDias').textContent = streak >= 30 ? '30+' : String(streak);
            rachaRow.style.display = streak >= 1 ? 'flex' : 'none';
        } else {
            rachaRow.style.display = 'none';
        }
    } catch (error) {
        tiempoElement.textContent = i18n('noActiveSession');
    }
}

// Formatear milisegundos como "2h 15m" / "45 min"
function formatearTiempo(milliseconds) {
    const minutos = Math.floor(milliseconds / (1000 * 60));
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;

    if (horas > 0) {
        return `${horas}h ${minutosRestantes}m`;
    }
    return `${minutos} min`;
}

// ==============================
// PAUSA DE EMERGENCIA
// ==============================

function cargarEstadoPausa() {
    chrome.storage.sync.get([EMERGENCY_PAUSE_KEY], (result) => {
        if (chrome.runtime.lastError) return;
        renderEstadoPausa(result[EMERGENCY_PAUSE_KEY] || 0);
    });
}

function renderEstadoPausa(pausedUntil) {
    const controls = document.getElementById('pauseControls');
    const active = document.getElementById('pauseActive');
    const activeText = document.getElementById('pauseActiveText');

    if (Date.now() < pausedUntil) {
        controls.style.display = 'none';
        active.style.display = 'block';
        const fecha = new Date(pausedUntil).toLocaleString(chrome.i18n.getUILanguage(), {
            weekday: 'long', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'long'
        });
        activeText.textContent = i18n('pauseActiveUntil', [fecha]);
    } else {
        controls.style.display = 'block';
        active.style.display = 'none';
    }
}

let pauseConfirmPending = false;

function activarPausaEmergencia() {
    const boton = document.getElementById('activarPausa');

    // Doble confirmación: el primer clic cambia el texto del botón
    if (!pauseConfirmPending) {
        pauseConfirmPending = true;
        boton.textContent = i18n('confirmPause');
        setTimeout(() => {
            if (pauseConfirmPending) {
                pauseConfirmPending = false;
                boton.textContent = i18n('activatePause');
            }
        }, 5000);
        return;
    }

    pauseConfirmPending = false;
    const horas = parseInt(document.getElementById('duracionPausa').value, 10) || 24;
    const pausedUntil = Date.now() + horas * 60 * 60 * 1000;

    chrome.storage.sync.set({ [EMERGENCY_PAUSE_KEY]: pausedUntil }, () => {
        if (chrome.runtime.lastError) {
            mostrarMensaje(i18n('errorGeneric'), 'error');
            boton.textContent = i18n('activatePause');
            return;
        }
        renderEstadoPausa(pausedUntil);
        mostrarMensaje(i18n('pauseActivated'), 'success');
    });
}

// Guardar configuración
function guardarConfiguracion() {
    const patron = document.getElementById('patron').value;
    const tiempoMaximo = parseInt(document.getElementById('tiempoMaximoSesion').value, 10);
    const respiracionContinua = document.getElementById('respiracionContinua').checked;

    if (!tiempoMaximo || tiempoMaximo < 30) {
        mostrarMensaje(i18n('minSessionWarning'), 'warning');
        return;
    }

    const newSettings = {
        breathingPattern: patron,
        continuousBreathing: respiracionContinua,
        sessionDuration: tiempoMaximo,
        dailyLimit: parseInt(document.getElementById('limiteDiario').value, 10) || 0
    };

    chrome.storage.sync.set(newSettings, () => {
        if (chrome.runtime.lastError) {
            mostrarMensaje(i18n('errorGeneric'), 'error');
            return;
        }

        // Feedback visual en el botón
        const btn = document.getElementById('guardar');
        const originalText = btn.textContent;
        btn.textContent = i18n('saved');
        btn.style.background = '#3d6b58';

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);

        notificarCambioConfiguracion(newSettings);
        cargarEstadisticas();
    });
}

// Notificar cambio de configuración a las pestañas activas
async function notificarCambioConfiguracion(settings) {
    try {
        const tabs = await chrome.tabs.query({ active: true });

        for (const tab of tabs) {
            if (tab.url && /^https?:/.test(tab.url)) {
                chrome.tabs.sendMessage(tab.id, {
                    type: 'configChanged',
                    settings
                }).catch(() => {
                    // Pestaña sin content script: ignorar
                });
            }
        }
    } catch (error) {
        // Sin pestañas accesibles: ignorar
    }
}

// ==============================
// DOMINIOS PERSONALIZADOS
// ==============================

/**
 * 🎮 Registrar el sitio actual como dominio personalizado
 */
async function registrarSitioActual() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.url) {
            mostrarMensaje(i18n('errorGeneric'), 'error');
            return;
        }

        const url = new URL(tab.url);

        if (!/^https?:$/.test(url.protocol)) {
            mostrarMensaje(i18n('cannotRegisterBrowserPage'), 'error');
            return;
        }

        const hostname = url.hostname.replace(/^www\./, '');

        chrome.storage.sync.get(['customProtectedDomains'], (result) => {
            if (chrome.runtime.lastError) {
                mostrarMensaje(i18n('errorGeneric'), 'error');
                return;
            }

            const currentDomains = result.customProtectedDomains || [];

            if (currentDomains.includes(hostname)) {
                mostrarMensaje(i18n('siteAlreadyRegistered'), 'warning');
                return;
            }

            chrome.storage.sync.set({
                customProtectedDomains: [...currentDomains, hostname]
            }, () => {
                if (chrome.runtime.lastError) {
                    mostrarMensaje(i18n('errorGeneric'), 'error');
                    return;
                }
                mostrarMensaje(i18n('siteRegistered', [hostname]), 'success');
                cargarDominiosRegistrados();
            });
        });
    } catch (error) {
        mostrarMensaje(i18n('errorGeneric'), 'error');
    }
}

/**
 * 🎮 Cargar y mostrar dominios registrados
 */
function cargarDominiosRegistrados() {
    const container = document.getElementById('dominiosRegistrados');

    chrome.storage.sync.get(['customProtectedDomains'], (result) => {
        if (chrome.runtime.lastError) {
            container.textContent = i18n('errorGeneric');
            return;
        }

        const dominios = result.customProtectedDomains || [];
        container.textContent = '';

        if (dominios.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.style.cssText = 'margin: 5px 0; opacity: 0.7;';
            emptyMsg.textContent = i18n('noRegisteredSites');
            container.appendChild(emptyMsg);
            return;
        }

        dominios.forEach((dominio) => {
            const item = document.createElement('div');
            item.className = 'domain-item';

            const name = document.createElement('span');
            name.className = 'domain-name';
            name.textContent = dominio;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-delete';
            deleteBtn.textContent = '✕';
            deleteBtn.addEventListener('click', () => eliminarDominio(dominio));

            item.appendChild(name);
            item.appendChild(deleteBtn);
            container.appendChild(item);
        });
    });
}

/**
 * 🎮 Eliminar un dominio personalizado
 */
function eliminarDominio(dominio) {
    chrome.storage.sync.get(['customProtectedDomains'], (result) => {
        if (chrome.runtime.lastError) {
            mostrarMensaje(i18n('errorGeneric'), 'error');
            return;
        }

        const updatedDomains = (result.customProtectedDomains || []).filter(d => d !== dominio);

        chrome.storage.sync.set({ customProtectedDomains: updatedDomains }, () => {
            if (chrome.runtime.lastError) {
                mostrarMensaje(i18n('errorGeneric'), 'error');
                return;
            }
            mostrarMensaje(i18n('siteDeleted', [dominio]), 'info');
            cargarDominiosRegistrados();
        });
    });
}

/**
 * 🎮 Mostrar/ocultar la sección de gestión de sitios
 */
function toggleGestionSitios() {
    const listaSitios = document.getElementById('listaSitios');
    const boton = document.getElementById('gestionarSitios');

    if (listaSitios.style.display === 'none' || !listaSitios.style.display) {
        listaSitios.style.display = 'block';
        boton.textContent = i18n('hide');
        cargarDominiosRegistrados();
    } else {
        listaSitios.style.display = 'none';
        boton.textContent = i18n('manageSites');
    }
}

/**
 * 💬 Mostrar mensaje temporal al usuario
 */
function mostrarMensaje(mensaje, tipo = 'info') {
    let messageEl = document.getElementById('mensajeTemp');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'mensajeTemp';
        document.body.appendChild(messageEl);
    }

    const colores = {
        success: 'background: #2e5c48; color: #c6eddb; border: 1px solid rgba(124,196,164,0.25);',
        error: 'background: #4a2020; color: #e8a8a8; border: 1px solid rgba(210,80,80,0.25);',
        warning: 'background: #4a3a18; color: #e8cc88; border: 1px solid rgba(210,160,60,0.25);',
        info: 'background: #1e2e4a; color: #a8c4e8; border: 1px solid rgba(80,130,210,0.25);'
    };

    messageEl.style.cssText = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        padding: 7px 14px;
        border-radius: 6px;
        font-size: 12px;
        font-family: inherit;
        z-index: 1000;
        max-width: 280px;
        text-align: center;
        letter-spacing: 0.01em;
        ${colores[tipo] || colores.info}
    `;
    messageEl.textContent = mensaje;
    messageEl.style.display = 'block';

    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 3000);
}

/**
 * 🎓 Mostrar tutorial interactivo en la pestaña activa
 */
async function mostrarTutorial() {
    try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!activeTab || !activeTab.url || !/^https?:/.test(activeTab.url)) {
            mostrarMensaje(i18n('tutorialNavigateFirst'), 'warning');
            return;
        }

        // Inyectar el tutorial manager solo si no está ya cargado
        const result = await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: () => !!window.TutorialManager
        });

        if (!result[0].result) {
            await chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                files: ['modules/tutorial-manager.js']
            });
        }

        await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: () => {
                if (window.TutorialManager) {
                    window.TutorialManager.showTutorial();
                }
            }
        });

        window.close();
    } catch (error) {
        mostrarMensaje(i18n('tutorialUnavailable'), 'warning');
    }
}
