/**
 * 应用控制器类
 * 协调各个组件，管理应用的整体流程
 */
class AppController {
    constructor() {
        this.configManager = new ConfigManager();
        this.timeGenerator = new TimeGenerator(this.configManager.getConfig());
        this.clockRenderer = null;
        this.answerValidator = new AnswerValidator();
        this.currentTime = null;
        
        this.initializeElements();
        this.initializeEventListeners();
    }

    /**
     * 初始化DOM元素引用
     */
    initializeElements() {
        // 配置相关元素
        this.enableHoursCheckbox = document.getElementById('enable-hours');
        this.enableMinutesCheckbox = document.getElementById('enable-minutes');
        this.enableSecondsCheckbox = document.getElementById('enable-seconds');
        this.minuteIntervalsContainer = document.getElementById('minute-intervals');
        this.minuteIntervalRadios = document.querySelectorAll('input[name="minute-interval"]');
        
        // 按钮元素
        this.refreshBtn = document.getElementById('refresh-btn');
        this.submitBtn = document.getElementById('submit-btn');
        this.nextBtn = document.getElementById('next-btn');
        
        // 时钟相关元素
        this.clockCanvas = document.getElementById('clock-canvas');
        this.clockFallback = document.getElementById('clock-fallback');
        
        // 输入和结果元素
        this.hoursInput = document.getElementById('hours-input');
        this.minutesInput = document.getElementById('minutes-input');
        this.secondsInput = document.getElementById('seconds-input');
        this.resultDisplay = document.getElementById('result-display');
        this.resultMessage = document.getElementById('result-message');
        this.correctAnswer = document.getElementById('correct-answer');
    }

    /**
     * 初始化应用
     */
    init() {
        try {
            // 初始化时钟渲染器
            this.clockRenderer = new ClockRenderer(this.clockCanvas);
            
            // 加载保存的配置
            this.loadConfigFromUI();
            
            // 生成第一个题目
            this.generateNewQuestion();
            
            console.log('时钟学习应用初始化完成');
        } catch (error) {
            console.error('应用初始化失败:', error);
        }
    }

    /**
     * 初始化事件监听器
     */
    initializeEventListeners() {
        // 配置变更事件
        this.enableHoursCheckbox.addEventListener('change', () => this.handleConfigChange());
        this.enableMinutesCheckbox.addEventListener('change', () => this.handleConfigChange());
        this.enableSecondsCheckbox.addEventListener('change', () => this.handleConfigChange());
        
        this.minuteIntervalRadios.forEach(radio => {
            radio.addEventListener('change', () => this.handleConfigChange());
        });

        // 按钮事件
        this.refreshBtn.addEventListener('click', () => this.handleRefresh());
        this.submitBtn.addEventListener('click', () => this.handleSubmit());
        this.nextBtn.addEventListener('click', () => this.handleNext());

        // 输入框事件
        this.hoursInput.addEventListener('input', () => this.handleInputChange());
        this.minutesInput.addEventListener('input', () => this.handleInputChange());
        this.secondsInput.addEventListener('input', () => this.handleInputChange());
        
        // 回车键提交
        [this.hoursInput, this.minutesInput, this.secondsInput].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSubmit();
                }
            });
        });
    }

    /**
     * 处理配置变更
     */
    handleConfigChange() {
        const config = this.getConfigFromUI();
        
        // 更新配置管理器
        this.configManager.updateConfig(config);
        
        // 更新时间生成器配置
        this.timeGenerator.updateConfig(config);
        
        // 显示/隐藏分钟间隔选项
        this.updateMinuteIntervalVisibility(config.enableMinutes);
        
        console.log('配置已更新:', config);
    }

    /**
     * 从UI获取当前配置
     * @returns {Object} 配置对象
     */
    getConfigFromUI() {
        const selectedInterval = document.querySelector('input[name="minute-interval"]:checked');
        
        return {
            enableHours: this.enableHoursCheckbox.checked,
            enableMinutes: this.enableMinutesCheckbox.checked,
            enableSeconds: this.enableSecondsCheckbox.checked,
            minuteInterval: selectedInterval ? parseInt(selectedInterval.value) : 1
        };
    }

    /**
     * 从配置管理器加载配置到UI
     */
    loadConfigFromUI() {
        const config = this.configManager.getConfig();
        
        this.enableHoursCheckbox.checked = config.enableHours;
        this.enableMinutesCheckbox.checked = config.enableMinutes;
        this.enableSecondsCheckbox.checked = config.enableSeconds;
        
        // 设置分钟间隔
        const intervalRadio = document.querySelector(`input[name="minute-interval"][value="${config.minuteInterval}"]`);
        if (intervalRadio) {
            intervalRadio.checked = true;
        }
        
        // 更新分钟间隔显示
        this.updateMinuteIntervalVisibility(config.enableMinutes);
    }

    /**
     * 更新分钟间隔选项的显示状态
     * @param {boolean} showIntervals - 是否显示间隔选项
     */
    updateMinuteIntervalVisibility(showIntervals) {
        this.minuteIntervalsContainer.style.display = showIntervals ? 'block' : 'none';
    }

    /**
     * 处理刷新按钮点击
     */
    handleRefresh() {
        this.generateNewQuestion();
    }

    /**
     * 生成新题目
     */
    generateNewQuestion() {
        try {
            // 生成新时间
            this.currentTime = this.timeGenerator.generateTime();
            
            // 渲染时钟
            this.clockRenderer.render(this.currentTime);
            
            // 清空输入和结果
            this.clearInputAndResult();
            
            console.log('生成新题目:', this.currentTime);
        } catch (error) {
            console.error('生成题目失败:', error);
        }
    }

    /**
     * 处理提交按钮点击
     */
    handleSubmit() {
        if (!this.currentTime) {
            alert('请先生成一个题目');
            return;
        }

        // 获取用户输入的时间
        const userTime = this.getUserInputTime();
        
        if (!userTime) {
            this.showInputError('请检查输入的时间范围');
            return;
        }

        // 验证答案
        const result = this.answerValidator.validateTimeObject(userTime, this.currentTime);
        
        // 显示结果
        this.showResult(result);
    }

    /**
     * 处理继续练习按钮点击
     */
    handleNext() {
        this.generateNewQuestion();
    }

    /**
     * 处理输入框内容变化
     */
    handleInputChange() {
        // 验证各个输入框
        this.validateIndividualInputs();
    }

    /**
     * 验证各个输入框的值
     */
    validateIndividualInputs() {
        const hours = parseInt(this.hoursInput.value) || 0;
        const minutes = parseInt(this.minutesInput.value) || 0;
        const seconds = parseInt(this.secondsInput.value) || 0;

        // 验证小时 - 允许0，但如果不是0则必须在1-12范围内
        this.hoursInput.classList.remove('error', 'success');
        if (hours < 0 || hours > 12) {
            this.hoursInput.classList.add('error');
        } else {
            this.hoursInput.classList.add('success');
        }

        // 验证分钟
        this.minutesInput.classList.remove('error', 'success');
        if (minutes < 0 || minutes > 59) {
            this.minutesInput.classList.add('error');
        } else {
            this.minutesInput.classList.add('success');
        }

        // 验证秒钟
        this.secondsInput.classList.remove('error', 'success');
        if (seconds < 0 || seconds > 59) {
            this.secondsInput.classList.add('error');
        } else {
            this.secondsInput.classList.add('success');
        }
    }

    /**
     * 获取用户输入的时间对象
     * @returns {Object|null} 时间对象或null
     */
    getUserInputTime() {
        const hours = parseInt(this.hoursInput.value) || 0;
        const minutes = parseInt(this.minutesInput.value) || 0;
        const seconds = parseInt(this.secondsInput.value) || 0;

        // 验证范围 - 允许小时为0，但如果不是0则必须在1-12范围内
        if (hours < 0 || hours > 12 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
            return null;
        }

        // 如果小时为0，转换为12（12小时制）
        const adjustedHours = hours === 0 ? 12 : hours;

        return {
            hours: adjustedHours,
            minutes: minutes,
            seconds: seconds
        };
    }

    /**
     * 显示验证结果
     * @param {Object} result - 验证结果对象
     */
    showResult(result) {
        // 显示结果区域
        this.resultDisplay.style.display = 'block';
        
        // 设置样式
        this.resultDisplay.className = `result-display ${result.isCorrect ? 'correct' : 'incorrect'}`;
        
        // 设置消息
        this.resultMessage.textContent = result.message;
        
        // 显示正确答案（如果答错了）
        if (!result.isCorrect) {
            this.correctAnswer.textContent = `正确答案是: ${this.answerValidator.formatTime(result.correctTime)}`;
            this.correctAnswer.style.display = 'block';
        } else {
            this.correctAnswer.style.display = 'none';
        }
        
        // 显示继续按钮
        this.nextBtn.style.display = 'inline-block';
        
        // 禁用提交按钮和输入框
        this.submitBtn.disabled = true;
        [this.hoursInput, this.minutesInput, this.secondsInput].forEach(input => {
            input.disabled = true;
        });
    }

    /**
     * 显示输入错误
     * @param {string} message - 错误消息
     */
    showInputError(message) {
        [this.hoursInput, this.minutesInput, this.secondsInput].forEach(input => {
            input.classList.add('error');
        });
        
        // 可以添加更多的错误提示逻辑
        setTimeout(() => {
            [this.hoursInput, this.minutesInput, this.secondsInput].forEach(input => {
                input.classList.remove('error');
            });
        }, 2000);
    }

    /**
     * 清空输入和结果
     */
    clearInputAndResult() {
        // 清空输入
        this.hoursInput.value = '0';
        this.minutesInput.value = '0';
        this.secondsInput.value = '0';
        
        // 启用输入框
        [this.hoursInput, this.minutesInput, this.secondsInput].forEach(input => {
            input.disabled = false;
            input.classList.remove('error', 'success');
        });
        
        // 启用提交按钮
        this.submitBtn.disabled = false;
        
        // 隐藏结果
        this.resultDisplay.style.display = 'none';
        this.nextBtn.style.display = 'none';
        
        // 聚焦到小时输入框
        this.hoursInput.focus();
    }
}