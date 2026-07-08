# Publicar Breathy en Chrome Web Store — guía completa

Todo lo de esta carpeta está listo para pegar en el [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

## 0. Requisitos previos

1. **Cuenta de desarrollador** — entra en el [dashboard](https://chrome.google.com/webstore/devconsole)
   con tu cuenta de Google y paga la tasa única de **5 USD**.
2. **Landing desplegada** — necesitas la URL pública de la política de privacidad
   (`https://TU-DOMINIO/privacidad.html`). Sin ella no se puede enviar la extensión.
3. **El ZIP** — `breathy-v1.0.0.zip` en la raíz del proyecto. Si necesitas regenerarlo:

   ```powershell
   .\store\build-zip.ps1
   ```

## 1. Crear el artículo

Dashboard → **+ Nuevo artículo** → sube `breathy-v1.0.0.zip`.

## 2. Ficha del artículo (pestaña "Ficha de Play Store")

| Campo | Valor |
|---|---|
| Idioma predeterminado | Español |
| Nombre | Breathy *(viene del manifest)* |
| Categoría | **Estilo de vida → Bienestar** |

**Resumen (ES)** — máx. 132 caracteres:

> Tu compañera de respiración y autocuidado para un juego online más responsable

**Descripción (ES)** — pegar tal cual:

```
Breathy te acompaña cuando entras en un casino o casa de apuestas online. No te juzga ni te bloquea a la fuerza: te ayuda a decidir con calma, a respetar tus propios límites y a parar a tiempo.

QUÉ HACE

• Pausa de reflexión al entrar: 10 segundos para preguntarte cómo te sientes antes de empezar a jugar.
• Un dragón que refleja tu sesión: tranquilo al empezar, cansado a mitad de tu límite y en alerta cuando lo superas.
• Respiración guiada: un clic en el dragón y un minuto de respiración (4-4, 4-7-8 o 4-4-4) para bajar pulsaciones.
• Preguntas de control de realidad cada 10 minutos.
• Límite de tiempo por sesión y límite diario acumulado (cerrar la pestaña no lo reinicia).
• Pausa de emergencia: bloquea todos los casinos durante 24 h, 48 h o 7 días. No se puede desactivar hasta que termina.
• Estadísticas claras: tiempo de hoy, de la semana y tu racha de días sin jugar.
• Recursos de ayuda profesional siempre a mano (FEJAR, Jugadores Anónimos, Gambling Therapy).

PRIVACIDAD

Sin registro, sin cuentas y sin servidores. Todos tus datos se guardan localmente en tu navegador y nunca salen de él. Breathy no usa analíticas ni comparte nada con terceros.

DETECCIÓN AUTOMÁTICA

Reconoce los principales casinos y casas de apuestas de España, Latinoamérica, Reino Unido e internacionales. Y si juegas en un sitio que no reconoce, puedes registrarlo tú mismo en dos clics.

IMPORTANTE

Breathy es una herramienta de autocuidado, no un tratamiento médico ni psicológico. Si el juego está afectando a tu vida, busca ayuda profesional. En España existe además el RGIAJ, el registro oficial y gratuito de autoexclusión del juego online.
```

**Añade el idioma inglés** (selector de idioma de la ficha → English):

Resumen (EN):

> Your breathing and self-care companion for more responsible online gambling

Descripción (EN):

```
Breathy stays by your side when you enter an online casino or betting site. It doesn't judge you or force-block you: it helps you decide calmly, respect your own limits and stop in time.

WHAT IT DOES

• Reflection pause on entry: 10 seconds to ask yourself how you feel before you start playing.
• A dragon that mirrors your session: calm at the start, tired halfway through your limit, on alert when you pass it.
• Guided breathing: one click on the dragon starts a one-minute exercise (4-4, 4-7-8 or 4-4-4) to slow your heart rate.
• Reality-check questions every 10 minutes.
• Per-session time limit and cumulative daily limit (closing the tab doesn't reset it).
• Emergency pause: blocks every casino site for 24 h, 48 h or 7 days. It cannot be turned off until it ends.
• Clear stats: time today, this week, and your streak of gambling-free days.
• Professional help resources always at hand (GamCare, Gamblers Anonymous, Gambling Therapy).

PRIVACY

No sign-up, no accounts, no servers. All your data is stored locally in your browser and never leaves it. Breathy uses no analytics and shares nothing with third parties.

AUTOMATIC DETECTION

It recognises major casinos and bookmakers from the UK, Spain, Latin America and international brands. And if you play somewhere it doesn't recognise, you can register that site yourself in two clicks.

IMPORTANT

Breathy is a self-care tool, not medical or psychological treatment. If gambling is affecting your life, please seek professional help. In the UK, GamStop offers free official self-exclusion from all licensed operators.
```

**Recursos gráficos** (en esta carpeta):

- Capturas: `screenshot-1280x800-es.png` (ficha ES) y `screenshot-1280x800-en.png` (ficha EN).
- Tarjeta promocional pequeña: `promo-tile-440x280.png`.
- Icono de la tienda: lo toma del manifest (`assets/icons/icon128.png`).

> 💡 **Muy recomendado**: añade 2-3 capturas reales además de la tarjeta. Carga la extensión,
> entra en un casino y captura: (1) el popup de reflexión con el dragón, (2) la mascota sobre
> la web con su bocadillo, (3) el popup de configuración. Redimensiona a 1280×800.

## 3. Pestaña "Privacidad"

**Finalidad única** (single purpose):

> Ayudar al usuario a controlar el tiempo que pasa en webs de casino y apuestas online mediante límites, recordatorios y bloqueos temporales que él mismo configura.

**Justificación de permisos** — pegar en cada campo:

| Permiso | Justificación |
|---|---|
| `storage` | Guardar localmente la configuración del usuario (límites, patrón de respiración) y sus estadísticas de tiempo de juego. No se transmite nada fuera del navegador. |
| `tabs` | Detectar cuándo el usuario entra o sale de una web de casino para medir la duración de la sesión y aplicar sus límites de tiempo. |
| `activeTab` | Mostrar el tutorial interactivo en la pestaña activa cuando el usuario lo solicita desde el popup. |
| `scripting` | Inyectar el tutorial interactivo en la pestaña activa únicamente a petición del usuario. |
| `alarms` | Mantener el temporizador de sesión funcionando de forma fiable mientras hay una sesión de juego activa. |
| Permiso de host (`<all_urls>`) | La extensión debe detectar automáticamente webs de casino en cualquier dominio: la lista de operadores cambia constantemente y el usuario puede registrar sitios propios. El content script solo activa su interfaz en webs de juego; en el resto de páginas permanece inactivo y no lee su contenido. |

**Uso de datos**: marcar que **NO** se recopilan datos de usuario (no vendemos, no transferimos,
no usamos para fines ajenos). Todos los datos permanecen en el dispositivo.

**URL de política de privacidad**: `https://TU-DOMINIO/privacidad.html`

## 4. Pestaña "Distribución"

- Visibilidad: **Pública**.
- Países: todos (o al menos España, Latinoamérica, Reino Unido y EE. UU.).
- Precio: gratis.

## 5. Enviar a revisión

Botón **Enviar para revisión**. Tiempos habituales: de unas horas a ~3 días
(las extensiones con permiso de host amplio pueden tardar algo más).
Si piden aclaraciones, la justificación del permiso de host del punto 3 es la respuesta clave.

## 6. Después de la aprobación

1. Copia la URL de la ficha (`https://chromewebstore.google.com/detail/breathy/...`).
2. En el repo de la landing, sustituye `REEMPLAZAR-ID` por esa URL y haz push.
3. Celebra. 🐉
