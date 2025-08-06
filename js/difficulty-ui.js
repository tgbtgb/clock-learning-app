/**
 * 难度选择界面管理器
 * 负责处理星级难度选择的DOM操作和用户交互
 */
class DifficultyUI {
    constructor(difficultyManager) {
        if (!difficultyManager) {
            throw new Error('DifficultyManager 是必需的参数');
        }
        this.difficultyManager = difficultyManager;
        this.tooltip = null;
        this.currentTooltipLevel = null;
        this.isMouseOverTooltip = false;
        this.init();
    }

    /**
     * 初始化难度选择界面
     */
    init() {
        // 检查DOM是否已加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
                this.updateUI();
            });
        } else {
            this.setupEventListeners();
            this.updateUI();
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 星级容器点击事件
        const starContainers = document.querySelectorAll('.star-container');
        if (starContainers.length === 0) {
            console.warn('未找到星级容器元素，难度选择功能可能无法正常工作');
            return;
        }
        starContainers.forEach(container => {
            container.addEventListener('click', (e) => {
                const level = parseInt(container.dataset.level);
                this.selectDifficulty(level);
            });
        });

        // 使用事件委托处理帮助图标事件，确保动态添加的元素也能响应
        document.addEventListener('mouseenter', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('help-icon')) {
                e.stopPropagation();
                const levelData = e.target.dataset.level;
                const level = levelData === 'all' ? 'all' : parseInt(levelData);
                this.showTooltip(level, e.target);
            }
        }, true);

        document.addEventListener('mouseleave', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('help-icon')) {
                e.stopPropagation();
                // 延迟隐藏，允许用户移动到提示框
                setTimeout(() => {
                    if (!this.isMouseOverTooltip) {
                        this.hideTooltip();
                    }
                }, 100);
            }
        }, true);

        // 使用事件委托处理点击事件
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('help-icon')) {
                e.stopPropagation();
                const levelData = e.target.dataset.level;
                const level = levelData === 'all' ? 'all' : parseInt(levelData);
                this.showTooltip(level, e.target);
            }
        }, true);

        // 星级容器悬停事件（用于显示悬停效果）
        starContainers.forEach(container => {
            if (!container || !container.classList) {
                console.warn('星级容器元素无效，跳过事件监听器设置');
                return;
            }

            container.addEventListener('mouseenter', () => {
                if (!container.classList.contains('active')) {
                    container.style.transform = 'translateX(3px)';
                    container.style.backgroundColor = '#e8ecff';
                }
            });

            container.addEventListener('mouseleave', () => {
                if (!container.classList.contains('active')) {
                    container.style.transform = 'translateX(0)';
                    container.style.backgroundColor = '#f8f9ff';
                }
            });
        });

        // 点击其他地方隐藏提示框
        document.addEventListener('click', (e) => {
            if (e.target && !e.target.closest('.help-icon') && !e.target.closest('.difficulty-tooltip')) {
                this.hideTooltip();
            }
        });

        // 键盘导航支持
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideTooltip();
            }
        });
    }

    /**
     * 选择难度等级
     * @param {number} level - 难度等级 (1-5)
     */
    selectDifficulty(level) {
        if (this.difficultyManager.setDifficulty(level)) {
            this.updateUI();
            this.hideTooltip();

            // 触发难度变更事件
            this.onDifficultyChange(level);

            // 提供视觉反馈
            this.showSelectionFeedback(level);
        }
    }

    /**
     * 更新界面显示
     */
    updateUI() {
        const currentLevel = this.difficultyManager.getCurrentLevel();
        const starContainers = document.querySelectorAll('.star-container');

        starContainers.forEach(container => {
            if (!container || !container.classList || !container.dataset) {
                console.warn('星级容器元素无效，跳过更新');
                return;
            }

            const level = parseInt(container.dataset.level);

            if (level === currentLevel) {
                container.classList.add('active');
                container.style.transform = 'translateX(0)';
                container.style.backgroundColor = '#667eea';
                container.style.color = 'white';
            } else {
                container.classList.remove('active');
                container.style.backgroundColor = '#f8f9ff';
                container.style.color = '#333';
                container.style.transform = 'translateX(0)';
            }
        });

        // 更新星级显示
        this.updateStarDisplay();

        // 触发界面更新完成事件
        this.onUIUpdated(currentLevel);
    }

    /**
     * 更新星级显示
     */
    updateStarDisplay() {
        const starContainers = document.querySelectorAll('.star-container');

        starContainers.forEach(container => {
            if (!container || !container.dataset) {
                console.warn('星级容器元素无效，跳过星级显示更新');
                return;
            }

            const level = parseInt(container.dataset.level);
            const starsElement = container.querySelector('.stars');

            if (starsElement) {
                starsElement.textContent = this.difficultyManager.getStarDisplay(level);
            }
        });
    }

    /**
     * 显示难度说明提示框
     * @param {number|string} level - 难度等级或'all'
     * @param {HTMLElement} targetElement - 目标元素
     */
    showTooltip(level, targetElement) {
        // 如果已经显示相同等级的提示框，则不重复显示
        if (this.currentTooltipLevel === level && this.tooltip && this.tooltip.style.display !== 'none') {
            return;
        }

        this.hideTooltip();

        if (level === 'all') {
            // 显示全局帮助信息
            const globalHelp = {
                name: '难度选择说明',
                description: '点击任意星级选择对应难度。星级越高，时间间隔越精确，挑战性越大。1星为整点时间，5星精确到秒。选择适合您当前水平的难度开始练习。'
            };
            this.createTooltip(globalHelp, targetElement);
        } else {
            const difficulty = this.difficultyManager.getDifficulty();
            if (level !== difficulty.level) {
                // 获取指定等级的难度信息
                const targetDifficulty = this.difficultyManager.getAllDifficulties()[level];
                if (!targetDifficulty) return;

                this.createTooltip(targetDifficulty, targetElement);
            } else {
                this.createTooltip(difficulty, targetElement);
            }
        }

        this.currentTooltipLevel = level;
    }

    /**
     * 创建提示框
     * @param {Object} difficulty - 难度对象
     * @param {HTMLElement} targetElement - 目标元素
     */
    createTooltip(difficulty, targetElement) {
        // 获取或创建提示框元素
        this.tooltip = document.getElementById('difficulty-tooltip');
        if (!this.tooltip) {
            console.error('找不到难度提示框元素');
            return;
        }

        // 更新提示框内容
        const titleElement = this.tooltip.querySelector('.tooltip-title');
        const descriptionElement = this.tooltip.querySelector('.tooltip-description');

        if (titleElement) {
            titleElement.textContent = difficulty.name;
        }

        if (descriptionElement) {
            descriptionElement.textContent = difficulty.description;
        }

        // 添加提示框悬停事件，防止鼠标移动到提示框时隐藏
        this.tooltip.addEventListener('mouseenter', () => {
            this.isMouseOverTooltip = true;
        });

        this.tooltip.addEventListener('mouseleave', () => {
            this.isMouseOverTooltip = false;
            this.hideTooltip();
        });

        // 定位提示框
        this.positionTooltip(targetElement);

        // 显示提示框
        this.tooltip.style.display = 'block';
        this.tooltip.style.opacity = '0';
        this.tooltip.style.transform = 'translateY(-10px)';

        // 动画显示
        setTimeout(() => {
            this.tooltip.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            this.tooltip.style.opacity = '1';
            this.tooltip.style.transform = 'translateY(0)';
        }, 10);
    }

    /**
     * 定位提示框
     * @param {HTMLElement} targetElement - 目标元素
     */
    positionTooltip(targetElement) {
        if (!this.tooltip || !targetElement) return;

        const targetRect = targetElement.getBoundingClientRect();
        const containerRect = targetElement.closest('.config-panel').getBoundingClientRect();

        // 计算相对于配置面板的位置
        const left = targetRect.left - containerRect.left - 120; // 向左偏移以避免超出边界
        const top = targetRect.bottom - containerRect.top + 5;

        this.tooltip.style.left = Math.max(10, left) + 'px';
        this.tooltip.style.top = top + 'px';
    }

    /**
     * 隐藏提示框
     */
    hideTooltip() {
        if (this.tooltip && this.tooltip.style.display !== 'none') {
            // 动画隐藏
            this.tooltip.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            this.tooltip.style.opacity = '0';
            this.tooltip.style.transform = 'translateY(-10px)';

            setTimeout(() => {
                if (this.tooltip) {
                    this.tooltip.style.display = 'none';
                }
            }, 200);
        }
        this.currentTooltipLevel = null;
        this.isMouseOverTooltip = false;
    }

    /**
     * 显示选择反馈
     * @param {number} level - 选择的难度等级
     */
    showSelectionFeedback(level) {
        const container = document.querySelector(`.star-container[data-level="${level}"]`);
        if (container) {
            // 添加选择动画效果
            container.style.transform = 'scale(1.05)';
            container.style.transition = 'transform 0.2s ease';

            setTimeout(() => {
                container.style.transform = 'scale(1)';
            }, 200);
        }
    }

    /**
     * 难度变更回调函数
     * @param {number} level - 新的难度等级
     */
    onDifficultyChange(level) {
        // 触发自定义事件
        const event = new CustomEvent('difficultyChanged', {
            detail: {
                level: level,
                difficulty: this.difficultyManager.getDifficulty()
            }
        });
        document.dispatchEvent(event);

        // 在控制台输出变更信息（用于调试）
        console.log(`难度已变更为: ${level}星 - ${this.difficultyManager.getDifficultyName(level)}`);
    }

    /**
     * 界面更新完成回调函数
     * @param {number} level - 当前难度等级
     */
    onUIUpdated(level) {
        // 触发界面更新完成事件
        const event = new CustomEvent('difficultyUIUpdated', {
            detail: {
                level: level,
                difficulty: this.difficultyManager.getDifficulty()
            }
        });
        document.dispatchEvent(event);

        console.log(`难度界面已更新为: ${level}星`);
    }

    /**
     * 获取当前选中的难度等级
     * @returns {number} 当前难度等级
     */
    getCurrentLevel() {
        return this.difficultyManager.getCurrentLevel();
    }

    /**
     * 获取当前难度配置
     * @returns {Object} 当前难度对象
     */
    getCurrentDifficulty() {
        return this.difficultyManager.getDifficulty();
    }

    /**
     * 重置为默认难度
     */
    resetToDefault() {
        this.difficultyManager.resetDifficulty();
        this.updateUI();
        this.onDifficultyChange(1);
    }

    /**
     * 强制刷新界面显示
     */
    refreshUI() {
        this.updateUI();
        this.hideTooltip();
        console.log('难度选择界面已刷新');
    }

    /**
     * 设置界面为禁用状态
     * @param {boolean} disabled - 是否禁用
     */
    setDisabled(disabled) {
        const starContainers = document.querySelectorAll('.star-container');
        const helpIcons = document.querySelectorAll('.help-icon');

        starContainers.forEach(container => {
            if (disabled) {
                container.style.pointerEvents = 'none';
                container.style.opacity = '0.6';
            } else {
                container.style.pointerEvents = 'auto';
                container.style.opacity = '1';
            }
        });

        helpIcons.forEach(icon => {
            if (disabled) {
                icon.style.pointerEvents = 'none';
                icon.style.opacity = '0.6';
            } else {
                icon.style.pointerEvents = 'auto';
                icon.style.opacity = '1';
            }
        });

        if (disabled) {
            this.hideTooltip();
        }
    }

    /**
     * 高亮显示特定难度等级
     * @param {number} level - 要高亮的难度等级
     * @param {number} duration - 高亮持续时间（毫秒）
     */
    highlightLevel(level, duration = 1000) {
        const container = document.querySelector(`.star-container[data-level="${level}"]`);
        if (container) {
            const originalBackground = container.style.backgroundColor;
            const originalTransform = container.style.transform;

            container.style.backgroundColor = '#ffd700';
            container.style.transform = 'scale(1.05)';
            container.style.transition = 'all 0.3s ease';

            setTimeout(() => {
                container.style.backgroundColor = originalBackground;
                container.style.transform = originalTransform;
            }, duration);
        }
    }

    /**
     * 销毁界面管理器
     */
    destroy() {
        this.hideTooltip();
        // 移除事件监听器
        const starContainers = document.querySelectorAll('.star-container');
        starContainers.forEach(container => {
            container.replaceWith(container.cloneNode(true));
        });

        const helpIcons = document.querySelectorAll('.help-icon');
        helpIcons.forEach(icon => {
            icon.replaceWith(icon.cloneNode(true));
        });
    }
}