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
            message: '',
            explanation: '',
            encouragement: ''
        };

        // 解析用户输入
        const parsedTime = this.parseTimeInput(userInput);
        
        if (!parsedTime) {
            result.message = '时间格式不正确，请使用 HH:MM:SS 格式';
            result.encouragement = this.generateEncouragement(false);
            result.explanation = '请检查输入格式，确保使用 HH:MM:SS 的格式，例如：03:30:00';
            return result;
        }

        result.userTime = parsedTime;

        // 比较时间
        if (this.compareTime(parsedTime, correctTime)) {
            result.isCorrect = true;
            result.message = '正确！';
            result.encouragement = this.generateEncouragement(true);
            result.explanation = this.generateExplanation(correctTime, true);
        } else {
            result.isCorrect = false;
            result.message = '答案不正确';
            result.encouragement = this.generateEncouragement(false);
            result.explanation = this.generateExplanation(correctTime, false, parsedTime);
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
            message: '',
            explanation: '',
            encouragement: ''
        };

        // 比较时间
        if (this.compareTime(userTime, correctTime)) {
            result.isCorrect = true;
            result.message = '正确！';
            result.encouragement = this.generateEncouragement(true);
            result.explanation = this.generateExplanation(correctTime, true);
        } else {
            result.isCorrect = false;
            result.message = '答案不正确';
            result.encouragement = this.generateEncouragement(false);
            result.explanation = this.generateExplanation(correctTime, false, userTime);
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
     * 解析分离式输入的时间
     * @param {string|number} hoursInput - 小时输入
     * @param {string|number} minutesInput - 分钟输入
     * @param {string|number} secondsInput - 秒数输入
     * @returns {Object} 解析结果对象
     */
    parseSeparateTimeInputs(hoursInput, minutesInput, secondsInput) {
        const result = {
            isValid: false,
            time: null,
            errors: [],
            warnings: []
        };

        // 解析各个输入值，空值或无效值按0处理
        const hours = this.parseIndividualInput(hoursInput, 'hours');
        const minutes = this.parseIndividualInput(minutesInput, 'minutes');
        const seconds = this.parseIndividualInput(secondsInput, 'seconds');

        // 验证小时范围 (0-12，0会被转换为12)
        if (hours.value < 0 || hours.value > 12) {
            result.errors.push({
                field: 'hours',
                message: '小时必须在0-12范围内',
                value: hours.value
            });
        }

        // 验证分钟范围 (0-59)
        if (minutes.value < 0 || minutes.value > 59) {
            result.errors.push({
                field: 'minutes',
                message: '分钟必须在0-59范围内',
                value: minutes.value
            });
        }

        // 验证秒数范围 (0-59)
        if (seconds.value < 0 || seconds.value > 59) {
            result.errors.push({
                field: 'seconds',
                message: '秒数必须在0-59范围内',
                value: seconds.value
            });
        }

        // 添加警告信息
        if (hours.isEmpty) {
            result.warnings.push({
                field: 'hours',
                message: '小时输入为空，按0处理'
            });
        }

        if (minutes.isEmpty) {
            result.warnings.push({
                field: 'minutes',
                message: '分钟输入为空，按0处理'
            });
        }

        if (seconds.isEmpty) {
            result.warnings.push({
                field: 'seconds',
                message: '秒数输入为空，按0处理'
            });
        }

        // 如果没有错误，创建时间对象
        if (result.errors.length === 0) {
            result.isValid = true;
            // 如果小时为0，转换为12（12小时制）
            const adjustedHours = hours.value === 0 ? 12 : hours.value;
            
            result.time = {
                hours: adjustedHours,
                minutes: minutes.value,
                seconds: seconds.value
            };
        }

        return result;
    }

    /**
     * 解析单个输入值
     * @param {string|number} input - 输入值
     * @param {string} fieldName - 字段名称
     * @returns {Object} 解析结果
     */
    parseIndividualInput(input, fieldName) {
        const result = {
            value: 0,
            isEmpty: false,
            isValid: true,
            originalInput: input
        };

        // 处理空值或undefined
        if (input === null || input === undefined || input === '') {
            result.isEmpty = true;
            return result;
        }

        // 转换为字符串并去除空格
        const stringInput = String(input).trim();
        
        if (stringInput === '') {
            result.isEmpty = true;
            return result;
        }

        // 尝试解析为数字
        const numericValue = parseInt(stringInput, 10);
        
        if (isNaN(numericValue)) {
            result.isValid = false;
            result.value = 0; // 无效输入按0处理
        } else {
            result.value = numericValue;
        }

        return result;
    }

    /**
     * 验证单个输入字段的范围
     * @param {number} value - 输入值
     * @param {string} fieldType - 字段类型 ('hours', 'minutes', 'seconds')
     * @returns {Object} 验证结果
     */
    validateFieldRange(value, fieldType) {
        const result = {
            isValid: true,
            message: '',
            suggestion: ''
        };

        switch (fieldType) {
            case 'hours':
                if (value < 0 || value > 12) {
                    result.isValid = false;
                    result.message = '小时超出范围';
                    result.suggestion = '请输入0-12之间的数字（0表示12点）';
                }
                break;
            
            case 'minutes':
                if (value < 0 || value > 59) {
                    result.isValid = false;
                    result.message = '分钟超出范围';
                    result.suggestion = '请输入0-59之间的数字';
                }
                break;
            
            case 'seconds':
                if (value < 0 || value > 59) {
                    result.isValid = false;
                    result.message = '秒数超出范围';
                    result.suggestion = '请输入0-59之间的数字';
                }
                break;
            
            default:
                result.isValid = false;
                result.message = '未知字段类型';
        }

        return result;
    }

    /**
     * 实时验证输入值
     * @param {string|number} value - 输入值
     * @param {string} fieldType - 字段类型
     * @returns {Object} 验证结果
     */
    validateInputRealtime(value, fieldType) {
        const result = {
            isValid: true,
            hasWarning: false,
            message: '',
            cssClass: ''
        };

        const parsed = this.parseIndividualInput(value, fieldType);
        
        if (!parsed.isValid) {
            result.isValid = false;
            result.message = '请输入有效数字';
            result.cssClass = 'error';
            return result;
        }

        const rangeValidation = this.validateFieldRange(parsed.value, fieldType);
        
        if (!rangeValidation.isValid) {
            result.isValid = false;
            result.message = rangeValidation.message;
            result.cssClass = 'error';
            return result;
        }

        if (parsed.isEmpty) {
            result.hasWarning = true;
            result.message = '空值将按0处理';
            result.cssClass = 'warning';
        } else {
            result.message = '输入有效';
            result.cssClass = 'success';
        }

        return result;
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
     * 生成详细解答过程
     * @param {Object} correctTime - 正确时间对象
     * @param {boolean} isCorrect - 答案是否正确
     * @param {Object} userTime - 用户输入的时间（可选）
     * @returns {string} 解答过程说明
     */
    generateExplanation(correctTime, isCorrect, userTime = null) {
        let explanation = '';
        
        // 基础解答过程
        explanation += `正确答案解析：\n`;
        explanation += `时钟显示的时间是 ${this.formatTime(correctTime)}\n\n`;
        
        // 详细解释各个指针
        explanation += `指针读取方法：\n`;
        
        // 时针解释
        if (correctTime.hours <= 12) {
            const hourAngle = (correctTime.hours % 12) * 30 + (correctTime.minutes * 0.5);
            explanation += `• 时针：指向 ${correctTime.hours} 点`;
            if (correctTime.minutes > 0) {
                explanation += `，并向前移动了 ${correctTime.minutes} 分钟的距离`;
            }
            explanation += `\n`;
        }
        
        // 分针解释
        const minuteAngle = correctTime.minutes * 6;
        explanation += `• 分针：指向 ${correctTime.minutes} 分`;
        if (correctTime.minutes === 0) {
            explanation += `（指向12的位置）`;
        } else if (correctTime.minutes === 15) {
            explanation += `（指向3的位置）`;
        } else if (correctTime.minutes === 30) {
            explanation += `（指向6的位置）`;
        } else if (correctTime.minutes === 45) {
            explanation += `（指向9的位置）`;
        }
        explanation += `\n`;
        
        // 秒针解释（如果有秒数）
        if (correctTime.seconds > 0) {
            explanation += `• 秒针：指向 ${correctTime.seconds} 秒`;
            if (correctTime.seconds === 0) {
                explanation += `（指向12的位置）`;
            } else if (correctTime.seconds === 15) {
                explanation += `（指向3的位置）`;
            } else if (correctTime.seconds === 30) {
                explanation += `（指向6的位置）`;
            } else if (correctTime.seconds === 45) {
                explanation += `（指向9的位置）`;
            }
            explanation += `\n`;
        }
        
        // 如果答案错误，提供对比分析
        if (!isCorrect && userTime) {
            explanation += `\n你的答案分析：\n`;
            explanation += `你输入的时间是 ${this.formatTime(userTime)}\n`;
            
            // 分析各个部分的差异
            if (userTime.hours !== correctTime.hours) {
                explanation += `• 小时部分：你输入了 ${userTime.hours}，正确答案是 ${correctTime.hours}\n`;
                explanation += `  提示：注意观察时针的位置，时针会随着分钟数慢慢移动\n`;
            }
            
            if (userTime.minutes !== correctTime.minutes) {
                explanation += `• 分钟部分：你输入了 ${userTime.minutes}，正确答案是 ${correctTime.minutes}\n`;
                explanation += `  提示：分针指向的数字乘以5就是分钟数\n`;
            }
            
            if (userTime.seconds !== correctTime.seconds) {
                explanation += `• 秒数部分：你输入了 ${userTime.seconds}，正确答案是 ${correctTime.seconds}\n`;
                explanation += `  提示：秒针指向的数字乘以5就是秒数\n`;
            }
        }
        
        // 添加学习提示
        explanation += `\n💡 学习提示：\n`;
        explanation += `• 时针较短较粗，分针较长较细，秒针最细最长\n`;
        explanation += `• 分针和秒针每格代表5分钟/5秒\n`;
        explanation += `• 时针会随着分钟数慢慢移动，不是突然跳跃的\n`;
        
        return explanation;
    }

    /**
     * 根据正确性生成不同的鼓励内容
     * @param {boolean} isCorrect - 答案是否正确
     * @returns {string} 鼓励内容
     */
    generateEncouragement(isCorrect) {
        if (isCorrect) {
            const successMessages = [
                '🎉 太棒了！你完全掌握了时钟的读法！',
                '⭐ 优秀！你的时间读取能力很强！',
                '🏆 正确！你是时钟读取小能手！',
                '👏 很好！继续保持这样的准确度！',
                '🌟 完美！你对时钟的理解很到位！',
                '🎯 精准！你的观察力很敏锐！',
                '💪 厉害！时钟对你来说不是问题！',
                '🚀 出色！你的学习进步很快！'
            ];
            return successMessages[Math.floor(Math.random() * successMessages.length)];
        } else {
            const encouragementMessages = [
                '💪 别灰心！每次练习都是进步的机会！',
                '🌱 没关系，学习需要过程，你正在进步中！',
                '🎯 很接近了！再仔细观察一下指针的位置！',
                '⭐ 不要放弃！多练习几次就会熟练了！',
                '🔍 仔细看看解答过程，下次一定能做对！',
                '📚 学习时钟需要耐心，你已经在正确的路上了！',
                '🌟 每个错误都是学习的机会，继续加油！',
                '🎈 相信自己！多观察多练习，你一定能掌握的！',
                '🏃 继续努力！熟能生巧，你会越来越好的！',
                '🎨 时钟读取是一门艺术，慢慢来，不着急！'
            ];
            return encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
        }
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