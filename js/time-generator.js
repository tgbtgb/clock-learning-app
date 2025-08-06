/**
 * 时间生成器类
 * 根据星级难度生成相应复杂度的时间
 */
class TimeGenerator {
    constructor(difficultyManager) {
        this.difficultyManager = difficultyManager;
        this.lastGeneratedTime = null; // 记录上次生成的时间
    }

    /**
     * 更新难度管理器
     * @param {DifficultyManager} difficultyManager - 难度管理器实例
     */
    updateDifficultyManager(difficultyManager) {
        this.difficultyManager = difficultyManager;
    }

    /**
     * 获取当前时间配置
     * @returns {Object} 当前难度的时间配置
     */
    getTimeConfig() {
        if (!this.difficultyManager) {
            console.error('难度管理器未初始化');
            return {
                includeHours: true,
                includeMinutes: true,
                includeSeconds: true,
                minuteInterval: 60,
                secondsFixed: 0
            };
        }
        return this.difficultyManager.getTimeConfig();
    }

    /**
     * 生成随机时间
     * @returns {Object} 包含hours, minutes, seconds的时间对象
     */
    generateTime() {
        let time;
        let attempts = 0;
        const maxAttempts = 50; // 防止无限循环

        do {
            time = {
                hours: this.generateHour(),
                minutes: this.generateMinute(),
                seconds: this.generateSecond()
            };
            attempts++;
        } while (this.isSameTime(time, this.lastGeneratedTime) && attempts < maxAttempts);

        // 记录这次生成的时间
        this.lastGeneratedTime = { ...time };

        return time;
    }

    /**
     * 比较两个时间是否相同
     * @param {Object} time1 - 第一个时间对象
     * @param {Object} time2 - 第二个时间对象
     * @returns {boolean} 时间是否相同
     */
    isSameTime(time1, time2) {
        if (!time1 || !time2) {
            return false;
        }
        return time1.hours === time2.hours &&
               time1.minutes === time2.minutes &&
               time1.seconds === time2.seconds;
    }

    /**
     * 生成随机小时 (1-12)
     * @returns {number} 小时数
     */
    generateHour() {
        return Math.floor(Math.random() * 12) + 1;
    }

    /**
     * 根据难度配置生成分钟
     * @returns {number} 分钟数
     */
    generateMinute() {
        const config = this.getTimeConfig();
        
        if (!config.includeMinutes) {
            return 0;
        }

        const interval = config.minuteInterval;
        
        switch (interval) {
            case 60:
                // 1星：整点时间，分钟固定为0
                return 0;
            case 30:
                // 2星：只能是0或30分钟
                return Math.random() < 0.5 ? 0 : 30;
            case 5:
                // 3星：5分钟的倍数: 0, 5, 10, 15, ..., 55
                return Math.floor(Math.random() * 12) * 5;
            case 1:
            default:
                // 4星和5星：任意分钟: 0-59
                return Math.floor(Math.random() * 60);
        }
    }

    /**
     * 根据难度配置生成秒钟
     * @returns {number} 秒数
     */
    generateSecond() {
        const config = this.getTimeConfig();
        
        if (!config.includeSeconds) {
            return 0;
        }
        
        // 检查是否有固定的秒数设置（1-4星固定为0，5星随机）
        if (config.secondsFixed !== undefined && config.secondsFixed !== null) {
            return config.secondsFixed;
        }
        
        // 5星难度：随机生成0-59秒
        return Math.floor(Math.random() * 60);
    }

    /**
     * 格式化时间为字符串
     * @param {Object} time - 时间对象
     * @returns {string} 格式化的时间字符串 (HH:MM:SS)
     */
    formatTime(time) {
        const hours = time.hours.toString().padStart(2, '0');
        const minutes = time.minutes.toString().padStart(2, '0');
        const seconds = time.seconds.toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }
}