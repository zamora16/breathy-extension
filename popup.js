// Popup de configuración de Breathy

// 🌍 Helper de i18n
function i18n(key, substitutions) {
    return chrome.i18n.getMessage(key, substitutions);
}

// Configuración por defecto
const DEFAULT_SETTINGS = {
    breathingPattern: '4-4',
    continuousBreathing: false,
    sessionDuration: 90 // tiempo máximo de sesión en minutos
};

document.addEventListener('DOMContentLoaded', () => {
    aplicarTraducciones();
    cargarConfiguracion();
    cargarEstadisticas();
    setupEventListeners();

    // Refrescar el tiempo de sesión mientras el popup esté abierto
    setInterval(cargarEstadisticas, 10000);
});

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

    const tiempoSelect = document.getElementById('tiempoMaximoSesion');
    if (tiempoSelect) {
        tiempoSelect.querySelectorAll('option').forEach(opcion => {
            const valor = parseInt(opcion.value, 10);
            const horas = Math.floor(valor / 60);
            const minutos = valor % 60;
            if (horas === 0) {
                opcion.textContent = `${minutos} ${i18n('minutes')}`;
            } else if (minutos === 0) {
                opcion.textContent = `${horas} ${horas === 1 ? i18n('hour') : i18n('hours')}`;
            } else {
                opcion.textContent = `${horas} ${horas === 1 ? i18n('hour') : i18n('hours')} ${minutos} ${i18n('minutes')}`;
            }
        });
    }
}

function setupEventListeners() {
    document.getElementById('guardar').addEventListener('click', guardarConfiguracion);
    document.getElementById('mostrarTutorial').addEventListener('click', mostrarTutorial);
    document.getElementById('registrarSitio').addEventListener('click', registrarSitioActual);
    document.getElementById('gestionarSitios').addEventListener('click', toggleGestionSitios);

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

        const respiracionContinuaCheckbox = document.getElementById('respiracionContinua');
        if (respiracionContinuaCheckbox) {
            respiracionContinuaCheckbox.checked = !!settings.continuousBreathing;
        }
    });
}

// Cargar tiempo de la sesión actual
async function cargarEstadisticas() {
    const tiempoElement = document.getElementById('tiempoHoy');

    try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!activeTab) {
            tiempoElement.textContent = i18n('noActiveSession');
            return;
        }

        const result = await chrome.storage.local.get(['casinoSessions']);
        const sessions = result.casinoSessions || [];

        // Buscar sesión activa de la pestaña actual
        const sesionActual = sessions.find(s => s.tabId === activeTab.id && !s.endTime);

        if (sesionActual) {
            actualizarTiempoMostrado(Date.now() - sesionActual.startTime);
        } else {
            tiempoElement.textContent = i18n('noActiveSession');
        }
    } catch (error) {
        tiempoElement.textContent = i18n('noActiveSession');
    }
}

// Formatear el tiempo mostrado
function actualizarTiempoMostrado(milliseconds) {
    const tiempoElement = document.getElementById('tiempoHoy');

    const minutos = Math.floor(milliseconds / (1000 * 60));
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;

    if (horas > 0) {
        tiempoElement.textContent = `${horas}h ${minutosRestantes}m`;
    } else {
        tiempoElement.textContent = `${minutos} min`;
    }
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
        sessionDuration: tiempoMaximo
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
