/**
 * 时钟渲染器类
 * 使用Canvas绘制模拟时钟，支持参考线功能
 */
class ClockRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = null;
        this.centerX = 0;
        this.centerY = 0;
        this.radius = 0;
        this.isCanvasSupported = false;
        this.showGuideLines = false; // 参考线开关状态
        this.autoTick = false; // 自动走动状态
        this.showCurrentTime = false; // 显示当前时间状态
        this.tickInterval = null; // 自动走动定时器
        this.currentTime = null; // 当前显示的时间
        this.originalTime = null; // 原始题目时间（用于恢复）
        
        // 检测Canvas支持
        this.checkCanvasSupport();
        
        // 初始化Canvas设置
        if (this.isCanvasSupported && this.canvas) {
            this.initializeCanvas();
        } else {
            this.initializeFallback();
        }
    }

    /**
     * 检测Canvas支持
     */
    checkCanvasSupport() {
        try {
            // 检查是否存在canvas元素
            if (!this.canvas) {
                console.warn('Canvas元素不存在');
                this.isCanvasSupported = false;
                return;
            }
            
            // 检查是否支持2D上下文
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                console.warn('浏览器不支持Canvas 2D上下文');
                this.isCanvasSupported = false;
                return;
            }
            
            // 检查基本绘制功能
            if (typeof this.ctx.beginPath !== 'function' || 
                typeof this.ctx.arc !== 'function' || 
                typeof this.ctx.stroke !== 'function') {
                console.warn('Canvas 2D上下文功能不完整');
                this.isCanvasSupported = false;
                return;
            }
            
            this.isCanvasSupported = true;
        } catch (error) {
            console.error('Canvas支持检测失败:', error);
            this.isCanvasSupported = false;
        }
    }

    /**
     * 初始化降级模式
     */
    initializeFallback() {
        try {
            console.info('使用降级模式显示时钟');
            
            // 隐藏Canvas，显示降级界面
            if (this.canvas) {
                this.canvas.style.display = 'none';
            }
            
            // 确保降级界面存在，如果不存在则创建
            let fallback = document.getElementById('clock-fallback');
            if (!fallback) {
                fallback = this.createFallbackInterface();
            }
            
            if (fallback) {
                fallback.style.display = 'flex';
                fallback.style.flexDirection = 'column';
                fallback.style.alignItems = 'center';
                fallback.style.justifyContent = 'center';
                
                // 添加降级模式的样式类
                fallback.classList.add('canvas-fallback-active');
            }
            
            // 禁用参考线功能
            this.disableGuideLineFeature('Canvas不支持');
            
            // 显示降级模式提示
            this.showFallbackModeMessage();
            
            console.log('降级模式初始化完成');
        } catch (error) {
            console.error('初始化降级模式失败:', error);
            this.createEmergencyFallback();
        }
    }

    /**
     * 创建降级界面
     * @returns {HTMLElement} 降级界面元素
     */
    createFallbackInterface() {
        try {
            const fallback = document.createElement('div');
            fallback.id = 'clock-fallback';
            fallback.className = 'clock-fallback';
            
            fallback.innerHTML = `
                <div class="fallback-content">
                    <div class="fallback-icon">🕐</div>
                    <div class="digital-time-display">
                        <div id="digital-time" class="digital-time">00:00:00</div>
                        <div class="fallback-label">数字时钟显示</div>
                    </div>
                    <div class="fallback-message">
                        您的浏览器不支持Canvas，使用数字时钟显示
                    </div>
                </div>
            `;
            
            // 插入到时钟容器中
            const clockContainer = document.querySelector('.clock-container') || 
                                  document.querySelector('.clock-section') ||
                                  this.canvas?.parentElement;
            
            if (clockContainer) {
                clockContainer.appendChild(fallback);
            } else {
                // 如果找不到合适的容器，插入到body中
                document.body.appendChild(fallback);
                console.warn('未找到时钟容器，降级界面已插入到body中');
            }
            
            return fallback;
        } catch (error) {
            console.error('创建降级界面失败:', error);
            return null;
        }
    }

    /**
     * 禁用参考线功能
     * @param {string} reason - 禁用原因
     */
    disableGuideLineFeature(reason) {
        try {
            const guideToggle = document.getElementById('guide-lines-toggle');
            if (guideToggle) {
                guideToggle.disabled = true;
                guideToggle.checked = false;
                
                const toggleContainer = guideToggle.closest('.reference-line-toggle') || 
                                       guideToggle.parentElement;
                if (toggleContainer) {
                    toggleContainer.style.opacity = '0.5';
                    toggleContainer.style.cursor = 'not-allowed';
                    toggleContainer.title = `参考线功能不可用: ${reason}`;
                }
            }
        } catch (error) {
            console.error('禁用参考线功能失败:', error);
        }
    }

    /**
     * 显示降级模式提示
     */
    showFallbackModeMessage() {
        try {
            let messageElement = document.getElementById('fallback-mode-message');
            if (!messageElement) {
                messageElement = document.createElement('div');
                messageElement.id = 'fallback-mode-message';
                messageElement.className = 'info-message fallback-mode';
                
                const clockContainer = document.querySelector('.clock-container') || 
                                      document.querySelector('.clock-section');
                if (clockContainer) {
                    clockContainer.appendChild(messageElement);
                }
            }
            
            messageElement.innerHTML = `
                <div class="message-content">
                    <span class="message-icon">ℹ️</span>
                    <span class="message-text">当前使用数字时钟模式，参考线功能不可用</span>
                    <button class="message-close" onclick="this.parentElement.parentElement.style.display='none'">×</button>
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
            console.error('显示降级模式提示失败:', error);
        }
    }

    /**
     * 创建紧急降级方案
     */
    createEmergencyFallback() {
        try {
            console.warn('使用紧急降级方案');
            
            // 创建最简单的文本显示
            let emergencyElement = document.getElementById('emergency-clock');
            if (!emergencyElement) {
                emergencyElement = document.createElement('div');
                emergencyElement.id = 'emergency-clock';
                emergencyElement.className = 'emergency-clock';
                emergencyElement.style.cssText = `
                    text-align: center;
                    padding: 20px;
                    border: 2px solid #ccc;
                    border-radius: 8px;
                    background-color: #f9f9f9;
                    font-family: monospace;
                    font-size: 24px;
                    margin: 10px;
                `;
                
                const targetContainer = document.querySelector('.clock-container') || 
                                       document.querySelector('.clock-section') ||
                                       this.canvas?.parentElement ||
                                       document.body;
                
                targetContainer.appendChild(emergencyElement);
            }
            
            emergencyElement.innerHTML = `
                <div>⏰ 时钟显示</div>
                <div id="emergency-time" style="font-size: 32px; margin: 10px 0;">00:00:00</div>
                <div style="font-size: 14px; color: #666;">时钟功能受限，仅显示数字时间</div>
            `;
            
            // 隐藏其他时钟相关元素
            if (this.canvas) this.canvas.style.display = 'none';
            const fallback = document.getElementById('clock-fallback');
            if (fallback) fallback.style.display = 'none';
            
        } catch (error) {
            console.error('创建紧急降级方案也失败:', error);
        }
    }

    /**
     * 初始化Canvas设置
     */
    initializeCanvas() {
        if (!this.ctx) return;
        
        // 防止频繁重新初始化 - 使用更严格的检查
        if (this.isCanvasInitialized() && !this.needsReinitialize) {
            console.log('Canvas已初始化，跳过重复初始化');
            return;
        }
        
        // 直接执行初始化，不使用防抖
        this.performCanvasInitialization();
    }

    /**
     * 执行Canvas初始化
     */
    performCanvasInitialization() {
        console.log('🔧 开始执行Canvas初始化...');
        try {
            // 设置高DPI支持
            const devicePixelRatio = window.devicePixelRatio || 1;
            console.log('📱 设备像素比:', devicePixelRatio);
            
            // 等待DOM稳定后获取尺寸
            let width, height;
            
            // 首先尝试从CSS样式获取固定尺寸
            const computedStyle = window.getComputedStyle(this.canvas);
            width = parseInt(computedStyle.width) || 300;
            height = parseInt(computedStyle.height) || 300;
            console.log('📏 CSS样式尺寸:', { width, height });
            
            // 如果CSS没有设置，再尝试getBoundingClientRect
            if (width === 300 && height === 300) {
                const rect = this.canvas.getBoundingClientRect();
                console.log('📐 getBoundingClientRect结果:', rect);
                if (rect.width > 0 && rect.height > 0) {
                    width = rect.width;
                    height = rect.height;
                    console.log('📏 使用getBoundingClientRect尺寸:', { width, height });
                }
            }
            
            // 确保Canvas尺寸正确设置
            const oldCanvasWidth = this.canvas.width;
            const oldCanvasHeight = this.canvas.height;
            this.canvas.width = width * devicePixelRatio;
            this.canvas.height = height * devicePixelRatio;
            this.canvas.style.width = width + 'px';
            this.canvas.style.height = height + 'px';
            console.log('🖼️ Canvas尺寸变化:', {
                old: { width: oldCanvasWidth, height: oldCanvasHeight },
                new: { width: this.canvas.width, height: this.canvas.height },
                style: { width: this.canvas.style.width, height: this.canvas.style.height }
            });
            
            // 完全重置变换矩阵，确保没有累积变换
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            console.log('🔄 Canvas变换矩阵完全重置');
            
            // 应用设备像素比缩放
            this.ctx.scale(devicePixelRatio, devicePixelRatio);
            console.log('🔄 Canvas应用设备像素比缩放:', devicePixelRatio);
            
            // 计算中心点和半径 - 确保表盘居中
            const oldCenterX = this.centerX;
            const oldCenterY = this.centerY;
            const oldRadius = this.radius;
            this.centerX = width / 2;
            this.centerY = height / 2;
            this.radius = Math.min(width, height) / 2 - 40; // 留出边距
            console.log('🎯 表盘参数变化:', {
                old: { centerX: oldCenterX, centerY: oldCenterY, radius: oldRadius },
                new: { centerX: this.centerX, centerY: this.centerY, radius: this.radius }
            });
            
            // 设置抗锯齿
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.imageSmoothingQuality = 'high';
            console.log('✨ 抗锯齿设置完成');
            
            // 重置标志
            this.needsReinitialize = false;
            
            // 验证初始化结果
            this.validateCanvasInitialization();
            
            console.log('✅ Canvas初始化完成:', {
                cssWidth: width,
                cssHeight: height,
                canvasWidth: this.canvas.width,
                canvasHeight: this.canvas.height,
                centerX: this.centerX,
                centerY: this.centerY,
                radius: this.radius,
                devicePixelRatio: devicePixelRatio
            });
            
        } catch (error) {
            console.error('❌ Canvas初始化失败:', error);
            console.error('❌ 错误堆栈:', error.stack);
            this.needsReinitialize = true;
        }
    }

    /**
     * 验证Canvas初始化结果
     */
    validateCanvasInitialization() {
        try {
            // 检查Canvas参数是否合理
            if (!this.centerX || !this.centerY || !this.radius || 
                isNaN(this.centerX) || isNaN(this.centerY) || isNaN(this.radius)) {
                console.error('❌ Canvas初始化验证失败: 参数异常');
                this.needsReinitialize = true;
                return false;
            }
            
            // 检查Canvas尺寸是否合理
            if (!this.canvas.width || !this.canvas.height || 
                this.canvas.width <= 0 || this.canvas.height <= 0) {
                console.error('❌ Canvas初始化验证失败: 尺寸异常');
                this.needsReinitialize = true;
                return false;
            }
            
            // 检查表盘半径是否合理
            const maxRadius = Math.min(this.canvas.width, this.canvas.height) / 2;
            if (this.radius > maxRadius || this.radius <= 0) {
                console.error('❌ Canvas初始化验证失败: 半径异常', {
                    radius: this.radius,
                    maxRadius: maxRadius
                });
                this.needsReinitialize = true;
                return false;
            }
            
            console.log('✅ Canvas初始化验证通过');
            return true;
            
        } catch (error) {
            console.error('❌ Canvas初始化验证失败:', error);
            this.needsReinitialize = true;
            return false;
        }
    }

    /**
     * 调试Canvas状态
     */
    debugCanvasState() {
        console.log('🔍 Canvas调试信息:', {
            canvas: this.canvas,
            ctx: this.ctx,
            isCanvasSupported: this.isCanvasSupported,
            centerX: this.centerX,
            centerY: this.centerY,
            radius: this.radius,
            canvasWidth: this.canvas?.width,
            canvasHeight: this.canvas?.height,
            canvasStyle: this.canvas?.style?.width + ' x ' + this.canvas?.style?.height
        });
    }

    /**
     * 诊断Canvas状态和坐标系统
     */
    diagnoseCanvasState() {
        console.log('🏥 开始Canvas状态诊断...');
        
        // 基本状态检查
        const basicState = {
            canvas存在: !!this.canvas,
            context存在: !!this.ctx,
            Canvas支持: this.isCanvasSupported,
            已初始化: this.isCanvasInitialized()
        };
        console.log('📋 基本状态:', basicState);
        
        if (!this.canvas) {
            console.error('❌ Canvas元素不存在');
            return;
        }
        
        // Canvas尺寸信息
        const sizeInfo = {
            Canvas实际尺寸: {
                width: this.canvas.width,
                height: this.canvas.height
            },
            Canvas样式尺寸: {
                width: this.canvas.style.width,
                height: this.canvas.style.height
            },
            getBoundingClientRect: this.canvas.getBoundingClientRect(),
            offsetWidth: this.canvas.offsetWidth,
            offsetHeight: this.canvas.offsetHeight,
            clientWidth: this.canvas.clientWidth,
            clientHeight: this.canvas.clientHeight
        };
        console.log('📏 尺寸信息:', sizeInfo);
        
        // 坐标系统信息
        const coordinateInfo = {
            中心点: { x: this.centerX, y: this.centerY },
            半径: this.radius,
            设备像素比: window.devicePixelRatio || 1,
            CSS尺寸: {
                width: parseInt(this.canvas.style.width) || 0,
                height: parseInt(this.canvas.style.height) || 0
            }
        };
        console.log('🎯 坐标系统:', coordinateInfo);
        
        // 检查坐标合理性
        const cssWidth = parseInt(this.canvas.style.width) || 0;
        const cssHeight = parseInt(this.canvas.style.height) || 0;
        
        const coordinateCheck = {
            中心点在范围内: this.centerX <= cssWidth && this.centerY <= cssHeight,
            半径合理: this.radius > 0 && this.radius < Math.min(cssWidth, cssHeight) / 2,
            坐标不为零: this.centerX > 0 && this.centerY > 0,
            坐标不为NaN: !isNaN(this.centerX) && !isNaN(this.centerY) && !isNaN(this.radius)
        };
        console.log('✅ 坐标检查:', coordinateCheck);
        
        // Canvas变换矩阵信息
        if (this.ctx) {
            const transform = this.ctx.getTransform();
            console.log('🔄 变换矩阵:', {
                a: transform.a, // 水平缩放
                b: transform.b, // 水平倾斜
                c: transform.c, // 垂直倾斜
                d: transform.d, // 垂直缩放
                e: transform.e, // 水平移动
                f: transform.f  // 垂直移动
            });
        }
        
        // 绘制测试点
        if (this.ctx && this.isCanvasInitialized()) {
            console.log('🎨 绘制测试点...');
            this.ctx.save();
            
            // 绘制Canvas四个角的测试点
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(0, 0, 5, 5); // 左上角
            this.ctx.fillRect(cssWidth - 5, 0, 5, 5); // 右上角
            this.ctx.fillRect(0, cssHeight - 5, 5, 5); // 左下角
            this.ctx.fillRect(cssWidth - 5, cssHeight - 5, 5, 5); // 右下角
            
            // 绘制中心点测试
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillRect(this.centerX - 2, this.centerY - 2, 4, 4);
            
            // 绘制半径测试圆
            this.ctx.strokeStyle = '#0000ff';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
            this.ctx.stroke();
            
            this.ctx.restore();
            console.log('✅ 测试点绘制完成');
        }
        
        console.log('🏥 Canvas状态诊断完成');
    }

    /**
     * 可视化调试Canvas坐标系统
     */
    visualDebugCoordinates() {
        if (!this.ctx || !this.isCanvasInitialized()) {
            console.error('❌ Canvas未初始化，无法进行可视化调试');
            return;
        }
        
        console.log('🎨 开始可视化调试Canvas坐标系统...');
        
        // 保存当前状态
        this.ctx.save();
        
        // 使用CSS逻辑尺寸（考虑设备像素比）
        const cssWidth = parseInt(this.canvas.style.width) || 350;
        const cssHeight = parseInt(this.canvas.style.height) || 350;
        
        // 清空画布（使用CSS逻辑坐标系统）
        this.ctx.clearRect(0, 0, cssWidth, cssHeight);
        
        console.log('🎨 可视化调试尺寸信息:', {
            Canvas实际尺寸: { width: this.canvas.width, height: this.canvas.height },
            CSS显示尺寸: { width: cssWidth, height: cssHeight },
            中心点: { x: this.centerX, y: this.centerY },
            半径: this.radius,
            设备像素比: window.devicePixelRatio
        });
        
        // 绘制坐标网格（使用CSS逻辑坐标）
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        
        // 垂直线
        for (let x = 0; x <= cssWidth; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, cssHeight);
            this.ctx.stroke();
        }
        
        // 水平线
        for (let y = 0; y <= cssHeight; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(cssWidth, y);
            this.ctx.stroke();
        }
        
        // 绘制Canvas边界（使用CSS逻辑坐标）
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(0, 0, cssWidth, cssHeight);
        
        // 绘制中心点
        this.ctx.fillStyle = '#00ff00';
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 8, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // 绘制中心十字线
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX - 20, this.centerY);
        this.ctx.lineTo(this.centerX + 20, this.centerY);
        this.ctx.moveTo(this.centerX, this.centerY - 20);
        this.ctx.lineTo(this.centerX, this.centerY + 20);
        this.ctx.stroke();
        
        // 绘制半径圆
        this.ctx.strokeStyle = '#0000ff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // 绘制四个角的标记点
        this.ctx.fillStyle = '#ff0000';
        const cornerSize = 10;
        this.ctx.fillRect(0, 0, cornerSize, cornerSize); // 左上角
        this.ctx.fillRect(cssWidth - cornerSize, 0, cornerSize, cornerSize); // 右上角
        this.ctx.fillRect(0, cssHeight - cornerSize, cornerSize, cornerSize); // 左下角
        this.ctx.fillRect(cssWidth - cornerSize, cssHeight - cornerSize, cornerSize, cornerSize); // 右下角
        
        // 添加文字标注
        this.ctx.fillStyle = '#000000';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Canvas: ${cssWidth}x${cssHeight}`, 10, 25);
        this.ctx.fillText(`Center: (${this.centerX}, ${this.centerY})`, 10, 45);
        this.ctx.fillText(`Radius: ${this.radius}`, 10, 65);
        this.ctx.fillText(`DevicePixelRatio: ${window.devicePixelRatio}`, 10, 85);
        
        // 恢复状态
        this.ctx.restore();
        
        console.log('✅ 可视化调试完成');
        console.log('📊 调试信息:', {
            CSS尺寸: { width: cssWidth, height: cssHeight },
            Canvas实际尺寸: { width: this.canvas.width, height: this.canvas.height },
            中心点: { x: this.centerX, y: this.centerY },
            半径: this.radius,
            设备像素比: window.devicePixelRatio
        });
    }

    /**
     * 渲染时钟
     * @param {Object} time - 包含hours, minutes, seconds的时间对象
     * @param {boolean} showGuideLines - 是否显示参考线
     * @param {Function} onComplete - 重绘完成回调函数
     */
    render(time, showGuideLines = false, onComplete = null) {
        console.log('🎨 [DEBUG] ====== 开始渲染时钟 ======', {
            time: time,
            showGuideLines: showGuideLines,
            timestamp: new Date().toISOString(),
            currentState: {
                currentTime: this.currentTime,
                showCurrentTime: this.showCurrentTime,
                autoTick: this.autoTick,
                showGuideLines: this.showGuideLines
            }
        });
        
        // 验证时间对象
        if (!this.validateTime(time)) {
            console.error('❌ 无效的时间对象:', time);
            console.error('❌ 时间验证失败详情:', {
                type: typeof time,
                isObject: time && typeof time === 'object',
                hours: time?.hours,
                minutes: time?.minutes,
                seconds: time?.seconds
            });
            if (onComplete) {
                setTimeout(onComplete, 10);
            }
            return;
        }
        console.log('✅ 时间对象验证通过');

        if (!this.isCanvasSupported) {
            console.log('⚠️ Canvas不支持，使用降级模式');
            this.renderFallback(time);
            if (onComplete) {
                setTimeout(onComplete, 10);
            }
            return;
        }
        console.log('✅ Canvas支持检查通过');

        try {
            console.log('🚀 立即执行渲染（已移除防抖）');
            // 直接执行渲染，不使用防抖
            this.executeRender(time, showGuideLines);
            
            // 渲染完成后调用回调
            if (onComplete) {
                setTimeout(() => {
                    console.log('✅ 渲染完成，调用回调函数');
                    onComplete();
                }, 50); // 给渲染留出一点时间
            }

        } catch (error) {
            console.error('❌ 时钟渲染失败:', error);
            console.error('❌ 渲染错误堆栈:', error.stack);
            // 使用新的渲染失败处理方法
            this.handleCanvasRenderFailure(error.message || '未知渲染错误');
            this.renderFallback(time);
            if (onComplete) {
                setTimeout(onComplete, 10);
            }
        }
    }

    /**
     * 执行实际的渲染逻辑
     * @param {Object} time - 包含hours, minutes, seconds的时间对象
     * @param {boolean} showGuideLines - 是否显示参考线
     */
    executeRender(time, showGuideLines = false) {
        console.log('🚀 [DEBUG] 执行实际渲染逻辑:', {
            time: time,
            showGuideLines: showGuideLines,
            currentTime: this.currentTime,
            showCurrentTime: this.showCurrentTime,
            autoTick: this.autoTick,
            canvasState: {
                width: this.canvas?.width,
                height: this.canvas?.height,
                centerX: this.centerX,
                centerY: this.centerY,
                radius: this.radius
            }
        });
        
        try {
            // 只在必要时更新当前显示时间（避免参考线切换时重置时间）
            if (!showGuideLines || !this.currentTime) {
                console.log('🔄 更新当前显示时间:', { from: this.currentTime, to: time });
                this.currentTime = { ...time };
            } else {
                console.log('⏭️ 保持当前显示时间不变:', this.currentTime);
            }
            
            // 更新参考线状态
            const oldShowGuideLines = this.showGuideLines;
            this.showGuideLines = showGuideLines;
            console.log('📏 参考线状态变化:', { from: oldShowGuideLines, to: this.showGuideLines });
            
            // 确保Canvas已正确初始化（只在真正需要时初始化）
            if (!this.ctx) {
                console.error('❌ Canvas上下文丢失');
                this.renderFallback(time);
                return;
            }
            console.log('✅ Canvas上下文检查通过');
            
            // 检查Canvas状态，但避免频繁重新初始化
            if (!this.isCanvasInitialized()) {
                console.log('⚠️ Canvas需要初始化');
                
                // 如果正在初始化中，等待完成
                if (this.initTimeout) {
                    console.log('⏳ Canvas正在初始化中，等待完成');
                    setTimeout(() => {
                        console.log('🔄 重新尝试渲染');
                        this.executeRender(time, showGuideLines);
                    }, 100);
                    return;
                }
                
                // 立即执行初始化
                console.log('🔧 立即执行Canvas初始化');
                this.performCanvasInitialization();
                
                // 再次检查初始化结果
                if (!this.isCanvasInitialized()) {
                    console.error('❌ Canvas初始化失败，使用降级模式');
                    this.renderFallback(time);
                    return;
                }
                console.log('✅ Canvas初始化成功');
            }
            
            console.log('✅ Canvas状态正常，开始绘制');
            console.log('🎯 当前Canvas参数:', {
                centerX: this.centerX,
                centerY: this.centerY,
                radius: this.radius,
                canvasWidth: this.canvas.width,
                canvasHeight: this.canvas.height
            });
            
            // 如果表盘参数异常，进行详细诊断
            if (!this.centerX || !this.centerY || !this.radius || 
                isNaN(this.centerX) || isNaN(this.centerY) || isNaN(this.radius)) {
                console.warn('⚠️ 检测到表盘参数异常，开始详细诊断...');
                this.diagnoseCanvasState();
            }
            
            // 保存当前Canvas状态
            this.ctx.save();
            console.log('💾 Canvas状态已保存');
            
            // 只在Canvas未初始化或需要重新初始化时才重置变换矩阵
            if (!this.isCanvasInitialized() || this.needsReinitialize) {
                // 完全重置变换矩阵，确保没有累积变换
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                console.log('🔄 渲染前Canvas变换矩阵重置');
                
                // 应用设备像素比缩放
                const devicePixelRatio = window.devicePixelRatio || 1;
                this.ctx.scale(devicePixelRatio, devicePixelRatio);
                console.log('🔄 渲染前应用设备像素比缩放:', devicePixelRatio);
            } else {
                console.log('⏭️ Canvas已初始化，跳过变换矩阵重置');
            }
            
            // 清空画布（使用实际Canvas尺寸）
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            console.log('🧹 画布已清空，使用实际Canvas尺寸:', { 
                width: this.canvas.width, 
                height: this.canvas.height 
            });
            
            // 使用当前显示时间进行渲染（保持表盘时间不变）
            const renderTime = showGuideLines ? this.currentTime : time;
            console.log('⏰ 使用渲染时间:', renderTime);
            
            // 完整渲染流程
            console.log('🎨 开始绘制表盘...');
            this.drawClockFace();
            console.log('✅ 表盘绘制完成');
            
            console.log('🕐 开始绘制指针...');
            this.drawHands(renderTime);
            console.log('✅ 指针绘制完成');
            
            // 绘制参考线（如果启用）
            console.log('🔍 [DEBUG] 参考线绘制检查:', {
                showGuideLines_param: showGuideLines,
                showGuideLines_property: this.showGuideLines,
                renderTime: renderTime,
                canvasState: {
                    fillStyle: this.ctx.fillStyle,
                    strokeStyle: this.ctx.strokeStyle,
                    lineWidth: this.ctx.lineWidth,
                    lineDash: this.ctx.getLineDash()
                }
            });
            
            if (this.showGuideLines) {
                console.log('📏 [DEBUG] 开始绘制参考线...');
                console.log('🎯 [DEBUG] 参考线绘制前Canvas状态:', {
                    fillStyle: this.ctx.fillStyle,
                    strokeStyle: this.ctx.strokeStyle,
                    lineWidth: this.ctx.lineWidth,
                    lineDash: this.ctx.getLineDash()
                });
                
                this.drawGuideLines(renderTime);
                
                console.log('🎯 [DEBUG] 参考线绘制后Canvas状态:', {
                    fillStyle: this.ctx.fillStyle,
                    strokeStyle: this.ctx.strokeStyle,
                    lineWidth: this.ctx.lineWidth,
                    lineDash: this.ctx.getLineDash()
                });
                console.log('✅ [DEBUG] 参考线绘制完成');
            } else {
                console.log('⏭️ [DEBUG] 跳过参考线绘制，showGuideLines为false');
            }
            
            // 恢复Canvas状态
            this.ctx.restore();
            console.log('🔄 Canvas状态已恢复');
            
            // 确保Canvas可见
            this.ensureCanvasVisible();
            console.log('👁️ Canvas可见性已确保');
            
            console.log('🎉 渲染完成！');
            
        } catch (error) {
            console.error('❌ 执行时钟渲染失败:', error);
            console.error('❌ 执行渲染错误堆栈:', error.stack);
            console.error('❌ 错误发生时的状态:', {
                time: time,
                showGuideLines: showGuideLines,
                currentTime: this.currentTime,
                centerX: this.centerX,
                centerY: this.centerY,
                radius: this.radius,
                canvasWidth: this.canvas?.width,
                canvasHeight: this.canvas?.height
            });
            this.handleCanvasRenderFailure(error.message || '未知渲染错误');
            this.renderFallback(time);
        }
    }

    /**
     * 检查Canvas是否已正确初始化
     * @returns {boolean} Canvas是否已初始化
     */
    isCanvasInitialized() {
        return this.centerX > 0 && this.centerY > 0 && this.radius > 0;
    }

    /**
     * 强制重新初始化Canvas
     */
    forceReinitialize() {
        console.log('🔄 强制重新初始化Canvas');
        
        // 清除所有定时器
        if (this.initTimeout) {
            clearTimeout(this.initTimeout);
            this.initTimeout = null;
        }
        if (this.renderTimeout) {
            clearTimeout(this.renderTimeout);
            this.renderTimeout = null;
        }
        
        // 完全重置Canvas参数
        this.centerX = 0;
        this.centerY = 0;
        this.radius = 0;
        this.needsReinitialize = true;
        
        // 如果Canvas上下文存在，完全重置变换矩阵
        if (this.ctx) {
            try {
                // 完全重置变换矩阵到单位矩阵
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                console.log('🔄 Canvas变换矩阵已完全重置');
                
                // 清空画布
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                console.log('🧹 Canvas已清空');
            } catch (error) {
                console.error('❌ 重置Canvas变换矩阵失败:', error);
            }
        }
        
        // 立即执行初始化
        this.performCanvasInitialization();
    }

    /**
     * 验证时间对象
     * @param {Object} time - 时间对象
     * @returns {boolean} 是否有效
     */
    validateTime(time) {
        if (!time || typeof time !== 'object') {
            return false;
        }
        
        const { hours, minutes, seconds } = time;
        
        return (
            typeof hours === 'number' && hours >= 0 && hours <= 12 &&
            typeof minutes === 'number' && minutes >= 0 && minutes <= 59 &&
            typeof seconds === 'number' && seconds >= 0 && seconds <= 59
        );
    }

    /**
     * 确保Canvas可见
     */
    ensureCanvasVisible() {
        if (this.canvas) {
            this.canvas.style.display = 'block';
        }
        
        const fallback = document.getElementById('clock-fallback');
        if (fallback) {
            fallback.style.display = 'none';
        }
    }

    /**
     * 绘制时钟表盘
     */
    drawClockFace() {
        const ctx = this.ctx;
        
        console.log('🎨 绘制时钟表盘开始:', {
            centerX: this.centerX,
            centerY: this.centerY,
            radius: this.radius,
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            canvasStyleWidth: this.canvas.style.width,
            canvasStyleHeight: this.canvas.style.height
        });
        
        // 检查坐标是否合理
        if (!this.centerX || !this.centerY || !this.radius) {
            console.error('❌ 表盘参数异常:', {
                centerX: this.centerX,
                centerY: this.centerY,
                radius: this.radius
            });
            return;
        }
        
        // 检查坐标是否在Canvas范围内
        const cssWidth = parseInt(this.canvas.style.width);
        const cssHeight = parseInt(this.canvas.style.height);
        if (this.centerX > cssWidth || this.centerY > cssHeight) {
            console.warn('⚠️ 表盘中心点超出Canvas范围:', {
                centerX: this.centerX,
                centerY: this.centerY,
                cssWidth: cssWidth,
                cssHeight: cssHeight
            });
        }
        
        // 绘制外圆
        console.log('⭕ 绘制外圆...', {
            centerX: this.centerX,
            centerY: this.centerY,
            radius: this.radius
        });
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 3;
        ctx.stroke();
        console.log('✅ 外圆绘制完成');

        // 绘制小时刻度和数字
        console.log('🕐 开始绘制小时刻度和数字...');
        for (let i = 1; i <= 12; i++) {
            const angle = (i * 30 - 90) * Math.PI / 180; // 每小时30度，从12点开始
            
            // 刻度线
            const x1 = this.centerX + (this.radius - 20) * Math.cos(angle);
            const y1 = this.centerY + (this.radius - 20) * Math.sin(angle);
            const x2 = this.centerX + this.radius * Math.cos(angle);
            const y2 = this.centerY + this.radius * Math.sin(angle);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // 数字
            const textX = this.centerX + (this.radius - 35) * Math.cos(angle);
            const textY = this.centerY + (this.radius - 35) * Math.sin(angle);
            ctx.fillStyle = '#333333';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(i.toString(), textX, textY);
            
            if (i === 1 || i === 12) {
                console.log(`🔢 数字${i}位置:`, { 
                    angle: angle * 180 / Math.PI, 
                    textX, 
                    textY,
                    刻度线: { x1, y1, x2, y2 }
                });
            }
        }
        console.log('✅ 小时刻度和数字绘制完成');

        // 绘制分钟刻度
        console.log('⏱️ 开始绘制分钟刻度...');
        let minuteMarkCount = 0;
        for (let i = 0; i < 60; i++) {
            if (i % 5 !== 0) { // 跳过小时刻度位置
                const angle = (i * 6 - 90) * Math.PI / 180;
                const x1 = this.centerX + (this.radius - 10) * Math.cos(angle);
                const y1 = this.centerY + (this.radius - 10) * Math.sin(angle);
                const x2 = this.centerX + this.radius * Math.cos(angle);
                const y2 = this.centerY + this.radius * Math.sin(angle);
                
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = '#666666';
                ctx.lineWidth = 1;
                ctx.stroke();
                minuteMarkCount++;
            }
        }
        console.log(`✅ 分钟刻度绘制完成，共绘制${minuteMarkCount}个刻度`);

        // 绘制中心点
        console.log('🎯 绘制中心点...', {
            centerX: this.centerX,
            centerY: this.centerY
        });
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#333333';
        ctx.fill();
        console.log('✅ 中心点绘制完成');
        
        console.log('🎨 表盘绘制全部完成');
    }

    /**
     * 绘制时钟指针
     * @param {Object} time - 时间对象
     */
    drawHands(time) {
        console.log('🕐 绘制时钟指针开始:', time);
        
        // 计算角度
        const hourAngle = this.calculateHourAngle(time.hours, time.minutes);
        const minuteAngle = this.calculateMinuteAngle(time.minutes);
        const secondAngle = this.calculateSecondAngle(time.seconds);

        console.log('📐 指针角度计算结果:', {
            hour: { degrees: hourAngle * 180 / Math.PI, radians: hourAngle },
            minute: { degrees: minuteAngle * 180 / Math.PI, radians: minuteAngle },
            second: { degrees: secondAngle * 180 / Math.PI, radians: secondAngle }
        });

        // 绘制时针
        console.log('🕐 绘制时针...');
        this.drawHourHand(hourAngle);
        console.log('✅ 时针绘制完成');
        
        // 绘制分针
        console.log('🕑 绘制分针...');
        this.drawMinuteHand(minuteAngle);
        console.log('✅ 分针绘制完成');
        
        // 绘制秒针
        console.log('🕒 绘制秒针...');
        this.drawSecondHand(secondAngle);
        console.log('✅ 秒针绘制完成');
        
        console.log('🕐 所有指针绘制完成');
    }

    /**
     * 计算时针角度
     * @param {number} hours - 小时
     * @param {number} minutes - 分钟
     * @returns {number} 角度（弧度）
     */
    calculateHourAngle(hours, minutes) {
        // 每小时30度，每分钟0.5度
        const angle = ((hours % 12) * 30 + minutes * 0.5 - 90) * Math.PI / 180;
        return angle;
    }

    /**
     * 计算分针角度
     * @param {number} minutes - 分钟
     * @returns {number} 角度（弧度）
     */
    calculateMinuteAngle(minutes) {
        // 每分钟6度
        const angle = (minutes * 6 - 90) * Math.PI / 180;
        return angle;
    }

    /**
     * 计算秒针角度
     * @param {number} seconds - 秒
     * @returns {number} 角度（弧度）
     */
    calculateSecondAngle(seconds) {
        // 每秒6度
        const angle = (seconds * 6 - 90) * Math.PI / 180;
        return angle;
    }

    /**
     * 绘制时针
     * @param {number} angle - 角度（弧度）
     */
    drawHourHand(angle) {
        const length = this.radius * 0.5;
        const startX = this.centerX;
        const startY = this.centerY;
        const endX = this.centerX + length * Math.cos(angle);
        const endY = this.centerY + length * Math.sin(angle);
        
        console.log('🕐 绘制时针:', {
            angle: {
                degrees: angle * 180 / Math.PI,
                radians: angle
            },
            length: length,
            coordinates: {
                start: { x: startX, y: startY },
                end: { x: endX, y: endY }
            },
            lineWidth: 6,
            center: { x: this.centerX, y: this.centerY },
            radius: this.radius
        });
        
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
        
        console.log('✅ 时针绘制完成');
    }

    /**
     * 绘制分针
     * @param {number} angle - 角度（弧度）
     */
    drawMinuteHand(angle) {
        const length = this.radius * 0.7;
        const startX = this.centerX;
        const startY = this.centerY;
        const endX = this.centerX + length * Math.cos(angle);
        const endY = this.centerY + length * Math.sin(angle);
        
        console.log('🕑 绘制分针:', {
            angle: {
                degrees: angle * 180 / Math.PI,
                radians: angle
            },
            length: length,
            coordinates: {
                start: { x: startX, y: startY },
                end: { x: endX, y: endY }
            },
            lineWidth: 4,
            center: { x: this.centerX, y: this.centerY },
            radius: this.radius
        });
        
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
        
        console.log('✅ 分针绘制完成');
    }

    /**
     * 绘制秒针
     * @param {number} angle - 角度（弧度）
     */
    drawSecondHand(angle) {
        const length = this.radius * 0.8;
        const startX = this.centerX;
        const startY = this.centerY;
        const endX = this.centerX + length * Math.cos(angle);
        const endY = this.centerY + length * Math.sin(angle);
        
        console.log('🕒 绘制秒针:', {
            angle: {
                degrees: angle * 180 / Math.PI,
                radians: angle
            },
            length: length,
            coordinates: {
                start: { x: startX, y: startY },
                end: { x: endX, y: endY }
            },
            lineWidth: 2,
            center: { x: this.centerX, y: this.centerY },
            radius: this.radius
        });
        
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
        
        console.log('✅ 秒针绘制完成');
    }

    /**
     * 绘制参考线
     * @param {Object} time - 时间对象
     */
    drawGuideLines(time) {
        console.log('📏 [DEBUG] 开始绘制参考线:', { time, showGuideLines: this.showGuideLines });
        console.log('🔍 [DEBUG] Canvas状态检查:', {
            isCanvasSupported: this.isCanvasSupported,
            ctx: !!this.ctx,
            centerX: this.centerX,
            centerY: this.centerY,
            radius: this.radius
        });
        
        if (!this.showGuideLines || !this.isCanvasSupported) {
            console.log('⏭️ [DEBUG] 跳过参考线绘制:', { showGuideLines: this.showGuideLines, isCanvasSupported: this.isCanvasSupported });
            return;
        }

        try {
            const ctx = this.ctx;
            
            // 验证上下文是否可用
            if (!ctx) {
                console.warn('⚠️ [DEBUG] Canvas上下文不可用，无法绘制参考线');
                this.handleGuideLineError('Canvas上下文丢失');
                return;
            }
            console.log('✅ [DEBUG] Canvas上下文验证通过');
            
            // 检查Canvas状态
            console.log('🔍 [DEBUG] Canvas当前状态:', {
                fillStyle: ctx.fillStyle,
                strokeStyle: ctx.strokeStyle,
                lineWidth: ctx.lineWidth,
                lineDash: ctx.getLineDash()
            });
            
            // 计算角度
            const hourAngle = this.calculateHourAngle(time.hours, time.minutes);
            const minuteAngle = this.calculateMinuteAngle(time.minutes);
            const secondAngle = this.calculateSecondAngle(time.seconds);

            console.log('📐 [DEBUG] 参考线角度计算:', {
                hour: { degrees: hourAngle * 180 / Math.PI, radians: hourAngle },
                minute: { degrees: minuteAngle * 180 / Math.PI, radians: minuteAngle },
                second: { degrees: secondAngle * 180 / Math.PI, radians: secondAngle }
            });

            // 保存当前绘图状态
            ctx.save();
            console.log('💾 [DEBUG] 参考线绘制状态已保存');
            
            try {
                // 设置参考线样式
                ctx.strokeStyle = '#ff0000'; // 红色参考线，更清晰可见
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]); // 虚线样式
                console.log('🎨 [DEBUG] 参考线样式设置完成:', {
                    strokeStyle: ctx.strokeStyle,
                    lineWidth: ctx.lineWidth,
                    lineDash: ctx.getLineDash()
                });

                // 绘制时针参考线
                console.log('📏 [DEBUG] 开始绘制时针参考线...');
                this.drawGuideLine(hourAngle);
                console.log('✅ [DEBUG] 时针参考线绘制完成');
                
                // 绘制分针参考线
                console.log('📏 [DEBUG] 开始绘制分针参考线...');
                this.drawGuideLine(minuteAngle);
                console.log('✅ [DEBUG] 分针参考线绘制完成');
                
                // 绘制秒针参考线（如果有秒数）
                if (time.seconds !== undefined && time.seconds !== 0) {
                    console.log('📏 [DEBUG] 开始绘制秒针参考线...');
                    this.drawGuideLine(secondAngle);
                    console.log('✅ [DEBUG] 秒针参考线绘制完成');
                } else {
                    console.log('⏭️ [DEBUG] 跳过秒针参考线（秒数为0或未定义）');
                }
                
                console.log('✅ [DEBUG] 所有参考线绘制完成');
                
            } catch (drawError) {
                console.error('❌ [DEBUG] 参考线绘制过程中出错:', drawError);
                console.error('❌ [DEBUG] 参考线绘制错误堆栈:', drawError.stack);
                this.handleGuideLineError('参考线绘制失败: ' + drawError.message);
            } finally {
                // 恢复绘图状态
                ctx.restore();
                console.log('🔄 [DEBUG] 参考线绘制状态已恢复');
                
                // 检查恢复后的Canvas状态
                console.log('🔍 [DEBUG] Canvas恢复后状态:', {
                    fillStyle: ctx.fillStyle,
                    strokeStyle: ctx.strokeStyle,
                    lineWidth: ctx.lineWidth,
                    lineDash: ctx.getLineDash()
                });
            }
            
        } catch (error) {
            console.error('❌ [DEBUG] 参考线绘制失败:', error);
            console.error('❌ [DEBUG] 参考线错误堆栈:', error.stack);
            this.handleGuideLineError('参考线功能异常: ' + error.message);
        }
    }

    /**
     * 绘制单条参考线
     * @param {number} angle - 角度（弧度）
     * @param {string} color - 颜色（可选，使用父级设置的样式）
     */
    drawGuideLine(angle, color) {
        try {
            const ctx = this.ctx;
            
            // 验证参数
            if (typeof angle !== 'number' || isNaN(angle)) {
                console.warn('无效的角度值:', angle);
                return;
            }
            
            // 计算终点坐标
            const endX = this.centerX + this.radius * Math.cos(angle);
            const endY = this.centerY + this.radius * Math.sin(angle);
            
            // 验证坐标是否有效
            if (isNaN(endX) || isNaN(endY)) {
                console.warn('计算出的坐标无效:', { endX, endY, angle });
                return;
            }

            // 保存当前状态（避免影响其他绘制）
            ctx.save();
            
            try {
                // 只有在明确指定颜色时才覆盖样式
                if (color && typeof color === 'string') {
                    ctx.strokeStyle = color;
                }
                // 否则使用父级drawGuideLines中设置的样式
                
                ctx.beginPath();
                ctx.moveTo(this.centerX, this.centerY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
                
                console.log('✅ 参考线绘制完成:', {
                    angle: angle * 180 / Math.PI + '°',
                    endPoint: { x: endX.toFixed(1), y: endY.toFixed(1) }
                });
            } finally {
                // 恢复状态
                ctx.restore();
            }
        } catch (error) {
            console.error('绘制单条参考线失败:', error);
            // 不抛出错误，避免影响整体渲染
        }
    }

    /**
     * 处理参考线错误
     * @param {string} errorMessage - 错误消息
     */
    handleGuideLineError(errorMessage) {
        console.warn('参考线功能出现问题:', errorMessage);
        
        // 禁用参考线功能
        this.showGuideLines = false;
        
        // 更新UI状态
        const guideToggle = document.getElementById('guide-lines-toggle');
        if (guideToggle) {
            guideToggle.checked = false;
            guideToggle.disabled = true;
            
            const toggleContainer = guideToggle.closest('.reference-line-toggle');
            if (toggleContainer) {
                toggleContainer.style.opacity = '0.5';
                toggleContainer.style.cursor = 'not-allowed';
                toggleContainer.title = `参考线功能暂时不可用: ${errorMessage}`;
            }
        }
        
        // 显示用户友好的提示
        this.showGuideLineErrorMessage(errorMessage);
    }

    /**
     * 显示参考线错误消息
     * @param {string} errorMessage - 错误消息
     */
    showGuideLineErrorMessage(errorMessage) {
        // 创建或更新错误提示
        let errorElement = document.getElementById('guide-line-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'guide-line-error';
            errorElement.className = 'error-message guide-line-error';
            
            const clockContainer = document.querySelector('.clock-container');
            if (clockContainer) {
                clockContainer.appendChild(errorElement);
            }
        }
        
        errorElement.textContent = `参考线功能暂时不可用: ${errorMessage}`;
        errorElement.style.display = 'block';
        
        // 3秒后自动隐藏
        setTimeout(() => {
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }, 3000);
    }

    /**
     * 尝试恢复参考线功能
     * @returns {boolean} 恢复是否成功
     */
    tryRecoverGuideLines() {
        try {
            // 检查Canvas和上下文是否正常
            if (!this.isCanvasSupported || !this.ctx) {
                console.log('Canvas不支持，无法恢复参考线功能');
                return false;
            }
            
            // 尝试简单的绘制操作
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.restore();
            
            // 重新启用参考线功能
            const guideToggle = document.getElementById('guide-lines-toggle');
            if (guideToggle) {
                guideToggle.disabled = false;
                
                const toggleContainer = guideToggle.closest('.reference-line-toggle');
                if (toggleContainer) {
                    toggleContainer.style.opacity = '1';
                    toggleContainer.style.cursor = 'pointer';
                    toggleContainer.title = '切换参考线显示';
                }
            }
            
            // 隐藏错误消息
            const errorElement = document.getElementById('guide-line-error');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
            
            console.log('参考线功能已恢复');
            return true;
        } catch (error) {
            console.error('恢复参考线功能失败:', error);
            return false;
        }
    }

    /**
     * 切换参考线显示状态
     */
    toggleGuideLines() {
        this.showGuideLines = !this.showGuideLines;
        return this.showGuideLines;
    }

    /**
     * 设置参考线显示状态
     * @param {boolean} show - 是否显示参考线
     */
    setGuideLines(show) {
        this.showGuideLines = show;
    }

    /**
     * 获取参考线显示状态
     * @returns {boolean} 是否显示参考线
     */
    getGuideLinesStatus() {
        return this.showGuideLines;
    }

    /**
     * 降级渲染（当Canvas不支持时）
     * @param {Object} time - 时间对象
     */
    renderFallback(time) {
        try {
            // 验证时间对象
            if (!this.validateTime(time)) {
                console.error('降级渲染收到无效时间对象:', time);
                this.renderFallbackError('时间数据无效');
                return;
            }

            // 格式化时间字符串
            const timeString = this.formatTimeForFallback(time);
            
            // 尝试更新主要的数字时钟显示
            const fallbackElement = document.getElementById('digital-time');
            if (fallbackElement) {
                fallbackElement.textContent = timeString;
                fallbackElement.classList.remove('error');
            }
            
            // 尝试更新紧急时钟显示
            const emergencyElement = document.getElementById('emergency-time');
            if (emergencyElement) {
                emergencyElement.textContent = timeString;
                emergencyElement.classList.remove('error');
            }
            
            // 确保正确的界面显示状态
            this.ensureFallbackDisplay();
            
            // 禁用参考线功能
            this.disableGuideLineFeature('Canvas不支持');
            
            console.log('降级渲染完成:', timeString);
            
        } catch (error) {
            console.error('降级渲染失败:', error);
            this.renderFallbackError('降级渲染异常');
        }
    }

    /**
     * 格式化时间用于降级显示
     * @param {Object} time - 时间对象
     * @returns {string} 格式化的时间字符串
     */
    formatTimeForFallback(time) {
        try {
            const hours = time.hours.toString().padStart(2, '0');
            const minutes = time.minutes.toString().padStart(2, '0');
            const seconds = time.seconds.toString().padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
        } catch (error) {
            console.error('格式化降级时间失败:', error);
            return '00:00:00';
        }
    }

    /**
     * 确保降级显示界面正确
     */
    ensureFallbackDisplay() {
        try {
            // 隐藏Canvas
            if (this.canvas) {
                this.canvas.style.display = 'none';
            }
            
            // 显示降级界面
            const fallback = document.getElementById('clock-fallback');
            if (fallback) {
                fallback.style.display = 'flex';
            } else {
                // 如果降级界面不存在，创建一个
                this.createFallbackInterface();
            }
            
            // 如果有紧急界面，也要显示
            const emergency = document.getElementById('emergency-clock');
            if (emergency) {
                emergency.style.display = 'block';
            }
            
        } catch (error) {
            console.error('确保降级显示失败:', error);
        }
    }

    /**
     * 渲染降级错误状态
     * @param {string} errorMessage - 错误消息
     */
    renderFallbackError(errorMessage) {
        try {
            console.error('降级渲染错误:', errorMessage);
            
            // 更新所有可能的时间显示元素为错误状态
            const timeElements = [
                document.getElementById('digital-time'),
                document.getElementById('emergency-time')
            ];
            
            timeElements.forEach(element => {
                if (element) {
                    element.textContent = '时钟错误';
                    element.classList.add('error');
                    element.title = errorMessage;
                }
            });
            
            // 显示错误提示
            this.showFallbackErrorMessage(errorMessage);
            
        } catch (error) {
            console.error('渲染降级错误状态也失败:', error);
            
            // 最后的最后，尝试在页面上显示基本错误信息
            try {
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #ffebee;
                    border: 2px solid #f44336;
                    padding: 20px;
                    border-radius: 8px;
                    z-index: 9999;
                    text-align: center;
                `;
                errorDiv.innerHTML = `
                    <div style="color: #d32f2f; font-weight: bold;">时钟显示功能异常</div>
                    <div style="margin-top: 10px; font-size: 14px;">${errorMessage}</div>
                    <button onclick="this.parentElement.remove()" style="margin-top: 10px;">关闭</button>
                `;
                document.body.appendChild(errorDiv);
                
                // 5秒后自动移除
                setTimeout(() => {
                    if (errorDiv.parentElement) {
                        errorDiv.remove();
                    }
                }, 5000);
            } catch (finalError) {
                console.error('最终错误显示也失败:', finalError);
            }
        }
    }

    /**
     * 显示降级错误消息
     * @param {string} errorMessage - 错误消息
     */
    showFallbackErrorMessage(errorMessage) {
        try {
            let errorElement = document.getElementById('fallback-error');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.id = 'fallback-error';
                errorElement.className = 'error-message fallback-error';
                
                const clockContainer = document.querySelector('.clock-container') || 
                                      document.querySelector('.clock-section') ||
                                      document.body;
                clockContainer.appendChild(errorElement);
            }
            
            errorElement.innerHTML = `
                <div class="error-content">
                    <span class="error-icon">⚠️</span>
                    <span class="error-text">时钟显示异常: ${errorMessage}</span>
                    <button class="error-close" onclick="this.parentElement.parentElement.style.display='none'">×</button>
                </div>
            `;
            errorElement.style.display = 'block';
            
            // 10秒后自动隐藏
            setTimeout(() => {
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
            }, 10000);
        } catch (error) {
            console.error('显示降级错误消息失败:', error);
        }
    }



    /**
     * 尝试恢复Canvas功能
     * @returns {boolean} 恢复是否成功
     */
    tryRecoverCanvas() {
        try {
            console.log('尝试恢复Canvas功能...');
            
            // 重新检测Canvas支持
            this.checkCanvasSupport();
            
            if (this.isCanvasSupported) {
                // 重新初始化Canvas
                this.initializeCanvas();
                console.log('Canvas功能已恢复');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('恢复Canvas功能失败:', error);
            return false;
        }
    }

    /**
     * 检查Canvas是否可用
     * @returns {boolean} Canvas是否可用
     */
    isCanvasAvailable() {
        return this.isCanvasSupported;
    }

    /**
     * 重新初始化渲染器
     */
    reinitialize() {
        this.checkCanvasSupport();
        if (this.isCanvasSupported && this.canvas) {
            this.initializeCanvas();
        } else {
            this.initializeFallback();
        }
    }

    /**
     * 显示Canvas恢复消息
     */
    showCanvasRecoveryMessage() {
        try {
            let messageElement = document.getElementById('canvas-recovery');
            if (!messageElement) {
                messageElement = document.createElement('div');
                messageElement.id = 'canvas-recovery';
                messageElement.className = 'success-message canvas-recovery';
                
                const clockContainer = document.querySelector('.clock-container') || 
                                      document.querySelector('.clock-section');
                if (clockContainer) {
                    clockContainer.appendChild(messageElement);
                }
            }
            
            messageElement.innerHTML = `
                <div class="success-content">
                    <span class="success-icon">✅</span>
                    <span class="success-text">时钟显示功能已恢复，参考线功能可用</span>
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
            console.error('显示Canvas恢复消息失败:', error);
        }
    }

    /**
     * 处理Canvas渲染失败的降级方案
     * @param {string} errorMessage - 错误消息
     */
    handleCanvasRenderFailure(errorMessage) {
        console.error('Canvas渲染失败:', errorMessage);
        
        // 标记Canvas为不支持
        this.isCanvasSupported = false;
        
        // 切换到降级模式
        this.initializeFallback();
        
        // 显示渲染失败提示
        this.showCanvasRenderFailureMessage(errorMessage);
        
        // 记录渲染失败统计
        this.recordCanvasError('render_failure', errorMessage);
        
        // 尝试自动恢复（延迟执行）
        setTimeout(() => {
            this.attemptCanvasRecovery();
        }, 3000);
    }

    /**
     * 显示Canvas渲染失败消息
     * @param {string} errorMessage - 错误消息
     */
    showCanvasRenderFailureMessage(errorMessage) {
        try {
            let errorElement = document.getElementById('canvas-render-error');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.id = 'canvas-render-error';
                errorElement.className = 'error-message canvas-error';
                
                const clockContainer = document.querySelector('.clock-container') || 
                                      document.querySelector('.clock-section');
                if (clockContainer) {
                    clockContainer.appendChild(errorElement);
                }
            }
            
            errorElement.innerHTML = `
                <div class="error-content">
                    <span class="error-icon">⚠️</span>
                    <span class="error-text">时钟渲染异常，已切换到数字显示模式</span>
                    <button class="error-close" onclick="this.parentElement.parentElement.style.display='none'">×</button>
                </div>
            `;
            errorElement.style.display = 'block';
            
            // 8秒后自动隐藏
            setTimeout(() => {
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
            }, 8000);
        } catch (error) {
            console.error('显示Canvas渲染失败消息失败:', error);
        }
    }

    /**
     * 记录Canvas错误统计
     * @param {string} errorType - 错误类型
     * @param {string} errorMessage - 错误消息
     */
    recordCanvasError(errorType, errorMessage) {
        try {
            if (!this.canvasErrorStats) {
                this.canvasErrorStats = {};
            }
            
            const errorKey = errorType.replace(/[^a-zA-Z0-9]/g, '_');
            this.canvasErrorStats[errorKey] = (this.canvasErrorStats[errorKey] || 0) + 1;
            this.canvasErrorStats.lastError = {
                type: errorType,
                message: errorMessage,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            };
            
            console.log('Canvas错误统计:', this.canvasErrorStats);
        } catch (error) {
            console.warn('记录Canvas错误统计失败:', error);
        }
    }

    /**
     * 尝试Canvas自动恢复
     */
    attemptCanvasRecovery() {
        try {
            console.log('尝试Canvas自动恢复...');
            
            // 检查是否可以恢复
            if (this.tryRecoverCanvas()) {
                // 触发恢复事件
                const event = new CustomEvent('canvasRecovered', {
                    detail: {
                        timestamp: new Date(),
                        errorStats: this.canvasErrorStats
                    }
                });
                document.dispatchEvent(event);
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Canvas自动恢复失败:', error);
            return false;
        }
    }

    /**
     * 获取Canvas错误统计
     * @returns {Object} 错误统计信息
     */
    getCanvasErrorStats() {
        return this.canvasErrorStats || {};
    }

    /**
     * 清除Canvas错误统计
     */
    clearCanvasErrorStats() {
        this.canvasErrorStats = {};
        console.log('Canvas错误统计已清除');
    }

    /**
     * 获取Canvas支持状态
     * @returns {boolean} 是否支持Canvas
     */
    isCanvasAvailable() {
        return this.isCanvasSupported;
    }

    /**
     * 重新初始化渲染器
     */
    reinitialize() {
        this.checkCanvasSupport();
        if (this.isCanvasSupported && this.canvas) {
            this.initializeCanvas();
        } else {
            this.initializeFallback();
        }
    }

    /**
     * 设置自动走动状态
     * @param {boolean} enabled - 是否启用自动走动
     */
    setAutoTick(enabled) {
        this.autoTick = enabled;
        
        if (enabled) {
            this.startAutoTick();
        } else {
            this.stopAutoTick();
        }
    }

    /**
     * 开始自动走动
     */
    startAutoTick() {
        console.log('⏰ 开始自动走动功能:', {
            currentAutoTick: this.autoTick,
            showCurrentTime: this.showCurrentTime,
            currentTime: this.currentTime,
            hasExistingInterval: !!this.tickInterval
        });
        
        // 先停止现有的定时器
        this.stopAutoTick();
        
        this.autoTick = true;
        console.log('✅ 自动走动状态已设置为true');
        
        // 设置定时器，每秒更新一次
        this.tickInterval = setInterval(() => {
            console.log('⏱️ 定时器触发，更新时间...');
            
            try {
                if (this.showCurrentTime) {
                    // 如果显示当前时间，获取系统时间
                    const now = new Date();
                    this.currentTime = {
                        hours: now.getHours() % 12,
                        minutes: now.getMinutes(),
                        seconds: now.getSeconds()
                    };
                    console.log('🕐 更新为系统当前时间:', this.currentTime);
                } else {
                    // 否则递增时间
                    if (this.currentTime) {
                        this.currentTime.seconds++;
                        if (this.currentTime.seconds >= 60) {
                            this.currentTime.seconds = 0;
                            this.currentTime.minutes++;
                            if (this.currentTime.minutes >= 60) {
                                this.currentTime.minutes = 0;
                                this.currentTime.hours++;
                                if (this.currentTime.hours >= 12) {
                                    this.currentTime.hours = 0;
                                }
                            }
                        }
                        console.log('🕐 递增时间:', this.currentTime);
                    } else {
                        console.warn('⚠️ currentTime为空，无法递增');
                    }
                }
                
                // 重新渲染时钟
                if (this.currentTime) {
                    console.log('🎨 自动走动触发重新渲染');
                    this.render(this.currentTime, this.showGuideLines);
                }
                
            } catch (error) {
                console.error('❌ 自动走动更新时间失败:', error);
                console.error('❌ 自动走动错误堆栈:', error.stack);
            }
        }, 1000);
        
        console.log('✅ 自动走动定时器已启动，间隔1秒');
    }

    /**
     * 停止自动走动
     */
    stopAutoTick() {
        console.log('⏹️ 停止自动走动功能:', {
            currentAutoTick: this.autoTick,
            hasInterval: !!this.tickInterval,
            intervalId: this.tickInterval
        });
        
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
            console.log('✅ 定时器已清除');
        } else {
            console.log('ℹ️ 没有活动的定时器需要清除');
        }
        
        this.autoTick = false;
        console.log('✅ 自动走动状态已设置为false');
    }

    /**
     * 设置是否显示当前时间
     * @param {boolean} show - 是否显示当前时间
     */
    setShowCurrentTime(show) {
        console.log('🕐 设置显示当前时间:', {
            from: this.showCurrentTime,
            to: show,
            currentTime: this.currentTime,
            autoTick: this.autoTick
        });
        
        // 只在开启显示当前时间时才重置Canvas状态
        if (show && this.showCurrentTime !== show) {
            // 只在Canvas未正确初始化时才重置状态
            if (this.ctx && this.canvas && (!this.isCanvasInitialized() || this.needsReinitialize)) {
                try {
                    // 完全重置变换矩阵
                    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                    console.log('🔄 开启显示当前时间时重置Canvas变换矩阵');
                    
                    // 重新应用设备像素比缩放
                    const devicePixelRatio = window.devicePixelRatio || 1;
                    this.ctx.scale(devicePixelRatio, devicePixelRatio);
                    console.log('🔄 开启显示当前时间时重新应用设备像素比缩放');
                } catch (error) {
                    console.error('❌ 开启显示当前时间时重置Canvas失败:', error);
                }
            } else {
                console.log('⏭️ Canvas状态正常，跳过重置');
            }
        }
        
        this.showCurrentTime = show;
        console.log('✅ showCurrentTime状态已更新');
    }

    /**
     * 设置显示时间
     * @param {Object} time - 时间对象
     */
    setDisplayTime(time) {
        console.log('⏰ 设置显示时间:', {
            from: this.currentTime,
            to: time,
            showCurrentTime: this.showCurrentTime,
            autoTick: this.autoTick
        });
        
        if (this.validateTime(time)) {
            this.currentTime = { ...time };
            console.log('✅ 显示时间已更新');
        } else {
            console.error('❌ 无效的时间对象，设置失败:', time);
        }
    }

    /**
     * 获取当前显示时间
     * @returns {Object} 当前显示的时间对象
     */
    getCurrentDisplayTime() {
        return this.currentTime ? { ...this.currentTime } : null;
    }

    /**
     * 重置Canvas状态
     */
    resetCanvas() {
        try {
            if (!this.isCanvasSupported || !this.canvas || !this.ctx) {
                console.warn('Canvas不可用，无法重置');
                return;
            }

            // 强制重置Canvas参数
            this.centerX = 0;
            this.centerY = 0;
            this.radius = 0;
            
            // 重新初始化Canvas设置
            this.initializeCanvas();
            
            // 清空画布（使用CSS逻辑坐标系统）
            const cssWidth = parseInt(this.canvas.style.width) || 350;
            const cssHeight = parseInt(this.canvas.style.height) || 350;
            this.ctx.clearRect(0, 0, cssWidth, cssHeight);
            
            console.log('Canvas状态已重置');
            
        } catch (error) {
            console.error('重置Canvas状态失败:', error);
        }
    }

    /**
     * 清理所有资源和定时器
     * 在页面卸载时调用，防止内存泄漏
     */
    cleanup() {
        console.log('🧹 开始清理ClockRenderer资源...');
        
        try {
            // 停止自动走动（这会清理tickInterval）
            this.stopAutoTick();
            
            // 清除其他定时器（避免重复清理tickInterval）
            if (this.initTimeout) {
                clearTimeout(this.initTimeout);
                this.initTimeout = null;
                console.log('✅ 初始化定时器已清除');
            }
            
            if (this.renderTimeout) {
                clearTimeout(this.renderTimeout);
                this.renderTimeout = null;
                console.log('✅ 渲染定时器已清除');
            }
            
            // 注意：tickInterval已经在stopAutoTick()中清理了，不需要重复清理
            
            // 清理Canvas上下文
            if (this.ctx && this.canvas) {
                try {
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    console.log('✅ Canvas已清空');
                } catch (canvasError) {
                    console.warn('⚠️ 清空Canvas时出错:', canvasError);
                }
            }
            
            // 重置状态变量
            this.autoTick = false;
            this.showCurrentTime = false;
            this.showGuideLines = false;
            this.currentTime = null;
            this.needsReinitialize = false;
            
            // 重置Canvas参数
            this.centerX = 0;
            this.centerY = 0;
            this.radius = 0;
            
            console.log('✅ ClockRenderer资源清理完成');
            
        } catch (error) {
            console.error('❌ ClockRenderer资源清理失败:', error);
            // 即使清理失败，也要确保关键状态被重置
            try {
                this.autoTick = false;
                this.tickInterval = null;
                this.renderTimeout = null;
                this.initTimeout = null;
                console.log('✅ 关键状态已强制重置');
            } catch (resetError) {
                console.error('❌ 强制重置状态也失败:', resetError);
            }
        }
    }

    /**
     * 析构函数（当对象被销毁时调用）
     */
    destroy() {
        console.log('🗑️ 销毁ClockRenderer实例...');
        this.cleanup();
        console.log('✅ ClockRenderer实例已销毁');
    }

    /**
     * 处理显示当前时间切换时的Canvas重置
     */
    handleCurrentTimeToggle() {
        console.log('🔄 处理显示当前时间切换时的Canvas重置');
        
        try {
            // 保存当前状态
            const wasInitialized = this.isCanvasInitialized();
            const oldCenterX = this.centerX;
            const oldCenterY = this.centerY;
            const oldRadius = this.radius;
            
            // 强制重新初始化Canvas
            this.forceReinitialize();
            
            // 验证重置结果
            if (!this.isCanvasInitialized()) {
                console.error('❌ Canvas重置失败，尝试紧急恢复');
                this.attemptEmergencyRecovery();
            } else {
                console.log('✅ Canvas重置成功:', {
                    wasInitialized: wasInitialized,
                    oldParams: { centerX: oldCenterX, centerY: oldCenterY, radius: oldRadius },
                    newParams: { centerX: this.centerX, centerY: this.centerY, radius: this.radius }
                });
            }
            
        } catch (error) {
            console.error('❌ 处理显示当前时间切换时Canvas重置失败:', error);
            this.attemptEmergencyRecovery();
        }
    }

    /**
     * 紧急恢复Canvas状态
     */
    attemptEmergencyRecovery() {
        console.log('🚨 尝试紧急恢复Canvas状态');
        
        try {
            // 完全重置所有参数
            this.centerX = 0;
            this.centerY = 0;
            this.radius = 0;
            this.needsReinitialize = true;
            
            // 重新检测Canvas支持
            this.checkCanvasSupport();
            
            // 重新初始化
            if (this.isCanvasSupported && this.canvas) {
                this.performCanvasInitialization();
                
                if (this.isCanvasInitialized()) {
                    console.log('✅ 紧急恢复成功');
                } else {
                    console.error('❌ 紧急恢复失败');
                }
            } else {
                console.error('❌ Canvas不支持，无法进行紧急恢复');
            }
            
        } catch (error) {
            console.error('❌ 紧急恢复失败:', error);
        }
    }
}
