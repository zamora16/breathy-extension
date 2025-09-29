# 🎯 Configuración de Demostración - Breathy

Este archivo contiene configuraciones pre-establecidas para facilitar las pruebas y demostraciones de Breathy.

## 🚀 Configuración Rápida

### Para Pruebas de Desarrollo
```javascript
// Copiar y pegar en consola del popup:
chrome.storage.sync.set({
  breathingPattern: '4-4',
  sessionDuration: 30, // 30 minutos para pruebas rápidas
  continuousBreathing: true,
  hasSeenTutorial: false, // Forzar tutorial en próxima visita
  customDomains: ['google.com', 'github.com'] // Sitios de prueba
});
```

### Para Demostración a Usuarios
```javascript
// Configuración realista para demostrar:
chrome.storage.sync.set({
  breathingPattern: '4-7-8', // Patrón avanzado
  sessionDuration: 90, // 1.5 horas estándar
  continuousBreathing: false,
  hasSeenTutorial: false,
  customDomains: []
});
```

## 🧪 Sitios de Prueba Recomendados

### Sitios Seguros para Desarrollo
- **google.com** - Fácil de registrar como sitio personalizado
- **github.com** - Ideal para probar funcionalidades
- **stackoverflow.com** - Buen ejemplo de sitio complejo
- **wikipedia.org** - Contenido neutro para pruebas

### Simulación de Sitios de Casino (Sin Apostar)
- **casino-demo.com** (simulador gratuito)
- **freecasino.org** (juegos de práctica)
- **playcasino-demo.net** (sin dinero real)

## ⏰ Configuraciones de Tiempo para Pruebas

### Prueba Ultra Rápida (2 minutos)
- Límite: 2 minutos
- Activar modo prueba
- 1 segundo real = 1 minuto virtual
- Estados cambiarán cada ~30 segundos

### Prueba Rápida (5 minutos)
- Límite: 5 minutos  
- Sin modo prueba
- Para ver progresión natural de estados

### Prueba Completa (30 minutos)
- Límite: 30 minutos
- Experiencia realista pero acelerada

## 🎭 Escenarios de Demostración

### 1. "Primera Vez Usuario"
```bash
# Pasos:
1. Limpiar storage (ver comandos abajo)
2. Visitar sitio registrado
3. Tutorial aparece automáticamente
4. Mostrar cada paso del tutorial
5. Configurar límites básicos
```

### 2. "Usuario Experimentado"  
```bash
# Pasos:
1. Configuración avanzada ya establecida
2. Mostrar respiración continua
3. Demostrar arrastrar mascota
4. Mostrar estadísticas detalladas
5. Cambio de estados de Breathy
```

### 3. "Caso de Emergencia"
```bash
# Pasos:
1. Activar modo prueba
2. Alcanzar límite rápidamente
3. Mostrar estado "enfadado" de Breathy
4. Ejercicios de respiración intensivos
5. Mensaje de límite alcanzado
```

## 🛠️ Comandos Útiles para Demostración

### Limpiar Todo (Empezar de Cero)
```javascript
// En consola del background script o popup:
chrome.storage.sync.clear(() => {
    chrome.storage.local.clear(() => {
        console.log('✅ Extensión limpia para nueva demo');
    });
});
```

### Ver Estado Actual
```javascript
// Ver toda la configuración:
chrome.storage.sync.get(null, (data) => {
    console.table(data);
});
```

### Forzar Tutorial
```javascript
// Hacer que aparezca tutorial en próxima visita:
chrome.storage.sync.set({hasSeenTutorial: false});
```

### Simular Sesión Larga
```javascript
// Simular que llevas 45 minutos jugando:
chrome.storage.local.set({
    sessionStartTime: Date.now() - (45 * 60 * 1000)
});
```

### Añadir Sitio de Prueba
```javascript
// Registrar sitio actual como casino personalizado:
chrome.storage.sync.get(['customDomains'], (result) => {
    const domains = result.customDomains || [];
    domains.push(window.location.hostname);
    chrome.storage.sync.set({customDomains: domains});
});
```

## 📱 Configuración de Dispositivos

### Para Desktop
- Resolución mínima: 1024x768
- Mascota en esquina inferior derecha
- Popup tamaño estándar (380px)

### Para Laptop Pequeño  
- Resolución mínima: 1366x768
- Mascota ajustable por arrastre
- Popup responsive

## 🎨 Personalización Visual

### Tema Claro (Futuro)
```javascript
// Preparado para implementar:
chrome.storage.sync.set({
    theme: 'light',
    mascotColor: 'blue'
});
```

### Modo Alto Contraste
```javascript  
// Para accesibilidad:
chrome.storage.sync.set({
    highContrast: true,
    fontSize: 'large'
});
```

## 📊 Métricas de Demo Exitosa

- ✅ Tutorial completado sin errores
- ✅ Configuración guardada correctamente  
- ✅ Estados de Breathy visibles claramente
- ✅ Ejercicios de respiración funcionando
- ✅ Límites de tiempo respetados
- ✅ Sin errores en consola
- ✅ UX fluida y profesional

## 🎬 Scripts de Presentación

### Introducción (30 segundos)
> "Breathy es tu compañero digital para un juego responsable. Te ayuda a mantener el control a través de respiración consciente y límites personalizables."

### Demostración Core (2 minutos)
1. Mostrar detección automática
2. Estados de Breathy (feliz → cansado → enfadado)
3. Ejercicio de respiración en vivo  
4. Configuración de límites

### Características Avanzadas (1 minuto)
1. Sitios personalizados
2. Estadísticas detalladas
3. Modo de prueba para desarrolladores
4. Privacidad y seguridad

---

**🎯 Objetivo:** Cada demo debe mostrar el valor inmediato de Breathy y convencer al usuario de su utilidad práctica para el juego responsable.