// Tutorial Manager - Guía interactiva para usuarios
// Evitar redeclaración si ya existe
if (window.TutorialManager) {
    console.log('TutorialManager ya existe, usando instancia existente');
} else {
class TutorialManager {
    constructor() {
        this.currentStep = 0;
        this.isActive = false;
        this.steps = [];
        this.overlay = null;
        this.tooltip = null;
        this.initializeTutorial();
    }

    initializeTutorial() {
        // Función auxiliar para obtener mensajes traducidos
        const i18n = (key) => {
            return chrome.i18n?.getMessage(key) || key;
        };
        
        this.steps = [
            {
                id: 'welcome',
                title: i18n('tutorialStep1Title'),
                content: i18n('tutorialStep1Content'),
                target: null,
                position: 'center'
            },
            {
                id: 'mascot',
                title: i18n('tutorialStep2Title'),
                content: i18n('tutorialStep2Content'),
                target: '.breathy-mascot',
                position: 'bottom'
            },
            {
                id: 'detection',
                title: i18n('tutorialStep3Title'),
                content: i18n('tutorialStep3Content'),
                target: null,
                position: 'center'
            },
            {
                id: 'breathing',
                title: i18n('tutorialStep4Title'),
                content: i18n('tutorialStep4Content'),
                target: '.breathing-exercise',
                position: 'top'
            },
            {
                id: 'limits',
                title: i18n('tutorialStep5Title'),
                content: i18n('tutorialStep5Content'),
                target: null,
                position: 'center'
            },
            {
                id: 'popup',
                title: i18n('tutorialStep6Title'),
                content: i18n('tutorialStep6Content'),
                target: '.extension-icon',
                position: 'bottom'
            },
            {
                id: 'privacy',
                title: i18n('tutorialStep7Title'),
                content: i18n('tutorialStep7Content'),
                target: null,
                position: 'center'
            },
            {
                id: 'finish',
                title: i18n('tutorialStep8Title'),
                content: i18n('tutorialStep8Content'),
                target: null,
                position: 'center'
            }
        ];
    }

    async startTutorial() {
        // Verificar si es la primera vez
        const hasSeenTutorial = await ConfigManager.get('hasSeenTutorial', false);
        
        if (!hasSeenTutorial) {
            this.showTutorial();
        }
    }

    showTutorial() {
        this.isActive = true;
        this.currentStep = 0;
        this.createOverlay();
        this.showStep(this.currentStep);
        
        // Marcar como visto solo si es la primera vez (tutorial automático)
        ConfigManager.set('hasSeenTutorial', true);
    }
    
    // Mostrar tutorial sin marcar como visto (para uso manual)
    showTutorialManual() {
        this.isActive = true;
        this.currentStep = 0;
        this.createOverlay();
        this.showStep(this.currentStep);
        // NO marcar como visto para permitir tutorial automático futuro
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'breathy-tutorial-overlay';
        this.overlay.innerHTML = `
            <div class="tutorial-content">
                <div class="tutorial-header">
                    <div class="tutorial-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                        <span class="step-counter">1 / ${this.steps.length}</span>
                    </div>
                    <button class="tutorial-close" title="Saltar tutorial">×</button>
                </div>
                <div class="tutorial-body">
                    <h3 class="tutorial-title"></h3>
                    <p class="tutorial-text"></p>
                </div>
                <div class="tutorial-footer">
                    <button class="tutorial-prev" disabled data-i18n="tutorialPrevious">Anterior</button>
                    <button class="tutorial-skip" data-i18n="tutorialSkip">Saltar</button>
                    <button class="tutorial-next" data-i18n="tutorialNext">Siguiente</button>
                </div>
            </div>
        `;

        // Estilos del tutorial
        const tutorialStyles = document.createElement('style');
        tutorialStyles.textContent = `
            .breathy-tutorial-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .tutorial-content {
                background: white;
                border-radius: 12px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                overflow: hidden;
                animation: tutorialFadeIn 0.3s ease-out;
            }

            @keyframes tutorialFadeIn {
                from {
                    opacity: 0;
                    transform: scale(0.9) translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }

            .tutorial-header {
                padding: 20px 20px 10px;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .tutorial-progress {
                flex: 1;
                margin-right: 15px;
            }

            .progress-bar {
                height: 4px;
                background: #e5e7eb;
                border-radius: 2px;
                overflow: hidden;
                margin-bottom: 8px;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #10b981, #3b82f6);
                border-radius: 2px;
                transition: width 0.3s ease;
            }

            .step-counter {
                font-size: 12px;
                color: #6b7280;
                font-weight: 500;
            }

            .tutorial-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #6b7280;
                padding: 0;
                width: 30px;
                height: 30px;
                border-radius: 15px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            .tutorial-close:hover {
                background: #f3f4f6;
                color: #374151;
            }

            .tutorial-body {
                padding: 30px;
                text-align: center;
            }

            .tutorial-title {
                margin: 0 0 15px;
                font-size: 24px;
                font-weight: 600;
                color: #111827;
            }

            .tutorial-text {
                margin: 0;
                font-size: 16px;
                line-height: 1.5;
                color: #4b5563;
            }

            .tutorial-footer {
                padding: 20px;
                background: #f9fafb;
                display: flex;
                justify-content: space-between;
                gap: 10px;
            }

            .tutorial-footer button {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }

            .tutorial-prev {
                background: #e5e7eb;
                color: #6b7280;
            }

            .tutorial-prev:not(:disabled):hover {
                background: #d1d5db;
            }

            .tutorial-prev:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .tutorial-skip {
                background: transparent;
                color: #6b7280;
                border: 1px solid #d1d5db;
            }

            .tutorial-skip:hover {
                background: #f3f4f6;
            }

            .tutorial-next {
                background: linear-gradient(90deg, #10b981, #3b82f6);
                color: white;
            }

            .tutorial-next:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            }

            .tutorial-highlight {
                position: relative;
                z-index: 10002;
                box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.3) !important;
                border-radius: 8px !important;
            }
        `;

        document.head.appendChild(tutorialStyles);
        document.body.appendChild(this.overlay);

        // Aplicar traducciones a botones
        this.applyTranslations();

        // Event listeners
        this.overlay.querySelector('.tutorial-close').onclick = () => this.closeTutorial();
        this.overlay.querySelector('.tutorial-skip').onclick = () => this.closeTutorial();
        this.overlay.querySelector('.tutorial-prev').onclick = () => this.previousStep();
        this.overlay.querySelector('.tutorial-next').onclick = () => this.nextStep();

        // ESC para cerrar
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    showStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) return;

        const step = this.steps[stepIndex];
        const title = this.overlay.querySelector('.tutorial-title');
        const text = this.overlay.querySelector('.tutorial-text');
        const progressFill = this.overlay.querySelector('.progress-fill');
        const stepCounter = this.overlay.querySelector('.step-counter');
        const prevButton = this.overlay.querySelector('.tutorial-prev');
        const nextButton = this.overlay.querySelector('.tutorial-next');

        title.textContent = step.title;
        text.textContent = step.content;
        
        // Actualizar progreso
        const progress = ((stepIndex + 1) / this.steps.length) * 100;
        progressFill.style.width = `${progress}%`;
        stepCounter.textContent = `${stepIndex + 1} / ${this.steps.length}`;

        // Botones
        prevButton.disabled = stepIndex === 0;
        const i18n = (key) => chrome.i18n?.getMessage(key) || key;
        nextButton.textContent = stepIndex === this.steps.length - 1 ? i18n('tutorialFinish') : i18n('tutorialNext');

        // Remover highlight anterior
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });

        // Añadir highlight al elemento objetivo
        if (step.target) {
            const targetElement = document.querySelector(step.target);
            if (targetElement) {
                targetElement.classList.add('tutorial-highlight');
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.showStep(this.currentStep);
        } else {
            this.closeTutorial();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }

    handleKeydown(event) {
        if (!this.isActive) return;
        
        switch (event.key) {
            case 'Escape':
                this.closeTutorial();
                break;
            case 'ArrowLeft':
                this.previousStep();
                break;
            case 'ArrowRight':
                this.nextStep();
                break;
        }
    }

    closeTutorial() {
        this.isActive = false;
        
        // Remover highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });

        // Remover overlay
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }

        document.removeEventListener('keydown', this.handleKeydown.bind(this));
    }

    applyTranslations() {
        const i18n = (key) => chrome.i18n?.getMessage(key) || key;
        
        // Traducir botones
        const prevButton = this.overlay.querySelector('.tutorial-prev');
        const skipButton = this.overlay.querySelector('.tutorial-skip');
        const nextButton = this.overlay.querySelector('.tutorial-next');
        
        if (prevButton) prevButton.textContent = i18n('tutorialPrevious');
        if (skipButton) skipButton.textContent = i18n('tutorialSkip');
        if (nextButton) nextButton.textContent = i18n('tutorialNext');
    }

    // Método para mostrar tutorial manual desde popup (sin verificar si ya se vio)
    static showManualTutorial() {
        const tutorial = new TutorialManager();
        tutorial.showTutorialManual();
    }
    
    // Método directo para mostrar tutorial (para usar desde popup.js)
    static showTutorial() {
        const tutorial = new TutorialManager();
        tutorial.showTutorialManual();
    }
}

// Exportar para uso en otros módulos
window.TutorialManager = TutorialManager;
}