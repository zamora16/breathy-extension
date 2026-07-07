// Tutorial Manager - Guía interactiva para usuarios
// Evitar redeclaración si ya existe (puede inyectarse también desde el popup)
if (!window.TutorialManager) {

class TutorialManager {
    constructor() {
        this.currentStep = 0;
        this.isActive = false;
        this.steps = [];
        this.overlay = null;
        this.boundKeydownHandler = this.handleKeydown.bind(this);
        this.initializeTutorial();
    }

    initializeTutorial() {
        const i18n = (key) => chrome.i18n?.getMessage(key) || key;

        this.steps = [
            {
                id: 'welcome',
                title: i18n('tutorialStep1Title'),
                content: i18n('tutorialStep1Content'),
                target: null
            },
            {
                id: 'mascot',
                title: i18n('tutorialStep2Title'),
                content: i18n('tutorialStep2Content'),
                target: '#breathyContainer'
            },
            {
                id: 'detection',
                title: i18n('tutorialStep3Title'),
                content: i18n('tutorialStep3Content'),
                target: null
            },
            {
                id: 'breathing',
                title: i18n('tutorialStep4Title'),
                content: i18n('tutorialStep4Content'),
                target: null
            },
            {
                id: 'limits',
                title: i18n('tutorialStep5Title'),
                content: i18n('tutorialStep5Content'),
                target: null
            },
            {
                id: 'popup',
                title: i18n('tutorialStep6Title'),
                content: i18n('tutorialStep6Content'),
                target: null
            },
            {
                id: 'privacy',
                title: i18n('tutorialStep7Title'),
                content: i18n('tutorialStep7Content'),
                target: null
            },
            {
                id: 'finish',
                title: i18n('tutorialStep8Title'),
                content: i18n('tutorialStep8Content'),
                target: null
            }
        ];
    }

    // Tutorial automático: solo se muestra la primera vez
    startTutorial() {
        try {
            chrome.storage.sync.get(['hasSeenTutorial'], (result) => {
                if (chrome.runtime.lastError) return;
                if (!result.hasSeenTutorial) {
                    this.showTutorial();
                }
            });
        } catch (error) {
            // Storage no disponible: no mostrar
        }
    }

    showTutorial() {
        this.isActive = true;
        this.currentStep = 0;
        this.createOverlay();
        this.showStep(this.currentStep);

        try {
            chrome.storage.sync.set({ hasSeenTutorial: true });
        } catch (error) {
            // Ignorar: el tutorial se mostrará de nuevo la próxima vez
        }
    }

    // Tutorial manual desde el popup (no altera hasSeenTutorial)
    showTutorialManual() {
        this.isActive = true;
        this.currentStep = 0;
        this.createOverlay();
        this.showStep(this.currentStep);
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
                    <button class="tutorial-close" title="×">×</button>
                </div>
                <div class="tutorial-body">
                    <h3 class="tutorial-title"></h3>
                    <p class="tutorial-text"></p>
                </div>
                <div class="tutorial-footer">
                    <button class="tutorial-prev" disabled></button>
                    <button class="tutorial-skip"></button>
                    <button class="tutorial-next"></button>
                </div>
            </div>
        `;

        if (!document.getElementById('breathyTutorialCSS')) {
            const tutorialStyles = document.createElement('style');
            tutorialStyles.id = 'breathyTutorialCSS';
            tutorialStyles.textContent = `
                .breathy-tutorial-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(20,22,30,0.92);
                    z-index: 10001;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .tutorial-content {
                    background: #232330;
                    border-radius: 14px;
                    max-width: 410px;
                    width: 92%;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.45);
                    overflow: hidden;
                    animation: tutorialFadeIn 0.3s ease-out;
                }

                @keyframes tutorialFadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.96) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                .tutorial-header {
                    padding: 16px 18px 8px;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .tutorial-progress {
                    flex: 1;
                    margin-right: 10px;
                }

                .progress-bar {
                    height: 4px;
                    background: #1c1c24;
                    border-radius: 2px;
                    overflow: hidden;
                    margin-bottom: 7px;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #7cc4a4, #4a8090);
                    border-radius: 2px;
                    transition: width 0.3s ease;
                }

                .step-counter {
                    font-size: 12px;
                    color: #b0b0c0;
                    font-weight: 500;
                }

                .tutorial-close {
                    background: none;
                    border: none;
                    font-size: 22px;
                    cursor: pointer;
                    color: #b0b0c0;
                    padding: 0;
                    width: 28px;
                    height: 28px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s, color 0.2s;
                }

                .tutorial-close:hover {
                    background: #1c1c24;
                    color: #7cc4a4;
                }

                .tutorial-body {
                    padding: 22px 18px 24px;
                    text-align: center;
                }

                .tutorial-title {
                    margin: 0 0 10px;
                    font-size: 19px;
                    font-weight: 600;
                    color: #e8e8f0;
                    letter-spacing: 0.01em;
                }

                .tutorial-text {
                    margin: 0;
                    font-size: 15px;
                    line-height: 1.6;
                    color: #b0b0c0;
                }

                .tutorial-footer {
                    padding: 14px 18px 16px;
                    background: #1c1c24;
                    display: flex;
                    justify-content: space-between;
                    gap: 8px;
                }

                .tutorial-footer button {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 7px;
                    font-size: 13px;
                    font-weight: 500;
                    font-family: inherit;
                    cursor: pointer;
                    transition: background 0.2s, color 0.2s, opacity 0.2s;
                }

                .tutorial-prev {
                    background: #232330;
                    color: #b0b0c0;
                }

                .tutorial-prev:not(:disabled):hover {
                    background: #2e2e3a;
                }

                .tutorial-prev:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .tutorial-skip {
                    background: transparent;
                    color: #b0b0c0;
                    border: 1px solid #2e2e3a;
                }

                .tutorial-skip:hover {
                    background: #232330;
                }

                .tutorial-next {
                    background: #3e6f7c;
                    color: #e8f4f2;
                }

                .tutorial-next:hover {
                    background: #4a8090;
                }

                .tutorial-highlight {
                    position: relative;
                    z-index: 10002;
                    box-shadow: 0 0 0 4px rgba(124,196,164,0.22) !important;
                    border-radius: 8px !important;
                }
            `;
            document.head.appendChild(tutorialStyles);
        }

        document.body.appendChild(this.overlay);

        this.applyTranslations();

        this.overlay.querySelector('.tutorial-close').onclick = () => this.closeTutorial();
        this.overlay.querySelector('.tutorial-skip').onclick = () => this.closeTutorial();
        this.overlay.querySelector('.tutorial-prev').onclick = () => this.previousStep();
        this.overlay.querySelector('.tutorial-next').onclick = () => this.nextStep();

        document.addEventListener('keydown', this.boundKeydownHandler);
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

        const progress = ((stepIndex + 1) / this.steps.length) * 100;
        progressFill.style.width = `${progress}%`;
        stepCounter.textContent = `${stepIndex + 1} / ${this.steps.length}`;

        prevButton.disabled = stepIndex === 0;
        const i18n = (key) => chrome.i18n?.getMessage(key) || key;
        nextButton.textContent = stepIndex === this.steps.length - 1 ? i18n('tutorialFinish') : i18n('tutorialNext');

        // Actualizar elemento resaltado
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });

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

        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });

        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }

        document.removeEventListener('keydown', this.boundKeydownHandler);
    }

    applyTranslations() {
        const i18n = (key) => chrome.i18n?.getMessage(key) || key;

        const prevButton = this.overlay.querySelector('.tutorial-prev');
        const skipButton = this.overlay.querySelector('.tutorial-skip');
        const nextButton = this.overlay.querySelector('.tutorial-next');
        const closeButton = this.overlay.querySelector('.tutorial-close');

        if (prevButton) prevButton.textContent = i18n('tutorialPrevious');
        if (skipButton) skipButton.textContent = i18n('tutorialSkip');
        if (nextButton) nextButton.textContent = i18n('tutorialNext');
        if (closeButton) closeButton.title = i18n('tutorialSkip');
    }

    // Mostrar tutorial manual (para usar desde popup.js)
    static showTutorial() {
        const tutorial = new TutorialManager();
        tutorial.showTutorialManual();
    }
}

window.TutorialManager = TutorialManager;
}
