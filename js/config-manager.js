/**
 * 配置管理器类
 * 负责管理应用的配置选项，包括时间单位和分钟间隔设置
 */
class ConfigManager {
    constructor() {
        this.defaultConfig = {
            enableHours: true,
            enableMinutes: false,
            enableSeconds: false,
            minuteInterval: 1
        };
        this.currentConfig = { ...this.defaultConfig };
        this.loadConfig();
    }

    /**
     * 获取当前配置
     * @returns {Object} 当前配置对象
     */
    getConfig() {
        return { ...this.currentConfig };
    }

    /**
     * 更新配置
     * @param {Object} newConfig - 新的配置对象
     */
    updateConfig(newConfig) {
        if (this.validateConfig(newConfig)) {
            this.currentConfig = { ...this.currentConfig, ...newConfig };
            this.saveConfig();
            return true;
        }
        return false;
    }

    /**
     * 验证配置的有效性
     * @param {Object} config - 要验证的配置对象
     * @returns {boolean} 配置是否有效
     */
    validateConfig(config) {
        // 至少要启用一个时间单位
        if (!config.enableHours && !config.enableMinutes && !config.enableSeconds) {
            console.warn('至少需要启用一个时间单位，默认启用小时');
            config.enableHours = true;
        }

        // 验证分钟间隔
        if (config.minuteInterval && ![1, 5, 30].includes(config.minuteInterval)) {
            console.warn('无效的分钟间隔，使用默认值1分钟');
            config.minuteInterval = 1;
        }

        return true;
    }

    /**
     * 从本地存储加载配置
     */
    loadConfig() {
        try {
            const savedConfig = localStorage.getItem('clockLearningConfig');
            if (savedConfig) {
                const parsedConfig = JSON.parse(savedConfig);
                this.currentConfig = { ...this.defaultConfig, ...parsedConfig };
                this.validateConfig(this.currentConfig);
            }
        } catch (error) {
            console.error('加载配置失败，使用默认配置:', error);
            this.currentConfig = { ...this.defaultConfig };
        }
    }

    /**
     * 保存配置到本地存储
     */
    saveConfig() {
        try {
            localStorage.setItem('clockLearningConfig', JSON.stringify(this.currentConfig));
        } catch (error) {
            console.error('保存配置失败:', error);
        }
    }

    /**
     * 重置为默认配置
     */
    resetConfig() {
        this.currentConfig = { ...this.defaultConfig };
        this.saveConfig();
    }
}