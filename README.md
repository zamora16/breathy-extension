# 🐉 Breathy - Chrome Extension for Responsible Gaming

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-red)

A smart browser extension that helps maintain healthy gaming habits through mindful breathing techniques and customizable limits.

## 🌟 Features

- **🎯 Automatic Detection**: Recognizes Spanish gambling sites automatically
- **🐉 Dynamic Mascot**: Visual dragon companion with mood-based states
- **🌬️ Breathing Exercises**: Guided breathing patterns (4-4, 4-7-8, 4-4-4)
- **⏰ Session Management**: Customizable time limits with gentle reminders
- **🔄 Multi-Window Sync**: Perfect synchronization across multiple casino tabs
- **📱 Mobile Responsive**: Works on all screen sizes
- **🎓 Interactive Tutorial**: Built-in onboarding experience
- **🧪 Test Mode**: Fast testing with 1 second = 1 minute

## 🚀 Quick Start

### Installation for Development
1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked extension"
5. Select the project folder
6. Breathy will appear in your toolbar!

### Método 2: Para Producción
1. Comprimir la carpeta en un archivo ZIP
2. Subir a Chrome Web Store siguiendo las políticas de Google
3. Esperar aprobación (proceso de revisión)

## 🎓 Tutorial de Uso

### Primera Vez
- Breathy mostrará automáticamente un tutorial interactivo la primera vez que visites un sitio de apuestas
- El tutorial te guiará a través de todas las funciones principales
- Puedes repetir el tutorial en cualquier momento desde el botón "🎓 Tutorial" en el popup

### Funciones Principales

#### 🎯 Detección Automática
- Reconoce sitios de apuestas y casinos españoles automáticamente
- Funciona con dominios populares como bet365, betfair, pokerstars, etc.
- Permite añadir sitios personalizados

#### 🐉 Estados de Breathy
- **😊 Feliz:** Todo va bien (0-50% del tiempo límite)
- **😴 Cansado:** Hora de un descanso (50-100% del límite)  
- **😠 Enfadado:** Límite de tiempo alcanzado

#### 🌬️ Ejercicios de Respiración
- **Patrón 4-4:** Inhala 4s, Exhala 4s (ideal para principiantes)
- **Patrón 4-7-8:** Inhala 4s, Mantén 7s, Exhala 8s (para ansiedad)
- **Patrón 4-4-4:** Inhala 4s, Mantén 4s, Exhala 4s (equilibrado)

#### ⏰ Control de Tiempo
- Establece límites de sesión personalizables (30min a 5 horas)
- Recordatorios gentiles cuando te acerques al límite
- Estadísticas detalladas de uso

## 🛠️ Configuración Recomendada

### Para Principiantes
```
Patrón de respiración: 4-4
Tiempo máximo de sesión: 90 minutos
Respiración continua: Desactivada
```

### Para Usuarios Experimentados
```
Patrón de respiración: 4-7-8
Tiempo máximo de sesión: 60 minutos
Respiración continua: Activada
```

## 🔧 Desarrollo y Pruebas

### 🧪 Página de Pruebas Integrada
1. Abre `test-page.html` en tu navegador
2. Registra la página como "sitio personalizado" desde el popup
3. Recarga la página - ¡Breathy se activará automáticamente!
4. Usa los botones de la página para probar todas las funciones

### Activar Modo de Prueba
1. Abre el popup de Breathy
2. Busca la sección "Modo Prueba"  
3. Haz clic en "Activar Prueba (2 min)"
4. En modo prueba: 1 segundo = 1 minuto real
5. Permite probar límites de tiempo rápidamente

### 🎯 Probar el Tutorial Completo
```bash
# Método 1: Automático (primera visita)
1. Limpiar datos: chrome.storage.sync.clear()
2. Visitar sitio de casino (bet365.es, pokerstars.es)
3. Tutorial aparece automáticamente

# Método 2: Manual
1. Abrir popup de Breathy  
2. Buscar ícono discreto de tutorial en esquina superior derecha (ícono personalizado)
3. Hacer clic en 🎓 para iniciar tutorial interactivo
```

### 🏗️ Sitios de Prueba
- **test-page.html** - Página incluida para pruebas completas
- **google.com** - Registrar como sitio personalizado
- **github.com** - Ideal para probar funcionalidades  
- **bet365.es** - Detección automática (sin apostar)

## 📋 Arquitectura Modular - REGLAS OBLIGATORIAS

## 🏗️ Estructura del Proyecto

```
extensiongamble/
├── manifest.json                 # Configuración principal de la extensión
├── background.js                 # Service worker principal
├── popup.html/popup.js          # Interfaz de configuración
├── content_script_refactored.js # Script principal (SOLO 777 líneas)
├── styles/mascot.css            # Estilos de la mascota
├── assets/                      # Recursos multimedia
│   ├── logo.png                 # Icono de la extensión
│   ├── happy.webm              # Video estado feliz
│   ├── tired.webm              # Video estado cansado
│   ├── angry.webm              # Video estado enfadado
│   └── breath.webm             # Video respiración
└── modules/                     # MÓDULOS ORGANIZADOS
    ├── constants.js             # ✅ Constantes centralizadas
    ├── config-manager.js        # ✅ Gestión de configuración
    ├── casino-detector.js       # ✅ Detección de casinos
    ├── session-manager.js       # ✅ Comunicación background
    └── ui-manager.js            # ✅ Interfaz de usuario
```

---

## 🎯 REGLAS FUNDAMENTALES

### ❌ NUNCA HAGAS ESTO:
1. **NO copies código de módulos al archivo principal**
2. **NO dupliques constantes entre archivos**
3. **NO agregues funciones UI al content_script_refactored.js**
4. **NO crees nuevos módulos sin documentar su propósito**

### ✅ SIEMPRE HAZ ESTO:
1. **USA los módulos existentes mediante importación**
2. **CENTRALIZA constantes en constants.js**
3. **DOCUMENTA cambios en este README**

---

## 📚 Responsabilidades de cada Módulo

### 🎯 `constants.js` - Fuente Única de Verdad
**Propósito**: Todas las constantes del proyecto
- `CASINO_DOMAINS` - URLs de sitios de casino
- `DRAGON_STATES` - Estados de la mascota
- `BREATHING_PATTERNS` - Patrones de respiración
- `DEFAULT_SETTINGS` - Configuración por defecto
- `UI_TEXTS` - Textos de interfaz

**Regla**: Si es una constante, va aquí. NO duplicar en otros archivos.

### ⚙️ `config-manager.js` - Gestión de Configuración
**Propósito**: Manejo de configuración y localStorage
- `loadConfiguration()` - Cargar configuración
- `saveCustomPosition()` - Guardar posición del dragón
- `currentSettings` - Configuración actual

**Regla**: Solo funciones relacionadas con configuración y persistencia.

### 🎰 `casino-detector.js` - Detección de Sitios
**Propósito**: Identificar sitios de casino
- `isGamblingWebsite()` - Detectar si es sitio de casino
- Funciones de detección de comportamiento

**Regla**: Solo lógica de detección, NO funciones de UI.

### 📡 `session-manager.js` - Comunicación
**Propósito**: Comunicación con background script
- `setupBackgroundMessageHandler()` - Manejar mensajes
- `updateDragonState()` - Actualizar estado según tiempo
- `sessionMaxDuration` - Duración máxima de sesión

**Regla**: Solo comunicación y gestión de sesión.

### 🎨 `ui-manager.js` - Interfaz de Usuario
**Propósito**: TODAS las funciones de interfaz visual
- `addAnimationCSS()` - CSS de animaciones
- `iniciarRespiracion()` - Respiración guiada
- `crearOverlayRespiracion()` - Overlays de pantalla completa
- `mostrarTransicionFase()` - Transiciones de estado
- `finalizarSesionRespiracion()` - Pantallas finales

**Regla**: Si crea, modifica o elimina elementos DOM, va aquí.

### 📄 `content_script_refactored.js` - Coordinador Principal
**Propósito**: Orquestar la funcionalidad (SOLO 777 líneas)
- Inicialización de la extensión
- Gestión de eventos principales
- Función `crearMascota()` (que usa módulos UI)
- Coordinación entre módulos

**Regla**: NO agregar funciones UI extensas. Usar módulos.

---

```

---

## 🔄 Sincronización Multi-Ventana UNIVERSAL (Implementado y Optimizado)

### ✅ **Funcionalidad Actual - TODOS LOS CASINOS**
La extensión ahora sincroniza perfectamente el estado del dragón entre **ventanas principales** y **ventanas de juego** para **CUALQUIER CASINO**:

#### 🎮 **Escenarios Soportados:**

**Sportium:**
1. Usuario navega en `www.sportium.es` (ventana principal)
2. Abre un juego que carga en `cachedownload.sportium.es` (ventana de juego)
3. **AMBAS ventanas** muestran el mismo dragón con **estado sincronizado**

**Codere:**
1. Usuario navega en `www.codere.es` (ventana principal)
2. Abre un juego que carga en `m.apuestas.codere.es/csbgonlinereports/CasinoGames/...` (ventana de juego)
3. **AMBAS ventanas** muestran el mismo dragón con **estado sincronizado**

**Bet365, Bwin, Luckia, etc.:**
1. Usuario navega en ventana principal (ej: `www.bet365.es`)
2. Abre un juego en subdominio (ej: `casino.bet365.es`, `games.bet365.es`)
3. **SINCRONIZACIÓN AUTOMÁTICA** entre todas las ventanas del mismo casino

#### � **Implementación Técnica UNIVERSAL:**

**Sistema de Detección de Dominio Base:**
```javascript
// Función getUniversalBaseDomain() - Extrae dominio base automáticamente
// Ejemplos:
// m.apuestas.codere.es → codere.es
// casino.bet365.es → bet365.es  
// cachedownload.sportium.es → sportium.es
// games.luckia.es → luckia.es
```

**Detección Mejorada de Ventanas de Juego:**
```javascript
// Función isGameWindow() centralizada detecta patrones universales:
const gameWindowPatterns = [
    'cachedownload',     // Sportium
    'juegos', 'casino',  // Universal  
    'apuestas',          // Codere
    'games', 'slots',    // Universal
    'mobile', 'm.',      // Móvil universal
    'csbgonlinereports', // Codere específico
    'gameid=', 'game='   // Parámetros de URL
];
```

**Background Script - Agrupación Universal:**
- **Variables globales** sincronizadas: `globalDragonState`, `globalLastRealityCheckTime`
- **Agrupación automática** por `baseDomain` usando `getUniversalBaseDomain()`
- **Envío coordinado** a todas las pestañas del mismo casino
- **Estado compartido** independiente del número de ventanas

#### 🧪 **Sincronización de Modo Prueba - CARACTERÍSTICA CLAVE:**

**Problema Resuelto:**
- ❌ **Antes:** El modo prueba solo se activaba en la pestaña donde se iniciaba
- ✅ **Ahora:** El modo prueba se sincroniza instantáneamente en **todas las ventanas del casino**

**Funcionalidad:**
1. **Usuario activa modo prueba** desde cualquier pestaña del casino
2. **Sistema detecta** automáticamente todas las pestañas del mismo dominio base
3. **Envío inmediato** del estado del modo prueba a todas las ventanas
4. **Indicadores visuales** aparecen simultáneamente en todas las pestañas
5. **Desactivación automática** también se sincroniza

**Implementación:**
```javascript
// background.js - Función clave
function notificarModoPruebaATodas() {
    // Detecta la pestaña desde donde se activa
    // Envía mensaje inmediato a todas las pestañas del mismo dominio
    // Incluye sistema fallback para casos edge
}

// session-manager.js - Manejo del mensaje
if (request.type === 'modoPruebaChanged') {
    // Muestra/oculta indicador inmediatamente
    // Funciona independientemente del timer principal
}
```

#### 📊 **Ejemplos de Dominios Sincronizados Automáticamente:**

**Codere:**
```javascript
"codere.es", "m.codere.es", "apuestas.codere.es", 
"m.apuestas.codere.es", "casino.codere.es", "juegos.codere.es"
// Todos sincronizan con baseDomain: "codere.es"
```

**Bet365:**
```javascript  
"bet365.es", "m.bet365.es", "casino.bet365.es",
"games.bet365.es", "poker.bet365.es", "vegas.bet365.es"
// Todos sincronizan con baseDomain: "bet365.es"
```

**Sportium:**
```javascript
"sportium.es", "live.sportium.es", "cachedownload.sportium.es"
// Todos sincronizan con baseDomain: "sportium.es"
```

#### � **Resultado Universal:**
- ✅ **Cualquier casino** tiene sincronización automática
- ✅ **Detección inteligente** de dominios base
- ✅ **Reality checks simultáneos** en todas las ventanas
- ✅ **Transiciones coordinadas** entre estados del dragón
- ✅ **Experiencia consistente** sin configuración manual

### 🧪 **Testing de Sincronización Universal:**

Para verificar que funciona con cualquier casino:

1. **Abrir casino principal** (ej: `www.codere.es`, `www.bet365.es`)
2. **Activar modo test** en popup de extensión  
3. **Abrir juego** en nueva ventana/pestaña
4. **Verificar** que **AMBAS ventanas** muestran:
   - ✅ **Indicador de modo prueba simultáneamente** (característica clave)
   - ✅ Mismo estado del dragón
   - ✅ Reality checks simultáneos cada 10 minutos (modo test)
   - ✅ Transiciones de estado sincronizadas
   - ✅ Tiempos consistentes

#### 📋 **Checklist de Verificación Universal:**
```
□ Modo prueba se activa simultáneamente en ambas ventanas
□ Dragón aparece en ambas ventanas (principal + juego)
□ Estado inicial es 'happy' en ambas
□ A los 15 minutos → cambio a 'tired' simultáneo  
□ A los 30 minutos → cambio a 'angry' simultáneo
□ Transiciones vistosas aparecen en ambas
□ Reality checks cada 10 minutos en ambas
□ Tiempos mostrados son consistentes
□ Desactivación del modo prueba también sincronizada
```

### 📝 **Registro de Patrones Detectados Automáticamente:**

La extensión ahora detecta y sincroniza automáticamente estos patrones:

```javascript
// Patrones de hostname universales:
'casino', 'games', 'slots', 'poker', 'mobile', 'm.', 'app.', 'live'

// Patrones específicos por casino:
'cachedownload'      // Sportium  
'apuestas'           // Codere
'csbgonlinereports'  // Codere CasinoGames
'vegas'              // Bet365
'bingo'              // Universal

// Patrones de URL:
'gameid=', 'game=', 'casinogames', 'launch', 'play'
```

---

## 🔄 Proceso para Nuevas Funcionalidades

### 1. ✅ Analizar Responsabilidad
```
¿Es una constante? → constants.js
¿Es configuración? → config-manager.js  
¿Es detección? → casino-detector.js
¿Es comunicación? → session-manager.js
¿Es interfaz visual? → ui-manager.js
¿Es coordinación? → content_script_refactored.js
```

### 2. ✅ Implementar en el Módulo Correcto
- Agregar función al módulo apropiado
- Documentar la función
- Actualizar imports si es necesario

### 3. ✅ Usar desde el Archivo Principal
- Importar la función (manifest.json)
- Llamar la función desde content_script_refactored.js
- NO copiar el código

### Buscar duplicaciones de constantes:
```bash
grep -r "CASINO_DOMAINS" . --include="*.js"
grep -r "DRAGON_STATES" . --include="*.js"
```

### Verificar imports en manifest.json:
```json
"js": [
  "modules/constants.js", 
  "modules/config-manager.js", 
  "modules/casino-detector.js", 
  "modules/session-manager.js",
  "modules/ui-manager.js",
  "content_script_refactored.js"
]
```

---

## 🚀 Instrucciones para Desarrolladores Futuros

### ⚠️ **SINCRONIZACIÓN UNIVERSAL - NO TOCAR SIN DOCUMENTAR**

**La funcionalidad de sincronización multi-ventana está completamente implementada y optimizada.**

#### 🔒 **Funciones Críticas - MANTENER INTACTAS:**

1. **`notificarModoPruebaATodas()`** (background.js)
   - Propaga instantáneamente el modo prueba a todas las ventanas
   - Incluye sistema fallback robusto
   - **NO modificar sin documentar cambios**

2. **`getBaseDomain()` y `getUniversalBaseDomain()`** (background.js)
   - Normalización inteligente de dominios (codere.es, sportium.es, etc.)
   - Base de la sincronización universal
   - **NO cambiar la lógica de normalización**

3. **Manejo de `modoPruebaChanged`** (session-manager.js)
   - Recepción y aplicación inmediata del modo prueba
   - **NO eliminar este tipo de mensaje**

#### 📋 **Antes de Hacer Cambios:**

1. **PROBAR** siempre con múltiples ventanas abiertas
2. **VERIFICAR** que el modo prueba se sincroniza en todas las ventanas
3. **DOCUMENTAR** cualquier cambio en este README
4. **MANTENER** los logs esenciales:
   ```
   🧪 Notificando modo prueba (ACTIVO/INACTIVO) a pestañas del dominio: X
   🔄 Actualizaciones enviadas a X pestañas del dominio Y
   🌐 getUniversalBaseDomain: hostname → baseDomain
   ```

#### 🎯 **Funcionalidad Garantizada:**
- ✅ Sincronización perfecta en Sportium
- ✅ Sincronización perfecta en Codere  
- ✅ Sincronización automática en cualquier casino nuevo
- ✅ Modo prueba universal e instantáneo
- ✅ Reality checks coordinados
- ✅ Transiciones de estado sincronizadas

---

## 🐉 SISTEMA DE ESTADOS DEL DRAGÓN - DOCUMENTACIÓN CRÍTICA

### ⚠️ **REGLAS FUNDAMENTALES - NUNCA VIOLAR**

#### 🔒 **Jerarquía de Estados INMUTABLE:**
```javascript
const stateHierarchy = {
    'happy': 0,   // Estado inicial - Dragón feliz
    'tired': 1,   // 15 minutos - Dragón cansado  
    'angry': 2    // 30 minutos - Dragón enfadado
};
```

**REGLA #1: NO REGRESIÓN**
- ✅ happy → tired → angry (PERMITIDO)
- ❌ angry → happy (PROHIBIDO SIEMPRE)
- ❌ tired → happy (PROHIBIDO SIEMPRE)
- ❌ angry → tired (PROHIBIDO SIEMPRE)

#### 🕐 **Tiempos de Transición:**
```javascript
// Modo Normal (Producción):
happy → tired: 900 segundos (15 minutos)
tired → angry: 1800 segundos (30 minutos)

// Modo Prueba (Testing):
happy → tired: 15 segundos (simulando 15 minutos)
tired → angry: 30 segundos (simulando 30 minutos)
```

### 🎬 **Sistema de Transiciones - FUNCIONAMIENTO CRÍTICO**

#### ⚡ **Progresión Natural vs Sincronización:**

**PROGRESIÓN NATURAL (Transiciones Vistosas):**
- Cuando el content script calcula un nuevo estado basado en tiempo
- Se activa `isNaturalProgression = true`
- Se ejecuta `mostrarTransicionFase()` - **PANTALLA COMPLETA ÉPICA**
- Cambia happy→tired o tired→angry con efectos visuales

**SINCRONIZACIÓN (Sin Transiciones):**
- Cuando se recibe un estado desde background script
- Se activa `isNaturalProgression = false`  
- Solo actualiza el estado sin efectos visuales
- Para coordinar entre múltiples pestañas

#### 🚨 **ERROR CRÍTICO RESUELTO - NUNCA REPETIR:**

**❌ PROBLEMA ANTERIOR:**
```javascript
// background.js enviaba dragonState en sessionTimeUpdate
chrome.tabs.sendMessage(tabId, {
    type: 'sessionTimeUpdate',
    dragonState: globalDragonState, // ← ESTO CAUSABA EL BUG
    sessionDurationMinutes: sessionDurationMinutes
});
```

**✅ SOLUCIÓN IMPLEMENTADA:**
```javascript
// background.js NO envía dragonState en sessionTimeUpdate
chrome.tabs.sendMessage(tabId, {
    type: 'sessionTimeUpdate',
    sessionDurationMinutes: sessionDurationMinutes,
    // NO enviar dragonState - cada content script calcula su estado
    realityCheckMessage: realityCheckMessage
});
```

#### 🎯 **Consecuencias del Fix:**

**ANTES (Buggy):**
1. Content script recibía `dragonState` del background
2. Se detectaba como sincronización: `isNaturalProgression = false`
3. NO se mostraban las transiciones vistosas
4. Usuario no veía cambios happy→tired o tired→angry

**AHORA (Correcto):**
1. Content script solo recibe `sessionDurationMinutes`
2. Calcula su propio estado: `calculateDragonState(sessionDurationMinutes)`
3. Se detecta como progresión natural: `isNaturalProgression = true`  
4. Se ejecuta `mostrarTransicionFase()` con efectos épicos
5. Usuario ve las transiciones en pantalla completa

### 🛠️ **Funciones Críticas - NO MODIFICAR SIN ENTENDER:**

#### 📡 **session-manager.js - `updateDragonState()`:**
```javascript
function updateDragonState(sessionDurationMinutes, receivedState = null, modoPrueba = false) {
    // LÓGICA CRÍTICA:
    // Si receivedState existe → Sincronización
    // Si receivedState es null → Progresión Natural ← ESTO ACTIVA TRANSICIONES
}
```

#### 🎨 **ui-manager.js - `mostrarTransicionFase()`:**
```javascript
function mostrarTransicionFase(fromState, toState) {
    // CREA OVERLAY DE PANTALLA COMPLETA
    // REPRODUCE VIDEOS DE TRANSICIÓN
    // EFECTOS VISUALES ÉPICOS
    // SOLO SE EJECUTA EN PROGRESIÓN NATURAL
}
```

#### 📊 **background.js - `sessionUpdateTimer`:**
```javascript
// NUNCA incluir dragonState en mensajes sessionTimeUpdate
// Solo enviar información de tiempo para cálculo local
```

### 🧪 **Testing del Sistema de Estados:**

#### ✅ **Checklist de Verificación:**
```
□ Modo prueba activado
□ A los 15 segundos: TRANSICIÓN VISTOSA happy→tired
□ A los 30 segundos: TRANSICIÓN VISTOSA tired→angry  
□ NO aparecen pantallas de "estado actualizado"
□ Estados se sincronizan entre pestañas SIN transiciones duplicadas
□ Refresh de página mantiene estado (no regresa a happy)
```

#### 🔍 **Logs de Debug Importantes:**
```javascript
// PROGRESIÓN NATURAL (Bueno):
"🔄 PROGRESIÓN NATURAL detectada: happy → tired"
"🎬 Ejecutando transición vistosa"

// SINCRONIZACIÓN (Normal):  
"🔄 SINCRONIZACIÓN ESPECIAL: estado recibido tired"
"⚡ Aplicando estado recibido sin transición"

// ERROR (Malo):
"🔄 SINCRONIZACIÓN ESPECIAL" cuando debería ser natural
```

### 🚨 **ADVERTENCIAS PARA DESARROLLADORES FUTUROS:**

#### ❌ **NUNCA HACER:**
1. **NO enviar dragonState** en mensajes `sessionTimeUpdate` desde background
2. **NO permitir regresión** de estados (angry → happy)
3. **NO eliminar** la lógica de `isNaturalProgression`
4. **NO modificar** la jerarquía de estados
5. **NO duplicar** `mostrarTransicionFase()` entre módulos

#### ✅ **SIEMPRE VERIFICAR:**
1. Las transiciones vistosas aparecen en progresión natural
2. No hay pantallas de "estado actualizado" no deseadas
3. Estados se sincronizan correctamente entre pestañas
4. El modo prueba funciona con transiciones épicas
5. Los refresh no resetean el estado del dragón

#### 📝 **Antes de Modificar Estados:**
1. **LEER** esta documentación completamente
2. **PROBAR** en modo prueba con múltiples pestañas
3. **VERIFICAR** que las transiciones aparecen correctamente
4. **DOCUMENTAR** cualquier cambio en este README
5. **MANTENER** la separación entre progresión natural y sincronización

---

## 🚀 Instrucciones para Desarrolladores Futuros