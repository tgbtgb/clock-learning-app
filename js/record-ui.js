/**
 * 答题记录界面管理器
 * 负责管理答题记录的显示、筛选、分页和详情展示
 */
class RecordUI {
    constructor(recordManager) {
        this.recordManager = recordManager;
        this.currentPage = 1;
        this.pageSize = 10;
        this.currentFilters = {};
        this.filteredRecords = [];

        
        this.initializeElements();
        this.bindEvents();

        this.loadRecords();
    }

    /**
     * 初始化DOM元素引用
     */
    initializeElements() {
        // 筛选控件
        this.correctnessFilter = document.getElementById('correctness-filter');
        this.difficultyFilter = document.getElementById('difficulty-filter');
        this.dateFromFilter = document.getElementById('date-from-filter');
        this.dateToFilter = document.getElementById('date-to-filter');
        this.clearFiltersBtn = document.getElementById('clear-filters-btn');
        this.clearRecordsBtn = document.getElementById('clear-records-btn');
        
        // 统计信息
        this.totalRecordsCount = document.getElementById('total-records-count');
        this.correctRate = document.getElementById('correct-rate');
        this.averageTime = document.getElementById('average-time');
        
        // 记录列表
        this.recordsContainer = document.getElementById('records-container');
        if (this.recordsContainer) {
            this.noRecordsMessage = this.recordsContainer.querySelector('.no-records-message');
        } else {
            console.warn('records-container 元素未找到，记录显示功能将不可用');
            this.noRecordsMessage = null;
        }
        
        // 分页控件
        this.prevPageBtn = document.getElementById('prev-page-btn');
        this.nextPageBtn = document.getElementById('next-page-btn');
        this.currentPageSpan = document.getElementById('current-page');
        this.totalPagesSpan = document.getElementById('total-pages');
        this.pageSizeSpan = document.getElementById('page-size');
        
        // 模态框功能已移除
    }

    // 用户交互检测方法已移除

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 筛选按钮事件
        if (this.clearFiltersBtn) {
            this.clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }
        
        // 清除记录按钮事件
        if (this.clearRecordsBtn) {
            this.clearRecordsBtn.addEventListener('click', (e) => {
                // 防止与HTML onclick重复执行
                e.stopPropagation();
                this.clearAllRecords();
            });
        }
        
        // 分页按钮事件
        if (this.prevPageBtn) {
            this.prevPageBtn.addEventListener('click', () => this.goToPreviousPage());
        }
        if (this.nextPageBtn) {
            this.nextPageBtn.addEventListener('click', () => this.goToNextPage());
        }
        
        // 模态框事件已移除
        
        // 筛选器变化事件（实时筛选）
        [this.correctnessFilter, this.difficultyFilter, this.dateFromFilter, this.dateToFilter].forEach(filter => {
            if (filter) {
                filter.addEventListener('change', () => {
                    // 延迟应用筛选，避免频繁更新
                    clearTimeout(this.filterTimeout);
                    this.filterTimeout = setTimeout(() => this.applyFilters(), 300);
                });
            }
        });
    }

    /**
     * 加载记录数据
     */
    loadRecords() {
        try {
            // 应用当前筛选条件
            this.filteredRecords = Object.keys(this.currentFilters).length > 0 
                ? this.recordManager.filterRecords(this.currentFilters)
                : this.recordManager.records;
            
            // 重置到第一页
            this.currentPage = 1;
            
            // 更新显示
            this.updateRecordsList();
            this.updateStatistics();
            this.updatePagination();
            
        } catch (error) {
            console.error('加载记录失败:', error);
            this.showError('加载记录失败，请刷新页面重试');
        }
    }

    /**
     * 应用筛选条件
     */
    applyFilters() {
        try {
            this.currentFilters = {};
            
            // 正确性筛选
            if (this.correctnessFilter.value !== '') {
                this.currentFilters.isCorrect = this.correctnessFilter.value === 'true';
            }
            
            // 难度筛选
            if (this.difficultyFilter.value !== '') {
                this.currentFilters.difficulty = parseInt(this.difficultyFilter.value);
            }
            
            // 日期筛选
            if (this.dateFromFilter.value) {
                this.currentFilters.dateFrom = this.dateFromFilter.value;
            }
            
            if (this.dateToFilter.value) {
                this.currentFilters.dateTo = this.dateToFilter.value;
            }
            
            // 重新加载记录
            this.loadRecords();
            
        } catch (error) {
            console.error('应用筛选失败:', error);
            this.showError('筛选失败，请检查筛选条件');
        }
    }

    /**
     * 清除筛选条件
     */
    clearFilters() {
        try {
            // 重置筛选控件
            this.correctnessFilter.value = '';
            this.difficultyFilter.value = '';
            this.dateFromFilter.value = '';
            this.dateToFilter.value = '';
            
            // 清除筛选条件
            this.currentFilters = {};
            
            // 重新加载记录
            this.loadRecords();
            
        } catch (error) {
            console.error('清除筛选失败:', error);
        }
    }

    /**
     * 清除所有记录（带确认弹窗）
     */
    clearAllRecords() {
        try {
            // 检查是否有记录
            if (this.recordManager.records.length === 0) {
                this.showMessage('暂无记录可清除', 'info');
                return;
            }

            // 弹窗确认
            const confirmed = confirm(
                `确定要清除所有答题记录吗？\n\n` +
                `当前共有 ${this.recordManager.records.length} 条记录，此操作不可撤销。\n\n` +
                `点击"确定"继续，点击"取消"返回。`
            );

            if (!confirmed) {
                return;
            }

            // 执行清除
            const success = this.recordManager.clearRecords();
            
            if (success) {
                // 清除成功，重新加载界面
                this.loadRecords();
                this.showMessage('所有记录已清除', 'success');
            } else {
                this.showMessage('清除记录失败，请重试', 'error');
            }
            
        } catch (error) {
            console.error('清除记录失败:', error);
            this.showMessage('清除记录时发生错误', 'error');
        }
    }

    /**
     * 更新记录列表显示
     */
    updateRecordsList() {
        try {
            // 检查容器是否存在
            if (!this.recordsContainer) {
                console.warn('记录容器不存在，跳过记录列表更新');
                return;
            }
            
            // 计算分页
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const endIndex = startIndex + this.pageSize;
            const pageRecords = this.filteredRecords.slice(startIndex, endIndex);
            
            // 清空容器
            this.recordsContainer.innerHTML = '';
            
            // 检查是否有记录
            if (this.filteredRecords.length === 0) {
                this.showNoRecordsMessage();
                return;
            }
            
            // 创建记录项
            pageRecords.forEach(record => {
                const recordElement = this.createRecordElement(record);
                this.recordsContainer.appendChild(recordElement);
            });
            
        } catch (error) {
            console.error('更新记录列表失败:', error);
            this.showError('显示记录失败');
        }
    }

    /**
     * 创建记录项元素
     * @param {Object} record - 记录对象
     * @returns {HTMLElement} 记录项元素
     */
    createRecordElement(record) {
        const recordDiv = document.createElement('div');
        recordDiv.className = `record-item ${record.isCorrect ? 'correct' : 'incorrect'}`;
        
        // 状态图标
        const statusDiv = document.createElement('div');
        statusDiv.className = `record-status ${record.isCorrect ? 'correct' : 'incorrect'}`;
        statusDiv.textContent = record.isCorrect ? '✓' : '✗';
        
        // 记录信息 - 一行显示
        const infoDiv = document.createElement('div');
        infoDiv.className = 'record-info';
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'record-time';
        timeDiv.textContent = this.formatDateTime(record.timestamp);
        
        const answersDiv = document.createElement('div');
        answersDiv.className = 'record-answers';
        answersDiv.innerHTML = `
            <span class="record-user-answer">您的答案: ${this.formatTime(record.userAnswer)}</span>
            <span class="record-correct-answer">正确答案: ${this.formatTime(record.correctAnswer)}</span>
        `;
        
        infoDiv.appendChild(timeDiv);
        infoDiv.appendChild(answersDiv);
        
        // 难度标签
        const difficultyDiv = document.createElement('div');
        difficultyDiv.className = `record-difficulty level-${record.difficulty}`;
        difficultyDiv.textContent = `${record.difficulty}星`;
        
        // 耗时
        const timeSpentDiv = document.createElement('div');
        timeSpentDiv.className = 'record-time-spent';
        timeSpentDiv.textContent = `${record.timeSpent}秒`;
        
        // 组装元素
        recordDiv.appendChild(statusDiv);
        recordDiv.appendChild(infoDiv);
        recordDiv.appendChild(difficultyDiv);
        recordDiv.appendChild(timeSpentDiv);
        
        return recordDiv;
    }

    /**
     * 显示无记录消息
     */
    showNoRecordsMessage() {
        if (!this.recordsContainer) {
            console.warn('记录容器不存在，无法显示无记录消息');
            return;
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'no-records-message';
        messageDiv.innerHTML = `
            <p>暂无符合条件的记录</p>
            <p class="no-records-hint">尝试调整筛选条件或开始新的练习</p>
        `;
        this.recordsContainer.appendChild(messageDiv);
    }

    /**
     * 更新统计信息
     */
    updateStatistics() {
        try {
            const stats = this.recordManager.getStatistics();
            
            // 使用筛选后的记录计算统计
            const filteredStats = this.calculateFilteredStats();
            
            if (this.totalRecordsCount) {
                this.totalRecordsCount.textContent = filteredStats.totalRecords;
            }
            if (this.correctRate) {
                this.correctRate.textContent = `${filteredStats.correctRate}%`;
            }
            if (this.averageTime) {
                this.averageTime.textContent = `${filteredStats.averageTimeSpent}秒`;
            }
            
        } catch (error) {
            console.error('更新统计信息失败:', error);
        }
    }

    /**
     * 计算筛选后记录的统计信息
     * @returns {Object} 统计信息
     */
    calculateFilteredStats() {
        const total = this.filteredRecords.length;
        
        if (total === 0) {
            return {
                totalRecords: 0,
                correctRate: 0,
                averageTimeSpent: 0
            };
        }
        
        const correctCount = this.filteredRecords.filter(r => r.isCorrect).length;
        const correctRate = Math.round((correctCount / total) * 100);
        
        const totalTimeSpent = this.filteredRecords.reduce((sum, r) => sum + r.timeSpent, 0);
        const averageTimeSpent = Math.round(totalTimeSpent / total);
        
        return {
            totalRecords: total,
            correctRate,
            averageTimeSpent
        };
    }

    /**
     * 更新分页信息
     */
    updatePagination() {
        try {
            const totalPages = Math.ceil(this.filteredRecords.length / this.pageSize);
            
            if (this.currentPageSpan) {
                this.currentPageSpan.textContent = this.currentPage;
            }
            if (this.totalPagesSpan) {
                this.totalPagesSpan.textContent = Math.max(1, totalPages);
            }
            if (this.pageSizeSpan) {
                this.pageSizeSpan.textContent = this.pageSize;
            }
            
            // 更新总记录数显示
            const totalRecordsDisplay = document.getElementById('total-records-display');
            if (totalRecordsDisplay) {
                totalRecordsDisplay.textContent = this.filteredRecords.length;
            }
            
            // 更新按钮状态
            if (this.prevPageBtn) {
                this.prevPageBtn.disabled = this.currentPage <= 1;
            }
            if (this.nextPageBtn) {
                this.nextPageBtn.disabled = this.currentPage >= totalPages || totalPages === 0;
            }
            
        } catch (error) {
            console.error('更新分页信息失败:', error);
        }
    }

    /**
     * 上一页
     */
    goToPreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updateRecordsList();
            this.updatePagination();
        }
    }

    /**
     * 下一页
     */
    goToNextPage() {
        const totalPages = Math.ceil(this.filteredRecords.length / this.pageSize);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.updateRecordsList();
            this.updatePagination();
        }
    }

    // showRecordDetail方法已移除

    // 所有模态框相关方法已移除

    /**
     * 格式化时间对象为字符串
     * @param {Object} timeObj - 时间对象
     * @returns {string} 格式化的时间字符串
     */
    formatTime(timeObj) {
        if (!timeObj) return '00:00:00';
        
        const hours = timeObj.hours.toString().padStart(2, '0');
        const minutes = timeObj.minutes.toString().padStart(2, '0');
        const seconds = timeObj.seconds.toString().padStart(2, '0');
        
        return `${hours}:${minutes}:${seconds}`;
    }

    /**
     * 格式化日期时间
     * @param {Date} date - 日期对象
     * @returns {string} 格式化的日期时间字符串
     */
    formatDateTime(date) {
        if (!date) return '';
        
        const d = new Date(date);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const seconds = d.getSeconds().toString().padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    /**
     * 显示消息提示
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 ('success', 'error', 'info', 'warning')
     */
    showMessage(message, type = 'info') {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8',
            warning: '#ffc107'
        };
        
        const textColors = {
            success: 'white',
            error: 'white',
            info: 'white',
            warning: '#212529'
        };
        
        // 创建消息提示
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-${type}`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: ${colors[type] || colors.info};
            color: ${textColors[type] || textColors.info};
            padding: 15px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 1001;
            animation: slideIn 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        messageDiv.textContent = message;
        
        // 确保document.body存在
        if (document.body) {
            document.body.appendChild(messageDiv);
        } else {
            console.warn('无法显示消息：document.body不存在');
            return;
        }
        
        // 3秒后自动移除
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }

    /**
     * 显示错误消息
     * @param {string} message - 错误消息
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * 刷新记录显示
     */
    refresh() {
        this.loadRecords();
    }

    /**
     * 刷新记录显示（兼容性方法）
     */
    refreshRecords() {
        this.loadRecords();
    }

    /**
     * 添加新记录后的回调
     * @param {Object} record - 新记录
     */
    onRecordAdded(record) {
        // 刷新显示
        this.refresh();
        
        // 如果当前在第一页，滚动到顶部显示新记录
        if (this.currentPage === 1) {
            this.recordsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}