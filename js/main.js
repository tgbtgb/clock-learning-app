/**
 * 应用入口文件
 * 初始化应用控制器
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    try {
        // 初始化性能优化器
        const performanceOptimizer = new PerformanceOptimizer();
        
        // 初始化无障碍管理器
        const accessibilityManager = new AccessibilityManager();
        
        // 创建应用控制器实例
        const app = new AppController();
        
        // 初始化应用
        app.init();
        
        // 应用性能优化
        if (app.clockRenderer) {
            performanceOptimizer.optimizeClockRenderer(app.clockRenderer);
        }
        performanceOptimizer.optimizeAppController(app);
        
        // 将应用实例挂载到全局对象，便于调试访问
        window.clockLearningApp = app;
        window.appController = app;
        window.clockRenderer = app.clockRenderer;
        window.accessibilityManager = accessibilityManager;
        window.performanceOptimizer = performanceOptimizer;
        

        
        // 添加cookie测试功能
        window.testCookieStorage = function() {
            const recordManager = appController.recordManager;
            console.log('=== Cookie存储测试 ===');
            console.log('当前记录数量:', recordManager.records.length);
            console.log('存储类型:', recordManager.storageType);
            
            // 测试保存一条记录
            const testRecord = {
                id: 'test_' + Date.now(),
                timestamp: new Date(),
                isCorrect: true,
                timeSpent: 5000,
                difficulty: 1,
                difficultyName: '简单',
                userAnswer: { hours: 3, minutes: 15, seconds: 0 },
                correctAnswer: { hours: 3, minutes: 15, seconds: 0 }
            };
            
            const saveResult = recordManager.saveRecord(testRecord);
            console.log('保存测试记录结果:', saveResult);
            console.log('保存后记录数量:', recordManager.records.length);
            
            // 检查cookie
            const cookieValue = recordManager.getCookie(recordManager.cookieName);
            console.log('Cookie存在:', !!cookieValue);
            if (cookieValue) {
                console.log('Cookie长度:', cookieValue.length);
            }
            
            return {
                recordCount: recordManager.records.length,
                saveResult: saveResult,
                cookieExists: !!cookieValue,
                storageType: recordManager.storageType
            };
        };
        

        
        console.log('时钟练习应用启动成功');
        console.log('性能优化和调试功能已启用');
        

        
    } catch (error) {
        console.error('应用启动失败:', error);
        
        // 显示错误信息给用户
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #f8d7da;
            color: #721c24;
            padding: 15px 20px;
            border: 1px solid #f5c6cb;
            border-radius: 5px;
            z-index: 1000;
            font-family: Arial, sans-serif;
        `;
        errorMessage.textContent = '应用启动失败，请刷新页面重试';
        document.body.appendChild(errorMessage);
        
        // 5秒后自动隐藏错误信息
        setTimeout(() => {
            if (errorMessage.parentNode) {
                errorMessage.parentNode.removeChild(errorMessage);
            }
        }, 5000);
    }
});

// 处理页面卸载时的清理工作
window.addEventListener('beforeunload', function() {
    console.log('🧹 页面即将关闭，开始清理所有资源...');
    
    // 使用数组来管理清理任务，确保即使某个清理失败也不影响其他清理
    const cleanupTasks = [
        {
            name: '应用控制器',
            obj: window.clockLearningApp,
            method: 'cleanup'
        },
        {
            name: '性能优化器',
            obj: window.performanceOptimizer,
            method: 'cleanup'
        },
        {
            name: '时钟渲染器',
            obj: window.clockRenderer,
            method: 'cleanup'
        },

        {
            name: '无障碍管理器',
            obj: window.accessibilityManager,
            method: 'cleanup'
        }
    ];
    
    let successCount = 0;
    let failureCount = 0;
    
    cleanupTasks.forEach(task => {
        try {
            if (task.obj && typeof task.obj[task.method] === 'function') {
                task.obj[task.method]();
                console.log(`✅ ${task.name}已清理`);
                successCount++;
            } else if (task.obj) {
                console.log(`⚠️ ${task.name}没有${task.method}方法`);
            } else {
                console.log(`ℹ️ ${task.name}未初始化，跳过清理`);
            }
        } catch (error) {
            console.error(`❌ 清理${task.name}时出错:`, error);
            failureCount++;
            
            // 尝试基本的状态重置
            try {
                if (task.obj) {
                    // 如果是时钟渲染器，尝试停止关键功能
                    if (task.name === '时钟渲染器' && typeof task.obj.stopAutoTick === 'function') {
                        task.obj.stopAutoTick();
                        console.log(`✅ ${task.name}的关键功能已停止`);
                    }
                }
            } catch (resetError) {
                console.error(`❌ 重置${task.name}状态也失败:`, resetError);
            }
        }
    });
    
    console.log(`🧹 资源清理完成: 成功 ${successCount} 个，失败 ${failureCount} 个`);
    console.log('🚪 应用即将关闭');
});

// 处理页面可见性变化
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('页面已隐藏');
    } else {
        console.log('页面已显示');
    }
});