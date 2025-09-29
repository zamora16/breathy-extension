# 🧪 Guía Completa de Pruebas - Breathy Extension

## 🎯 Objetivo
Esta guía te permitirá probar todas las funcionalidades de Breathy de manera sistemática y completa.

## 📋 Lista de Verificación de Pruebas

### ✅ 1. Instalación Base
- [ ] Extensión cargada correctamente en Chrome
- [ ] Icono de Breathy visible en la barra de herramientas
- [ ] Sin errores en la consola del desarrollador

### ✅ 2. Funcionalidades del Popup
- [ ] Popup se abre al hacer clic en el icono
- [ ] Botón "🎓 Tutorial" funciona
- [ ] Botón "❓ Ayuda" muestra la guía rápida
- [ ] Configuración de patrones de respiración se guarda
- [ ] Límites de tiempo se pueden ajustar
- [ ] Estadísticas muestran "Cargando..." y luego datos reales

### ✅ 3. Sistema de Tutorial
- [ ] Tutorial aparece automáticamente en sitio de casino (primera vez)
- [ ] Tutorial se puede saltar con "Saltar" o "×"
- [ ] Navegación entre pasos con "Anterior/Siguiente"
- [ ] Progreso visual se actualiza correctamente
- [ ] Tutorial manual funciona desde el popup

### ✅ 4. Detección de Sitios
#### Sitios Automáticos (probar con estos dominios):
- [ ] bet365.es - Debe detectarse automáticamente
- [ ] betfair.es - Debe detectarse automáticamente  
- [ ] pokerstars.es - Debe detectarse automáticamente
- [ ] casino.com - Debe detectarse automáticamente

#### Sitios Personalizados:
- [ ] Registrar sitio actual desde cualquier página web
- [ ] Verificar que se añade a la lista de sitios registrados
- [ ] Comprobar que Breathy se activa en el sitio registrado
- [ ] Eliminar sitios registrados funciona correctamente

### ✅ 5. Mascota Breathy (Estados)
- [ ] Aparece en sitios detectados (esquina inferior derecha)
- [ ] Estado "Feliz" (😊) - primeros minutos de sesión
- [ ] Estado "Cansado" (😴) - 50-100% del límite de tiempo
- [ ] Estado "Enfadado" (😠) - límite de tiempo superado
- [ ] Animaciones fluidas entre estados
- [ ] Mascota es arrastrable (se puede mover por la pantalla)

### ✅ 6. Ejercicios de Respiración
- [ ] Patrón 4-4: Inhala 4s, Exhala 4s
- [ ] Patrón 4-7-8: Inhala 4s, Mantén 7s, Exhala 8s
- [ ] Patrón 4-4-4: Inhala 4s, Mantén 4s, Exhala 4s
- [ ] Respiración continua funciona cuando está activada
- [ ] Efectos visuales durante la respiración
- [ ] Audio/vibración (si está implementado)

### ✅ 7. Control de Tiempo
- [ ] Sesión inicia al detectar sitio de casino
- [ ] Tiempo se cuenta correctamente
- [ ] Alertas a 50% del límite de tiempo
- [ ] Alerta final al alcanzar el límite
- [ ] Estadísticas se actualizan en tiempo real

### ✅ 8. Modo de Prueba (Para Desarrolladores)
- [ ] Activar modo prueba acelera el tiempo (1s = 1min)
- [ ] Botón "Parar" desactiva el modo prueba
- [ ] Estados de Breathy cambian rápidamente en modo prueba
- [ ] Límites de tiempo se alcanzan rápidamente

### ✅ 9. Almacenamiento y Persistencia
- [ ] Configuración se mantiene al cerrar/abrir navegador
- [ ] Estadísticas de sesión persisten
- [ ] Sitios personalizados se guardan correctamente
- [ ] Estado del tutorial (ya visto) se recuerda

### ✅ 10. Experiencia de Usuario
- [ ] Interfaz responsive en diferentes tamaños de ventana
- [ ] Traducciones funcionan (español/inglés)
- [ ] Transiciones y animaciones fluidas
- [ ] Sin interferencias con sitios web normales
- [ ] Rendimiento sin impacto notable

## 🧪 Escenarios de Prueba Específicos

### Escenario A: Usuario Nuevo
1. Instalar extensión limpia
2. Visitar bet365.es
3. Verificar que aparece tutorial automático
4. Completar tutorial paso a paso
5. Configurar límite de 30 minutos
6. Usar modo prueba para alcanzar límite rápidamente

### Escenario B: Usuario Experimentado
1. Abrir popup y activar "Respiración continua"
2. Establecer patrón 4-7-8
3. Registrar sitio personalizado (ej: google.com)
4. Visitar sitio registrado y verificar activación
5. Probar arrastrar mascota a diferentes posiciones

### Escenario C: Prueba de Estrés
1. Abrir múltiples pestañas con sitios de casino
2. Verificar que solo una instancia de Breathy está activa
3. Cambiar entre pestañas rápidamente
4. Cerrar y reabrir pestañas
5. Verificar que estadísticas se mantienen coherentes

## 🐛 Problemas Comunes y Soluciones

### La mascota no aparece
- **Causa:** Sitio no detectado o bloqueado por CSP
- **Solución:** Registrar como sitio personalizado

### Tutorial no se muestra
- **Causa:** Ya marcado como "visto" anteriormente  
- **Solución:** Usar botón manual del popup o limpiar storage

### Estadísticas no se actualizan
- **Causa:** Problemas de comunicación con background script
- **Solución:** Recargar extensión desde chrome://extensions/

### Configuración no se guarda
- **Causa:** Problemas de permisos de storage
- **Solución:** Verificar permisos en manifest.json

## 🎮 Comandos de Desarrollo

### Limpiar Datos de Prueba
```javascript
// En consola del background script:
chrome.storage.sync.clear();
chrome.storage.local.clear();
```

### Ver Datos Almacenados
```javascript  
// En consola del background script:
chrome.storage.sync.get(null, console.log);
```

### Forzar Tutorial
```javascript
// En consola de la página:
chrome.storage.sync.remove('hasSeenTutorial');
```

## 📊 Métricas de Éxito
- [ ] 0 errores críticos en consola
- [ ] Tiempo de carga < 2 segundos
- [ ] Tutorial completado en < 3 minutos
- [ ] Configuración guardada correctamente
- [ ] Detección funciona en 95% de los sitios objetivo
- [ ] UX fluida y no intrusiva

## ✨ Checklist Final
- [ ] Todas las pruebas pasadas
- [ ] Documentación actualizada
- [ ] Screenshots/videos de demostración
- [ ] Código comentado y organizado
- [ ] Listo para distribución

---

**💡 Tip:** Usa las herramientas de desarrollo de Chrome (F12) para monitorizar la consola durante las pruebas y identificar cualquier error o advertencia.