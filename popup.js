// Popup para la extensión Breathy

// 🔧 CONFIGURACIÓN DE DESARROLLO
const DEVELOPMENT_MODE = false;

// 🌍 Función auxiliar para i18n
function i18n(key, substitutions) {
    return chrome.i18n.getMessage(key, substitutions);
}

// Configuración por defecto (sin imports)
const DEFAULT_SETTINGS = {
    breathingPattern: '4-4',
    mascotPosition: 'bottom-right',
    showReminders: true,
    reminderInterval: 30,
    mascotSize: 'medium',
    isDraggable: true,
    continuousBreathing: false,
    sessionDuration: 90  // tiempo máximo de sesión en minutos
};

document.addEventListener('DOMContentLoaded', async () => {
    // 🌍 Aplicar traducciones dinámicamente
    aplicarTraducciones();
    
    // Asegurar que todos los selects tienen una opción seleccionada por defecto
    inicializarSelectsConDefaults();
    
    // 🔧 Configurar modo desarrollo (ocultar/mostrar herramientas de debug)
    configurarModoDesarrollo();
    
    // Cargar configuración actual
    cargarConfiguracion();
    
    // Cargar estadísticas del día
    cargarEstadisticas();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Actualizar estadísticas cada 10 segundos
    setInterval(() => {
        cargarEstadisticas();
    }, 10000);
});

// Función para inicializar selects con valores por defecto
function inicializarSelectsConDefaults() {
    // Patrón de respiración
    const patronSelect = document.getElementById('patron');
    if (patronSelect && !patronSelect.value) {
        patronSelect.selectedIndex = 0; // Primera opción (4-4)
    }
    
    // Tiempo máximo de sesión
    const tiempoMaximoSelect = document.getElementById('tiempoMaximoSesion');
    if (tiempoMaximoSelect && !tiempoMaximoSelect.value) {
        tiempoMaximoSelect.value = "90"; // 1 hora y 30 minutos por defecto
    }
    
    console.log('🎯 Selects inicializados con valores por defecto');
}

// 🌍 Función para aplicar traducciones dinámicamente
function aplicarTraducciones() {
    // Traducciones para elementos con data-i18n
    const elementos = document.querySelectorAll('[data-i18n]');
    elementos.forEach(elemento => {
        const key = elemento.getAttribute('data-i18n');
        const texto = i18n(key);
        if (texto) {
            elemento.textContent = texto;
        }
    });
    
    // Traducciones específicas para elementos complejos
    const title = document.querySelector('title');
    if (title) title.textContent = i18n('extensionName');
    
    // Traducciones para tooltips (title attributes)
    const elementosConTooltip = document.querySelectorAll('[data-i18n-title]');
    elementosConTooltip.forEach(elemento => {
        const key = elemento.getAttribute('data-i18n-title');
        const texto = i18n(key);
        if (texto) {
            elemento.setAttribute('title', texto);
        }
    });
    
    // Traducir opciones de los selects
    traducirOpcionesSelect();
    
    console.log('🌍 Traducciones aplicadas:', chrome.i18n.getUILanguage());
}

// 🌍 Función para traducir opciones de selects
function traducirOpcionesSelect() {
    // Patrón de respiración
    const patronSelect = document.getElementById('patron');
    if (patronSelect) {
        const opciones = patronSelect.querySelectorAll('option');
        opciones.forEach(opcion => {
            const valor = opcion.value;
            if (valor === '4-4') opcion.textContent = `${i18n('simple')} (4-4)`;
            if (valor === '4-7-8') opcion.textContent = `${i18n('relaxing')} (4-7-8)`;
            if (valor === '4-4-4') opcion.textContent = `${i18n('balanced')} (4-4-4)`;
        });
    }
    
    // Tiempo máximo de sesión
    const tiempoSelect = document.getElementById('tiempoMaximoSesion');
    if (tiempoSelect) {
        const opciones = tiempoSelect.querySelectorAll('option');
        opciones.forEach(opcion => {
            const valor = parseInt(opcion.value);
            if (valor === 60) opcion.textContent = `1 ${i18n('hour')}`;
            else if (valor === 120) opcion.textContent = `2 ${i18n('hours')}`;
            else opcion.textContent = `${valor} ${i18n('minutes')}`;
        });
    }
}

// 🔧 Función para configurar el modo desarrollo (deshabilitado en producción)
function configurarModoDesarrollo() {
    // Producción: todas las herramientas de debug están deshabilitadas
    console.log('🚀 Modo producción ACTIVADO');
}

function setupEventListeners() {
    document.getElementById('guardar').addEventListener('click', guardarConfiguracion);
    
    // Event listener para tutorial
    document.getElementById('mostrarTutorial').addEventListener('click', mostrarTutorial);
    
    // Modo desarrollo deshabilitado en producción
    
    // Nuevos event listeners para dominios personalizados
    document.getElementById('registrarSitio').addEventListener('click', registrarSitioActual);
    document.getElementById('gestionarSitios').addEventListener('click', toggleGestionSitios);
    
    // Cargar información del sitio actual
    cargarSitioActual();
    cargarDominiosRegistrados();
}

// Cargar configuración guardada
function cargarConfiguracion() {
    chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS), (result) => {
        console.log('⚙️ Datos de configuración obtenidos:', result);
        const settings = { ...DEFAULT_SETTINGS, ...result };
        
        // Patrón de respiración - asegurar que siempre haya un valor seleccionado
        const patronSelect = document.getElementById('patron');
        if (patronSelect) {
            const patronValue = settings.breathingPattern || DEFAULT_SETTINGS.breathingPattern || '4-4';
            patronSelect.value = patronValue;
            
            // Verificar que se aplicó correctamente
            if (patronSelect.value !== patronValue) {
                console.warn('⚠️ No se pudo seleccionar el patrón:', patronValue, 'Forzando selección manual');
                // Si por alguna razón no se seleccionó, forzar la primera opción
                patronSelect.selectedIndex = 0;
            }
            console.log('🎯 Patrón seleccionado:', patronSelect.value);
        }
        
        // Tiempo máximo de sesión
        const tiempoMaximoSelect = document.getElementById('tiempoMaximoSesion');
        if (tiempoMaximoSelect) {
            const sessionValue = settings.sessionDuration || DEFAULT_SETTINGS.sessionDuration || 90;
            tiempoMaximoSelect.value = sessionValue;
            if (tiempoMaximoSelect.value !== sessionValue.toString()) {
                tiempoMaximoSelect.value = "90"; // Por defecto 1h 30min
            }
            console.log('🎯 Tiempo máximo de sesión seleccionado:', tiempoMaximoSelect.value);
        }
        
        // Respiración continua
        const respiracionContinuaCheckbox = document.getElementById('respiracionContinua');
        if (respiracionContinuaCheckbox) {
            respiracionContinuaCheckbox.checked = settings.continuousBreathing || false;
        }
        
        console.log('✅ Configuración aplicada:', settings);
    });
}

// Cargar estadísticas del día
async function cargarEstadisticas() {
    try {
        console.log('🔄 Iniciando carga de estadísticas...');
        
        // Obtener pestaña activa actual
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!activeTab) {
            console.warn('⚠️ No hay pestaña activa');
            document.getElementById('tiempoHoy').textContent = 'No hay pestaña activa';
            document.getElementById('sesionesHoy').textContent = '-';
            return;
        }
        
        console.log('📱 Pestaña activa:', activeTab.id, activeTab.url);
        
        const hoy = new Date().toISOString().split('T')[0];
        const result = await chrome.storage.local.get(['dailyStats', 'casinoSessions']);
        const dailyStats = result.dailyStats || {};
        const sessions = result.casinoSessions || [];
        
        console.log('📊 Datos de storage:', { dailyStats, sessions: sessions.length });
        
        // Buscar sesión activa de la pestaña actual
        const sesionActual = sessions.find(s => s.tabId === activeTab.id && !s.endTime);
        
        if (sesionActual) {
            // Hay una sesión activa en la pestaña actual
            const tiempoSesionActual = Date.now() - sesionActual.startTime;
            const statsHoy = dailyStats[hoy] || { totalTime: 0, sessions: 0 };
            
            actualizarTiempoMostrado(tiempoSesionActual);
            document.getElementById('sesionesHoy').textContent = `${statsHoy.sessions} ${i18n('todayText')}`;
            
            console.log('📈 Sesión actual:', {
                tabId: activeTab.id,
                hostname: sesionActual.hostname,
                tiempo: Math.round(tiempoSesionActual/1000/60) + ' min',
                sesionesHoy: statsHoy.sessions
            });
        } else {
            // No hay sesión activa en la pestaña actual
            const statsHoy = dailyStats[hoy] || { totalTime: 0, sessions: 0 };
            
            document.getElementById('tiempoHoy').textContent = i18n('noActiveSession');
            document.getElementById('sesionesHoy').textContent = `${statsHoy.sessions} ${i18n('todayText')}`;
            
            console.log('📈 Sin sesión activa en pestaña actual');
        }
        
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
        document.getElementById('tiempoHoy').textContent = 'Error';
        document.getElementById('sesionesHoy').textContent = 'Error';
    }
}

// Actualizar el tiempo mostrado en formato legible
function actualizarTiempoMostrado(milliseconds) {
    const tiempoElement = document.getElementById('tiempoHoy');
    
    if (milliseconds === 0) {
        tiempoElement.textContent = '0 min';
        return;
    }
    
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
    const tiempoMaximo = parseInt(document.getElementById('tiempoMaximoSesion').value);
    const respiracionContinua = document.getElementById('respiracionContinua').checked;
    
    // Validar tiempo máximo
    if (!tiempoMaximo || tiempoMaximo < 30) {
        alert('⚠️ El tiempo máximo de sesión debe ser al menos 30 minutos');
        return;
    }
    
    const newSettings = {
        breathingPattern: patron,
        continuousBreathing: respiracionContinua,
        sessionDuration: tiempoMaximo,
        // Mantener otros settings por defecto
        mascotPosition: 'bottom-right',
        showReminders: true,
        reminderInterval: 30,
        mascotSize: 'medium',
        isDraggable: true
    };
    
    chrome.storage.sync.set(newSettings, () => {
        console.log('💾 Configuración guardada:', newSettings);
        
        // Mostrar feedback visual
        const btn = document.getElementById('guardar');
        const originalText = btn.textContent;
        
        btn.textContent = '✅ Guardado!';
        btn.style.background = '#4CAF50';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
        
        // Notificar a content scripts que la configuración cambió
        notificarCambioConfiguracion(newSettings);
        
        // Actualizar estado actual con nueva configuración
        cargarEstadisticas();
    });
}

// Notificar cambio de configuración a las pestañas activas
async function notificarCambioConfiguracion(settings) {
    try {
        const tabs = await chrome.tabs.query({ active: true });
        
        for (const tab of tabs) {
            if (tab.url && !tab.url.startsWith('chrome://')) {
                chrome.tabs.sendMessage(tab.id, {
                    type: 'configChanged',
                    settings: settings
                }).catch(() => {
                    // Ignore errors for tabs without content script
                    console.log('Tab sin content script:', tab.url);
                });
            }
        }
    } catch (error) {
        console.error('Error notificando cambios:', error);
    }
}

// ==============================
// FUNCIONES PARA DOMINIOS PERSONALIZADOS
// ==============================

/**
 * 🎮 Cargar información del sitio actual
 */
async function cargarSitioActual() {
    try {
        // Verificar si el contexto de la extensión es válido
        if (!chrome.runtime?.id) {
            document.getElementById('sitioActual').textContent = 'Contexto de extensión inválido';
            return;
        }

        // Obtener la pestaña activa
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab && tab.url) {
            const url = new URL(tab.url);
            const hostname = url.hostname.replace(/^www\./, '');
            
            document.getElementById('sitioActual').textContent = 
                `${i18n('currentSiteLabel')} ${hostname}`;
        } else {
            document.getElementById('sitioActual').textContent = 
                i18n('couldNotGetCurrentSite');
        }
    } catch (error) {
        console.error('❌ Error obteniendo sitio actual:', error);
        document.getElementById('sitioActual').textContent = 
            i18n('errorGettingCurrentSite');
    }
}

/**
 * 🎮 Registrar el sitio actual como dominio personalizado
 */
async function registrarSitioActual() {
    try {
        // Verificar si el contexto de la extensión es válido
        if (!chrome.runtime?.id) {
            mostrarMensaje('❌ Contexto de extensión inválido', 'error');
            return;
        }

        // Obtener la pestaña activa
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab || !tab.url) {
            mostrarMensaje('❌ No se pudo obtener la URL actual', 'error');
            return;
        }
        
        const url = new URL(tab.url);
        const hostname = url.hostname.replace(/^www\./, '');
        
        // Verificar que no sea una página del navegador
        if (url.protocol === 'chrome:' || url.protocol === 'chrome-extension:' || 
            url.protocol === 'edge:' || url.protocol === 'about:') {
            mostrarMensaje('❌ No se pueden registrar páginas del navegador', 'error');
            return;
        }
        
        // Verificar contexto antes de usar chrome.storage
        if (!chrome.storage?.sync) {
            mostrarMensaje('❌ Storage no disponible', 'error');
            return;
        }

        chrome.storage.sync.get(['customProtectedDomains'], (result) => {
            // Verificar si hubo error en chrome.runtime
            if (chrome.runtime.lastError) {
                console.error('❌ Error de chrome.runtime:', chrome.runtime.lastError);
                mostrarMensaje('❌ Error de contexto de extensión', 'error');
                return;
            }

            const currentDomains = result.customProtectedDomains || [];
            
            if (currentDomains.includes(hostname)) {
                mostrarMensaje('⚠️ Este sitio ya está registrado', 'warning');
                return;
            }
            
            const updatedDomains = [...currentDomains, hostname];
            
            chrome.storage.sync.set({
                customProtectedDomains: updatedDomains
            }, () => {
                // Verificar si hubo error en chrome.runtime
                if (chrome.runtime.lastError) {
                    console.error('❌ Error guardando:', chrome.runtime.lastError);
                    mostrarMensaje('❌ Error al guardar el sitio', 'error');
                    return;
                }

                console.log('✅ Dominio registrado:', hostname);
                mostrarMensaje(`✅ Sitio registrado: ${hostname}`, 'success');
                cargarDominiosRegistrados(); // Actualizar la lista
            });
        });
        
    } catch (error) {
        console.error('❌ Error registrando sitio:', error);
        mostrarMensaje('❌ Error al registrar el sitio', 'error');
    }
}

/**
 * 🎮 Cargar y mostrar dominios registrados
 */
function cargarDominiosRegistrados() {
    try {
        // Verificar si el contexto de la extensión es válido
        if (!chrome.runtime?.id || !chrome.storage?.sync) {
            const container = document.getElementById('dominiosRegistrados');
            container.innerHTML = '<p style="margin: 5px 0; opacity: 0.7;">Error: Contexto de extensión inválido</p>';
            return;
        }

        chrome.storage.sync.get(['customProtectedDomains'], (result) => {
            // Verificar si hubo error en chrome.runtime
            if (chrome.runtime.lastError) {
                console.error('❌ Error de chrome.runtime:', chrome.runtime.lastError);
                const container = document.getElementById('dominiosRegistrados');
                container.innerHTML = '<p style="margin: 5px 0; opacity: 0.7;">Error al cargar dominios</p>';
                return;
            }

            const dominios = result.customProtectedDomains || [];
            const container = document.getElementById('dominiosRegistrados');
            
            if (dominios.length === 0) {
                container.innerHTML = '<p style="margin: 5px 0; opacity: 0.7;">No hay sitios registrados</p>';
            } else {
                container.innerHTML = dominios.map((dominio, index) => `
                    <div class="domain-item">
                        <span class="domain-name">${dominio}</span>
                        <button data-domain="${dominio}" class="eliminar-dominio-btn btn-delete">
                            ✕
                        </button>
                    </div>
                `).join('');
                
                // Agregar event listeners a los botones de eliminar
                const eliminarBtns = container.querySelectorAll('.eliminar-dominio-btn');
                eliminarBtns.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const dominio = e.target.getAttribute('data-domain');
                        eliminarDominio(dominio);
                    });
                });
            }
        });
    } catch (error) {
        console.error('❌ Error cargando dominios:', error);
        const container = document.getElementById('dominiosRegistrados');
        container.innerHTML = '<p style="margin: 5px 0; opacity: 0.7;">Error al cargar dominios</p>';
    }
}

/**
 * 🎮 Eliminar un dominio personalizado
 */
function eliminarDominio(dominio) {
    try {
        // Verificar si el contexto de la extensión es válido
        if (!chrome.runtime?.id || !chrome.storage?.sync) {
            mostrarMensaje('❌ Contexto de extensión inválido', 'error');
            return;
        }

        chrome.storage.sync.get(['customProtectedDomains'], (result) => {
            // Verificar si hubo error en chrome.runtime
            if (chrome.runtime.lastError) {
                console.error('❌ Error de chrome.runtime:', chrome.runtime.lastError);
                mostrarMensaje('❌ Error al acceder al storage', 'error');
                return;
            }

            const currentDomains = result.customProtectedDomains || [];
            const updatedDomains = currentDomains.filter(d => d !== dominio);
            
            chrome.storage.sync.set({
                customProtectedDomains: updatedDomains
            }, () => {
                // Verificar si hubo error en chrome.runtime
                if (chrome.runtime.lastError) {
                    console.error('❌ Error guardando:', chrome.runtime.lastError);
                    mostrarMensaje('❌ Error al eliminar el sitio', 'error');
                    return;
                }

                console.log('🗑️ Dominio eliminado:', dominio);
                mostrarMensaje(`🗑️ Sitio eliminado: ${dominio}`, 'info');
                cargarDominiosRegistrados(); // Actualizar la lista
            });
        });
    } catch (error) {
        console.error('❌ Error eliminando dominio:', error);
        mostrarMensaje('❌ Error al eliminar el sitio', 'error');
    }
}

/**
 * 🎮 Toggle de la sección de gestión de sitios
 */
function toggleGestionSitios() {
    const listaSitios = document.getElementById('listaSitios');
    const boton = document.getElementById('gestionarSitios');
    
    if (listaSitios.style.display === 'none' || !listaSitios.style.display) {
        listaSitios.style.display = 'block';
        boton.textContent = '📋 Ocultar';
        cargarDominiosRegistrados(); // Actualizar la lista al mostrar
    } else {
        listaSitios.style.display = 'none';
        boton.textContent = '📋 Gestionar';
    }
}

/**
 * 💬 Mostrar mensaje temporal al usuario
 */
function mostrarMensaje(mensaje, tipo = 'info') {
    // Crear elemento de mensaje si no existe
    let messageEl = document.getElementById('mensajeTemp');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'mensajeTemp';
        messageEl.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            max-width: 280px;
            text-align: center;
        `;
        document.body.appendChild(messageEl);
    }
    
    // Estilos según el tipo
    const colores = {
        success: 'background: #4CAF50; color: white;',
        error: 'background: #f44336; color: white;',
        warning: 'background: #ff9800; color: white;',
        info: 'background: #2196F3; color: white;'
    };
    
    messageEl.style.cssText += colores[tipo] || colores.info;
    messageEl.textContent = mensaje;
    messageEl.style.display = 'block';
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 3000);
}

/**
 * 🎓 Mostrar tutorial interactivo
 */
async function mostrarTutorial() {
    try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Verificar si es una página válida para inyectar scripts
        if (activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('chrome-extension://') || 
            activeTab.url.startsWith('edge://') || activeTab.url.startsWith('about:')) {
            mostrarMensaje('Por favor, navega a una página web normal para ver el tutorial', 'warning');
            return;
        }
        
        // Verificar si TutorialManager ya existe antes de inyectar
        const result = await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: () => {
                return !!window.TutorialManager;
            }
        });
        
        // Solo inyectar si no existe
        if (!result[0].result) {
            await chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                files: ['modules/tutorial-manager.js']
            });
        }
        
        // Ejecutar tutorial
        await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: () => {
                if (window.TutorialManager) {
                    window.TutorialManager.showTutorial();
                }
            }
        });
        
        window.close(); // Cerrar popup después de iniciar tutorial
    } catch (error) {
        console.error('❌ Error al mostrar tutorial:', error);
        mostrarMensaje('No se pudo abrir el tutorial en esta página', 'warning');
    }
}

