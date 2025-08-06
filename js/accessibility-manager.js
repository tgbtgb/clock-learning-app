/**
 * 无障碍和交互管理器
 * 处理Tab导航、触摸设备优化、键盘导航等
 */
class AccessibilityManager {
    constructor() {
        this.tabOrder = [];
        this.currentTabIndex = -1;
        this.touchDevice = this.detectTouchDevice();
        
        // 确保DOM加载完成后再初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            // DOM已经加载完成
            this.init();
        }
    }

    /**
     * 初始化无障碍功能
     */
    init() {
        this.setupTabOrder();
        this.setupKeyboardNavigation();
        this.setupTouchOptimizations();
        this.setupFocusManagement();
        this.setupAriaLabels();
    }

    /**
     * 检测是否为触摸设备
     */
    detectTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    /**
     * 设置Tab导航顺序
     */
    setupTabOrder() {
        // 定义Tab导航的逻辑顺序
        const tabElements = [
            // 难度选择区域
            '.star-container[data-level="1"]',
            '.star-container[data-level="2"]',
            '.star-container[data-level="3"]',
            '.star-container[data-level="4"]',
            '.star-container[data-level="5"]',
            '#refresh-btn',
            
            // 参考线开关
            '#guide-lines-toggle',
            
            // 时间输入区域
            '#hours-input',
            '#minutes-input',
            '#seconds-input',
            '#submit-btn',
            
            // 记录筛选区域
            '#correctness-filter',
            '#difficulty-filter',
            '#date-from-filter',
            '#date-to-filter',
            '#clear-filters-btn',
            '#clear-records-btn',
            
            // 分页导航
            '#prev-page-btn',
            '#next-page-btn'
        ];

        // 设置tabindex
        tabElements.forEach((selector, index) => {
            const element = document.querySelector(selector);
            if (element) {
                element.setAttribute('tabindex', index + 1);
                this.tabOrder.push(element);
            }
        });

        // 为星级选择添加键盘支持
        this.setupStarKeyboardNavigation();
    }

    /**
     * 设置星级选择的键盘导航
     */
    setupStarKeyboardNavigation() {
        const starContainers = document.querySelectorAll('.star-container');
        
        starContainers.forEach((container, index) => {
            if (!container || !container.classList) {
                console.warn('星级容器元素无效，跳过键盘导航设置');
                return;
            }
            
            // 添加键盘事件监听
            container.addEventListener('keydown', (e) => {
                switch(e.key) {
                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        container.click();
                        break;
                    case 'ArrowRight':
                    case 'ArrowDown':
                        e.preventDefault();
                        this.focusNextStar(index);
                        break;
                    case 'ArrowLeft':
                    case 'ArrowUp':
                        e.preventDefault();
                        this.focusPrevStar(index);
                        break;
                }
            });

            // 添加焦点样式
            container.addEventListener('focus', () => {
                if (container.classList) {
                    container.classList.add('keyboard-focus');
                }
            });

            container.addEventListener('blur', () => {
                if (container.classList) {
                    container.classList.remove('keyboard-focus');
                }
            });
        });
    }

    /**
     * 焦点移动到下一个星级
     */
    focusNextStar(currentIndex) {
        const starContainers = document.querySelectorAll('.star-container');
        const nextIndex = (currentIndex + 1) % starContainers.length;
        starContainers[nextIndex].focus();
    }

    /**
     * 焦点移动到上一个星级
     */
    focusPrevStar(currentIndex) {
        const starContainers = document.querySelectorAll('.star-container');
        const prevIndex = currentIndex === 0 ? starContainers.length - 1 : currentIndex - 1;
        starContainers[prevIndex].focus();
    }

    /**
     * 设置键盘导航
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Escape键关闭模态框
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal[style*="display: block"], .modal[style*="display: flex"]');
                if (modal) {
                    const closeBtn = modal.querySelector('.modal-close');
                    if (closeBtn) closeBtn.click();
                }
            }

            // Tab键导航增强
            if (e.key === 'Tab') {
                this.handleTabNavigation(e);
            }
        });

        // 为时间输入框添加特殊键盘支持
        this.setupTimeInputKeyboard();
    }

    /**
     * 处理Tab导航
     */
    handleTabNavigation(e) {
        const focusableElements = this.getFocusableElements();
        const currentIndex = focusableElements.indexOf(document.activeElement);
        
        if (e.shiftKey) {
            // Shift+Tab 向前导航
            if (currentIndex <= 0) {
                e.preventDefault();
                focusableElements[focusableElements.length - 1].focus();
            }
        } else {
            // Tab 向后导航
            if (currentIndex >= focusableElements.length - 1) {
                e.preventDefault();
                focusableElements[0].focus();
            }
        }
    }

    /**
     * 获取所有可聚焦元素
     */
    getFocusableElements() {
        const selectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            'a[href]'
        ];
        
        return Array.from(document.querySelectorAll(selectors.join(', ')))
            .filter(el => !el.hidden && el.offsetParent !== null);
    }

    /**
     * 设置时间输入框的键盘支持
     */
    setupTimeInputKeyboard() {
        const timeInputs = ['#hours-input', '#minutes-input', '#seconds-input'];
        
        timeInputs.forEach((selector, index) => {
            const input = document.querySelector(selector);
            if (!input) return;

            input.addEventListener('keydown', (e) => {
                switch(e.key) {
                    case 'ArrowRight':
                        if (input.selectionStart === input.value.length) {
                            e.preventDefault();
                            this.focusNextTimeInput(index);
                        }
                        break;
                    case 'ArrowLeft':
                        if (input.selectionStart === 0) {
                            e.preventDefault();
                            this.focusPrevTimeInput(index);
                        }
                        break;
                    case 'Enter':
                        e.preventDefault();
                        if (index === timeInputs.length - 1) {
                            // 最后一个输入框，提交答案
                            document.querySelector('#submit-btn')?.click();
                        } else {
                            this.focusNextTimeInput(index);
                        }
                        break;
                }
            });
        });
    }

    /**
     * 焦点移动到下一个时间输入框
     */
    focusNextTimeInput(currentIndex) {
        const timeInputs = ['#hours-input', '#minutes-input', '#seconds-input'];
        const nextIndex = Math.min(currentIndex + 1, timeInputs.length - 1);
        const nextInput = document.querySelector(timeInputs[nextIndex]);
        if (nextInput) {
            nextInput.focus();
            nextInput.select();
        }
    }

    /**
     * 焦点移动到上一个时间输入框
     */
    focusPrevTimeInput(currentIndex) {
        const timeInputs = ['#hours-input', '#minutes-input', '#seconds-input'];
        const prevIndex = Math.max(currentIndex - 1, 0);
        const prevInput = document.querySelector(timeInputs[prevIndex]);
        if (prevInput) {
            prevInput.focus();
            prevInput.select();
        }
    }

    /**
     * 设置触摸设备优化
     */
    setupTouchOptimizations() {
        if (!this.touchDevice) return;

        // 为触摸设备添加特殊样式类
        if (document.body) {
            document.body.classList.add('touch-device');
        }

        // 优化触摸目标大小
        this.optimizeTouchTargets();

        // 添加触摸反馈
        this.setupTouchFeedback();
    }

    /**
     * 优化触摸目标大小
     */
    optimizeTouchTargets() {
        const touchTargets = [
            '.star-container',
            '.help-icon',
            '.toggle-switch',
            '.time-input-field input',
            'button',
            '.record-detail-btn'
        ];

        touchTargets.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (el && el.classList) {
                    el.classList.add('touch-optimized');
                }
            });
        });
    }

    /**
     * 设置触摸反馈
     */
    setupTouchFeedback() {
        const interactiveElements = document.querySelectorAll(
            'button, .star-container, .toggle-switch, .record-item'
        );

        interactiveElements.forEach(el => {
            if (!el || !el.classList) return;
            
            el.addEventListener('touchstart', () => {
                if (el.classList) {
                    el.classList.add('touch-active');
                }
            });

            el.addEventListener('touchend', () => {
                setTimeout(() => {
                    if (el.classList) {
                        el.classList.remove('touch-active');
                    }
                }, 150);
            });

            el.addEventListener('touchcancel', () => {
                if (el.classList) {
                    el.classList.remove('touch-active');
                }
            });
        });
    }

    /**
     * 设置焦点管理
     */
    setupFocusManagement() {
        // 模态框焦点陷阱
        this.setupModalFocusTrap();
        
        // 跳过链接
        this.setupSkipLinks();
    }

    /**
     * 设置模态框焦点陷阱
     */
    setupModalFocusTrap() {
        document.addEventListener('focusin', (e) => {
            const modal = document.querySelector('.modal[style*="display: block"], .modal[style*="display: flex"]');
            if (modal && !modal.contains(e.target)) {
                const focusableElements = modal.querySelectorAll(
                    'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusableElements.length > 0) {
                    focusableElements[0].focus();
                }
            }
        });
    }

    /**
     * 设置跳过链接
     */
    setupSkipLinks() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = '跳转到主要内容';
        skipLink.className = 'skip-link';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: #000;
            color: #fff;
            padding: 8px;
            text-decoration: none;
            border-radius: 4px;
            z-index: 10000;
            transition: top 0.3s;
        `;

        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });

        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });

        if (document.body) {
            document.body.insertBefore(skipLink, document.body.firstChild);
        }

        // 为主要内容区域添加ID
        const clockSection = document.querySelector('.clock-section');
        if (clockSection) {
            clockSection.id = 'main-content';
        }
    }

    /**
     * 设置ARIA标签
     */
    setupAriaLabels() {
        // 为星级选择添加ARIA标签
        const starContainers = document.querySelectorAll('.star-container');
        starContainers.forEach((container, index) => {
            const level = index + 1;
            container.setAttribute('role', 'button');
            container.setAttribute('aria-label', `选择${level}星难度`);
            container.setAttribute('aria-pressed', 'false');
        });

        // 为参考线开关添加ARIA标签
        const guideToggle = document.querySelector('#guide-lines-toggle');
        if (guideToggle) {
            guideToggle.setAttribute('aria-label', '切换参考线显示');
        }

        // 为时间输入框添加ARIA标签
        const hoursInput = document.querySelector('#hours-input');
        const minutesInput = document.querySelector('#minutes-input');
        const secondsInput = document.querySelector('#seconds-input');
        
        if (hoursInput) hoursInput.setAttribute('aria-label', '输入小时');
        if (minutesInput) minutesInput.setAttribute('aria-label', '输入分钟');
        if (secondsInput) secondsInput.setAttribute('aria-label', '输入秒数');

        // 为计时器添加ARIA标签
        const timerDisplay = document.querySelector('#timer-display');
        if (timerDisplay) {
            timerDisplay.setAttribute('aria-label', '答题计时器');
            timerDisplay.setAttribute('aria-live', 'polite');
        }

        // 为结果显示添加ARIA标签
        const resultDisplay = document.querySelector('#result-display');
        if (resultDisplay) {
            resultDisplay.setAttribute('aria-live', 'assertive');
            resultDisplay.setAttribute('aria-atomic', 'true');
        }
    }

    /**
     * 更新星级选择的ARIA状态
     */
    updateStarAriaState(selectedLevel) {
        const starContainers = document.querySelectorAll('.star-container');
        starContainers.forEach((container, index) => {
            const level = index + 1;
            const isSelected = level === selectedLevel;
            container.setAttribute('aria-pressed', isSelected.toString());
        });
    }

    /**
     * 宣布结果给屏幕阅读器
     */
    announceResult(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        announcement.textContent = message;
        
        if (document.body) {
            document.body.appendChild(announcement);
            
            setTimeout(() => {
                if (document.body && announcement.parentNode) {
                    document.body.removeChild(announcement);
                }
            }, 1000);
        }
    }

    /**
     * 设置高对比度模式检测
     */
    setupHighContrastMode() {
        // 检测高对比度模式
        if (window.matchMedia('(prefers-contrast: high)').matches && document.body) {
            document.body.classList.add('high-contrast');
        }

        // 监听高对比度模式变化
        window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
            if (document.body) {
                if (e.matches) {
                    document.body.classList.add('high-contrast');
                } else {
                    document.body.classList.remove('high-contrast');
                }
            }
        });
    }

    /**
     * 设置减少动画偏好检测
     */
    setupReducedMotionMode() {
        // 检测减少动画偏好
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches && document.body) {
            document.body.classList.add('reduced-motion');
        }

        // 监听减少动画偏好变化
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            if (document.body) {
                if (e.matches) {
                    document.body.classList.add('reduced-motion');
                } else {
                    document.body.classList.remove('reduced-motion');
                }
            }
        });
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityManager;
}