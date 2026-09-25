# Breathy

**A Chrome extension that brings guided breathing and self-set time limits to online gambling sites.**

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-4285F4?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/breathy/mlnepkobdnlamfipojhdldionljfebhe)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-34A853)
![Languages](https://img.shields.io/badge/i18n-EN%20%7C%20ES-informational)

Breathy detects when you open a betting or casino site and shows a small animated companion. Its mood follows your session against the limit you chose yourself (calm → tired at 50% → alert when the limit is reached), and a click on it starts a guided breathing exercise. The idea comes from behavioural science: a short pause and a reminder of your own decision can interrupt an automatic loop without blocking or judging anyone.

**Published on the [Chrome Web Store](https://chromewebstore.google.com/detail/breathy/mlnepkobdnlamfipojhdldionljfebhe).**

## Features

- **Automatic detection** of gambling sites: a curated list of 90+ operators (Spain, LATAM, UK and global) plus keyword heuristics for unlisted sites and casino game pop-up windows, with an exclusion list so search engines, social media and sports news are never flagged.
- **Custom sites**: register any site from the popup so Breathy activates there too.
- **Session limit** you set yourself (minimum 30 min), with reminders at 30, 60 and 120 minutes and periodic reality checks.
- **Reflection prompt** the first time you enter a gambling site in a session.
- **Guided breathing** with three patterns (simple, relaxing, balanced), on demand or continuous.
- **Onboarding tutorial** the first time it activates.
- **Private by design**: everything is stored locally in the browser (`chrome.storage`); nothing is sent to any server.

## How it works

| Piece | Role |
| --- | --- |
| `background.js` | MV3 service worker. Tracks the session across all gambling tabs using `chrome.alarms` + `chrome.storage.session`, so state survives service-worker restarts (plain JS timers are not reliable in MV3). |
| `content_script.js` | Entry point on each page: runs detection, shows the reflection prompt and the companion. |
| `modules/casino-detector.js` | Domain matching (exact and subdomain), keyword heuristics and game-window detection. |
| `modules/session-manager.js` | Maps elapsed time to the companion's state and syncs it with the background worker. |
| `modules/ui-manager.js`, `tutorial-manager.js`, `config-manager.js` | UI, onboarding and user settings. |
| `modules/constants.js` | Shared data (domain lists, thresholds, texts), loadable both as a content script and with `importScripts`. |
| `_locales/` | English and Spanish strings (`chrome.i18n`). |

Plain JavaScript, no build step and no dependencies.

## Run from source

1. Clone this repository.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select the repository folder.

## Disclaimer

Breathy is a self-care aid, not a treatment. If gambling is causing you problems, please look for professional support (in Spain: FEJAR, 900 200 225).

## Author

Built by [Ángel Zamora Martínez](https://zamora16.github.io/angel-zamora-portfolio/), PhD in Psychology.
