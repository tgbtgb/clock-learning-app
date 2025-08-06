/**
 * 记录管理器类
 * 负责管理答题历史记录，使用Cookie存储
 */
class RecordManager {
    constructor() {
        this.cookieName = 'clockLearningRecords';
        this.maxRecords = 1000; // 最大记录数量
        this.pageSize = 10; // 默认每页记录数
        this.memoryRecords = []; // 内存备份
        this.storageType = 'cookie'; // 默认存储类型改为cookie
        this.useSessionStorage = false;
        this.useMemoryStorage = false;
        this.indexedDB = null;
        
        // 初始化records为空数组，但会在loadRecordsWithFallback中被覆盖
        this.records = [];
        
        // 尝试加载记录，如果失败则启用备用存储
        try {
            this.loadRecordsWithFallback();
        } catch (error) {
            console.error('初始化记录管理器失败:', error);
            this.records = []; // 确保在错误情况下有一个空数组
            this.enableFallbackStorage();
        }
    }

    /**
     * 保存答题记录
     * @param {Object} record - 答题记录对象
     * @returns {boolean} 保存是否成功
     */
    saveRecord(record) {
        try {
            // 验证记录格式
            if (!this.validateRecord(record)) {
                console.error('记录格式无效:', record);
                return false;
            }

            // 创建完整的记录对象
            const fullRecord = this.createFullRecord(record);
            
            // 添加到记录数组开头（最新记录在前）
            this.records.unshift(fullRecord);
            
            // 限制记录数量
            if (this.records.length > this.maxRecords) {
                this.records = this.records.slice(0, this.maxRecords);
            }
            
            // 根据当前存储类型保存记录
            return this.saveRecordWithFallback(fullRecord);
            
        } catch (error) {
            console.error('保存记录失败:', error);
            return false;
        }
    }

    /**
     * 使用备用方案保存记录
     * @param {Object} record - 记录对象
     * @returns {boolean} 保存是否成功
     */
    saveRecordWithFallback(record) {
        try {
            switch (this.storageType) {
                case 'cookie':
                    return this.saveRecordsToCookie();
                
                case 'localStorage':
                    return this.saveRecordsToLocalStorage();
                
                case 'sessionStorage':
                    return this.saveRecordsToSessionStorage();
                
                case 'indexedDB':
                    // IndexedDB是异步的，先保存到内存，然后异步保存到IndexedDB
                    this.saveRecordToIndexedDB(record);
                    return true; // 立即返回成功，实际保存是异步的
                
                case 'memory':
                    return this.saveRecordsToMemory();
                
                case 'none':
                    console.warn('没有可用的存储方案');
                    return false;
                
                default:
                    // 默认尝试Cookie存储
                    return this.saveRecordsToCookie();
            }
        } catch (error) {
            console.error('使用备用方案保存记录失败:', error);
            
            // 如果cookie失败，尝试localStorage作为备用
            try {
                console.log('Cookie存储失败，尝试localStorage作为备用');
                return this.saveRecordsToLocalStorage();
            } catch (localStorageError) {
                console.error('localStorage备用方案也失败:', localStorageError);
                
                // 最后的备用方案：内存存储
                try {
                    return this.saveRecordsToMemory();
                } catch (memoryError) {
                    console.error('内存存储也失败:', memoryError);
                    return false;
                }
            }
        }
    }

    /**
     * 保存记录到localStorage
     * @returns {boolean} 保存是否成功
     */
    saveRecordsToLocalStorage() {
        try {
            if (!localStorage) {
                console.error('localStorage不可用');
                return false;
            }

            const recordsToSave = this.records.map(record => ({
                ...record,
                timestamp: record.timestamp.toISOString()
            }));
            
            const jsonString = JSON.stringify(recordsToSave);
            localStorage.setItem(this.cookieName, jsonString);
            
            console.log(`成功保存 ${this.records.length} 条记录到localStorage`);
            return true;
        } catch (error) {
            console.error('保存记录到localStorage失败:', error);
            
            // 如果localStorage失败，尝试sessionStorage
            return this.saveRecordsToSessionStorage();
        }
    }

    /**
     * 保存记录到sessionStorage
     * @returns {boolean} 保存是否成功
     */
    saveRecordsToSessionStorage() {
        try {
            if (!sessionStorage) {
                console.error('sessionStorage不可用');
                return false;
            }

            const recordsToSave = this.records.map(record => ({
                ...record,
                timestamp: record.timestamp.toISOString()
            }));
            
            const jsonString = JSON.stringify(recordsToSave);
            sessionStorage.setItem(this.cookieName, jsonString);
            
            console.log(`成功保存 ${this.records.length} 条记录到sessionStorage`);
            return true;
        } catch (error) {
            console.error('保存记录到sessionStorage失败:', error);
            
            // 如果sessionStorage失败，尝试内存存储
            return this.saveRecordsToMemory();
        }
    }

    /**
     * 保存记录到内存
     * @returns {boolean} 保存是否成功
     */
    saveRecordsToMemory() {
        try {
            // 内存存储只是简单地保持records数组
            this.memoryRecords = [...this.records];
            console.log(`成功保存 ${this.records.length} 条记录到内存`);
            return true;
        } catch (error) {
            console.error('保存记录到内存失败:', error);
            return false;
        }
    }

    /**
     * 从备用存储加载记录
     */
    loadRecordsWithFallback() {
        try {
            // 首先尝试从Cookie加载
            this.loadRecords();
            
            // 如果Cookie中没有记录，尝试其他存储方式
            if (this.records.length === 0) {
                this.tryLoadFromAlternativeStorage();
            }
        } catch (error) {
            console.error('从备用存储加载记录失败:', error);
            this.records = [];
        }
    }

    /**
     * 尝试从其他存储方式加载记录
     */
    tryLoadFromAlternativeStorage() {
        try {
            // 尝试从sessionStorage加载
            if (sessionStorage && sessionStorage.getItem('sessionClockLearningRecords')) {
                this.loadRecordsFromSessionStorage();
                return;
            }
            
            // 尝试从内存加载（页面刷新后会丢失）
            if (this.memoryRecords && this.memoryRecords.length > 0) {
                this.records = [...this.memoryRecords];
                console.log(`从内存加载了 ${this.records.length} 条记录`);
                return;
            }
            
            console.log('没有找到其他存储中的记录');
        } catch (error) {
            console.error('从其他存储加载记录失败:', error);
        }
    }

    /**
     * 从sessionStorage加载记录
     */
    loadRecordsFromSessionStorage() {
        try {
            const sessionData = sessionStorage.getItem('sessionClockLearningRecords');
            if (sessionData) {
                const parsedRecords = JSON.parse(sessionData);
                if (Array.isArray(parsedRecords)) {
                    this.records = parsedRecords.map(record => ({
                        ...record,
                        timestamp: new Date(record.timestamp)
                    })).filter(record => this.validateRecord(record));
                    
                    console.log(`从sessionStorage加载了 ${this.records.length} 条记录`);
                }
            }
        } catch (error) {
            console.error('从sessionStorage加载记录失败:', error);
        }
    }

    /**
     * 获取记录（分页）
     * @param {number} page - 页码（从1开始）
     * @param {number} pageSize - 每页记录数（可选）
     * @returns {Object} 分页记录结果
     */
    getRecords(page = 1, pageSize = null) {
        try {
            const actualPageSize = pageSize || this.pageSize;
            const startIndex = (page - 1) * actualPageSize;
            const endIndex = startIndex + actualPageSize;
            
            const paginatedRecords = this.records.slice(startIndex, endIndex);
            
            return {
                records: paginatedRecords,
                currentPage: page,
                pageSize: actualPageSize,
                totalRecords: this.records.length,
                totalPages: Math.ceil(this.records.length / actualPageSize),
                hasNextPage: endIndex < this.records.length,
                hasPreviousPage: page > 1
            };
            
        } catch (error) {
            console.error('获取记录失败:', error);
            return {
                records: [],
                currentPage: 1,
                pageSize: this.pageSize,
                totalRecords: 0,
                totalPages: 0,
                hasNextPage: false,
                hasPreviousPage: false
            };
        }
    }

    /**
     * 获取记录总数
     * @returns {number} 记录总数
     */
    getTotalRecords() {
        return this.records.length;
    }

    /**
     * 清除所有记录
     * @returns {boolean} 清除是否成功
     */
    clearRecords() {
        try {
            this.records = [];
            return this.saveRecordsToCookie();
        } catch (error) {
            console.error('清除记录失败:', error);
            return false;
        }
    }

    /**
     * 筛选记录
     * @param {Object} criteria - 筛选条件
     * @returns {Array} 筛选后的记录数组
     */
    filterRecords(criteria) {
        try {
            let filteredRecords = [...this.records];
            
            // 按正确性筛选
            if (criteria.isCorrect !== undefined && criteria.isCorrect !== null) {
                filteredRecords = filteredRecords.filter(record => 
                    record.isCorrect === criteria.isCorrect
                );
            }
            
            // 按难度筛选
            if (criteria.difficulty !== undefined && criteria.difficulty !== null) {
                filteredRecords = filteredRecords.filter(record => 
                    record.difficulty === criteria.difficulty
                );
            }
            
            // 按时间范围筛选
            if (criteria.dateFrom) {
                const fromDate = new Date(criteria.dateFrom);
                filteredRecords = filteredRecords.filter(record => 
                    new Date(record.timestamp) >= fromDate
                );
            }
            
            if (criteria.dateTo) {
                const toDate = new Date(criteria.dateTo);
                // 设置为当天结束时间
                toDate.setHours(23, 59, 59, 999);
                filteredRecords = filteredRecords.filter(record => 
                    new Date(record.timestamp) <= toDate
                );
            }
            
            // 按耗时范围筛选
            if (criteria.minTimeSpent !== undefined && criteria.minTimeSpent !== null) {
                filteredRecords = filteredRecords.filter(record => 
                    record.timeSpent >= criteria.minTimeSpent
                );
            }
            
            if (criteria.maxTimeSpent !== undefined && criteria.maxTimeSpent !== null) {
                filteredRecords = filteredRecords.filter(record => 
                    record.timeSpent <= criteria.maxTimeSpent
                );
            }
            
            return filteredRecords;
            
        } catch (error) {
            console.error('筛选记录失败:', error);
            return [];
        }
    }

    /**
     * 搜索记录
     * @param {string} searchTerm - 搜索关键词
     * @returns {Array} 搜索结果
     */
    searchRecords(searchTerm) {
        try {
            if (!searchTerm || typeof searchTerm !== 'string') {
                return this.records;
            }
            
            const term = searchTerm.toLowerCase().trim();
            
            return this.records.filter(record => {
                // 搜索难度名称
                if (record.difficultyName && record.difficultyName.toLowerCase().includes(term)) {
                    return true;
                }
                
                // 搜索用户答案
                const userAnswerStr = this.formatTimeForSearch(record.userAnswer);
                if (userAnswerStr.includes(term)) {
                    return true;
                }
                
                // 搜索正确答案
                const correctAnswerStr = this.formatTimeForSearch(record.correctAnswer);
                if (correctAnswerStr.includes(term)) {
                    return true;
                }
                
                // 搜索正确性状态
                const statusStr = record.isCorrect ? '正确' : '错误';
                if (statusStr.includes(term)) {
                    return true;
                }
                
                return false;
            });
            
        } catch (error) {
            console.error('搜索记录失败:', error);
            return [];
        }
    }

    /**
     * 获取统计信息
     * @returns {Object} 统计信息对象
     */
    getStatistics() {
        try {
            const total = this.records.length;
            
            if (total === 0) {
                return {
                    totalRecords: 0,
                    correctCount: 0,
                    incorrectCount: 0,
                    correctRate: 0,
                    averageTimeSpent: 0,
                    difficultyStats: {},
                    recentActivity: []
                };
            }
            
            const correctCount = this.records.filter(r => r.isCorrect).length;
            const incorrectCount = total - correctCount;
            const correctRate = Math.round((correctCount / total) * 100);
            
            // 计算平均耗时
            const totalTimeSpent = this.records.reduce((sum, r) => sum + r.timeSpent, 0);
            const averageTimeSpent = Math.round(totalTimeSpent / total);
            
            // 按难度统计
            const difficultyStats = {};
            for (let i = 1; i <= 5; i++) {
                const difficultyRecords = this.records.filter(r => r.difficulty === i);
                const difficultyCorrect = difficultyRecords.filter(r => r.isCorrect).length;
                
                difficultyStats[i] = {
                    total: difficultyRecords.length,
                    correct: difficultyCorrect,
                    incorrect: difficultyRecords.length - difficultyCorrect,
                    correctRate: difficultyRecords.length > 0 ? 
                        Math.round((difficultyCorrect / difficultyRecords.length) * 100) : 0
                };
            }
            
            // 最近活动（最近10条记录）
            const recentActivity = this.records.slice(0, 10).map(record => ({
                timestamp: record.timestamp,
                isCorrect: record.isCorrect,
                difficulty: record.difficulty,
                timeSpent: record.timeSpent
            }));
            
            return {
                totalRecords: total,
                correctCount,
                incorrectCount,
                correctRate,
                averageTimeSpent,
                difficultyStats,
                recentActivity
            };
            
        } catch (error) {
            console.error('获取统计信息失败:', error);
            return {
                totalRecords: 0,
                correctCount: 0,
                incorrectCount: 0,
                correctRate: 0,
                averageTimeSpent: 0,
                difficultyStats: {},
                recentActivity: []
            };
        }
    }

    /**
     * 验证记录格式
     * @param {Object} record - 要验证的记录
     * @returns {boolean} 记录是否有效
     */
    validateRecord(record) {
        if (!record || typeof record !== 'object') {
            return false;
        }
        
        // 检查必需字段
        const requiredFields = ['userAnswer', 'correctAnswer', 'isCorrect', 'timeSpent', 'difficulty'];
        
        for (const field of requiredFields) {
            if (!(field in record)) {
                console.error(`记录缺少必需字段: ${field}`);
                return false;
            }
        }
        
        // 验证时间对象格式
        if (!this.validateTimeObject(record.userAnswer) || !this.validateTimeObject(record.correctAnswer)) {
            console.error('时间对象格式无效');
            return false;
        }
        
        // 验证其他字段类型
        if (typeof record.isCorrect !== 'boolean') {
            console.error('isCorrect字段必须是布尔值');
            return false;
        }
        
        if (typeof record.timeSpent !== 'number' || record.timeSpent < 0) {
            console.error('timeSpent字段必须是非负数');
            return false;
        }
        
        if (typeof record.difficulty !== 'number' || record.difficulty < 1 || record.difficulty > 5) {
            console.error('difficulty字段必须是1-5的数字');
            return false;
        }
        
        return true;
    }

    /**
     * 验证时间对象格式
     * @param {Object} timeObj - 时间对象
     * @returns {boolean} 时间对象是否有效
     */
    validateTimeObject(timeObj) {
        if (!timeObj || typeof timeObj !== 'object') {
            return false;
        }
        
        const { hours, minutes, seconds } = timeObj;
        
        return (
            typeof hours === 'number' && hours >= 1 && hours <= 12 &&
            typeof minutes === 'number' && minutes >= 0 && minutes <= 59 &&
            typeof seconds === 'number' && seconds >= 0 && seconds <= 59
        );
    }

    /**
     * 创建完整的记录对象
     * @param {Object} record - 基础记录对象
     * @returns {Object} 完整的记录对象
     */
    createFullRecord(record) {
        const now = new Date();
        
        return {
            id: this.generateRecordId(),
            timestamp: record.timestamp || now,
            userAnswer: { ...record.userAnswer },
            correctAnswer: { ...record.correctAnswer },
            isCorrect: record.isCorrect,
            timeSpent: record.timeSpent,
            difficulty: record.difficulty,
            difficultyName: record.difficultyName || this.getDifficultyName(record.difficulty)
        };
    }

    /**
     * 生成记录ID
     * @returns {string} 唯一的记录ID
     */
    generateRecordId() {
        return `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 获取难度名称
     * @param {number} difficulty - 难度等级
     * @returns {string} 难度名称
     */
    getDifficultyName(difficulty) {
        const difficultyNames = {
            1: '1星 - 整点时间',
            2: '2星 - 30分钟间隔',
            3: '3星 - 5分钟间隔',
            4: '4星 - 1分钟间隔',
            5: '5星 - 包含秒数'
        };
        
        return difficultyNames[difficulty] || `${difficulty}星`;
    }

    /**
     * 格式化时间用于搜索
     * @param {Object} timeObj - 时间对象
     * @returns {string} 格式化的时间字符串
     */
    formatTimeForSearch(timeObj) {
        if (!timeObj) return '';
        
        const hours = timeObj.hours.toString().padStart(2, '0');
        const minutes = timeObj.minutes.toString().padStart(2, '0');
        const seconds = timeObj.seconds.toString().padStart(2, '0');
        
        return `${hours}:${minutes}:${seconds}`;
    }

    /**
     * 从Cookie加载记录
     */
    loadRecords() {
        try {
            const cookieValue = this.getCookie(this.cookieName);
            
            if (cookieValue) {
                const decodedValue = decodeURIComponent(cookieValue);
                const parsedRecords = JSON.parse(decodedValue);
                
                if (Array.isArray(parsedRecords)) {
                    // 验证并转换时间戳
                    this.records = parsedRecords.map(record => ({
                        ...record,
                        timestamp: new Date(record.timestamp)
                    })).filter(record => this.validateRecord(record));
                    
                    console.log(`从Cookie成功加载 ${this.records.length} 条记录`);
                } else {
                    console.warn('Cookie中的记录格式无效');
                    this.records = [];
                }
            } else {
                this.records = [];
                console.log('未找到历史记录Cookie');
            }
            
        } catch (error) {
            console.error('从Cookie加载记录失败:', error);
            this.records = [];
        }
    }

    /**
     * 保存记录到Cookie
     * @returns {boolean} 保存是否成功
     */
    saveRecordsToCookie() {
        try {
            // 检查Cookie是否可用
            if (!this.isCookieSupported()) {
                console.warn('浏览器不支持Cookie，记录将不会被保存');
                this.handleStorageError('Cookie不支持');
                return false;
            }

            const recordsToSave = this.records.map(record => {
                try {
                    return {
                        ...record,
                        timestamp: record.timestamp.toISOString()
                    };
                } catch (dateError) {
                    console.warn('记录时间戳转换失败:', record.id, dateError);
                    return {
                        ...record,
                        timestamp: new Date().toISOString() // 使用当前时间作为备用
                    };
                }
            });
            
            let jsonString;
            try {
                jsonString = JSON.stringify(recordsToSave);
            } catch (jsonError) {
                console.error('记录序列化失败:', jsonError);
                this.handleStorageError('数据序列化失败');
                return false;
            }
            
            const encodedValue = encodeURIComponent(jsonString);
            
            // 检查Cookie大小限制（大约4KB）
            if (encodedValue.length > 4000) {
                console.warn('记录数据过大，尝试压缩数据');
                const compressionResult = this.compressRecordsForStorage();
                
                if (!compressionResult.success) {
                    console.error('数据压缩失败，无法保存记录');
                    this.handleStorageError('数据过大且压缩失败');
                    return false;
                }
                
                // 使用压缩后的数据重新尝试
                return this.saveRecordsToCookie();
            }
            
            // 设置Cookie，有效期30天
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 30);
            
            try {
                this.setCookie(this.cookieName, encodedValue, expirationDate);
            } catch (cookieError) {
                console.error('设置Cookie失败:', cookieError);
                this.handleStorageError('Cookie写入失败');
                return false;
            }
            
            // 验证保存是否成功
            const savedValue = this.getCookie(this.cookieName);
            if (!savedValue || savedValue !== encodedValue) {
                console.error('Cookie保存验证失败');
                this.handleStorageError('Cookie保存验证失败');
                return false;
            }
            
            console.log(`✅ 成功保存 ${this.records.length} 条记录到Cookie`);
            console.log('🍪 Cookie名称:', this.cookieName);
            console.log('🍪 保存的数据长度:', encodedValue.length);
            return true;
            
        } catch (error) {
            console.error('保存记录到Cookie时发生严重错误:', error);
            this.handleStorageError('存储系统异常');
            return false;
        }
    }

    /**
     * 检查Cookie是否支持
     * @returns {boolean} 是否支持Cookie
     */
    isCookieSupported() {
        try {
            // 检查是否在浏览器环境中
            if (typeof document === 'undefined' || typeof document.cookie === 'undefined') {
                return false;
            }
            
            const testKey = 'cookieTest';
            const testValue = 'test';
            
            // 设置测试Cookie
            document.cookie = `${testKey}=${testValue}; path=/`;
            
            // 检查Cookie是否设置成功
            const cookies = document.cookie.split(';');
            const testCookie = cookies.find(cookie => cookie.trim().startsWith(testKey + '='));
            const supported = !!testCookie;
            
            // 清理测试Cookie
            document.cookie = `${testKey}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
            
            return supported;
        } catch (error) {
            console.warn('Cookie支持检测失败:', error);
            return false;
        }
    }

    /**
     * 压缩记录数据以适应存储限制
     * @returns {Object} 压缩结果
     */
    compressRecordsForStorage() {
        try {
            const originalLength = this.records.length;
            
            // 策略1: 删除最旧的记录
            while (this.records.length > 0) {
                this.records.pop(); // 删除最后一个（最旧的）记录
                
                const testRecords = this.records.map(record => ({
                    ...record,
                    timestamp: record.timestamp.toISOString()
                }));
                
                const testJsonString = JSON.stringify(testRecords);
                const testEncodedValue = encodeURIComponent(testJsonString);
                
                if (testEncodedValue.length <= 4000) {
                    console.log(`通过删除旧记录压缩成功，从 ${originalLength} 条减少到 ${this.records.length} 条`);
                    return { success: true, method: 'deleteOld', removedCount: originalLength - this.records.length };
                }
                
                // 如果记录数量已经很少但仍然过大，说明单条记录太大
                if (this.records.length < 10) {
                    console.warn('即使只保留少量记录仍然过大，可能存在异常数据');
                    break;
                }
            }
            
            // 策略2: 如果删除旧记录仍然不够，尝试简化记录结构
            if (this.records.length > 0) {
                const simplifiedRecords = this.records.map(record => ({
                    id: record.id,
                    timestamp: record.timestamp.toISOString(),
                    isCorrect: record.isCorrect,
                    timeSpent: record.timeSpent,
                    difficulty: record.difficulty
                    // 移除详细的答案信息以节省空间
                }));
                
                const simplifiedJsonString = JSON.stringify(simplifiedRecords);
                const simplifiedEncodedValue = encodeURIComponent(simplifiedJsonString);
                
                if (simplifiedEncodedValue.length <= 4000) {
                    // 更新记录为简化版本
                    this.records = simplifiedRecords.map(record => ({
                        ...record,
                        timestamp: new Date(record.timestamp),
                        userAnswer: { hours: 0, minutes: 0, seconds: 0 }, // 占位符
                        correctAnswer: { hours: 0, minutes: 0, seconds: 0 }, // 占位符
                        difficultyName: this.getDifficultyName(record.difficulty)
                    }));
                    
                    console.log('通过简化记录结构压缩成功');
                    return { success: true, method: 'simplify', removedCount: originalLength - this.records.length };
                }
            }
            
            // 策略3: 如果以上都不行，清空所有记录
            console.warn('无法通过压缩解决存储问题，清空所有记录');
            this.records = [];
            return { success: true, method: 'clearAll', removedCount: originalLength };
            
        } catch (error) {
            console.error('压缩记录数据失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 处理存储错误
     * @param {string} errorType - 错误类型
     */
    handleStorageError(errorType) {
        console.warn('记录存储出现问题:', errorType);
        
        // 防止无限循环
        if (this.isHandlingStorageError) {
            console.warn('正在处理存储错误，跳过重复处理');
            return;
        }
        
        this.isHandlingStorageError = true;
        
        try {
            // 记录错误统计
            this.recordStorageError(errorType);
            
            // 显示用户友好的错误提示
            this.showStorageErrorMessage(errorType);
            
            // 尝试启用备用存储方案
            this.enableFallbackStorage();
            
            // 触发存储错误事件
            this.dispatchStorageErrorEvent(errorType);
            
            // 尝试自动恢复（延迟执行）
            setTimeout(() => {
                this.attemptStorageRecovery(errorType);
            }, 5000);
        } finally {
            // 重置标志
            setTimeout(() => {
                this.isHandlingStorageError = false;
            }, 1000);
        }
    }

    /**
     * 显示存储错误消息
     * @param {string} errorType - 错误类型
     */
    showStorageErrorMessage(errorType) {
        try {
            let errorElement = document.getElementById('storage-error');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.id = 'storage-error';
                errorElement.className = 'error-message storage-error';
                
                const recordContainer = document.querySelector('.record-section') || 
                                       document.querySelector('.main-container');
                if (recordContainer) {
                    recordContainer.appendChild(errorElement);
                }
            }
            
            const errorMessages = {
                'Cookie不支持': '浏览器不支持Cookie，答题记录将无法保存',
                '数据序列化失败': '记录数据格式异常，无法保存',
                '数据过大且压缩失败': '记录数据过多，请手动清理历史记录',
                'Cookie写入失败': 'Cookie写入失败，可能是浏览器限制',
                'Cookie保存验证失败': 'Cookie保存验证失败，数据可能未正确保存',
                '存储系统异常': '存储系统出现异常，记录功能暂时不可用'
            };
            
            const message = errorMessages[errorType] || `存储错误: ${errorType}`;
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // 10秒后自动隐藏
            setTimeout(() => {
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
            }, 10000);
        } catch (error) {
            console.error('显示存储错误消息失败:', error);
        }
    }

    /**
     * 启用备用存储方案
     */
    enableFallbackStorage() {
        try {
            // 策略1: 尝试使用sessionStorage作为备用
            if (this.trySessionStorage()) {
                console.log('启用sessionStorage作为备用存储');
                this.storageType = 'sessionStorage';
                this.showFallbackStorageMessage('使用会话存储，关闭浏览器后记录将丢失');
                return;
            }
            
            // 策略2: 尝试使用localStorage（可能之前失败是临时的）
            if (this.tryLocalStorage()) {
                console.log('localStorage已恢复可用');
                this.storageType = 'localStorage';
                this.showFallbackStorageMessage('存储功能已恢复正常');
                return;
            }
            
            // 策略3: 使用IndexedDB（如果可用）
            if (this.tryIndexedDB()) {
                console.log('启用IndexedDB作为备用存储');
                this.storageType = 'indexedDB';
                this.showFallbackStorageMessage('使用高级存储，功能正常');
                return;
            }
            
            // 策略4: 使用内存存储
            console.log('启用内存存储作为最后备用方案');
            this.storageType = 'memory';
            this.useMemoryStorage = true;
            this.memoryRecords = [...this.records]; // 备份当前记录到内存
            this.showFallbackStorageMessage('使用临时存储，刷新页面后记录将丢失');
            
        } catch (error) {
            console.error('启用备用存储失败:', error);
            this.storageType = 'none';
            this.showStorageCompletelyFailedMessage();
        }
    }

    /**
     * 显示存储完全失败的消息
     */
    showStorageCompletelyFailedMessage() {
        try {
            let errorElement = document.getElementById('storage-complete-failure');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.id = 'storage-complete-failure';
                errorElement.className = 'error-message storage-critical-error';
                
                const recordContainer = document.querySelector('.record-section') || 
                                       document.querySelector('.main-container');
                if (recordContainer) {
                    recordContainer.appendChild(errorElement);
                }
            }
            
            errorElement.innerHTML = `
                <div class="critical-error-content">
                    <span class="error-icon">🚫</span>
                    <h4>存储功能完全不可用</h4>
                    <p>所有存储方案都失败，答题记录将无法保存</p>
                    <div class="error-actions">
                        <button class="export-session-btn" onclick="this.dispatchEvent(new CustomEvent('exportSession'))">
                            导出当前会话记录
                        </button>
                        <button class="retry-storage-btn" onclick="this.dispatchEvent(new CustomEvent('retryStorage'))">
                            重试存储功能
                        </button>
                    </div>
                    <p class="error-hint">您仍然可以正常练习，但记录不会被保存</p>
                </div>
            `;
            errorElement.style.display = 'block';
            
            // 添加事件监听
            const errorContent = errorElement.querySelector('.critical-error-content');
            if (errorContent) {
                errorContent.addEventListener('exportSession', () => {
                    this.exportCurrentSession();
                });
                
                errorContent.addEventListener('retryStorage', () => {
                    this.enableFallbackStorage();
                });
            }
            
        } catch (error) {
            console.error('显示存储完全失败消息失败:', error);
        }
    }

    /**
     * 导出当前会话记录
     */
    exportCurrentSession() {
        try {
            if (this.records.length === 0) {
                alert('当前没有记录可以导出');
                return;
            }
            
            const exportData = {
                exportTime: new Date().toISOString(),
                recordCount: this.records.length,
                records: this.records.map(record => ({
                    ...record,
                    timestamp: record.timestamp.toISOString()
                }))
            };
            
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `clock-learning-records-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('会话记录已导出');
            alert(`已导出 ${this.records.length} 条记录到文件`);
            
        } catch (error) {
            console.error('导出会话记录失败:', error);
            alert('导出失败，请稍后重试');
        }
    }

    /**
     * 显示备用存储消息
     * @param {string} message - 消息内容
     */
    showFallbackStorageMessage(message) {
        try {
            let messageElement = document.getElementById('fallback-storage-message');
            if (!messageElement) {
                messageElement = document.createElement('div');
                messageElement.id = 'fallback-storage-message';
                messageElement.className = 'warning-message storage-fallback';
                
                const recordContainer = document.querySelector('.record-section') || 
                                       document.querySelector('.main-container');
                if (recordContainer) {
                    recordContainer.appendChild(messageElement);
                }
            }
            
            messageElement.innerHTML = `
                <div class="warning-content">
                    <span class="warning-icon">⚠️</span>
                    <span class="warning-text">${message}</span>
                    <button class="warning-close" onclick="this.parentElement.parentElement.style.display='none'">×</button>
                </div>
            `;
            messageElement.style.display = 'block';
            
            // 10秒后自动隐藏
            setTimeout(() => {
                if (messageElement) {
                    messageElement.style.display = 'none';
                }
            }, 10000);
        } catch (error) {
            console.error('显示备用存储消息失败:', error);
        }
    }

    /**
     * 尝试使用sessionStorage
     * @returns {boolean} 是否成功
     */
    trySessionStorage() {
        try {
            if (typeof Storage === 'undefined' || !sessionStorage) {
                return false;
            }
            
            // 测试写入和读取
            const testKey = 'sessionStorageTest';
            const testValue = 'test';
            sessionStorage.setItem(testKey, testValue);
            const readValue = sessionStorage.getItem(testKey);
            sessionStorage.removeItem(testKey);
            
            if (readValue === testValue) {
                this.useSessionStorage = true;
                this.cookieName = 'sessionClockLearningRecords';
                return true;
            }
            
            return false;
        } catch (error) {
            console.warn('sessionStorage测试失败:', error);
            return false;
        }
    }

    /**
     * 尝试使用localStorage
     * @returns {boolean} 是否成功
     */
    tryLocalStorage() {
        try {
            if (typeof Storage === 'undefined' || !localStorage) {
                return false;
            }
            
            // 测试写入和读取
            const testKey = 'localStorageTest';
            const testValue = 'test';
            localStorage.setItem(testKey, testValue);
            const readValue = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            
            if (readValue === testValue) {
                this.useSessionStorage = false;
                this.useMemoryStorage = false;
                return true;
            }
            
            return false;
        } catch (error) {
            console.warn('localStorage测试失败:', error);
            return false;
        }
    }

    /**
     * 尝试使用IndexedDB
     * @returns {boolean} 是否可用
     */
    tryIndexedDB() {
        try {
            if (!window.indexedDB) {
                return false;
            }
            
            // IndexedDB是异步的，这里只检查是否可用
            // 实际使用需要异步初始化
            this.initializeIndexedDB();
            return true;
        } catch (error) {
            console.warn('IndexedDB不可用:', error);
            return false;
        }
    }

    /**
     * 初始化IndexedDB
     */
    initializeIndexedDB() {
        try {
            const request = indexedDB.open('ClockLearningDB', 1);
            
            request.onerror = (event) => {
                console.error('IndexedDB打开失败:', event);
                this.storageType = 'memory';
                this.useMemoryStorage = true;
            };
            
            request.onsuccess = (event) => {
                this.indexedDB = event.target.result;
                console.log('IndexedDB初始化成功');
                
                // 尝试从IndexedDB加载现有记录
                this.loadRecordsFromIndexedDB();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 创建对象存储
                if (!db.objectStoreNames.contains('records')) {
                    const objectStore = db.createObjectStore('records', { keyPath: 'id' });
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                    objectStore.createIndex('difficulty', 'difficulty', { unique: false });
                }
            };
        } catch (error) {
            console.error('初始化IndexedDB失败:', error);
        }
    }

    /**
     * 从IndexedDB加载记录
     */
    loadRecordsFromIndexedDB() {
        try {
            if (!this.indexedDB) return;
            
            const transaction = this.indexedDB.transaction(['records'], 'readonly');
            const objectStore = transaction.objectStore('records');
            const request = objectStore.getAll();
            
            request.onsuccess = (event) => {
                const indexedRecords = event.target.result;
                if (indexedRecords && indexedRecords.length > 0) {
                    // 合并IndexedDB中的记录
                    const convertedRecords = indexedRecords.map(record => ({
                        ...record,
                        timestamp: new Date(record.timestamp)
                    }));
                    
                    this.records = [...convertedRecords, ...this.records];
                    console.log(`从IndexedDB加载了 ${indexedRecords.length} 条记录`);
                }
            };
            
            request.onerror = (event) => {
                console.error('从IndexedDB加载记录失败:', event);
            };
        } catch (error) {
            console.error('从IndexedDB加载记录时发生错误:', error);
        }
    }

    /**
     * 保存记录到IndexedDB
     * @param {Object} record - 记录对象
     * @returns {Promise<boolean>} 保存是否成功
     */
    saveRecordToIndexedDB(record) {
        return new Promise((resolve) => {
            try {
                if (!this.indexedDB) {
                    resolve(false);
                    return;
                }
                
                const transaction = this.indexedDB.transaction(['records'], 'readwrite');
                const objectStore = transaction.objectStore('records');
                
                const recordToSave = {
                    ...record,
                    timestamp: record.timestamp.toISOString()
                };
                
                const request = objectStore.add(recordToSave);
                
                request.onsuccess = () => {
                    resolve(true);
                };
                
                request.onerror = (event) => {
                    console.error('保存记录到IndexedDB失败:', event);
                    resolve(false);
                };
            } catch (error) {
                console.error('保存记录到IndexedDB时发生错误:', error);
                resolve(false);
            }
        });
    }

    /**
     * 显示存储完全失败的消息
     */
    showStorageCompletelyFailedMessage() {
        try {
            let messageElement = document.getElementById('storage-failed-message');
            if (!messageElement) {
                messageElement = document.createElement('div');
                messageElement.id = 'storage-failed-message';
                messageElement.className = 'error-message storage-failed';
                
                const recordContainer = document.querySelector('.record-section') || 
                                       document.querySelector('.main-container');
                if (recordContainer) {
                    recordContainer.appendChild(messageElement);
                }
            }
            
            messageElement.innerHTML = `
                <div class="error-content">
                    <span class="error-icon">⚠️</span>
                    <div class="error-text">
                        <strong>存储功能完全不可用</strong>
                        <div>所有答题记录将无法保存，但您仍可以正常练习</div>
                    </div>
                    <div class="error-actions">
                        <button onclick="this.closest('.storage-failed').style.display='none'">
                            我知道了
                        </button>
                        <button onclick="location.reload()">
                            刷新页面重试
                        </button>
                    </div>
                </div>
            `;
            messageElement.style.display = 'block';
        } catch (error) {
            console.error('显示存储完全失败消息失败:', error);
        }
    }

    /**
     * 显示备用存储提示
     */
    showFallbackStorageMessage() {
        try {
            let messageElement = document.getElementById('fallback-storage-message');
            if (!messageElement) {
                messageElement = document.createElement('div');
                messageElement.id = 'fallback-storage-message';
                messageElement.className = 'info-message storage-fallback';
                
                const recordContainer = document.querySelector('.record-section') || 
                                       document.querySelector('.main-container');
                if (recordContainer) {
                    recordContainer.appendChild(messageElement);
                }
            }
            
            messageElement.textContent = '注意：当前使用临时存储，关闭浏览器后记录将丢失';
            messageElement.style.display = 'block';
        } catch (error) {
            console.error('显示备用存储提示失败:', error);
        }
    }

    /**
     * 获取Cookie值
     * @param {string} name - Cookie名称
     * @returns {string|null} Cookie值
     */
    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                const value = c.substring(nameEQ.length, c.length);
                return value;
            }
        }
        
        return null;
    }

    /**
     * 设置Cookie
     * @param {string} name - Cookie名称
     * @param {string} value - Cookie值
     * @param {Date} expires - 过期时间
     */
    setCookie(name, value, expires) {
        let cookieString = `${name}=${value}`;
        
        if (expires) {
            cookieString += `; expires=${expires.toUTCString()}`;
        }
        
        cookieString += '; path=/';
        
        document.cookie = cookieString;
    }

    /**
     * 删除Cookie
     * @param {string} name - Cookie名称
     */
    deleteCookie(name) {
        this.setCookie(name, '', new Date(0));
    }

    /**
     * 导出记录为JSON
     * @returns {string} JSON格式的记录数据
     */
    exportRecords() {
        try {
            return JSON.stringify(this.records, null, 2);
        } catch (error) {
            console.error('导出记录失败:', error);
            return null;
        }
    }

    /**
     * 从JSON导入记录
     * @param {string} jsonData - JSON格式的记录数据
     * @returns {boolean} 导入是否成功
     */
    importRecords(jsonData) {
        try {
            const importedRecords = JSON.parse(jsonData);
            
            if (!Array.isArray(importedRecords)) {
                console.error('导入数据格式无效');
                return false;
            }
            
            // 验证并转换记录
            const validRecords = importedRecords
                .map(record => ({
                    ...record,
                    timestamp: new Date(record.timestamp)
                }))
                .filter(record => this.validateRecord(record));
            
            // 合并记录（去重）
            const existingIds = new Set(this.records.map(r => r.id));
            const newRecords = validRecords.filter(r => !existingIds.has(r.id));
            
            this.records = [...newRecords, ...this.records];
            
            // 限制记录数量
            if (this.records.length > this.maxRecords) {
                this.records = this.records.slice(0, this.maxRecords);
            }
            
            // 保存到Cookie
            const success = this.saveRecordsToCookie();
            
            if (success) {
                console.log(`成功导入 ${newRecords.length} 条新记录`);
            }
            
            return success;
            
        } catch (error) {
            console.error('导入记录失败:', error);
            return false;
        }
    }

    /**
     * 尝试使用localStorage
     * @returns {boolean} 是否成功
     */
    tryLocalStorage() {
        try {
            if (typeof Storage === 'undefined' || !localStorage) {
                return false;
            }
            
            // 测试写入和读取
            const testKey = 'localStorageTest';
            const testValue = 'test';
            localStorage.setItem(testKey, testValue);
            const readValue = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            
            return readValue === testValue;
        } catch (error) {
            console.warn('localStorage测试失败:', error);
            return false;
        }
    }

    /**
     * 尝试使用IndexedDB
     * @returns {boolean} 是否成功
     */
    tryIndexedDB() {
        try {
            if (!window.indexedDB) {
                return false;
            }
            
            // IndexedDB需要异步初始化，这里只是检查可用性
            console.log('IndexedDB可用，但需要异步初始化');
            return true;
        } catch (error) {
            console.warn('IndexedDB测试失败:', error);
            return false;
        }
    }

    /**
     * 记录存储错误统计
     * @param {string} errorType - 错误类型
     */
    recordStorageError(errorType) {
        try {
            // 使用内存存储错误统计，避免循环错误
            if (!this.storageErrorStats) {
                this.storageErrorStats = {};
            }
            
            const errorKey = errorType.replace(/[^a-zA-Z0-9]/g, '_');
            this.storageErrorStats[errorKey] = (this.storageErrorStats[errorKey] || 0) + 1;
            this.storageErrorStats.lastError = {
                type: errorType,
                timestamp: new Date().toISOString(),
                storageType: this.storageType
            };
            
            console.log('存储错误统计:', this.storageErrorStats);
        } catch (error) {
            console.warn('记录存储错误统计失败:', error);
        }
    }

    /**
     * 触发存储错误事件
     * @param {string} errorType - 错误类型
     */
    dispatchStorageErrorEvent(errorType) {
        try {
            const event = new CustomEvent('recordStorageError', {
                detail: {
                    errorType,
                    storageType: this.storageType,
                    recordCount: this.records.length,
                    timestamp: new Date()
                }
            });
            document.dispatchEvent(event);
        } catch (error) {
            console.error('触发存储错误事件失败:', error);
        }
    }

    /**
     * 尝试存储恢复
     * @param {string} originalError - 原始错误类型
     */
    attemptStorageRecovery(originalError) {
        try {
            console.log('尝试恢复存储功能...');
            
            // 如果当前使用的是备用存储，尝试恢复主存储
            if (this.storageType !== 'localStorage') {
                if (this.tryLocalStorage()) {
                    console.log('localStorage已恢复可用');
                    this.storageType = 'localStorage';
                    
                    // 尝试保存当前记录到恢复的存储，但不触发错误处理
                    try {
                        const saveSuccess = this.saveRecordsToCookie();
                        if (saveSuccess) {
                            this.showStorageRecoveryMessage();
                            
                            // 触发恢复事件
                            const event = new CustomEvent('recordStorageRecovered', {
                                detail: {
                                    originalError,
                                    newStorageType: this.storageType,
                                    recoveryTime: new Date()
                                }
                            });
                            document.dispatchEvent(event);
                            
                            return true;
                        }
                    } catch (saveError) {
                        console.warn('恢复存储后保存记录失败:', saveError);
                        // 不触发错误处理，避免无限循环
                    }
                }
            }
            
            return false;
        } catch (error) {
            console.error('尝试存储恢复失败:', error);
            return false;
        }
    }

    /**
     * 显示存储恢复消息
     */
    showStorageRecoveryMessage() {
        try {
            let messageElement = document.getElementById('storage-recovery');
            if (!messageElement) {
                messageElement = document.createElement('div');
                messageElement.id = 'storage-recovery';
                messageElement.className = 'success-message storage-recovery';
                
                const recordContainer = document.querySelector('.record-section') || 
                                       document.querySelector('.main-container');
                if (recordContainer) {
                    recordContainer.appendChild(messageElement);
                }
            }
            
            messageElement.innerHTML = `
                <div class="success-content">
                    <span class="success-icon">✅</span>
                    <span class="success-text">记录存储功能已恢复正常</span>
                    <button class="success-close" onclick="this.parentElement.parentElement.style.display='none'">×</button>
                </div>
            `;
            messageElement.style.display = 'block';
            
            // 5秒后自动隐藏
            setTimeout(() => {
                if (messageElement) {
                    messageElement.style.display = 'none';
                }
            }, 5000);
        } catch (error) {
            console.error('显示存储恢复消息失败:', error);
        }
    }

    /**
     * 获取存储错误统计
     * @returns {Object} 错误统计信息
     */
    getStorageErrorStats() {
        return this.storageErrorStats || {};
    }

    /**
     * 清除存储错误统计
     */
    clearStorageErrorStats() {
        this.storageErrorStats = {};
        console.log('存储错误统计已清除');
    }

    /**
     * 保存记录到IndexedDB（异步）
     * @param {Object} record - 记录对象
     */
    saveRecordToIndexedDB(record) {
        // IndexedDB实现较复杂，这里提供基本框架
        try {
            if (!window.indexedDB) {
                console.warn('IndexedDB不可用');
                return;
            }
            
            // 这里应该实现完整的IndexedDB操作
            console.log('IndexedDB保存功能需要完整实现');
        } catch (error) {
            console.error('IndexedDB保存失败:', error);
        }
    }
}