/**
 * 性能优化器
 * 优化时钟渲染和参考线绘制性能，减少DOM操作和重绘次数
 */
class PerformanceOptimizer {
    constructor() {
        this.renderCache = new Map();
        this.domUpdateQueue = [];
        this.isUpdating = false;
        this.lastRenderTime = 0;
        this.renderThrottle = 16; // 60fps限制
        
        // 性能监控
        this.performanceMetrics = {
            renderCount: 0,
            domUpdateCount: 0,
            cacheHits: 0,
            averageRenderTime: 0
        };
        
        this.initializeOptimizations();
    }

    /**
     * 初始化性能优化
     */
    initializeOptimizations() {
        // 启用批量DOM更新
        this.enableBatchDOMUpdates();
        
        // 优化事件监听器
        this.optimizeEventListeners();
        
        // 启用渲染缓存
        this.enableRenderCaching();
        
        console.log('性能优化器初始化完成');
    }

    /**
     * 优化时钟渲染性能
     * @param {ClockRenderer} clockRenderer - 时钟渲染器实例
     */
    optimizeClockRenderer(clockRenderer) {
        if (!clockRenderer || !clockRenderer.isCanvasSupported) {
            return;
        }

        // 缓存原始渲染方法
        const originalRender = clockRenderer.render.bind(clockRenderer);
        const originalDrawClockFace = clockRenderer.drawClockFace.bind(clockRenderer);
        const originalDrawGuideLines = clockRenderer.drawGuideLines.bind(clockRenderer);

        // 优化主渲染方法 - 暂时禁用缓存以解决参考线问题
        clockRenderer.render = (time, showGuideLines = false) => {
            const startTime = performance.now();
            
            // 检查渲染节流
            if (startTime - this.lastRenderTime < this.renderThrottle) {
                return;
            }
            
            console.log(`🎨 [DEBUG] 直接渲染 - 时间: ${time.hours}:${time.minutes}:${time.seconds || 0}, 参考线: ${clockRenderer.showGuideLines}`);
            
            // 直接执行渲染，不使用缓存
            originalRender(time, showGuideLines);
            
            // 更新性能指标
            const renderTime = performance.now() - startTime;
            this.updateRenderMetrics(renderTime);
            this.lastRenderTime = startTime;
        };

        // 暂时禁用表盘缓存，直接调用原始方法
        clockRenderer.drawClockFace = () => {
            console.log('🎯 [DEBUG] 直接绘制表盘，不使用缓存');
            originalDrawClockFace();
        };

        // 优化参考线绘制
        clockRenderer.drawGuideLines = (time) => {
            // 检查是否应该显示参考线
            if (!clockRenderer.showGuideLines) {
                console.log('🚫 [DEBUG] 参考线已禁用，跳过绘制');
                return;
            }
            
            console.log('📏 [DEBUG] 开始绘制优化参考线...');
            // 使用更高效的绘制方法
            this.drawOptimizedGuideLines(clockRenderer, time);
            console.log('✅ [DEBUG] 优化参考线绘制完成');
        };

        console.log('时钟渲染器性能优化完成');
    }

    /**
     * 生成渲染缓存键
     */
    generateRenderCacheKey(time, showGuideLines) {
        console.log(`🔑 [DEBUG] 生成缓存键: 时间=${time.hours}:${time.minutes}:${time.seconds || 0}, 参考线=${showGuideLines}`);
        return `${time.hours}-${time.minutes}-${time.seconds || 0}-${showGuideLines}`;
    }

    /**
     * 缓存渲染结果
     */
    cacheRenderResult(clockRenderer, cacheKey) {
        try {
            // 创建缓存Canvas
            const cacheCanvas = this.createOffscreenCanvas(
                clockRenderer.canvas.width, 
                clockRenderer.canvas.height
            );
            const cacheCtx = cacheCanvas.getContext('2d');
            
            // 复制当前渲染结果
            cacheCtx.drawImage(clockRenderer.canvas, 0, 0);
            
            // 存储到缓存（限制缓存大小）
            if (this.renderCache.size >= 50) {
                const firstKey = this.renderCache.keys().next().value;
                this.renderCache.delete(firstKey);
            }
            
            this.renderCache.set(cacheKey, cacheCanvas);
        } catch (error) {
            console.warn('缓存渲染结果失败:', error);
        }
    }

    /**
     * 从缓存恢复渲染结果
     */
    restoreFromCache(clockRenderer, cacheKey) {
        try {
            const cachedCanvas = this.renderCache.get(cacheKey);
            if (cachedCanvas) {
                const cssWidth = parseInt(clockRenderer.canvas.style.width) || 350;
                const cssHeight = parseInt(clockRenderer.canvas.style.height) || 350;
                clockRenderer.ctx.clearRect(0, 0, cssWidth, cssHeight);
                clockRenderer.ctx.drawImage(cachedCanvas, 0, 0);
            }
        } catch (error) {
            console.warn('从缓存恢复失败:', error);
            this.renderCache.delete(cacheKey);
        }
    }

    /**
     * 创建离屏Canvas
     */
    createOffscreenCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }

    /**
     * 绘制优化的参考线
     */
    drawOptimizedGuideLines(clockRenderer, time) {
        const ctx = clockRenderer.ctx;
        const centerX = clockRenderer.centerX;
        const centerY = clockRenderer.centerY;
        const radius = clockRenderer.radius;

        // 使用批量绘制减少状态切换
        ctx.save();
        ctx.strokeStyle = '#ff6b35';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);

        // 批量绘制所有参考线
        ctx.beginPath();

        // 时针参考线
        const hourAngle = ((time.hours % 12) + time.minutes / 60) * 30 - 90;
        const hourRadians = (hourAngle * Math.PI) / 180;
        const hourEndX = centerX + Math.cos(hourRadians) * radius;
        const hourEndY = centerY + Math.sin(hourRadians) * radius;
        
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(hourEndX, hourEndY);

        // 分针参考线
        const minuteAngle = time.minutes * 6 - 90;
        const minuteRadians = (minuteAngle * Math.PI) / 180;
        const minuteEndX = centerX + Math.cos(minuteRadians) * radius;
        const minuteEndY = centerY + Math.sin(minuteRadians) * radius;
        
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(minuteEndX, minuteEndY);

        // 秒针参考线（如果有秒数）
        if (time.seconds !== undefined) {
            const secondAngle = time.seconds * 6 - 90;
            const secondRadians = (secondAngle * Math.PI) / 180;
            const secondEndX = centerX + Math.cos(secondRadians) * radius;
            const secondEndY = centerY + Math.sin(secondRadians) * radius;
            
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(secondEndX, secondEndY);
        }

        // 一次性绘制所有线条
        ctx.stroke();
        ctx.restore();
    }

    /**
     * 启用批量DOM更新
     */
    enableBatchDOMUpdates() {
        // 创建批量更新方法
        this.batchDOMUpdate = (updateFunction) => {
            this.domUpdateQueue.push(updateFunction);
            
            if (!this.isUpdating) {
                this.isUpdating = true;
                requestAnimationFrame(() => {
                    this.processDOMUpdateQueue();
                });
            }
        };
    }

    /**
     * 处理DOM更新队列
     */
    processDOMUpdateQueue() {
        const startTime = performance.now();
        
        // 批量执行DOM更新
        while (this.domUpdateQueue.length > 0) {
            const updateFunction = this.domUpdateQueue.shift();
            try {
                updateFunction();
                this.performanceMetrics.domUpdateCount++;
            } catch (error) {
                console.warn('DOM更新失败:', error);
            }
        }
        
        this.isUpdating = false;
        
        const updateTime = performance.now() - startTime;
        if (updateTime > 16) {
            console.warn(`DOM批量更新耗时过长: ${updateTime.toFixed(2)}ms`);
        }
    }

    /**
     * 优化事件监听器
     */
    optimizeEventListeners() {
        // 创建防抖和节流工具
        this.debounce = (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        };

        this.throttle = (func, limit) => {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        };
    }

    /**
     * 启用渲染缓存
     */
    enableRenderCaching() {
        // 定期清理缓存
        setInterval(() => {
            if (this.renderCache.size > 30) {
                const keysToDelete = Array.from(this.renderCache.keys()).slice(0, 10);
                keysToDelete.forEach(key => this.renderCache.delete(key));
                console.log(`清理了 ${keysToDelete.length} 个渲染缓存`);
            }
        }, 30000); // 每30秒清理一次
    }

    /**
     * 更新渲染性能指标
     */
    updateRenderMetrics(renderTime) {
        this.performanceMetrics.renderCount++;
        
        // 计算平均渲染时间
        const totalTime = this.performanceMetrics.averageRenderTime * (this.performanceMetrics.renderCount - 1) + renderTime;
        this.performanceMetrics.averageRenderTime = totalTime / this.performanceMetrics.renderCount;
        
        // 警告慢渲染
        if (renderTime > 16) {
            console.warn(`渲染耗时过长: ${renderTime.toFixed(2)}ms`);
        }
    }

    /**
     * 优化应用控制器性能
     */
    optimizeAppController(appController) {
        // 优化输入验证（防抖）
        const originalValidateInputs = appController.validateIndividualInputs?.bind(appController);
        if (originalValidateInputs) {
            appController.validateIndividualInputs = this.debounce(originalValidateInputs, 300);
        }

        // 优化难度切换（节流）
        const originalHandleDifficultyChange = appController.handleDifficultyChange?.bind(appController);
        if (originalHandleDifficultyChange) {
            appController.handleDifficultyChange = this.throttle(originalHandleDifficultyChange, 500);
        }

        // 优化记录更新（批量）
        const originalUpdateRecords = appController.recordUI?.refreshRecords?.bind(appController.recordUI);
        if (originalUpdateRecords) {
            appController.recordUI.refreshRecords = () => {
                this.batchDOMUpdate(originalUpdateRecords);
            };
        }

        console.log('应用控制器性能优化完成');
    }

    /**
     * 获取性能报告
     */
    getPerformanceReport() {
        return {
            ...this.performanceMetrics,
            cacheSize: this.renderCache.size,
            cacheHitRate: this.performanceMetrics.cacheHits / Math.max(this.performanceMetrics.renderCount, 1) * 100
        };
    }

    /**
     * 清理资源
     */
    cleanup() {
        this.renderCache.clear();
        this.domUpdateQueue.length = 0;
        console.log('性能优化器资源已清理');
    }
}

// 导出性能优化器
window.PerformanceOptimizer = PerformanceOptimizer;