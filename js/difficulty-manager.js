/**
 * 难度管理器类
 * 负责管理1-5星难度系统，包括难度配置和描述
 */
class DifficultyManager {
    constructor() {
        this.currentDifficulty = 1; // 默认1星难度
        this.difficulties = this.initializeDifficulties();
        this.loadDifficulty();
    }

    /**
     * 初始化难度配置
     * @returns {Object} 难度配置对象
     */
    initializeDifficulties() {
        return {
            1: {
                level: 1,
                name: "1星 - 整点时间",
                description: "显示整点时间，如 3:00:00，适合初学者。请输入完整的时、分、秒",
                timeConfig: {
                    includeHours: true,
                    includeMinutes: true,
                    includeSeconds: true,
                    minuteInterval: 60, // 整点，即0分钟
                    secondsFixed: 0     // 秒数固定为0
                }
            },
            2: {
                level: 2,
                name: "2星 - 30分钟间隔",
                description: "显示30分钟间隔的时间，如 3:30:00，学习半点概念。请输入完整的时、分、秒",
                timeConfig: {
                    includeHours: true,
                    includeMinutes: true,
                    includeSeconds: true,
                    minuteInterval: 30,
                    secondsFixed: 0
                }
            },
            3: {
                level: 3,
                name: "3星 - 5分钟间隔",
                description: "显示5分钟间隔的时间，如 3:25:00，练习基础分钟读取。请输入完整的时、分、秒",
                timeConfig: {
                    includeHours: true,
                    includeMinutes: true,
                    includeSeconds: true,
                    minuteInterval: 5,
                    secondsFixed: 0
                }
            },
            4: {
                level: 4,
                name: "4星 - 1分钟间隔",
                description: "显示1分钟间隔的时间，如 3:27:00，掌握精确分钟。请输入完整的时、分、秒",
                timeConfig: {
                    includeHours: true,
                    includeMinutes: true,
                    includeSeconds: true,
                    minuteInterval: 1,
                    secondsFixed: 0
                }
            },
            5: {
                level: 5,
                name: "5星 - 包含秒数",
                description: "显示完整时间包含秒数，如 3:27:45，挑战完整时间读取。请输入完整的时、分、秒",
                timeConfig: {
                    includeHours: true,
                    includeMinutes: true,
                    includeSeconds: true,
                    minuteInterval: 1,
                    secondsFixed: null  // 秒数不固定，随机生成
                }
            }
        };
    }

    /**
     * 获取当前难度
     * @returns {Object} 当前难度对象
     */
    getDifficulty() {
        if (!this.difficulties) {
            console.error('难度配置未初始化');
            return null;
        }
        
        if (!this.currentDifficulty || !this.difficulties[this.currentDifficulty]) {
            console.warn('当前难度无效，重置为1星');
            this.currentDifficulty = 1;
        }
        
        return this.difficulties[this.currentDifficulty];
    }

    /**
     * 设置难度等级
     * @param {number} level - 难度等级 (1-5)
     * @returns {boolean} 设置是否成功
     */
    setDifficulty(level) {
        try {
            if (this.validateDifficulty(level)) {
                const previousDifficulty = this.currentDifficulty;
                this.currentDifficulty = level;
                
                // 尝试保存难度设置
                const saveSuccess = this.saveDifficulty();
                if (!saveSuccess) {
                    // 如果保存失败，回滚到之前的难度
                    console.warn('难度设置保存失败，回滚到之前的设置');
                    this.currentDifficulty = previousDifficulty;
                    this.handleDifficultyError('保存失败', level, previousDifficulty);
                    return false;
                }
                
                console.log(`难度已成功设置为 ${level} 星`);
                
                // 触发难度切换成功事件
                this.dispatchDifficultyChangeEvent(level, true);
                return true;
            } else {
                console.error(`无效的难度等级: ${level}，必须是1-5之间的整数`);
                this.handleDifficultyError('无效等级', level, this.currentDifficulty);
                return false;
            }
        } catch (error) {
            console.error('设置难度时发生错误:', error);
            
            // 确保难度保持在有效范围内
            if (!this.validateDifficulty(this.currentDifficulty)) {
                console.warn('当前难度无效，重置为默认难度1星');
                const originalDifficulty = this.currentDifficulty;
                this.currentDifficulty = 1;
                this.handleDifficultyError('系统异常，已重置', level, originalDifficulty);
            } else {
                this.handleDifficultyError('设置异常', level, this.currentDifficulty);
            }
            
            return false;
        }
    }

    /**
     * 获取当前难度等级
     * @returns {number} 当前难度等级
     */
    getCurrentLevel() {
        return this.currentDifficulty;
    }

    /**
     * 获取难度描述
     * @param {number} level - 难度等级 (1-5)
     * @returns {string} 难度描述
     */
    getDifficultyDescription(level) {
        if (this.validateDifficulty(level)) {
            return this.difficulties[level].description;
        }
        return "无效的难度等级";
    }

    /**
     * 获取难度名称
     * @param {number} level - 难度等级 (1-5)
     * @returns {string} 难度名称
     */
    getDifficultyName(level) {
        if (this.validateDifficulty(level)) {
            return this.difficulties[level].name;
        }
        return "未知难度";
    }

    /**
     * 获取所有难度信息
     * @returns {Object} 所有难度配置
     */
    getAllDifficulties() {
        return { ...this.difficulties };
    }

    /**
     * 获取当前难度的时间配置
     * @returns {Object} 时间配置对象
     */
    getTimeConfig() {
        const difficulty = this.getDifficulty();
        if (!difficulty || !difficulty.timeConfig) {
            console.error('无法获取时间配置，使用默认配置');
            return {
                includeHours: true,
                includeMinutes: true,
                includeSeconds: true,
                minuteInterval: 60,
                secondsFixed: 0
            };
        }
        return { ...difficulty.timeConfig };
    }

    /**
     * 验证难度等级的有效性
     * @param {number} level - 要验证的难度等级
     * @returns {boolean} 难度等级是否有效
     */
    validateDifficulty(level) {
        if (typeof level !== 'number') {
            console.warn('难度等级必须是数字');
            return false;
        }
        
        if (!Number.isInteger(level)) {
            console.warn('难度等级必须是整数');
            return false;
        }
        
        if (level < 1 || level > 5) {
            console.warn('难度等级必须在1-5之间');
            return false;
        }
        
        return true;
    }

    /**
     * 从本地存储加载难度设置
     */
    loadDifficulty() {
        try {
            const savedDifficulty = localStorage.getItem('clockLearningDifficulty');
            if (savedDifficulty) {
                const level = parseInt(savedDifficulty, 10);
                if (this.validateDifficulty(level)) {
                    this.currentDifficulty = level;
                } else {
                    console.warn('加载的难度等级无效，使用默认难度1星');
                    this.currentDifficulty = 1;
                }
            }
        } catch (error) {
            console.error('加载难度设置失败，使用默认难度:', error);
            this.currentDifficulty = 1;
        }
    }

    /**
     * 保存难度设置到本地存储
     * @returns {boolean} 保存是否成功
     */
    saveDifficulty() {
        try {
            // 检查localStorage是否可用
            if (typeof Storage === 'undefined') {
                console.warn('浏览器不支持localStorage，难度设置将不会被保存');
                return false;
            }
            
            // 验证当前难度的有效性
            if (!this.validateDifficulty(this.currentDifficulty)) {
                console.error('尝试保存无效的难度设置:', this.currentDifficulty);
                return false;
            }
            
            localStorage.setItem('clockLearningDifficulty', this.currentDifficulty.toString());
            console.log(`难度设置已保存: ${this.currentDifficulty}星`);
            return true;
        } catch (error) {
            console.error('保存难度设置失败:', error);
            
            // 检查是否是存储空间不足的问题
            if (error.name === 'QuotaExceededError') {
                console.warn('localStorage存储空间不足，尝试清理旧数据');
                this.handleStorageQuotaExceeded();
                
                // 重试保存
                try {
                    localStorage.setItem('clockLearningDifficulty', this.currentDifficulty.toString());
                    console.log('重试保存成功');
                    return true;
                } catch (retryError) {
                    console.error('重试保存仍然失败:', retryError);
                    return false;
                }
            }
            
            return false;
        }
    }

    /**
     * 处理存储空间不足的情况
     */
    handleStorageQuotaExceeded() {
        try {
            // 清理可能的旧数据（保留重要数据）
            const keysToCheck = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('clockLearning') && key !== 'clockLearningDifficulty') {
                    keysToCheck.push(key);
                }
            }
            
            // 删除非关键数据
            keysToCheck.forEach(key => {
                if (key !== 'clockLearningRecords') { // 保留答题记录
                    try {
                        localStorage.removeItem(key);
                        console.log(`已清理存储项: ${key}`);
                    } catch (error) {
                        console.warn(`清理存储项失败: ${key}`, error);
                    }
                }
            });
        } catch (error) {
            console.error('清理存储空间时发生错误:', error);
        }
    }

    /**
     * 重置为默认难度
     */
    resetDifficulty() {
        this.currentDifficulty = 1;
        this.saveDifficulty();
    }

    /**
     * 获取难度对应的星级显示字符串
     * @param {number} level - 难度等级
     * @returns {string} 星级显示字符串
     */
    getStarDisplay(level) {
        if (!this.validateDifficulty(level)) {
            return "☆☆☆☆☆";
        }
        
        let stars = "";
        for (let i = 1; i <= 5; i++) {
            stars += i <= level ? "★" : "☆";
        }
        return stars;
    }

    /**
     * 检查是否需要显示秒数输入
     * @returns {boolean} 是否需要显示秒数输入
     */
    shouldShowSeconds() {
        // 所有星级都要求输入完整的时、分、秒
        return true;
    }

    /**
     * 检查是否需要显示分钟输入
     * @returns {boolean} 是否需要显示分钟输入
     */
    shouldShowMinutes() {
        // 所有星级都要求输入完整的时、分、秒
        return true;
    }

    /**
     * 检查是否需要显示小时输入
     * @returns {boolean} 是否需要显示小时输入
     */
    shouldShowHours() {
        // 所有星级都要求输入完整的时、分、秒
        return true;
    }

    /**
     * 处理难度切换错误
     * @param {string} errorType - 错误类型
     * @param {number} targetLevel - 目标难度等级
     * @param {number} currentLevel - 当前难度等级
     */
    handleDifficultyError(errorType, targetLevel, currentLevel) {
        console.error(`难度切换错误 [${errorType}]:`, {
            target: targetLevel,
            current: currentLevel,
            timestamp: new Date().toISOString()
        });
        
        // 显示用户友好的错误提示
        this.showDifficultyErrorMessage(errorType, targetLevel);
        
        // 触发错误事件
        this.dispatchDifficultyChangeEvent(targetLevel, false, errorType);
        
        // 记录错误统计
        this.recordDifficultyError(errorType, targetLevel);
    }

    /**
     * 显示难度错误消息
     * @param {string} errorType - 错误类型
     * @param {number} targetLevel - 目标难度等级
     */
    showDifficultyErrorMessage(errorType, targetLevel) {
        try {
            let errorElement = document.getElementById('difficulty-error');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.id = 'difficulty-error';
                errorElement.className = 'error-message difficulty-error';
                
                const difficultyContainer = document.querySelector('.difficulty-section') || 
                                           document.querySelector('.config-section') ||
                                           document.body;
                difficultyContainer.appendChild(errorElement);
            }
            
            const errorMessages = {
                '保存失败': `切换到 ${targetLevel} 星难度失败，设置无法保存`,
                '无效等级': `难度等级 ${targetLevel} 无效，请选择1-5星`,
                '系统异常，已重置': `难度系统异常，已重置为1星难度`,
                '设置异常': `切换到 ${targetLevel} 星难度时出现异常`
            };
            
            const message = errorMessages[errorType] || `难度切换失败: ${errorType}`;
            
            errorElement.innerHTML = `
                <div class="error-content">
                    <span class="error-icon">⚠️</span>
                    <span class="error-text">${message}</span>
                    <button class="error-close" onclick="this.parentElement.parentElement.style.display='none'">×</button>
                </div>
            `;
            errorElement.style.display = 'block';
            
            // 5秒后自动隐藏
            setTimeout(() => {
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
            }, 5000);
        } catch (error) {
            console.error('显示难度错误消息失败:', error);
        }
    }

    /**
     * 触发难度切换事件
     * @param {number} level - 难度等级
     * @param {boolean} success - 是否成功
     * @param {string} errorType - 错误类型（如果失败）
     */
    dispatchDifficultyChangeEvent(level, success, errorType = null) {
        try {
            const eventData = {
                level,
                success,
                difficulty: success ? this.difficulties[level] : null,
                error: errorType,
                timestamp: new Date()
            };
            
            const eventName = success ? 'difficultyChanged' : 'difficultyChangeFailed';
            const event = new CustomEvent(eventName, { detail: eventData });
            document.dispatchEvent(event);
        } catch (error) {
            console.error('触发难度切换事件失败:', error);
        }
    }

    /**
     * 记录难度错误统计
     * @param {string} errorType - 错误类型
     * @param {number} targetLevel - 目标难度等级
     */
    recordDifficultyError(errorType, targetLevel) {
        try {
            // 获取或初始化错误统计
            let errorStats = JSON.parse(localStorage.getItem('difficultyErrorStats') || '{}');
            
            const errorKey = `${errorType}_${targetLevel}`;
            errorStats[errorKey] = (errorStats[errorKey] || 0) + 1;
            errorStats.lastError = {
                type: errorType,
                level: targetLevel,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('difficultyErrorStats', JSON.stringify(errorStats));
        } catch (error) {
            console.warn('记录难度错误统计失败:', error);
        }
    }

    /**
     * 尝试恢复难度功能
     * @returns {boolean} 恢复是否成功
     */
    tryRecoverDifficulty() {
        try {
            console.log('尝试恢复难度功能...');
            
            // 验证当前状态
            if (!this.validateDifficulty(this.currentDifficulty)) {
                console.log('当前难度无效，重置为1星');
                this.currentDifficulty = 1;
            }
            
            // 测试保存功能
            const testSave = this.saveDifficulty();
            if (!testSave) {
                console.log('保存功能仍然异常');
                return false;
            }
            
            // 隐藏错误消息
            const errorElement = document.getElementById('difficulty-error');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
            
            console.log('难度功能已恢复');
            return true;
        } catch (error) {
            console.error('恢复难度功能失败:', error);
            return false;
        }
    }

    /**
     * 获取当前难度对象
     * @returns {Object} 当前难度对象
     */
    getCurrentDifficulty() {
        return this.getDifficulty();
    }
}