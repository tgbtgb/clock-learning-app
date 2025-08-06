/**
 * 计时管理器类
 * 负责管理答题计时功能
 */
class TimerManager {
    constructor() {
        this.startTime = null;
        this.endTime = null;
        this.isRunning = false;
        this.elapsedTime = 0;
        this.timerInterval = null;
        this.displayElement = null;
        this.callbacks = {
            onTick: null,
            onStart: null,
            onStop: null,
            onReset: null
        };
    }

    /**
     * 启动计时器
     * @returns {boolean} 启动是否成功
     */
    startTimer() {
        try {
            if (this.isRunning) {
                console.warn('计时器已经在运行中');
                return false;
            }

            // 检查Date对象是否可用
            if (typeof Date === 'undefined' || typeof Date.now !== 'function') {
                console.error('Date对象不可用，无法启动计时器');
                this.handleTimerError('系统时间功能不可用');
                return false;
            }

            this.startTime = Date.now();
            this.endTime = null;
            this.isRunning = true;
            this.elapsedTime = 0;

            // 启动定时器，每100毫秒更新一次显示
            try {
                this.timerInterval = setInterval(() => {
                    try {
                        this.updateElapsedTime();
                        this.updateDisplay();
                        
                        // 触发tick回调
                        if (this.callbacks.onTick && typeof this.callbacks.onTick === 'function') {
                            this.callbacks.onTick(this.elapsedTime);
                        }
                    } catch (tickError) {
                        console.error('计时器tick处理失败:', tickError);
                        this.handleTimerError('计时器更新异常');
                    }
                }, 100);

                // 触发启动回调
                if (this.callbacks.onStart && typeof this.callbacks.onStart === 'function') {
                    try {
                        this.callbacks.onStart();
                    } catch (callbackError) {
                        console.error('启动回调执行失败:', callbackError);
                    }
                }

                console.log('计时器已启动');
                return true;
            } catch (intervalError) {
                console.error('创建定时器失败:', intervalError);
                this.handleTimerError('定时器创建失败');
                return false;
            }
        } catch (error) {
            console.error('启动计时器时发生错误:', error);
            this.handleTimerError('计时器启动失败');
            return false;
        }
    }

    /**
     * 停止计时器
     * @returns {number} 总耗时（毫秒）
     */
    stopTimer() {
        try {
            if (!this.isRunning) {
                console.warn('计时器未在运行');
                return this.elapsedTime;
            }

            // 记录结束时间
            try {
                this.endTime = Date.now();
            } catch (timeError) {
                console.error('获取结束时间失败:', timeError);
                // 使用估算的结束时间
                this.endTime = this.startTime + this.elapsedTime;
            }
            
            this.isRunning = false;
            
            // 清除定时器
            if (this.timerInterval) {
                try {
                    clearInterval(this.timerInterval);
                    this.timerInterval = null;
                } catch (clearError) {
                    console.error('清除定时器失败:', clearError);
                    this.timerInterval = null; // 强制设置为null
                }
            }

            // 计算最终耗时
            try {
                this.updateElapsedTime();
            } catch (updateError) {
                console.error('更新耗时失败:', updateError);
                // 使用备用计算方法
                if (this.startTime && this.endTime) {
                    this.elapsedTime = this.endTime - this.startTime;
                }
            }
            
            // 触发停止回调
            if (this.callbacks.onStop && typeof this.callbacks.onStop === 'function') {
                try {
                    this.callbacks.onStop(this.elapsedTime);
                } catch (callbackError) {
                    console.error('停止回调执行失败:', callbackError);
                }
            }

            console.log(`计时器已停止，总耗时: ${this.formatTime(this.elapsedTime / 1000)}`);
            
            return this.elapsedTime;
        } catch (error) {
            console.error('停止计时器时发生错误:', error);
            
            // 强制停止状态
            this.isRunning = false;
            if (this.timerInterval) {
                try {
                    clearInterval(this.timerInterval);
                } catch (e) {
                    // 忽略清除错误
                }
                this.timerInterval = null;
            }
            
            this.handleTimerError('计时器停止异常');
            return this.elapsedTime || 0;
        }
    }

    /**
     * 重置计时器
     */
    resetTimer() {
        // 如果正在运行，先停止
        if (this.isRunning) {
            this.stopTimer();
        }

        this.startTime = null;
        this.endTime = null;
        this.elapsedTime = 0;
        this.isRunning = false;

        // 更新显示
        this.updateDisplay();

        // 触发重置回调
        if (this.callbacks.onReset) {
            this.callbacks.onReset();
        }

        console.log('计时器已重置');
    }

    /**
     * 获取当前耗时（毫秒）
     * @returns {number} 当前耗时
     */
    getCurrentTime() {
        if (this.isRunning) {
            this.updateElapsedTime();
        }
        return this.elapsedTime;
    }

    /**
     * 获取当前耗时（秒）
     * @returns {number} 当前耗时（秒）
     */
    getCurrentTimeInSeconds() {
        return Math.round(this.getCurrentTime() / 1000);
    }

    /**
     * 更新已用时间
     */
    updateElapsedTime() {
        if (this.startTime) {
            const currentTime = this.endTime || Date.now();
            this.elapsedTime = currentTime - this.startTime;
        }
    }

    /**
     * 格式化时间显示
     * @param {number} seconds - 秒数
     * @returns {string} 格式化的时间字符串
     */
    formatTime(seconds) {
        if (typeof seconds !== 'number' || isNaN(seconds)) {
            return '00:00';
        }

        const totalSeconds = Math.floor(Math.abs(seconds));
        const minutes = Math.floor(totalSeconds / 60);
        const remainingSeconds = totalSeconds % 60;

        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * 格式化详细时间显示（包含毫秒）
     * @param {number} milliseconds - 毫秒数
     * @returns {string} 格式化的时间字符串
     */
    formatDetailedTime(milliseconds) {
        if (typeof milliseconds !== 'number' || isNaN(milliseconds)) {
            return '00:00.0';
        }

        const totalMs = Math.abs(milliseconds);
        const seconds = Math.floor(totalMs / 1000);
        const ms = Math.floor((totalMs % 1000) / 100);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${ms}`;
    }

    /**
     * 设置显示元素
     * @param {HTMLElement} element - 用于显示计时的DOM元素
     */
    setDisplayElement(element) {
        this.displayElement = element;
        this.updateDisplay();
    }

    /**
     * 更新显示
     */
    updateDisplay() {
        try {
            if (this.displayElement) {
                const seconds = this.getCurrentTimeInSeconds();
                const formattedTime = this.formatTime(seconds);
                
                // 检查格式化结果是否有效
                if (formattedTime && typeof formattedTime === 'string') {
                    this.displayElement.textContent = formattedTime;
                } else {
                    console.warn('时间格式化结果无效:', formattedTime);
                    this.displayElement.textContent = '00:00';
                }
                
                // 添加运行状态的CSS类
                try {
                    if (this.displayElement.classList) {
                        if (this.isRunning) {
                            this.displayElement.classList.add('timer-running');
                            this.displayElement.classList.remove('timer-stopped', 'timer-error');
                        } else {
                            this.displayElement.classList.remove('timer-running');
                            this.displayElement.classList.add('timer-stopped');
                        }
                    }
                } catch (classError) {
                    console.warn('更新计时器CSS类失败:', classError);
                }
            }
        } catch (error) {
            console.error('更新计时器显示失败:', error);
            
            // 显示错误状态
            if (this.displayElement) {
                try {
                    this.displayElement.textContent = 'ERROR';
                    if (this.displayElement.classList) {
                        this.displayElement.classList.add('timer-error');
                    }
                } catch (errorDisplayError) {
                    console.error('显示错误状态也失败:', errorDisplayError);
                }
            }
        }
    }

    /**
     * 处理计时器错误
     * @param {string} errorMessage - 错误消息
     */
    handleTimerError(errorMessage) {
        console.error('计时器错误:', errorMessage);
        
        // 强制停止计时器
        this.isRunning = false;
        if (this.timerInterval) {
            try {
                clearInterval(this.timerInterval);
            } catch (e) {
                // 忽略清除错误
            }
            this.timerInterval = null;
        }
        
        // 更新显示为错误状态
        if (this.displayElement) {
            try {
                this.displayElement.textContent = '计时错误';
                if (this.displayElement.classList) {
                    this.displayElement.classList.add('timer-error');
                    this.displayElement.classList.remove('timer-running', 'timer-stopped');
                }
                this.displayElement.title = errorMessage;
            } catch (displayError) {
                console.error('显示计时器错误状态失败:', displayError);
            }
        }
        
        // 显示用户友好的错误提示
        this.showTimerErrorMessage(errorMessage);
        
        // 记录错误统计
        this.recordTimerError(errorMessage);
        
        // 触发计时器错误事件
        this.dispatchTimerErrorEvent(errorMessage);
        
        // 尝试自动恢复（延迟执行）
        setTimeout(() => {
            this.attemptAutoRecovery(errorMessage);
        }, 2000);
    }

    /**
     * 显示计时器错误消息
     * @param {string} errorMessage - 错误消息
     */
    showTimerErrorMessage(errorMessage) {
        try {
            // 创建或更新错误提示
            let errorElement = document.getElementById('timer-error');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.id = 'timer-error';
                errorElement.className = 'error-message timer-error';
                
                const timerContainer = document.querySelector('.timer-container') || 
                                     document.querySelector('.input-section');
                if (timerContainer) {
                    timerContainer.appendChild(errorElement);
                }
            }
            
            errorElement.textContent = `计时功能异常: ${errorMessage}`;
            errorElement.style.display = 'block';
            
            // 5秒后自动隐藏
            setTimeout(() => {
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
            }, 5000);
        } catch (error) {
            console.error('显示计时器错误消息失败:', error);
        }
    }

    /**
     * 尝试恢复计时器功能
     * @returns {boolean} 恢复是否成功
     */
    tryRecoverTimer() {
        try {
            // 重置状态
            this.isRunning = false;
            this.timerInterval = null;
            this.elapsedTime = 0;
            
            // 测试基本功能
            const testTime = Date.now();
            if (typeof testTime !== 'number' || isNaN(testTime)) {
                console.log('系统时间功能仍然不可用');
                return false;
            }
            
            // 清除错误状态
            if (this.displayElement && this.displayElement.classList) {
                this.displayElement.classList.remove('timer-error');
                this.displayElement.title = '';
                this.updateDisplay();
            }
            
            // 隐藏错误消息
            const errorElement = document.getElementById('timer-error');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
            
            console.log('计时器功能已恢复');
            return true;
        } catch (error) {
            console.error('恢复计时器功能失败:', error);
            return false;
        }
    }

    /**
     * 设置回调函数
     * @param {string} eventType - 事件类型 ('onTick', 'onStart', 'onStop', 'onReset')
     * @param {Function} callback - 回调函数
     */
    setCallback(eventType, callback) {
        if (this.callbacks.hasOwnProperty(eventType)) {
            this.callbacks[eventType] = callback;
        } else {
            console.warn(`未知的回调事件类型: ${eventType}`);
        }
    }

    /**
     * 移除回调函数
     * @param {string} eventType - 事件类型
     */
    removeCallback(eventType) {
        if (this.callbacks.hasOwnProperty(eventType)) {
            this.callbacks[eventType] = null;
        }
    }

    /**
     * 获取计时器状态
     * @returns {Object} 计时器状态对象
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            startTime: this.startTime,
            endTime: this.endTime,
            elapsedTime: this.elapsedTime,
            elapsedSeconds: this.getCurrentTimeInSeconds(),
            formattedTime: this.formatTime(this.getCurrentTimeInSeconds())
        };
    }

    /**
     * 检查计时器是否正在运行
     * @returns {boolean} 是否正在运行
     */
    isTimerRunning() {
        return this.isRunning;
    }

    /**
     * 暂停计时器（保留当前时间）
     */
    pauseTimer() {
        if (!this.isRunning) {
            console.warn('计时器未在运行，无法暂停');
            return;
        }

        // 停止定时器但保留状态
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        this.endTime = Date.now();
        this.updateElapsedTime();
        this.isRunning = false;

        console.log('计时器已暂停');
    }

    /**
     * 恢复计时器
     */
    resumeTimer() {
        if (this.isRunning) {
            console.warn('计时器已在运行中');
            return;
        }

        if (this.startTime === null) {
            console.warn('计时器未初始化，请使用startTimer()');
            return;
        }

        // 调整开始时间以保持已用时间
        const pausedDuration = this.elapsedTime;
        this.startTime = Date.now() - pausedDuration;
        this.endTime = null;
        this.isRunning = true;

        // 重新启动定时器
        this.timerInterval = setInterval(() => {
            this.updateElapsedTime();
            this.updateDisplay();
            
            if (this.callbacks.onTick) {
                this.callbacks.onTick(this.elapsedTime);
            }
        }, 100);

        console.log('计时器已恢复');
    }

    /**
     * 销毁计时器，清理资源
     */
    destroy() {
        this.stopTimer();
        this.displayElement = null;
        this.callbacks = {
            onTick: null,
            onStart: null,
            onStop: null,
            onReset: null
        };
        
        console.log('计时器已销毁');
    }

    /**
     * 清理计时器资源（destroy方法的别名）
     */
    cleanup() {
        console.log('🧹 清理TimerManager资源...');
        this.destroy();
        console.log('✅ TimerManager资源清理完成');
    }

    /**
     * 记录计时器错误统计
     * @param {string} errorMessage - 错误消息
     */
    recordTimerError(errorMessage) {
        try {
            let errorStats = JSON.parse(localStorage.getItem('timerErrorStats') || '{}');
            
            const errorKey = errorMessage.replace(/[^a-zA-Z0-9]/g, '_');
            errorStats[errorKey] = (errorStats[errorKey] || 0) + 1;
            errorStats.lastError = {
                message: errorMessage,
                timestamp: new Date().toISOString(),
                elapsedTime: this.elapsedTime
            };
            
            localStorage.setItem('timerErrorStats', JSON.stringify(errorStats));
        } catch (error) {
            console.warn('记录计时器错误统计失败:', error);
        }
    }

    /**
     * 触发计时器错误事件
     * @param {string} errorMessage - 错误消息
     */
    dispatchTimerErrorEvent(errorMessage) {
        try {
            const event = new CustomEvent('timerError', {
                detail: {
                    message: errorMessage,
                    elapsedTime: this.elapsedTime,
                    isRunning: this.isRunning,
                    timestamp: new Date()
                }
            });
            document.dispatchEvent(event);
        } catch (error) {
            console.error('触发计时器错误事件失败:', error);
        }
    }

    /**
     * 尝试自动恢复计时器功能
     * @param {string} originalError - 原始错误消息
     */
    attemptAutoRecovery(originalError) {
        try {
            console.log('尝试自动恢复计时器功能...');
            
            // 检查基本功能是否恢复
            if (typeof Date === 'undefined' || typeof Date.now !== 'function') {
                console.log('系统时间功能仍然不可用');
                return false;
            }
            
            // 尝试恢复
            const recovered = this.tryRecoverTimer();
            if (recovered) {
                this.showTimerRecoveryMessage();
                
                // 触发恢复事件
                const event = new CustomEvent('timerRecovered', {
                    detail: {
                        originalError,
                        recoveryTime: new Date()
                    }
                });
                document.dispatchEvent(event);
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('自动恢复计时器功能失败:', error);
            return false;
        }
    }

    /**
     * 显示计时器恢复消息
     */
    showTimerRecoveryMessage() {
        try {
            let messageElement = document.getElementById('timer-recovery');
            if (!messageElement) {
                messageElement = document.createElement('div');
                messageElement.id = 'timer-recovery';
                messageElement.className = 'success-message timer-recovery';
                
                const timerContainer = document.querySelector('.timer-container') || 
                                     document.querySelector('.input-section');
                if (timerContainer) {
                    timerContainer.appendChild(messageElement);
                }
            }
            
            messageElement.innerHTML = `
                <div class="success-content">
                    <span class="success-icon">✅</span>
                    <span class="success-text">计时功能已恢复正常</span>
                    <button class="success-close" onclick="this.parentElement.parentElement.style.display='none'">×</button>
                </div>
            `;
            messageElement.style.display = 'block';
            
            // 3秒后自动隐藏
            setTimeout(() => {
                if (messageElement) {
                    messageElement.style.display = 'none';
                }
            }, 3000);
        } catch (error) {
            console.error('显示计时器恢复消息失败:', error);
        }
    }

    /**
     * 获取计时器错误统计
     * @returns {Object} 错误统计信息
     */
    getErrorStats() {
        try {
            return JSON.parse(localStorage.getItem('timerErrorStats') || '{}');
        } catch (error) {
            console.warn('获取计时器错误统计失败:', error);
            return {};
        }
    }

    /**
     * 清除计时器错误统计
     */
    clearErrorStats() {
        try {
            localStorage.removeItem('timerErrorStats');
            console.log('计时器错误统计已清除');
        } catch (error) {
            console.warn('清除计时器错误统计失败:', error);
        }
    }
}