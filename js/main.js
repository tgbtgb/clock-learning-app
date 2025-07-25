/**
 * 应用入口文件
 * 初始化应用控制器
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    try {
        // 创建应用控制器实例
        const app = new AppController();
        
        // 初始化应用
        app.init();
        
        // 将应用实例挂载到全局对象，便于调试
        window.clockLearningApp = app;
        
        console.log('时钟学习应用启动成功');
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
    // 这里可以添加清理逻辑，比如保存用户进度等
    console.log('应用即将关闭');
});

// 处理页面可见性变化
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('页面已隐藏');
    } else {
        console.log('页面已显示');
    }
});