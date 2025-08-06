/**
 * 应用控制器类
 * 协调各个组件，管理应用的整体流程
 * 整合所有新增组件，实现完整的用户交互流程
 */
class AppController {
    constructor() {
        // 核心组件管理器
        this.difficultyManager = new DifficultyManager();
        this.difficultyUI = null;
        this.configManager = new ConfigManager();
        this.timeGenerator = new TimeGenerator(this.difficultyManager);
        this.clockRenderer = null;
        this.timerManager = new TimerManager();
        this.answerValidator = new AnswerValidator();
        this.recordManager = new RecordManager();
        this.recordUI = null;

        
        // 应用状态管理
        this.currentTime = null;
        this.isAnswerSubmitted = false;
        this.validationTimeout = null;
        console.log('AppController构造函数: isAnswerSubmitted初始化为false');
        
        // 渲染锁机制
        this.isRendering = false;
        this.renderQueue = [];
        this.debounceTimers = new Map();
        this.isCurrentTimeToggling = false;
        
        // 初始化应用
        this.initializeElements();
        // 事件监听器将在init()方法中初始化，避免重复绑定
        
        console.log('AppController 初始化完成');
    }

    /**
     * 初始化DOM元素引用
     */
    initializeElements() {
        // 星级难度选择相关元素（替代旧的配置元素）
        this.difficultyStars = document.querySelectorAll('.star-container');
        this.difficultyTooltip = document.getElementById('difficulty-tooltip');
        
        // 按钮元素
        // this.refreshBtn = document.getElementById('refresh-btn'); // 已移除
        this.submitBtn = document.getElementById('submit-btn');
        // this.nextBtn = document.getElementById('next-btn'); // 已移除，与submit-btn共用
        
        // 时钟相关元素
        this.clockCanvas = document.getElementById('clock-canvas');
        this.clockFallback = document.getElementById('clock-fallback');
        this.guideLinesToggle = document.getElementById('guide-lines-toggle');
        this.autoTickToggle = document.getElementById('auto-tick-toggle');
        this.currentTimeToggle = document.getElementById('current-time-toggle');
        
        // 输入和结果元素
        this.hoursInput = document.getElementById('hours-input');
        this.minutesInput = document.getElementById('minutes-input');
        this.secondsInput = document.getElementById('seconds-input');
        this.timerDisplay = document.getElementById('timer-display');
        this.resultDisplay = document.getElementById('result-display');
        this.resultMessage = document.getElementById('result-message');
        this.resultTimeSpent = document.getElementById('result-time-spent');
        // this.resultEncouragement = document.getElementById('result-encouragement'); // 已移除
        this.correctAnswer = document.getElementById('correct-answer');
        this.resultExplanation = document.getElementById('result-explanation');
        


    }

    /**
     * 初始化应用
     * 整合所有新增组件，实现应用初始化和组件协调逻辑
     */
    init() {
        try {
            console.log('开始初始化时钟练习应用...');
            
            // 1. 初始化难度选择界面
            this.difficultyUI = new DifficultyUI(this.difficultyManager);
            console.log('难度选择界面初始化完成');
            
            // 2. 初始化时钟渲染器
            if (this.clockCanvas) {
                try {
                    this.clockRenderer = new ClockRenderer(this.clockCanvas);
                    console.log('时钟渲染器初始化完成');
                } catch (error) {
                    console.error('时钟渲染器初始化失败:', error);
                    this.clockRenderer = null;
                }
            } else {
                console.warn('时钟Canvas元素未找到，将使用降级显示');
            }
            
            // 3. 初始化计时器
            this.timerManager.setDisplayElement(this.timerDisplay);
            console.log('计时器管理器初始化完成');
            
            // 4. 初始化记录界面
            this.recordUI = new RecordUI(this.recordManager);
            console.log('答题记录界面初始化完成');
            

            
            // 6. 设置组件间的协调逻辑
            this.setupComponentCoordination();
            
            // 7. 加载保存的配置
            this.loadConfigFromUI();
            
            // 8. 初始化事件监听器
            this.initializeEventListeners();
            
            // 9. 初始化界面状态
            this.initializeUIState();
            
            // 10. 生成第一个题目
            this.generateNewQuestion();
            
            // 11. 确保时钟立即显示（已在时钟渲染器初始化时处理）
            
            console.log('时钟练习应用初始化完成');
            
            // 触发应用初始化完成事件
            this.dispatchEvent('appInitialized', {
                components: {
                    difficultyManager: !!this.difficultyManager,
                    difficultyUI: !!this.difficultyUI,
                    clockRenderer: !!this.clockRenderer,
                    timerManager: !!this.timerManager,
                    recordManager: !!this.recordManager,
                    recordUI: !!this.recordUI,

                }
            });
            
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * 移除所有事件监听器（防止重复绑定）
     */
    removeEventListeners() {
        try {
            // 移除当前时间切换事件监听器
            if (this.currentTimeToggle) {
                const newToggle = this.currentTimeToggle.cloneNode(true);
                this.currentTimeToggle.parentNode.replaceChild(newToggle, this.currentTimeToggle);
                this.currentTimeToggle = newToggle;
            }
            
            // 移除其他可能重复的事件监听器
            if (this.submitBtn) {
                const newSubmitBtn = this.submitBtn.cloneNode(true);
                this.submitBtn.parentNode.replaceChild(newSubmitBtn, this.submitBtn);
                this.submitBtn = newSubmitBtn;
            }
            
            console.log('事件监听器已清理');
        } catch (error) {
            console.error('清理事件监听器失败:', error);
        }
    }

    /**
     * 初始化事件监听器
     */
    initializeEventListeners() {
        // 先清理可能存在的重复监听器
        this.removeEventListeners();
        // 按钮事件 - submit-btn和next-btn共用
        // refresh-btn已移除
        if (this.submitBtn) {
            console.log('设置submitBtn点击事件监听器');
            this.submitBtn.addEventListener('click', () => {
                console.log('submitBtn被点击');
                this.handleSubmitOrNext();
            });
        } else {
            console.error('submitBtn元素不存在，无法设置事件监听器');
        }
        // next-btn事件已移除，与submit-btn共用

        // 输入框事件
        if (this.hoursInput) {
            this.hoursInput.addEventListener('input', () => this.handleInputChange());
            this.hoursInput.addEventListener('focus', (e) => this.handleInputFocus(e));
            this.hoursInput.addEventListener('blur', (e) => this.handleInputBlur(e));
        }
        if (this.minutesInput) {
            this.minutesInput.addEventListener('input', () => this.handleInputChange());
            this.minutesInput.addEventListener('focus', (e) => this.handleInputFocus(e));
            this.minutesInput.addEventListener('blur', (e) => this.handleInputBlur(e));
        }
        if (this.secondsInput) {
            this.secondsInput.addEventListener('input', () => this.handleInputChange());
            this.secondsInput.addEventListener('focus', (e) => this.handleInputFocus(e));
            this.secondsInput.addEventListener('blur', (e) => this.handleInputBlur(e));
        }
        
        // Tab键导航和回车键提交
        [this.hoursInput, this.minutesInput, this.secondsInput].forEach((input, index) => {
            if (input) {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab') {
                        this.handleTabNavigation(e, index);
                    } else if (e.key === 'Enter') {
                        this.handleSubmitOrNext();
                    }
                });
            }
        });

        // 参考线开关事件
        if (this.guideLinesToggle) {
            this.guideLinesToggle.addEventListener('change', () => this.handleGuideLineToggle());
        }
        
        // 自动走动开关事件
        if (this.autoTickToggle) {
            this.autoTickToggle.addEventListener('change', () => this.handleAutoTickToggle());
        }
        
        // 当前时间按钮事件
        if (this.currentTimeToggle) {
            this.currentTimeToggle.addEventListener('change', () => this.handleCurrentTimeToggle());
        }
        

    }

    /**
     * 设置组件间的协调逻辑
     * 建立各组件之间的通信和协调机制
     */
    setupComponentCoordination() {
        // 监听难度变更事件
        document.addEventListener('difficultyChanged', (e) => {
            this.handleDifficultyChange(e.detail);
        });
        
        // 监听记录更新事件
        document.addEventListener('recordAdded', (e) => {
            this.handleRecordAdded(e.detail);
        });
        

        
        console.log('组件协调逻辑设置完成');
    }

    /**
     * 初始化界面状态
     * 实现横幅标题和各功能区域的完整布局，整合所有组件到统一的用户界面中
     */
    initializeUIState() {
        console.log('开始初始化界面状态...');
        
        // 1. 确保横幅标题显示正确
        this.initializeBannerTitle();
        
        // 2. 初始化各功能区域的布局
        this.initializeFunctionalAreas();
        
        // 3. 确保输入框显示正确
        const currentDifficulty = this.difficultyManager.getCurrentDifficulty();
        this.updateInputVisibility(currentDifficulty);
        
        // 4. 重置所有输入和结果显示
        this.clearInputAndResult();
        
        // 5. 设置参考线开关初始状态
        if (this.guideLinesToggle) {
            this.guideLinesToggle.checked = false;
        }
        

        
        // 7. 设置界面响应性
        this.setupResponsiveLayout();
        
        // 8. 优化交互流畅性
        this.optimizeInteractionFlow();
        
        console.log('界面状态初始化完成');
    }

    /**
     * 清理资源
     */
    cleanup() {
        try {
            console.log('🧹 开始清理AppController资源...');
            
            // 清理时钟渲染器
            if (this.clockRenderer) {
                this.clockRenderer.setShowCurrentTime(false);
                this.clockRenderer.stopAutoTick();
                // 调用ClockRenderer的完整清理方法
                if (typeof this.clockRenderer.cleanup === 'function') {
                    this.clockRenderer.cleanup();
                }
                console.log('✅ ClockRenderer已清理');
            }
            
            // 停止计时器管理器
            if (this.timerManager) {
                this.timerManager.stopTimer();
                // 如果有cleanup方法也调用
                if (typeof this.timerManager.cleanup === 'function') {
                    this.timerManager.cleanup();
                }
                console.log('✅ TimerManager已清理');
            }
            
            // 清理其他定时器
            if (this.validationTimeout) {
                clearTimeout(this.validationTimeout);
                this.validationTimeout = null;
                console.log('✅ 验证定时器已清除');
            }
            
            // 清理更新间隔
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
                console.log('✅ 更新间隔已清除');
            }
            
            // 清理性能监控间隔
            if (this.performanceInterval) {
                clearInterval(this.performanceInterval);
                this.performanceInterval = null;
                console.log('✅ 性能监控间隔已清除');
            }
            
            // 重置状态
            this.currentTime = null;
            this.isInitialized = false;
            
            console.log('✅ AppController资源清理完成');
        } catch (error) {
            console.error('❌ AppController资源清理失败:', error);
        }
    }

    /**
     * 处理初始化错误
     * @param {Error} error - 初始化错误
     */
    handleInitializationError(error) {
        console.error('处理初始化错误:', error);
        
        // 显示用户友好的错误信息
        this.showTemporaryMessage('应用初始化失败，部分功能可能不可用', 'error');
        
        // 尝试基本功能的降级初始化
        try {
            if (!this.clockRenderer && this.clockFallback) {
                this.clockFallback.style.display = 'block';
                console.log('启用时钟降级显示');
            }
        } catch (fallbackError) {
            console.error('降级初始化也失败:', fallbackError);
        }
    }

    /**
     * 处理难度变更
     * 添加难度切换、参考线切换等事件处理
     * @param {Object} detail - 难度变更详情
     */
    handleDifficultyChange(detail) {
        try {
            const { level, difficulty } = detail;
            
            console.log(`处理难度变更: ${level} 星`, difficulty);
            
            // 验证难度数据的有效性
            if (!level || !difficulty || typeof level !== 'number' || level < 1 || level > 5) {
                console.error('无效的难度变更数据:', detail);
                this.handleDifficultyChangeError('无效的难度数据', level);
                return;
            }
            
            // 停止当前计时器（如果正在运行）
            try {
                if (this.timerManager && this.timerManager.isTimerRunning()) {
                    this.timerManager.stopTimer();
                }
            } catch (timerError) {
                console.warn('停止计时器时出错:', timerError);
                // 继续执行，不阻断难度切换流程
            }
            
            // 更新输入框显示
            try {
                this.updateInputVisibility(difficulty);
            } catch (inputError) {
                console.error('更新输入框显示失败:', inputError);
                this.handleDifficultyChangeError('界面更新失败', level);
                return;
            }
            

            
            // 生成新题目
            try {
                this.generateNewQuestion();
            } catch (questionError) {
                console.error('生成新题目失败:', questionError);
                this.handleDifficultyChangeError('题目生成失败', level);
                return;
            }
            
            // 触发难度变更完成事件
            try {
                this.dispatchEvent('difficultyChangeCompleted', {
                    level,
                    difficulty,
                    timestamp: new Date()
                });
            } catch (eventError) {
                console.warn('触发难度变更完成事件失败:', eventError);
                // 事件触发失败不影响核心功能
            }
            
            console.log(`难度已变更为 ${level} 星:`, difficulty);
            
            // 显示成功提示
            this.showTemporaryMessage(`难度已切换到 ${level} 星`, 'success');
            
        } catch (error) {
            console.error('处理难度变更时发生严重错误:', error);
            this.handleDifficultyChangeError('难度切换系统异常', detail?.level);
        }
    }

    /**
     * 处理难度切换错误
     * @param {string} errorMessage - 错误消息
     * @param {number} targetLevel - 目标难度等级
     */
    handleDifficultyChangeError(errorMessage, targetLevel) {
        console.error('难度切换失败:', errorMessage);
        
        try {
            // 尝试恢复到安全的难度状态
            const currentLevel = this.difficultyManager.getCurrentLevel();
            const safeDifficulty = this.difficultyManager.getDifficulty();
            
            if (!safeDifficulty) {
                // 如果当前难度也无效，强制设置为1星
                console.warn('当前难度无效，强制重置为1星');
                this.difficultyManager.resetDifficulty();
            }
            
            // 更新UI以反映实际的难度状态
            if (this.difficultyUI) {
                this.difficultyUI.updateDisplay();
            }
            
            // 显示错误提示
            const userMessage = targetLevel ? 
                `切换到 ${targetLevel} 星难度失败: ${errorMessage}` : 
                `难度切换失败: ${errorMessage}`;
            
            this.showTemporaryMessage(userMessage, 'error');
            
            // 尝试生成一个基本题目以保持应用可用性
            try {
                this.generateNewQuestion();
            } catch (recoveryError) {
                console.error('恢复性题目生成也失败:', recoveryError);
                this.showTemporaryMessage('应用出现异常，请刷新页面', 'error');
            }
            
        } catch (recoveryError) {
            console.error('难度切换错误恢复失败:', recoveryError);
            this.showTemporaryMessage('难度切换功能异常，请刷新页面', 'error');
        }
    }

    /**
     * 处理记录添加事件
     * @param {Object} detail - 记录详情
     */
    handleRecordAdded(detail) {
        console.log('新增答题记录:', detail);
        
        // 更新记录界面显示
        if (this.recordUI) {
            this.recordUI.refreshRecords();
        }
        
        // 可以在这里添加其他记录相关的处理逻辑
        // 比如更新统计信息、检查成就等
    }




    /**
     * 处理配置变更（现在由星级难度系统处理）
     */
    handleConfigChange() {
        // 配置现在通过星级难度系统管理
        console.log('配置变更由星级难度系统处理');
    }

    /**
     * 从难度管理器获取当前配置
     * @returns {Object} 配置对象
     */
    getConfigFromUI() {
        const difficulty = this.difficultyManager.getCurrentDifficulty();
        return {
            enableHours: this.difficultyManager.shouldShowHours(),
            enableMinutes: this.difficultyManager.shouldShowMinutes(),
            enableSeconds: this.difficultyManager.shouldShowSeconds(),
            difficulty: difficulty
        };
    }

    /**
     * 从难度管理器加载配置到UI
     */
    loadConfigFromUI() {
        // 配置现在由星级难度系统自动管理
        const currentDifficulty = this.difficultyManager.getCurrentDifficulty();
        console.log('当前难度配置:', currentDifficulty.name);
    }

    /**
     * 根据难度更新输入框显示
     * @param {Object} difficulty - 难度对象
     */
    updateInputVisibility(difficulty) {
        // 根据难度显示/隐藏输入框
        const hoursField = this.hoursInput.closest('.time-input-field');
        const minutesField = this.minutesInput.closest('.time-input-field');
        const secondsField = this.secondsInput.closest('.time-input-field');
        const separators = document.querySelectorAll('.time-separator');
        
        // 显示小时输入
        if (hoursField) {
            hoursField.style.display = this.difficultyManager.shouldShowHours() ? 'flex' : 'none';
        }
        
        // 显示分钟输入
        if (minutesField) {
            minutesField.style.display = this.difficultyManager.shouldShowMinutes() ? 'flex' : 'none';
        }
        
        // 显示秒数输入
        if (secondsField) {
            secondsField.style.display = this.difficultyManager.shouldShowSeconds() ? 'flex' : 'none';
        }
        
        // 更新分隔符显示
        separators.forEach((separator, index) => {
            if (index === 0) { // 时:分 之间的分隔符
                separator.style.display = (this.difficultyManager.shouldShowHours() && this.difficultyManager.shouldShowMinutes()) ? 'inline' : 'none';
            } else if (index === 1) { // 分:秒 之间的分隔符
                separator.style.display = (this.difficultyManager.shouldShowMinutes() && this.difficultyManager.shouldShowSeconds()) ? 'inline' : 'none';
            }
        });
        
        // 特别处理秒数分隔符
        const secondsSeparator = document.getElementById('seconds-separator');
        if (secondsSeparator) {
            secondsSeparator.style.display = (this.difficultyManager.shouldShowMinutes() && this.difficultyManager.shouldShowSeconds()) ? 'inline' : 'none';
        }
    }

    /**
     * 处理刷新按钮点击
     */
    handleRefresh() {
        this.generateNewQuestion();
    }

    /**
     * 生成新题目
     * 整合星级难度选择、时间生成、时钟显示的完整流程
     */
    generateNewQuestion() {
        try {
            console.log('开始生成新题目...');
            
            // 检查必要的组件是否已初始化
            if (!this.difficultyManager) {
                throw new Error('DifficultyManager 未初始化');
            }
            
            if (!this.timeGenerator) {
                throw new Error('TimeGenerator 未初始化');
            }
            
            // 1. 获取当前难度配置
            const currentDifficulty = this.difficultyManager.getCurrentDifficulty();
            if (!currentDifficulty) {
                console.error('无法获取当前难度配置');
                throw new Error('难度管理器未正确初始化');
            }
            console.log('当前难度:', currentDifficulty.name);
            
            // 2. 根据难度生成新时间
            this.currentTime = this.timeGenerator.generateTime();
            console.log('生成时间:', this.currentTime);
            
            // 3. 获取当前参考线状态
            const showGuideLines = this.guideLinesToggle ? this.guideLinesToggle.checked : false;
            
            // 4. 渲染时钟显示
            if (this.clockRenderer) {
                try {
                    // 更新时钟渲染器的显示时间
                    this.clockRenderer.setDisplayTime(this.currentTime);
                    this.clockRenderer.render(this.currentTime, showGuideLines);
                    console.log('时钟渲染完成，参考线状态:', showGuideLines);
                } catch (renderError) {
                    console.error('时钟渲染失败:', renderError);
                    // 尝试降级显示
                    if (this.clockFallback) {
                        this.showDigitalClock(this.currentTime);
                        console.log('时钟渲染失败，使用数字时钟降级显示');
                    }
                }
            } else if (this.clockFallback) {
                // 降级显示数字时钟
                this.showDigitalClock(this.currentTime);
                console.log('使用数字时钟降级显示');
            } else {
                console.warn('无可用的时钟显示方式');
            }
            
            // 5. 停止当前时间显示（如果正在运行）
            if (this.currentTimeToggle && this.currentTimeToggle.checked) {
                this.currentTimeToggle.checked = false;
                if (this.clockRenderer) {
                    this.clockRenderer.setShowCurrentTime(false);
                    this.clockRenderer.stopAutoTick();
                }
            }
            
            // 6. 清空输入和结果，准备新的答题流程
            this.clearInputAndResult();
            
            // 7. 重置答题状态
            this.isAnswerSubmitted = false;
            console.log('generateNewQuestion: isAnswerSubmitted重置为false');
            
            // 8. 重置按钮状态
            this.forceUpdateSubmitButton('提交答案');
            
            // 9. 重置并启动计时器
            this.timerManager.resetTimer();
            this.timerManager.startTimer();
            console.log('计时器已启动');
            
            // 10. 触发新题目生成事件
            this.dispatchEvent('questionGenerated', {
                time: this.currentTime,
                difficulty: currentDifficulty,
                showGuideLines: showGuideLines,
                timestamp: new Date()
            });
            
            console.log('新题目生成完成:', this.currentTime);
        } catch (error) {
            console.error('生成题目失败:', error);
            this.handleQuestionGenerationError(error);
        }
    }

    /**
     * 处理提交或继续练习按钮点击
     * submit-btn和next-btn共用，根据状态切换功能
     */
    handleSubmitOrNext() {
        console.log('=== handleSubmitOrNext被调用 ===');
        console.log('当前状态:', {
            isAnswerSubmitted: this.isAnswerSubmitted,
            currentTime: this.currentTime,
            buttonText: this.submitBtn ? this.submitBtn.textContent : 'null'
        });
        
        if (this.isAnswerSubmitted) {
            // 如果答案已提交，点击继续练习
            console.log('执行继续练习逻辑');
            this.generateNewQuestion();
        } else {
            // 如果答案未提交，点击提交答案
            console.log('执行提交答案逻辑');
            this.handleSubmit();
        }
        
        console.log('=== handleSubmitOrNext执行完成 ===');
    }

    /**
     * 处理提交按钮点击
     * 实现计时、答题、记录保存、结果显示的完整循环
     */
    handleSubmit() {
        console.log('handleSubmit被调用，检查状态:', {
            currentTime: this.currentTime,
            isAnswerSubmitted: this.isAnswerSubmitted,
            hoursInput: this.hoursInput ? this.hoursInput.value : 'null',
            minutesInput: this.minutesInput ? this.minutesInput.value : 'null',
            secondsInput: this.secondsInput ? this.secondsInput.value : 'null'
        });
        
        if (!this.currentTime) {
            console.log('没有当前时间，显示警告');
            this.showTemporaryMessage('请先生成一个题目', 'warning');
            return;
        }

        if (this.isAnswerSubmitted) {
            console.log('答案已提交，显示提示');
            this.showTemporaryMessage('答案已提交，请点击继续练习', 'info');
            return;
        }

        try {
            console.log('开始处理答案提交...');
            
            // 1. 停止计时器并获取耗时
            const timeSpent = this.timerManager.stopTimer();
            const timeSpentSeconds = Math.round(timeSpent / 1000);
            console.log('答题耗时:', timeSpentSeconds, '秒');

            // 2. 获取用户输入的时间
            let userTimeResult;
            try {
                userTimeResult = this.getUserInputTime();
                console.log('用户输入时间结果:', userTimeResult);
            } catch (error) {
                console.error('获取用户输入时间失败:', error);
                this.showTemporaryMessage('获取输入时间失败', 'error');
                return;
            }
            
            // 3. 检查是否有解析错误
            if (userTimeResult && userTimeResult.error) {
                console.log('输入解析错误:', userTimeResult.errors);
                try {
                    this.showInputErrors(userTimeResult.errors, userTimeResult.warnings);
                } catch (error) {
                    console.error('显示输入错误失败:', error);
                    this.showTemporaryMessage('输入验证失败', 'error');
                }
                // 如果有输入错误，重新启动计时器让用户继续，但不标记答案已提交
                this.timerManager.startTimer();
                return;
            }

            // 4. 验证答案
            let result;
            try {
                result = this.answerValidator.validateTimeObject(userTimeResult, this.currentTime);
                console.log('答案验证结果:', result.isCorrect ? '正确' : '错误');
                console.log('验证结果详情:', result);
            } catch (error) {
                console.error('答案验证失败:', error);
                this.showTemporaryMessage('答案验证失败', 'error');
                return;
            }
            
            // 5. 添加耗时信息到结果中
            result.timeSpent = timeSpentSeconds;
            result.timeSpentFormatted = this.timerManager.formatTime(timeSpentSeconds);
            
            // 6. 标记答案已提交
            this.isAnswerSubmitted = true;
            
            // 6.5. 强制更新按钮状态
            this.forceUpdateSubmitButton('继续练习');
            console.log('答案已提交，状态设置为true');
            
            // 7. 触发答案提交事件
            this.dispatchEvent('answerSubmitted', {
                userAnswer: userTimeResult,
                correctAnswer: this.currentTime,
                isCorrect: result.isCorrect,
                timeSpent: timeSpentSeconds,
                difficulty: this.difficultyManager.getCurrentDifficulty(),
                timestamp: new Date()
            });
            
            // 8. 显示结果（包含记录保存）
            console.log('准备调用showResult，当前result:', result);
            try {
                this.showResult(result);
                console.log('showResult调用完成');
            } catch (error) {
                console.error('显示结果失败:', error);
                this.showTemporaryMessage('显示结果失败: ' + error.message, 'error');
                // 即使显示结果失败，也要标记答案已提交并更新按钮
                this.isAnswerSubmitted = true;
                if (this.submitBtn) {
                    this.submitBtn.textContent = '继续练习';
                }
            }
            
            // 最终保险措施：确保状态和按钮都正确设置
            console.log('最终检查状态:', {
                isAnswerSubmitted: this.isAnswerSubmitted,
                buttonText: this.submitBtn ? this.submitBtn.textContent : 'null'
            });
            
            if (!this.isAnswerSubmitted) {
                console.warn('状态未正确设置，强制设置');
                this.isAnswerSubmitted = true;
            }
            
            if (this.submitBtn && this.submitBtn.textContent !== '继续练习') {
                console.warn('按钮文本未正确设置，强制设置');
                this.submitBtn.textContent = '继续练习';
            }
            
            console.log('答案提交处理完成');
        } catch (error) {
            console.error('处理答案提交失败:', error);
            this.handleSubmitError(error);
        }
    }

    /**
     * 处理继续练习按钮点击
     */
    handleNext() {
        this.generateNewQuestion();
    }

    /**
     * 处理参考线开关切换
     */
    handleGuideLineToggle() {
        try {
            console.log('🔄 [DEBUG] handleGuideLineToggle 开始执行');
            
            if (!this.guideLinesToggle) {
                console.error('❌ [DEBUG] 参考线开关元素不存在');
                return;
            }

            // 在防抖函数内部获取最新的开关状态，确保状态同步
            console.log('🔍 [DEBUG] 当前渲染状态:', {
                isRenderLocked: this.isRenderLocked,
                renderQueue: this.renderQueue ? this.renderQueue.length : 0,
                clockRenderer: !!this.clockRenderer
            });

            // 使用防抖机制，避免快速切换
            this.debounceRenderOperation('guideline', () => {
                // 在防抖延迟后获取最新的开关状态，确保与UI同步
                const showGuideLines = this.guideLinesToggle.checked;
                console.log('⏰ [DEBUG] 防抖延迟后开始执行参考线切换');
                console.log('🎯 [DEBUG] 最新参考线状态:', showGuideLines ? '显示' : '隐藏');
                
                this.executeRenderOperation(() => {
                    console.log('🚀 [DEBUG] executeRenderOperation 内部开始执行');
                    
                    if (this.clockRenderer) {
                        console.log('✅ [DEBUG] clockRenderer 存在，开始设置参考线状态');
                        
                        // 设置参考线状态
                        this.clockRenderer.setGuideLines(showGuideLines);
                        console.log('📝 [DEBUG] 参考线状态已设置为:', showGuideLines);
                        
                        // 重新渲染时钟以显示/隐藏参考线
                        const currentTime = this.clockRenderer.getCurrentDisplayTime() || this.currentTime;
                        console.log('⏰ [DEBUG] 获取当前时间:', currentTime);
                        
                        if (currentTime) {
                            console.log('🎨 [DEBUG] 开始重新渲染时钟，参考线状态:', showGuideLines);
                            this.clockRenderer.render(currentTime, showGuideLines);
                            console.log('✅ [DEBUG] 时钟重新渲染完成');
                        } else {
                            console.warn('⚠️ [DEBUG] 没有当前时间数据，跳过渲染');
                        }
                    } else {
                        console.error('❌ [DEBUG] clockRenderer 不存在');
                    }

                    this.showTemporaryMessage(showGuideLines ? '参考线已显示' : '参考线已隐藏', 'success');
                    console.log('✅ [DEBUG] handleGuideLineToggle 执行完成');
                });
            }, 150);

        } catch (error) {
            console.error('❌ [DEBUG] 参考线切换失败:', error);
            console.error('❌ [DEBUG] 错误堆栈:', error.stack);
            this.handleGuideLineToggleError('系统异常', false);
            // 发生错误时重置渲染状态
            this.resetRenderState();
        }
    }

    /**
     * 处理自动走动开关切换
     */
    handleAutoTickToggle() {
        try {
            if (!this.autoTickToggle) {
                console.error('自动走动开关元素不存在');
                return;
            }

            const autoTick = this.autoTickToggle.checked;
            console.log('切换自动走动状态:', autoTick ? '开启' : '关闭');

            // 使用防抖机制，避免快速切换
            this.debounceRenderOperation('autotick', () => {
                this.executeRenderOperation(() => {
                    if (this.clockRenderer) {
                        if (autoTick) {
                            // 开启自动走动
                            if (this.currentTimeToggle && this.currentTimeToggle.checked) {
                                // 显示当前时间模式下，重新获取当前时间并启动走动
                                const now = new Date();
                                const currentTime = {
                                    hours: now.getHours() % 12 || 12,
                                    minutes: now.getMinutes(),
                                    seconds: now.getSeconds()
                                };
                                this.clockRenderer.setDisplayTime(currentTime);
                                const showGuideLines = this.guideLinesToggle ? this.guideLinesToggle.checked : false;
                                this.clockRenderer.render(currentTime, showGuideLines);
                            }
                            // 启动自动走动
                            this.clockRenderer.startAutoTick();
                        } else {
                            // 关闭自动走动
                            this.clockRenderer.stopAutoTick();
                        }
                    }

                    this.showTemporaryMessage(autoTick ? '自动走动已开启' : '自动走动已关闭', 'success');
                });
            }, 150);

        } catch (error) {
            console.error('自动走动切换失败:', error);
            this.showTemporaryMessage('自动走动功能异常', 'error');
            // 发生错误时重置渲染状态
            this.resetRenderState();
        }
    }

    /**
     * 处理显示当前时间按钮切换
     */
    handleCurrentTimeToggle() {
        try {
            if (!this.currentTimeToggle) {
                console.error('当前时间切换元素不存在');
                return;
            }

            // 如果正在切换中，直接忽略
            if (this.isCurrentTimeToggling) {
                console.log('当前时间切换正在进行中，忽略重复操作');
                return;
            }
            
            const isActive = this.currentTimeToggle.checked;
            console.log('执行当前时间切换，目标状态:', isActive);
            
            // 使用防抖机制，避免快速切换
            this.debounceRenderOperation('currenttime', () => {
                this.executeRenderOperation(() => {
                    this.isCurrentTimeToggling = true;
                    
                    if (isActive) {
                        // 开启显示当前时间
                        if (this.clockRenderer) {
                            // 保存原始题目时间
                            if (this.currentTime) {
                                this.clockRenderer.originalTime = { ...this.currentTime };
                                console.log('💾 已保存原始题目时间:', this.clockRenderer.originalTime);
                            }
                            
                            // 设置显示当前时间状态
                            this.clockRenderer.setShowCurrentTime(true);
                            
                            // 获取当前时间并设置表盘
                            const now = new Date();
                            const currentTime = {
                                hours: now.getHours() % 12 || 12,
                                minutes: now.getMinutes(),
                                seconds: now.getSeconds()
                            };
                            
                            this.clockRenderer.setDisplayTime(currentTime);
                            
                            // 渲染当前时间
                            const showGuideLines = this.guideLinesToggle ? this.guideLinesToggle.checked : false;
                            this.clockRenderer.render(currentTime, showGuideLines);
                            
                            // 只有在"自动走动"开启时才启动实时更新
                            if (this.autoTickToggle && this.autoTickToggle.checked) {
                                this.clockRenderer.startAutoTick();
                            }
                        }
                        
                        this.showTemporaryMessage('正在显示当前时间', 'success');
                    } else {
                         // 关闭显示当前时间
                         if (this.clockRenderer) {
                             // 设置显示当前时间状态为false
                             this.clockRenderer.setShowCurrentTime(false);
                             
                             // 不恢复原始题目时间，不重新渲染表盘
                             // 保持当前表盘状态不变
                         }
                         
                         this.showTemporaryMessage('已关闭当前时间显示', 'success');
                     }
                    
                    this.isCurrentTimeToggling = false;
                });
            }, 150);

        } catch (error) {
            console.error('当前时间切换失败:', error);
            this.showTemporaryMessage('当前时间功能异常', 'error');
            // 发生错误时重置渲染状态
            this.resetRenderState();
            this.isCurrentTimeToggling = false;
        }
    }

    /**
     * 执行显示当前时间切换逻辑
     */
    executeCurrentTimeToggle() {
        try {
            // 设置状态锁定
            this.isCurrentTimeToggling = true;
            
            const isActive = this.currentTimeToggle.checked;
            console.log('执行当前时间切换，目标状态:', isActive);
            
            if (isActive) {
                // 开启显示当前时间 - 需要重绘，禁用按钮
                this.disableClockControls();
                
                if (this.clockRenderer) {
                    console.log('🔄 准备开启显示当前时间，clockRenderer存在');
                    
                    // 保存原始题目时间
                    if (this.currentTime) {
                        this.clockRenderer.originalTime = { ...this.currentTime };
                        console.log('💾 已保存原始题目时间:', this.clockRenderer.originalTime);
                    }
                    
                    // 设置显示当前时间状态
                    this.clockRenderer.setShowCurrentTime(true);
                    console.log('✅ 已设置显示当前时间状态为true');
                    
                    // 获取当前时间并设置表盘
                    const now = new Date();
                    const currentTime = {
                        hours: now.getHours() % 12 || 12,
                        minutes: now.getMinutes(),
                        seconds: now.getSeconds()
                    };
                    console.log('⏰ 获取到当前时间:', currentTime);
                    
                    this.clockRenderer.setDisplayTime(currentTime);
                    console.log('✅ 已设置显示时间');
                    
                    // 渲染当前时间
                    const showGuideLines = this.guideLinesToggle ? this.guideLinesToggle.checked : false;
                    console.log('🎨 准备调用render方法，参数:', { currentTime, showGuideLines });
                    this.clockRenderer.render(currentTime, showGuideLines);
                    console.log('✅ render方法调用完成');
                    
                    // 只有在"自动走动"开启时才启动实时更新
                    if (this.autoTickToggle && this.autoTickToggle.checked) {
                        console.log('🔄 启动自动走动');
                        this.clockRenderer.startAutoTick();
                    }
                } else {
                    console.error('❌ clockRenderer不存在，无法开启显示当前时间');
                }
                
                this.showTemporaryMessage('正在显示当前时间', 'success');
                
                // 等待重绘完成后再启用按钮
                this.waitForRenderComplete().then(() => {
                    this.isCurrentTimeToggling = false;
                    this.enableClockControls();
                    console.log('当前时间切换完成，按钮已重新启用');
                });
            } else {
                // 关闭显示当前时间 - 不需要重绘，直接处理
                if (this.clockRenderer) {
                    // 设置显示当前时间状态为false
                    this.clockRenderer.setShowCurrentTime(false);
                    
                    // 不恢复原始题目时间，不重新渲染表盘
                    // 保持当前表盘状态不变
                }
                
                this.showTemporaryMessage('已关闭当前时间显示', 'success');
                
                // 直接启用按钮，不需要等待重绘
                this.isCurrentTimeToggling = false;
                this.enableClockControls();
                console.log('当前时间关闭完成，按钮已重新启用');
            }

        } catch (error) {
            console.error('执行当前时间切换失败:', error);
            this.showTemporaryMessage('当前时间功能异常', 'error');
            // 发生错误时也要重新启用按钮
            this.isCurrentTimeToggling = false;
            this.enableClockControls();
        }
    }



    /**
     * 设置当前时间切换按钮的启用/禁用状态
     * @param {boolean} enabled - 是否启用按钮
     */
    setCurrentTimeToggleEnabled(enabled) {
        try {
            if (this.currentTimeToggle) {
                this.currentTimeToggle.disabled = !enabled;
                
                // 获取按钮的父容器，通常是label或包装div
                const toggleContainer = this.currentTimeToggle.closest('.current-time-toggle') || 
                                      this.currentTimeToggle.closest('label') ||
                                      this.currentTimeToggle.parentElement;
                
                if (toggleContainer) {
                    if (enabled) {
                        toggleContainer.style.opacity = '1';
                        toggleContainer.style.cursor = 'pointer';
                        toggleContainer.title = '';
                    } else {
                        toggleContainer.style.opacity = '0.6';
                        toggleContainer.style.cursor = 'not-allowed';
                        toggleContainer.title = '切换正在进行中，请稍候...';
                    }
                }
                
                console.log(`当前时间切换按钮${enabled ? '已启用' : '已禁用'}`);
            }
        } catch (error) {
            console.error('设置当前时间切换按钮状态失败:', error);
        }
    }

    /**
     * 处理参考线切换错误
     * @param {string} errorMessage - 错误消息
     * @param {boolean} revertState - 是否恢复开关状态
     */
    handleGuideLineToggleError(errorMessage, revertState) {
        console.error('参考线切换失败:', errorMessage);
        
        try {
            // 恢复开关状态
            if (this.guideLinesToggle && revertState) {
                this.guideLinesToggle.checked = !this.guideLinesToggle.checked;
            }
            
            // 如果是Canvas相关错误，禁用参考线功能
            if (errorMessage.includes('Canvas') || errorMessage.includes('渲染')) {
                this.disableGuideLineFeature(errorMessage);
            }
            
            // 显示用户友好的错误提示
            const userMessage = this.getGuideLineErrorMessage(errorMessage);
            this.showTemporaryMessage(userMessage, 'error');
            
            // 尝试恢复时钟显示（不带参考线）
            try {
                if (this.clockRenderer && this.currentTime) {
                    this.clockRenderer.render(this.currentTime, false);
                }
            } catch (recoveryError) {
                console.error('恢复时钟显示也失败:', recoveryError);
            }
            
        } catch (handlingError) {
            console.error('处理参考线切换错误时也出错:', handlingError);
        }
    }

    /**
     * 禁用参考线功能
     * @param {string} reason - 禁用原因
     */
    disableGuideLineFeature(reason) {
        try {
            if (this.guideLinesToggle) {
                this.guideLinesToggle.checked = false;
                this.guideLinesToggle.disabled = true;
                
                const toggleContainer = this.guideLinesToggle.closest('.reference-line-toggle');
                if (toggleContainer) {
                    toggleContainer.style.opacity = '0.5';
                    toggleContainer.style.cursor = 'not-allowed';
                    toggleContainer.title = `参考线功能不可用: ${reason}`;
                }
            }
            
            console.log('参考线功能已禁用:', reason);
        } catch (error) {
            console.error('禁用参考线功能时出错:', error);
        }
    }

    /**
     * 获取用户友好的参考线错误消息
     * @param {string} errorMessage - 原始错误消息
     * @returns {string} 用户友好的错误消息
     */
    getGuideLineErrorMessage(errorMessage) {
        const errorMap = {
            '没有时间数据': '请先生成一个时间题目',
            '时钟渲染器不可用': '时钟显示功能异常，参考线不可用',
            '浏览器不支持Canvas': '您的浏览器不支持参考线功能',
            '界面元素缺失': '参考线控件异常，请刷新页面',
            '渲染失败': '参考线绘制失败，请重试',
            '系统异常': '参考线功能出现异常，请刷新页面'
        };
        
        return errorMap[errorMessage] || `参考线切换失败: ${errorMessage}`;
    }

    /**
     * 尝试恢复参考线功能
     * @returns {boolean} 恢复是否成功
     */
    tryRecoverGuideLineFeature() {
        try {
            // 检查基本条件
            if (!this.clockRenderer || !this.clockRenderer.isCanvasAvailable()) {
                console.log('Canvas仍然不可用，无法恢复参考线功能');
                return false;
            }
            
            if (!this.currentTime) {
                console.log('没有当前时间数据，无法恢复参考线功能');
                return false;
            }
            
            // 尝试恢复参考线功能
            if (this.clockRenderer.tryRecoverGuideLines && this.clockRenderer.tryRecoverGuideLines()) {
                // 重新启用UI控件
                if (this.guideLinesToggle) {
                    this.guideLinesToggle.disabled = false;
                    
                    const toggleContainer = this.guideLinesToggle.closest('.reference-line-toggle');
                    if (toggleContainer) {
                        toggleContainer.style.opacity = '1';
                        toggleContainer.style.cursor = 'pointer';
                        toggleContainer.title = '切换参考线显示';
                    }
                }
                
                console.log('参考线功能已恢复');
                this.showTemporaryMessage('参考线功能已恢复', 'success');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('恢复参考线功能失败:', error);
            return false;
        }
    }

    /**
     * 处理输入框内容变化
     */
    handleInputChange() {
        // 使用防抖来避免过度验证
        if (this.validationTimeout) {
            clearTimeout(this.validationTimeout);
        }
        
        this.validationTimeout = setTimeout(() => {
            this.validateIndividualInputs();
        }, 300);
    }

    /**
     * 处理输入框获得焦点事件
     * 实现点击时自动清零逻辑（如果内容为0）
     * @param {Event} event - 焦点事件
     */
    handleInputFocus(event) {
        const input = event.target;
        if (!input) return;
        
        const currentValue = input.value;
        
        // 添加焦点样式
        if (input.classList) {
            input.classList.add('typing');
        }
        
        // 如果当前值为0或'0'，则清空输入框
        if (currentValue === '0' || currentValue === 0 || currentValue === '') {
            input.value = '';
            // 添加一个标记，表示用户已经点击过这个输入框
            input.dataset.userClicked = 'true';
        }
        
        // 选中所有文本，方便用户直接输入新值
        input.select();
        
        // 显示输入提示
        this.showInputHint(input);
    }

    /**
     * 处理输入框失去焦点事件
     * 实现空输入保持0的逻辑
     * @param {Event} event - 失焦事件
     */
    handleInputBlur(event) {
        const input = event.target;
        if (!input) return;
        
        const currentValue = input.value.trim();
        
        // 移除焦点样式
        if (input.classList) {
            input.classList.remove('typing');
        }
        
        // 如果输入框为空，设置为0
        if (currentValue === '') {
            input.value = '0';
            // 如果用户点击过但没有输入内容，保持0显示
            if (input.dataset.userClicked === 'true') {
                input.dataset.userClicked = 'false';
            }
        }
        
        // 隐藏输入提示
        this.hideInputHint(input);
        
        // 验证输入
        const fieldType = this.getFieldTypeByInput(input);
        if (fieldType) {
            this.validateSingleInput(input, fieldType);
        }
    }

    /**
     * 处理Tab键导航
     * 实现时→分→秒→提交按钮的顺序导航
     * @param {Event} event - 键盘事件
     * @param {number} currentIndex - 当前输入框索引
     */
    handleTabNavigation(event, currentIndex) {
        // 如果按下Shift+Tab，则反向导航
        if (event.shiftKey) {
            return; // 让浏览器处理默认的反向Tab导航
        }
        
        // 阻止默认Tab行为
        event.preventDefault();
        
        // 定义导航顺序：时(0) → 分(1) → 秒(2) → 提交按钮
        const inputs = [this.hoursInput, this.minutesInput, this.secondsInput];
        
        if (currentIndex < inputs.length - 1) {
            // 移动到下一个输入框
            const nextInput = inputs[currentIndex + 1];
            if (nextInput && nextInput.style.display !== 'none' && !nextInput.disabled) {
                nextInput.focus();
            } else {
                // 如果下一个输入框不可见或被禁用，跳到提交按钮
                if (this.submitBtn) {
                    this.submitBtn.focus();
                }
            }
        } else {
            // 从最后一个输入框移动到提交按钮
            if (this.submitBtn) {
                this.submitBtn.focus();
            }
        }
    }



    /**
     * 验证各个输入框的值
     */
    validateIndividualInputs() {
        // 使用增强的验证器进行实时验证
        this.validateSingleInput(this.hoursInput, 'hours');
        this.validateSingleInput(this.minutesInput, 'minutes');
        this.validateSingleInput(this.secondsInput, 'seconds');
    }

    /**
     * 验证单个输入框
     * @param {HTMLInputElement} input - 输入框元素
     * @param {string} fieldType - 字段类型
     */
    validateSingleInput(input, fieldType) {
        const validation = this.answerValidator.validateInputRealtime(input.value, fieldType);
        
        // 清除之前的样式类
        input.classList.remove('error', 'success', 'warning', 'typing');
        
        // 添加新的样式类
        if (validation.cssClass) {
            input.classList.add(validation.cssClass);
        }
        
        // 更新工具提示
        this.updateInputTooltip(input, validation);
        
        // 更新整体输入状态
        this.updateInputGroupState();
        
        // 更新提交按钮状态
        this.updateSubmitButtonState();
    }

    /**
     * 更新输入框工具提示
     * @param {HTMLInputElement} input - 输入框元素
     * @param {Object} validation - 验证结果
     */
    updateInputTooltip(input, validation) {
        const inputField = input.closest('.time-input-field');
        let tooltip = inputField.querySelector('.input-tooltip');
        
        // 如果没有工具提示元素，创建一个
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'input-tooltip';
            inputField.appendChild(tooltip);
        }
        
        // 更新工具提示内容和样式
        tooltip.textContent = validation.message || '';
        tooltip.className = `input-tooltip ${validation.cssClass || ''}`;
        
        // 如果没有消息，隐藏工具提示
        if (!validation.message) {
            tooltip.style.display = 'none';
        } else {
            tooltip.style.display = 'block';
        }
    }

    /**
     * 更新输入组整体状态
     */
    updateInputGroupState() {
        const inputGroup = document.querySelector('.time-input-group');
        const inputs = [this.hoursInput, this.minutesInput, this.secondsInput];
        
        let hasErrors = false;
        let allValid = true;
        let hasWarnings = false;
        
        inputs.forEach(input => {
            if (input) {
                const inputField = input.closest('.time-input-field');
                if (inputField && inputField.style.display !== 'none') {
                    if (input.classList.contains('error')) {
                        hasErrors = true;
                        allValid = false;
                    } else if (input.classList.contains('warning')) {
                        hasWarnings = true;
                    } else if (!input.classList.contains('success')) {
                        allValid = false;
                    }
                }
            }
        });
        
        // 更新输入组样式
        if (inputGroup) {
            inputGroup.classList.remove('has-errors', 'all-valid');
            
            if (hasErrors) {
                inputGroup.classList.add('has-errors');
            } else if (allValid && !hasWarnings) {
                inputGroup.classList.add('all-valid');
            }
        }
    }

    /**
     * 更新提交按钮状态
     */
    updateSubmitButtonState() {
        // 如果答案已提交，确保按钮文本为"继续练习"并启用
        if (this.isAnswerSubmitted) {
            if (this.submitBtn) {
                this.submitBtn.textContent = '继续练习';
                this.submitBtn.disabled = false;
                this.submitBtn.classList.remove('ready');
                this.submitBtn.classList.add('active');
            }
            return;
        }
        
        const inputs = [this.hoursInput, this.minutesInput, this.secondsInput];
        let allValid = true;
        let hasContent = false;
        
        inputs.forEach(input => {
            if (input) {
                const inputField = input.closest('.time-input-field');
                if (inputField && inputField.style.display !== 'none') {
                    if (input.classList.contains('error')) {
                        allValid = false;
                    }
                    if (input.value && input.value.trim() !== '' && input.value !== '0') {
                        hasContent = true;
                    }
                }
            }
        });
        
        // 更新按钮样式
        if (this.submitBtn) {
            this.submitBtn.classList.remove('ready');
            
            if (allValid && hasContent) {
                this.submitBtn.classList.add('ready');
                this.submitBtn.disabled = false;
            } else if (!allValid) {
                this.submitBtn.disabled = true;
            } else {
                this.submitBtn.disabled = false;
            }
        }
    }

    /**
     * 获取用户输入的时间对象
     * @returns {Object|null} 时间对象或null，如果有错误则返回错误信息
     */
    getUserInputTime() {
        // 使用增强的解析方法
        const parseResult = this.answerValidator.parseSeparateTimeInputs(
            this.hoursInput.value,
            this.minutesInput.value,
            this.secondsInput.value
        );

        if (!parseResult.isValid) {
            // 返回错误信息以便显示给用户
            return {
                error: true,
                errors: parseResult.errors,
                warnings: parseResult.warnings
            };
        }

        return parseResult.time;
    }

    /**
     * 显示验证结果
     * 实现结果显示的完整循环，包含记录保存和教学建议
     * @param {Object} result - 验证结果对象
     */
    showResult(result) {
        try {
            console.log('开始显示验证结果...', result);
            console.log('当前isAnswerSubmitted状态:', this.isAnswerSubmitted);
            
            // 1. 立即更新按钮状态（如果还没有更新）
            if (this.submitBtn && this.submitBtn.textContent !== '继续练习') {
                console.log('showResult: 检测到按钮文本不是"继续练习"，强制更新');
                this.forceUpdateSubmitButton('继续练习');
            } else {
                console.log('showResult: 按钮文本已经是"继续练习"，无需更新');
            }
            
            // 2. 隐藏占位符
            const placeholder = document.querySelector('.result-placeholder');
            if (placeholder) {
                placeholder.style.display = 'none';
                console.log('隐藏结果占位符');
            }
            
            // 3. 显示结果区域
            if (this.resultDisplay) {
                this.resultDisplay.style.display = 'block';
                this.resultDisplay.style.visibility = 'visible';
                this.resultDisplay.style.opacity = '1';
                console.log('显示结果区域');
                
                // 4. 设置样式
                this.resultDisplay.className = `result-display ${result.isCorrect ? 'correct' : 'incorrect'}`;
                
                // 5. 设置主要消息
                if (this.resultMessage) {
                    this.resultMessage.textContent = result.message || (result.isCorrect ? '正确！' : '答案不正确');
                }
                
                // 6. 显示答题耗时
                if (this.resultTimeSpent && result.timeSpent !== undefined) {
                    this.resultTimeSpent.textContent = `用时: ${result.timeSpentFormatted || result.timeSpent + '秒'}`;
                    this.resultTimeSpent.style.display = 'block';
                } else if (this.resultTimeSpent) {
                    this.resultTimeSpent.style.display = 'none';
                }
                
                // 7. 显示正确答案（如果答错了）
                if (this.correctAnswer) {
                    if (!result.isCorrect) {
                        try {
                            const formattedTime = this.answerValidator.formatTime(result.correctTime);
                            this.correctAnswer.textContent = `正确答案: ${formattedTime}`;
                            this.correctAnswer.style.display = 'block';
                            console.log('正确答案显示完成:', formattedTime);
                        } catch (error) {
                            console.error('格式化正确答案时间失败:', error);
                            this.correctAnswer.textContent = `正确答案: ${result.correctTime.hours}:${result.correctTime.minutes}:${result.correctTime.seconds}`;
                            this.correctAnswer.style.display = 'block';
                        }
                    } else {
                        this.correctAnswer.style.display = 'none';
                    }
                }
                
                // 8. 显示详细解答过程
                if (this.resultExplanation && result.explanation) {
                    this.resultExplanation.textContent = result.explanation;
                    this.resultExplanation.style.display = 'block';
                } else if (this.resultExplanation) {
                    this.resultExplanation.style.display = 'none';
                }
                
                // 9. 禁用输入框
                [this.hoursInput, this.minutesInput, this.secondsInput].forEach(input => {
                    if (input) {
                        input.disabled = true;
                    }
                });
            }
            
            // 10. 保存答题记录
            try {
                console.log('开始保存答题记录...');
                this.saveAnswerRecord(result);
                console.log('答题记录保存完成');
            } catch (recordError) {
                console.error('保存答题记录失败:', recordError);
                // 记录保存失败不影响结果显示
            }
            
            // 11. 触发结果显示事件
            this.dispatchEvent('resultDisplayed', {
                result: result,
                isCorrect: result.isCorrect,
                timeSpent: result.timeSpent,
                timestamp: new Date()
            });
            
            console.log('验证结果显示完成');
        } catch (error) {
            console.error('显示验证结果失败:', error);
            this.handleResultDisplayError(error);
        }
    }

    /**
     * 显示输入错误
     * @param {string} message - 错误消息
     */
    showInputError(message) {
        [this.hoursInput, this.minutesInput, this.secondsInput].forEach(input => {
            if (input) {
                input.classList.add('error');
            }
        });
        
        // 可以添加更多的错误提示逻辑
        setTimeout(() => {
            [this.hoursInput, this.minutesInput, this.secondsInput].forEach(input => {
                if (input) {
                    input.classList.remove('error');
                }
            });
        }, 2000);
    }

    /**
     * 显示详细的输入错误信息
     * @param {Array} errors - 错误数组
     * @param {Array} warnings - 警告数组
     */
    showInputErrors(errors, warnings) {
        // 清除之前的错误样式
        [this.hoursInput, this.minutesInput, this.secondsInput].forEach(input => {
            if (input) {
                input.classList.remove('error', 'warning');
            }
        });

        // 显示错误
        errors.forEach(error => {
            const input = this.getInputByField(error.field);
            if (input) {
                input.classList.add('error');
                input.title = error.message;
                
                // 添加震动效果
                input.style.animation = 'shake 0.3s ease-in-out';
                setTimeout(() => {
                    input.style.animation = '';
                }, 300);
            }
        });

        // 显示警告
        warnings.forEach(warning => {
            const input = this.getInputByField(warning.field);
            if (input && !input.classList.contains('error')) {
                input.classList.add('warning');
                input.title = warning.message;
            }
        });

        // 创建错误消息提示
        const errorMessage = errors.map(e => e.message).join(', ');
        if (errorMessage) {
            this.showTemporaryMessage(errorMessage, 'error');
        }

        // 聚焦到第一个有错误的输入框
        if (errors.length > 0) {
            const firstErrorInput = this.getInputByField(errors[0].field);
            if (firstErrorInput) {
                firstErrorInput.focus();
                firstErrorInput.select();
            }
        }
    }

    /**
     * 根据字段名获取对应的输入框
     * @param {string} fieldName - 字段名
     * @returns {HTMLInputElement|null} 输入框元素
     */
    getInputByField(fieldName) {
        switch (fieldName) {
            case 'hours':
                return this.hoursInput;
            case 'minutes':
                return this.minutesInput;
            case 'seconds':
                return this.secondsInput;
            default:
                return null;
        }
    }

    /**
     * 显示临时消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 ('error', 'warning', 'success')
     */
    showTemporaryMessage(message, type = 'info') {
        // 创建消息元素
        const messageElement = document.createElement('div');
        messageElement.className = `temporary-message ${type}`;
        messageElement.textContent = message;
        
        // 设置样式
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            z-index: 1000;
            animation: slideDown 0.3s ease-out;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;

        // 根据类型设置颜色
        switch (type) {
            case 'error':
                messageElement.style.backgroundColor = '#f8d7da';
                messageElement.style.color = '#721c24';
                messageElement.style.border = '1px solid #f5c6cb';
                break;
            case 'warning':
                messageElement.style.backgroundColor = '#fff3cd';
                messageElement.style.color = '#856404';
                messageElement.style.border = '1px solid #ffeaa7';
                break;
            case 'success':
                messageElement.style.backgroundColor = '#d4edda';
                messageElement.style.color = '#155724';
                messageElement.style.border = '1px solid #c3e6cb';
                break;
            default:
                messageElement.style.backgroundColor = '#d1ecf1';
                messageElement.style.color = '#0c5460';
                messageElement.style.border = '1px solid #bee5eb';
        }

        // 添加到页面前检查document.body是否存在
        if (document.body) {
            document.body.appendChild(messageElement);
        } else {
            console.warn('无法显示临时消息：document.body不存在');
            return;
        }

        // 3秒后自动移除
        setTimeout(() => {
            if (messageElement && messageElement.parentNode) {
                messageElement.style.animation = 'slideUp 0.3s ease-in';
                setTimeout(() => {
                    if (messageElement && messageElement.parentNode) {
                        messageElement.parentNode.removeChild(messageElement);
                    }
                }, 300);
            }
        }, 3000);
    }

    /**
     * 清空输入和结果
     */
    clearInputAndResult() {
        // 清空输入并重置用户点击标记
        [this.hoursInput, this.minutesInput, this.secondsInput].forEach(input => {
            if (input) {
                input.value = '0';
                input.dataset.userClicked = 'false';
                input.disabled = false;
                input.classList.remove('error', 'success');
            }
        });
        
        // 启用提交按钮并重置文本（仅在未提交答案时）
        if (this.submitBtn && !this.isAnswerSubmitted) {
            this.submitBtn.disabled = false;
            this.submitBtn.textContent = '提交答案';
            this.submitBtn.classList.remove('ready', 'active');
        }
        
        // 隐藏结果
        if (this.resultDisplay) {
            this.resultDisplay.style.display = 'none';
        }
        // next-btn已移除，与submit-btn共用
        
        // 显示占位符
        const placeholder = document.querySelector('.result-placeholder');
        if (placeholder) {
            placeholder.style.display = 'flex';
        }
        
        // 聚焦到第一个可见的输入框
        this.focusFirstVisibleInput();
    }

    /**
     * 聚焦到第一个可见的输入框
     */
    focusFirstVisibleInput() {
        const inputs = [this.hoursInput, this.minutesInput, this.secondsInput];
        
        for (const input of inputs) {
            if (input) {
                const inputField = input.closest('.time-input-field');
                if (inputField && inputField.style.display !== 'none' && !input.disabled) {
                    input.focus();
                    break;
                }
            }
        }
    }

    /**
     * 根据输入框获取字段类型
     * @param {HTMLInputElement} input - 输入框元素
     * @returns {string|null} 字段类型
     */
    getFieldTypeByInput(input) {
        if (input === this.hoursInput) return 'hours';
        if (input === this.minutesInput) return 'minutes';
        if (input === this.secondsInput) return 'seconds';
        return null;
    }

    /**
     * 显示输入提示
     * @param {HTMLInputElement} input - 输入框元素
     */
    showInputHint(input) {
        const fieldType = this.getFieldTypeByInput(input);
        if (!fieldType) return;
        
        let hintText = '';
        switch (fieldType) {
            case 'hours':
                hintText = '输入小时 (0-12)，0表示12点';
                break;
            case 'minutes':
                hintText = '输入分钟 (0-59)';
                break;
            case 'seconds':
                hintText = '输入秒数 (0-59)';
                break;
        }
        
        // 创建或更新提示
        const inputField = input.closest('.time-input-field');
        let hint = inputField.querySelector('.input-hint');
        
        if (!hint) {
            hint = document.createElement('div');
            hint.className = 'input-hint';
            hint.style.cssText = `
                position: absolute;
                top: -25px;
                left: 50%;
                transform: translateX(-50%);
                background-color: #667eea;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.7rem;
                white-space: nowrap;
                z-index: 1001;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            inputField.appendChild(hint);
        }
        
        hint.textContent = hintText;
        setTimeout(() => {
            hint.style.opacity = '1';
        }, 100);
    }

    /**
     * 隐藏输入提示
     * @param {HTMLInputElement} input - 输入框元素
     */
    hideInputHint(input) {
        const inputField = input.closest('.time-input-field');
        const hint = inputField.querySelector('.input-hint');
        
        if (hint) {
            hint.style.opacity = '0';
            setTimeout(() => {
                if (hint.parentNode) {
                    hint.parentNode.removeChild(hint);
                }
            }, 300);
        }
    }



    /**
     * 计算平均答题时间
     * @param {Array} records - 答题记录数组
     * @returns {number} 平均时间（秒）
     */
    calculateAverageTime(records) {
        // 确保records是数组
        if (!Array.isArray(records) || records.length === 0) {
            console.log('calculateAverageTime: 无效的records参数，使用默认值30秒');
            return 30; // 默认30秒
        }
        
        try {
            const totalTime = records.reduce((sum, record) => {
                const timeSpent = record && typeof record.timeSpent === 'number' ? record.timeSpent : 0;
                return sum + timeSpent;
            }, 0);
            return Math.round(totalTime / records.length);
        } catch (error) {
            console.error('计算平均时间失败:', error);
            return 30; // 默认30秒
        }
    }

    /**
     * 显示教学建议
     * @param {Object} advice - 建议对象
     * @param {number} currentDifficulty - 当前难度
     */
    showTutorialSuggestion(advice, currentDifficulty) {
        if (!this.tutorialContainer) return;

        // 查找或创建建议容器
        let suggestionContainer = this.tutorialContainer.querySelector('.tutorial-suggestion-container');
        if (!suggestionContainer) {
            suggestionContainer = document.createElement('div');
            suggestionContainer.className = 'tutorial-suggestion-container';
            suggestionContainer.style.cssText = `
                position: sticky;
                top: 0;
                background: white;
                z-index: 10;
                padding: 15px;
                border-bottom: 1px solid #e9ecef;
                margin-bottom: 15px;
            `;
            this.tutorialContainer.insertBefore(suggestionContainer, this.tutorialContainer.firstChild);
        }

        // 创建建议内容
        suggestionContainer.innerHTML = `
            <div class="tutorial-suggestion">
                <div class="tutorial-suggestion-content">
                    <h4>📈 个性化学习建议</h4>
                    <p><strong>学习建议：</strong>${advice.studyAdvice}</p>
                    <p><strong>练习建议：</strong>${advice.practiceAdvice}</p>
                    <p><strong>难度建议：</strong>${advice.difficultyAdvice}</p>
                    ${this.generatePracticeLinkHTML(currentDifficulty, advice)}
                </div>
            </div>
        `;

        // 添加动画效果
        suggestionContainer.style.opacity = '0';
        suggestionContainer.style.transform = 'translateY(-10px)';
        
        requestAnimationFrame(() => {
            suggestionContainer.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            suggestionContainer.style.opacity = '1';
            suggestionContainer.style.transform = 'translateY(0)';
        });
    }

    /**
     * 生成练习链接HTML
     * @param {number} currentDifficulty - 当前难度
     * @param {Object} advice - 建议对象
     * @returns {string} HTML字符串
     */
    generatePracticeLinkHTML(currentDifficulty, advice) {
        let links = '';
        
        // 根据建议生成相应的练习链接
        if (advice.difficultyAdvice.includes('降低难度') && currentDifficulty > 1) {
            links += `<a href="#" class="practice-link" onclick="appController.switchToDifficulty(${currentDifficulty - 1})">
                练习${currentDifficulty - 1}星难度
            </a>`;
        }
        
        if (advice.difficultyAdvice.includes('下一个难度') && currentDifficulty < 5) {
            links += `<a href="#" class="practice-link" onclick="appController.switchToDifficulty(${currentDifficulty + 1})">
                挑战${currentDifficulty + 1}星难度
            </a>`;
        }
        
        // 添加查看教学内容的链接
        links += `<a href="#" class="practice-link" onclick="appController.scrollToTutorial(${currentDifficulty})" style="background: #007bff;">
            查看${currentDifficulty}星教学内容
        </a>`;
        
        return links ? `<div style="margin-top: 10px;">${links}</div>` : '';
    }

    /**
     * 切换到指定难度
     * @param {number} difficulty - 目标难度
     */
    switchToDifficulty(difficulty) {
        if (this.difficultyUI) {
            // 触发难度切换
            this.difficultyUI.setDifficulty(difficulty);
        }
    }

    /**
     * 滚动到教学内容
     * @param {number} difficulty - 难度等级
     */
    scrollToTutorial(difficulty) {
        if (this.tutorialContainer) {
            // 确保显示对应难度的教学内容
            if (this.tutorialUI) {
                this.tutorialUI.showTutorial(difficulty);
            }
            
            // 滚动到教学区域
            this.tutorialContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            
            // 添加高亮效果
            this.tutorialContainer.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.3)';
            setTimeout(() => {
                this.tutorialContainer.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
            }, 2000);
        }
    }

    /**
     * 保存答题记录（增强版，包含教学关联）
     * @param {Object} result - 验证结果
     */
    saveAnswerRecord(result) {
        try {
            const currentDifficulty = this.difficultyManager.getCurrentDifficulty();
            
            const record = {
                timestamp: new Date(),
                userAnswer: result.userTime,
                correctAnswer: result.correctTime,
                isCorrect: result.isCorrect,
                timeSpent: result.timeSpent,
                difficulty: currentDifficulty.level,
                difficultyName: currentDifficulty.name
            };

            this.recordManager.saveRecord(record);
            
            // 更新记录界面
            if (this.recordUI) {
                this.recordUI.refreshRecords();
            }
            
            console.log('答题记录已保存:', record);
        } catch (error) {
            console.error('保存答题记录失败:', error);
            // 不抛出错误，避免影响主流程
        }
    }







    /**
     * 强制更新提交按钮状态
     * @param {string} text - 按钮文本
     */
    forceUpdateSubmitButton(text) {
        console.log('强制更新按钮文本为:', text);
        
        // 参照 current-time-btn 的实现方式，使用直接的DOM操作
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            // 直接设置文本内容
            submitBtn.textContent = text;
            
            // 确保按钮可用
            submitBtn.disabled = false;
            
            // 根据文本内容设置相应的CSS类
            submitBtn.classList.remove('ready', 'active');
            if (text === '继续练习') {
                submitBtn.classList.add('active');
            } else if (text === '提交答案') {
                // 保持默认状态
            }
            
            // 强制触发重绘和状态更新
            submitBtn.style.transform = 'scale(1.01)';
            setTimeout(() => {
                submitBtn.style.transform = 'scale(1)';
            }, 50);
            
            console.log('按钮更新完成，当前文本:', submitBtn.textContent);
            console.log('按钮类名:', submitBtn.className);
        } else {
            console.error('submit-btn 元素不存在');
        }
        
        // 同步更新实例变量
        if (this.submitBtn) {
            this.submitBtn.textContent = text;
            this.submitBtn.disabled = false;
        }
    }

    /**
     * 测试结果显示功能
     */
    testResultDisplay() {
        console.log('=== 测试结果显示功能 ===');
        
        // 创建一个测试结果
        const testResult = {
            isCorrect: false,
            message: '测试结果显示',
            userTime: { hours: 12, minutes: 0, seconds: 0 },
            correctTime: { hours: 3, minutes: 30, seconds: 0 },
            timeSpent: 15,
            timeSpentFormatted: '15秒',
            explanation: '这是一个测试结果，用于验证结果显示功能是否正常工作。'
        };
        
        // 强制设置状态
        this.isAnswerSubmitted = true;
        
        // 直接调用showResult
        try {
            this.showResult(testResult);
            console.log('测试结果显示调用完成');
        } catch (error) {
            console.error('测试结果显示失败:', error);
        }
    }

    /**
     * 测试按钮状态
     */
    testButtonState() {
        console.log('=== 测试按钮状态 ===');
        console.log('当前状态:');
        console.log('- isAnswerSubmitted:', this.isAnswerSubmitted);
        console.log('- submitBtn文本:', this.submitBtn ? this.submitBtn.textContent : 'null');
        console.log('- submitBtn元素:', this.submitBtn);
        
        // 测试强制更新按钮
        console.log('测试强制更新按钮为"继续练习"...');
        this.forceUpdateSubmitButton('继续练习');
        
        setTimeout(() => {
            console.log('更新后状态:');
            console.log('- submitBtn文本:', this.submitBtn ? this.submitBtn.textContent : 'null');
            
            console.log('测试强制更新按钮为"提交答案"...');
            this.forceUpdateSubmitButton('提交答案');
            
            setTimeout(() => {
                console.log('最终状态:');
                console.log('- submitBtn文本:', this.submitBtn ? this.submitBtn.textContent : 'null');
            }, 1000);
        }, 1000);
    }

    /**
     * 分发自定义事件
     * 用于组件间通信和状态同步
     * @param {string} eventName - 事件名称
     * @param {Object} detail - 事件详情
     */
    dispatchEvent(eventName, detail = {}) {
        try {
            const event = new CustomEvent(eventName, {
                detail: detail,
                bubbles: true,
                cancelable: true
            });
            
            document.dispatchEvent(event);
            console.log(`事件已分发: ${eventName}`, detail);
        } catch (error) {
            console.error(`分发事件失败: ${eventName}`, error);
        }
    }

    /**
     * 显示数字时钟（降级方案）
     * @param {Object} time - 时间对象
     */
    showDigitalClock(time) {
        try {
            if (this.clockFallback) {
                const digitalTime = document.getElementById('digital-time');
                if (digitalTime && this.answerValidator) {
                    const formattedTime = this.answerValidator.formatTime(time);
                    digitalTime.textContent = formattedTime;
                } else if (digitalTime) {
                    // 如果 answerValidator 不可用，使用简单格式化
                    const hours = time.hours.toString().padStart(2, '0');
                    const minutes = time.minutes.toString().padStart(2, '0');
                    const seconds = time.seconds.toString().padStart(2, '0');
                    digitalTime.textContent = `${hours}:${minutes}:${seconds}`;
                }
                this.clockFallback.style.display = 'block';
                if (this.clockCanvas) {
                    this.clockCanvas.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('显示数字时钟失败:', error);
        }
    }

    /**
     * 处理题目生成错误
     * @param {Error} error - 错误对象
     */
    handleQuestionGenerationError(error) {
        console.error('题目生成错误处理:', error);
        this.showTemporaryMessage('生成题目失败，请重试', 'error');
        
        // 尝试使用默认时间
        try {
            this.currentTime = { hours: 12, minutes: 0, seconds: 0 };
            if (this.clockRenderer) {
                this.clockRenderer.render(this.currentTime, false);
            } else {
                this.showDigitalClock(this.currentTime);
            }
        } catch (fallbackError) {
            console.error('降级题目生成也失败:', fallbackError);
        }
    }

    /**
     * 处理提交错误
     * @param {Error} error - 错误对象
     */
    handleSubmitError(error) {
        console.error('提交错误处理:', error);
        this.showTemporaryMessage('提交答案失败，请重试', 'error');
        
        // 重新启动计时器
        if (this.timerManager && !this.timerManager.isRunning()) {
            this.timerManager.startTimer();
        }
        
        // 重新启用提交按钮
        if (this.submitBtn) {
            this.submitBtn.disabled = false;
        }
    }

    /**
     * 处理结果显示错误
     * @param {Error} error - 错误对象
     */
    handleResultDisplayError(error) {
        console.error('结果显示错误处理:', error);
        this.showTemporaryMessage('显示结果失败', 'error');
        
        // 显示基本结果信息
        if (this.resultDisplay && this.resultMessage) {
            this.resultDisplay.style.display = 'block';
            this.resultMessage.textContent = '结果显示出现问题，但答案已记录';
        }
    }

    /**
     * 添加结果显示动画
     */
    animateResultDisplay() {
        if (!this.resultDisplay) return;
        
        try {
            // 设置初始状态
            this.resultDisplay.style.opacity = '0';
            this.resultDisplay.style.transform = 'translateY(20px)';
            
            // 使用requestAnimationFrame确保样式已应用
            requestAnimationFrame(() => {
                this.resultDisplay.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                this.resultDisplay.style.opacity = '1';
                this.resultDisplay.style.transform = 'translateY(0)';
            });
        } catch (error) {
            console.error('结果显示动画失败:', error);
        }
    }

    /**
     * 滚动到结果区域
     */
    scrollToResult() {
        if (!this.resultDisplay) return;
        
        try {
            this.resultDisplay.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
        } catch (error) {
            console.error('滚动到结果区域失败:', error);
        }
    }



    /**
     * 初始化横幅标题
     * 确保横幅标题正确显示
     */
    initializeBannerTitle() {
        const header = document.querySelector('.header');
        const title = document.querySelector('.header h1');
        
        if (header && title) {
            // 确保标题文本正确
            if (title.textContent !== '时钟学习练习') {
                title.textContent = '时钟学习练习';
            }
            
            // 添加标题样式增强
            header.style.display = 'block';
            header.style.visibility = 'visible';
            
            console.log('横幅标题初始化完成');
        } else {
            console.warn('横幅标题元素未找到');
        }
    }

    /**
     * 初始化各功能区域的布局
     * 按顺序显示：配置选项、时钟显示区域、输入时间区域、答题记录区域
     */
    initializeFunctionalAreas() {
        const areas = [
            { selector: '.config-panel', name: '配置选项区域' },
            { selector: '.clock-section', name: '时钟显示区域' },
            { selector: '.answer-section', name: '输入时间区域' },
            { selector: '.records-section', name: '答题记录区域' },
            { selector: '.tutorial-section', name: '教学模块区域' }
        ];

        areas.forEach(area => {
            const element = document.querySelector(area.selector);
            if (element) {
                // 确保区域可见
                element.style.display = 'block';
                element.style.visibility = 'visible';
                
                // 添加区域标识
                if (!element.dataset.areaInitialized) {
                    element.dataset.areaInitialized = 'true';
                    console.log(`${area.name}初始化完成`);
                }
            } else {
                console.warn(`${area.name}元素未找到: ${area.selector}`);
            }
        });
    }

    /**
     * 设置界面响应性
     * 添加界面响应性和交互流畅性优化
     */
    setupResponsiveLayout() {
        try {
            // 检测屏幕尺寸并应用相应的布局
            const screenWidth = window.innerWidth;
            const appContainer = document.querySelector('.app-container');
            
            if (appContainer && appContainer.classList) {
                // 移除之前的响应式类
                appContainer.classList.remove('mobile-layout', 'tablet-layout', 'desktop-layout');
                
                // 根据屏幕宽度应用布局
                if (screenWidth < 768) {
                    appContainer.classList.add('mobile-layout');
                    this.applyMobileLayout();
                } else if (screenWidth < 1024) {
                    appContainer.classList.add('tablet-layout');
                    this.applyTabletLayout();
                } else {
                    appContainer.classList.add('desktop-layout');
                    this.applyDesktopLayout();
                }
            } else {
                console.warn('应用容器元素未找到或不支持classList，跳过响应式布局设置');
            }

            // 监听窗口大小变化
            if (!this.resizeListenerAdded) {
                window.addEventListener('resize', () => {
                    this.setupResponsiveLayout();
                });
                this.resizeListenerAdded = true;
            }

            console.log('响应式布局设置完成');
        } catch (error) {
            console.error('设置响应式布局失败:', error);
        }
    }

    /**
     * 应用移动端布局
     */
    applyMobileLayout() {
        const appContainer = document.querySelector('.app-container');
        if (appContainer && appContainer.style) {
            appContainer.style.gridTemplateColumns = '1fr';
            appContainer.style.gridTemplateAreas = `
                "header"
                "config"
                "clock"
                "answer"
                "records"
                "tutorial"
            `;
            console.log('移动端布局已应用');
        } else {
            console.warn('无法应用移动端布局：容器元素不可用');
        }
    }

    /**
     * 应用平板端布局
     */
    applyTabletLayout() {
        const appContainer = document.querySelector('.app-container');
        if (appContainer && appContainer.style) {
            appContainer.style.gridTemplateColumns = '1fr 1fr';
            appContainer.style.gridTemplateAreas = `
                "header header"
                "config clock"
                "answer answer"
                "records records"
                "tutorial tutorial"
            `;
            console.log('平板端布局已应用');
        } else {
            console.warn('无法应用平板端布局：容器元素不可用');
        }
    }

    /**
     * 应用桌面端布局
     */
    applyDesktopLayout() {
        const appContainer = document.querySelector('.app-container');
        if (appContainer && appContainer.style) {
            appContainer.style.gridTemplateColumns = '1fr 2fr 1fr';
            appContainer.style.gridTemplateAreas = `
                "header header header"
                "config clock answer"
                "records records records"
                "tutorial tutorial tutorial"
            `;
            console.log('桌面端布局已应用');
        } else {
            console.warn('无法应用桌面端布局：容器元素不可用');
        }
    }

    /**
     * 优化交互流畅性
     * 添加界面交互的流畅性优化
     */
    optimizeInteractionFlow() {
        try {
            // 1. 优化按钮交互
            this.optimizeButtonInteractions();
            
            // 2. 优化输入框交互
            this.optimizeInputInteractions();
            
            // 3. 优化滚动行为
            this.optimizeScrollBehavior();
            
            // 4. 添加加载状态指示
            this.setupLoadingIndicators();
            
            console.log('交互流畅性优化完成');
        } catch (error) {
            console.error('优化交互流畅性失败:', error);
        }
    }

    /**
     * 优化按钮交互
     */
    optimizeButtonInteractions() {
        const buttons = [this.refreshBtn, this.submitBtn, this.nextBtn];
        
        buttons.forEach(button => {
            if (button) {
                // 添加点击反馈
                button.addEventListener('mousedown', () => {
                    button.style.transform = 'scale(0.95)';
                });
                
                button.addEventListener('mouseup', () => {
                    button.style.transform = 'scale(1)';
                });
                
                button.addEventListener('mouseleave', () => {
                    button.style.transform = 'scale(1)';
                });
                
                // 添加键盘支持
                button.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        button.click();
                    }
                });
            }
        });
    }

    /**
     * 优化输入框交互
     */
    optimizeInputInteractions() {
        const inputs = [this.hoursInput, this.minutesInput, this.secondsInput];
        
        inputs.forEach(input => {
            if (input) {
                // 添加输入动画
                input.addEventListener('focus', () => {
                    input.style.transition = 'all 0.3s ease';
                    input.style.borderColor = '#667eea';
                    input.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                });
                
                input.addEventListener('blur', () => {
                    input.style.borderColor = '';
                    input.style.boxShadow = '';
                });
            }
        });
    }

    /**
     * 优化滚动行为
     */
    optimizeScrollBehavior() {
        // 确保所有滚动都是平滑的
        document.documentElement.style.scrollBehavior = 'smooth';
        
        // 添加滚动到顶部功能
        if (!document.getElementById('scroll-to-top')) {
            const scrollButton = document.createElement('button');
            scrollButton.id = 'scroll-to-top';
            scrollButton.textContent = '↑';
            scrollButton.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background-color: #667eea;
                color: white;
                border: none;
                font-size: 20px;
                cursor: pointer;
                display: none;
                z-index: 1000;
                transition: all 0.3s ease;
            `;
            
            scrollButton.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            
            document.body.appendChild(scrollButton);
            
            // 显示/隐藏滚动按钮
            window.addEventListener('scroll', () => {
                if (window.scrollY > 300) {
                    scrollButton.style.display = 'block';
                } else {
                    scrollButton.style.display = 'none';
                }
            });
        }
    }

    /**
     * 设置加载状态指示
     */
    setupLoadingIndicators() {
        // 为主要操作添加加载状态
        const operations = [
            { element: this.refreshBtn, operation: 'refresh' },
            { element: this.submitBtn, operation: 'submit' }
        ];
        
        operations.forEach(({ element, operation }) => {
            if (element && !element.dataset.loadingSetup) {
                element.dataset.loadingSetup = 'true';
                element.dataset.originalText = element.textContent;
                
                // 添加加载状态方法
                element.showLoading = () => {
                    element.disabled = true;
                    element.textContent = '处理中...';
                    element.style.opacity = '0.7';
                };
                
                element.hideLoading = () => {
                    element.disabled = false;
                    element.textContent = element.dataset.originalText;
                    element.style.opacity = '1';
                };
            }
        });
    }

    /**
     * 获取应用状态信息
     * 用于调试和监控
     * @returns {Object} 应用状态对象
     */
    getAppState() {
        return {
            currentTime: this.currentTime,
            isAnswerSubmitted: this.isAnswerSubmitted,
            currentDifficulty: this.difficultyManager.getCurrentDifficulty(),
            timerRunning: this.timerManager.isRunning(),
            layoutInfo: {
                screenWidth: window.innerWidth,
                screenHeight: window.innerHeight,
                layoutType: this.getLayoutType()
            },
            components: {
                difficultyManager: !!this.difficultyManager,
                difficultyUI: !!this.difficultyUI,
                clockRenderer: !!this.clockRenderer,
                timerManager: !!this.timerManager,
                recordManager: !!this.recordManager,
                recordUI: !!this.recordUI,
                tutorialManager: !!this.tutorialManager,
                tutorialUI: !!this.tutorialUI
            }
        };
    }

    /**
     * 获取当前布局类型
     * @returns {string} 布局类型
     */
    getLayoutType() {
        const screenWidth = window.innerWidth;
        if (screenWidth < 768) return 'mobile';
        if (screenWidth < 1024) return 'tablet';
        return 'desktop';
    }

    /**
     * 禁用所有时钟控制按钮
     */
    disableClockControls() {
        try {
            const controls = [
                this.currentTimeToggle,
                this.autoTickToggle,
                this.guideLinesToggle
            ];
            
            controls.forEach(control => {
                if (control) {
                    control.disabled = true;
                    // 获取按钮的父容器，通常是label或包装div
                    const toggleContainer = control.closest('.toggle-switch') || 
                                          control.closest('label') ||
                                          control.parentElement;
                    
                    if (toggleContainer) {
                        toggleContainer.style.opacity = '0.6';
                        toggleContainer.style.cursor = 'not-allowed';
                        toggleContainer.title = '正在重绘中，请稍候...';
                    }
                }
            });
            
            console.log('🔒 时钟控制按钮已禁用');
        } catch (error) {
            console.error('禁用时钟控制按钮失败:', error);
        }
    }

    /**
     * 启用所有时钟控制按钮
     */
    enableClockControls() {
        try {
            const controls = [
                this.currentTimeToggle,
                this.autoTickToggle,
                this.guideLinesToggle
            ];
            
            controls.forEach(control => {
                if (control) {
                    control.disabled = false;
                    // 获取按钮的父容器，通常是label或包装div
                    const toggleContainer = control.closest('.toggle-switch') || 
                                          control.closest('label') ||
                                          control.parentElement;
                    
                    if (toggleContainer) {
                        toggleContainer.style.opacity = '1';
                        toggleContainer.style.cursor = 'pointer';
                        toggleContainer.title = '';
                    }
                }
            });
            
            console.log('🔓 时钟控制按钮已启用');
        } catch (error) {
            console.error('启用时钟控制按钮失败:', error);
        }
    }

    /**
     * 等待重绘完成
     */
    async waitForRenderComplete() {
        return new Promise((resolve) => {
            // 检查是否有实际的渲染操作在进行
            if (!this.isRendering) {
                resolve();
                return;
            }
            
            // 使用requestAnimationFrame确保在下一帧完成后再resolve
            const checkRenderComplete = () => {
                if (!this.isRendering) {
                    resolve();
                } else {
                    requestAnimationFrame(checkRenderComplete);
                }
            };
            
            // 设置最大等待时间，避免无限等待
            setTimeout(() => {
                resolve();
            }, 300);
            
            requestAnimationFrame(checkRenderComplete);
        });
    }

    /**
     * 防抖渲染操作
     * @param {string} operationType - 操作类型
     * @param {Function} operation - 要执行的操作
     * @param {number} delay - 防抖延迟时间（毫秒）
     */
    debounceRenderOperation(operationType, operation, delay = 100) {
        // 清除之前的定时器
        if (this.debounceTimers.has(operationType)) {
            clearTimeout(this.debounceTimers.get(operationType));
        }
        
        // 设置新的定时器
        const timer = setTimeout(() => {
            this.debounceTimers.delete(operationType);
            operation();
        }, delay);
        
        this.debounceTimers.set(operationType, timer);
        console.log(`🕐 防抖操作 ${operationType} 已设置，延迟 ${delay}ms`);
    }

    /**
     * 执行渲染操作（带锁机制）
     * @param {Function} renderOperation - 渲染操作函数
     */
    executeRenderOperation(renderOperation) {
        // 如果正在渲染，将操作加入队列
        if (this.isRendering) {
            console.log('🔒 渲染正在进行中，操作加入队列');
            this.renderQueue.push(renderOperation);
            return;
        }
        
        // 设置渲染锁
        this.isRendering = true;
        this.disableClockControls();
        console.log('🔒 渲染锁已设置');
        
        try {
            // 执行渲染操作
            renderOperation();
            
            // 等待渲染完成
            this.waitForRenderComplete().then(() => {
                this.finishRenderOperation();
            });
            
        } catch (error) {
            console.error('渲染操作执行失败:', error);
            this.finishRenderOperation();
        }
    }

    /**
     * 完成渲染操作
     */
    finishRenderOperation() {
        // 释放渲染锁
        this.isRendering = false;
        this.enableClockControls();
        console.log('🔓 渲染锁已释放');
        
        // 处理队列中的下一个操作
        if (this.renderQueue.length > 0) {
            console.log(`📋 处理队列中的下一个操作，队列长度: ${this.renderQueue.length}`);
            const nextOperation = this.renderQueue.shift();
            // 使用短延迟确保UI更新完成
            setTimeout(() => {
                this.executeRenderOperation(nextOperation);
            }, 50);
        }
    }

    /**
     * 清理所有防抖定时器
     */
    clearAllDebounceTimers() {
        this.debounceTimers.forEach((timer, operationType) => {
            clearTimeout(timer);
            console.log(`🧹 清理防抖定时器: ${operationType}`);
        });
        this.debounceTimers.clear();
    }

    /**
     * 重置渲染状态（用于错误恢复）
     */
    resetRenderState() {
        this.isRendering = false;
        this.renderQueue = [];
        this.clearAllDebounceTimers();
        this.enableClockControls();
        console.log('🔄 渲染状态已重置');
    }
}