# 📦 Archivos para Chrome Web Store

## ✅ Incluir en el ZIP (Solo archivos esenciales)

```
extensiongamble/
├── manifest.json              ✅ 
├── background.js              ✅
├── content_script.js          ✅
├── popup.html                 ✅
├── popup.js                   ✅
├── styles/
│   └── mascot.css             ✅
├── assets/                    ✅
│   ├── logo.png               
│   ├── happy.webm             
│   ├── tired.webm             
│   ├── angry.webm             
│   └── breath.webm            
├── modules/                   ✅
│   ├── constants.js           
│   ├── config-manager.js      
│   ├── casino-detector.js     
│   ├── session-manager.js     
│   ├── ui-manager.js          
│   └── tutorial-manager.js    
└── _locales/                  ✅
    ├── en/messages.json       
    └── es/messages.json       
```

## ❌ NO Incluir en el ZIP (Documentación de desarrollo)

```
❌ README.md                 (Solo para GitHub)
❌ ROADMAP.md                (Planificación interna)  
❌ GIT_WORKFLOW.md           (Desarrollo)
❌ GITHUB_SETUP.md           (Configuración Git)
❌ TESTING_GUIDE.md          (Para desarrolladores)
❌ DEMO_CONFIG.md            (Configuración demo)
❌ .gitignore                (Git específico)
❌ .git/                     (Repositorio Git)
❌ test-page.html            (Solo para testing)
```

## 📏 Tamaños Aproximados

```
Archivos esenciales:  ~8-10 MB
Documentación:        ~50 KB
Videos/Assets:        ~7-8 MB (mayor peso)
```

## 🎯 Script para Crear ZIP de Publicación

Voy a crear un script que genere el ZIP limpio automáticamente.