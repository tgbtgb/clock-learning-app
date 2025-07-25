/**
 * 答案验证器类
 * 负责验证用户输入的时间答案
 */
class AnswerValidator {
    constructor() {
        this.timePattern = /^([0-1]?[0-9]|2[0-3]):([0-5]?[0-9]):([0-5]?[0-9])$/;
    }

    /**
     * 验证用户答案
     * @param {string} userInput - 用户输入的时间字符串
     * @param {Object} correctTime - 正确的时间对象
     * @returns {Object} 验证结果对象
     */
    validateAnswer(userInput, correctTime) {
        const result = {
            isCorrect: false,
            userTime: null,
            correctTime: correctTime,
            message: ''
        };

        // 解析用户输入
        const parsedTime = this.parseTimeInput(userInput);
        
        if (!parsedTime) {
            result.message = '时间格式不正确，请使用 HH:MM:SS 格式';
            return result;
        }

        result.userTime = parsedTime;

        // 比较时间
        if (this.compareTime(parsedTime, correctTime)) {
            result.isCorrect = true;
            result.message = this.getSuccessMessage();
        } else {
            result.isCorrect = false;
            result.message = '答案不正确，请再试一次';
        }

        return result;
    }

    /**
     * 验证时间对象
     * @param {Object} userTime - 用户输入的时间对象
     * @param {Object} correctTime - 正确的时间对象
     * @returns {Object} 验证结果对象
     */
    validateTimeObject(userTime, correctTime) {
        const result = {
            isCorrect: false,
            userTime: userTime,
            correctTime: correctTime,
            message: ''
        };

        // 比较时间
        if (this.compareTime(userTime, correctTime)) {
            result.isCorrect = true;
            result.message = this.getSuccessMessage();
        } else {
            result.isCorrect = false;
            result.message = '答案不正确，请再试一次';
        }

        return result;
    }

    /**
     * 解析时间输入
     * @param {string} input - 输入的时间字符串
     * @returns {Object|null} 解析后的时间对象或null
     */
    parseTimeInput(input) {
        if (!input || typeof input !== 'string') {
            return null;
        }

        const trimmedInput = input.trim();
        const match = trimmedInput.match(this.timePattern);

        if (!match) {
            return null;
        }

        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const seconds = parseInt(match[3], 10);

        // 验证时间范围
        if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
            return null;
        }

        return {
            hours: hours,
            minutes: minutes,
            seconds: seconds
        };
    }

    /**
     * 比较两个时间对象
     * @param {Object} time1 - 第一个时间对象
     * @param {Object} time2 - 第二个时间对象
     * @returns {boolean} 时间是否相等
     */
    compareTime(time1, time2) {
        return time1.hours === time2.hours &&
               time1.minutes === time2.minutes &&
               time1.seconds === time2.seconds;
    }

    /**
     * 格式化时间为字符串
     * @param {Object} time - 时间对象
     * @returns {string} 格式化的时间字符串
     */
    formatTime(time) {
        const hours = time.hours.toString().padStart(2, '0');
        const minutes = time.minutes.toString().padStart(2, '0');
        const seconds = time.seconds.toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    /**
     * 获取成功消息
     * @returns {string} 随机的成功消息
     */
    getSuccessMessage() {
        const messages = [
            '太棒了！答案正确！',
            '很好！你读对了时间！',
            '正确！继续加油！',
            '优秀！时间读得很准确！',
            '答对了！你很棒！'
        ];
        
        return messages[Math.floor(Math.random() * messages.length)];
    }

    /**
     * 验证输入格式（实时验证）
     * @param {string} input - 输入字符串
     * @returns {Object} 验证结果
     */
    validateInputFormat(input) {
        const result = {
            isValid: false,
            message: '',
            suggestion: ''
        };

        if (!input) {
            result.message = '请输入时间';
            result.suggestion = '格式: HH:MM:SS (例如: 03:30:00)';
            return result;
        }

        if (!this.timePattern.test(input)) {
            result.message = '格式不正确';
            result.suggestion = '请使用 HH:MM:SS 格式';
            return result;
        }

        const parsedTime = this.parseTimeInput(input);
        if (!parsedTime) {
            result.message = '时间范围不正确';
            result.suggestion = '小时: 1-12, 分钟: 0-59, 秒: 0-59';
            return result;
        }

        result.isValid = true;
        result.message = '格式正确';
        return result;
    }
}