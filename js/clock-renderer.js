/**
 * 时钟渲染器类
 * 使用Canvas绘制模拟时钟
 */
class ClockRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas ? canvas.getContext('2d') : null;
        this.centerX = canvas ? canvas.width / 2 : 0;
        this.centerY = canvas ? canvas.height / 2 : 0;
        this.radius = canvas ? Math.min(canvas.width, canvas.height) / 2 - 20 : 0;
        this.isCanvasSupported = !!this.ctx;
    }

    /**
     * 渲染时钟
     * @param {Object} time - 包含hours, minutes, seconds的时间对象
     */
    render(time) {
        if (!this.isCanvasSupported) {
            this.renderFallback(time);
            return;
        }

        try {
            // 清空画布
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // 绘制时钟表盘
            this.drawClockFace();
            
            // 绘制指针
            this.drawHands(time);
        } catch (error) {
            console.error('时钟渲染失败:', error);
            this.renderFallback(time);
        }
    }

    /**
     * 绘制时钟表盘
     */
    drawClockFace() {
        const ctx = this.ctx;
        
        // 绘制外圆
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 绘制小时刻度和数字
        for (let i = 1; i <= 12; i++) {
            const angle = (i * 30 - 90) * Math.PI / 180;
            const x1 = this.centerX + (this.radius - 20) * Math.cos(angle);
            const y1 = this.centerY + (this.radius - 20) * Math.sin(angle);
            const x2 = this.centerX + (this.radius - 5) * Math.cos(angle);
            const y2 = this.centerY + (this.radius - 5) * Math.sin(angle);

            // 绘制刻度线
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 3;
            ctx.stroke();

            // 绘制数字
            const textX = this.centerX + (this.radius - 35) * Math.cos(angle);
            const textY = this.centerY + (this.radius - 35) * Math.sin(angle);
            ctx.fillStyle = '#333333';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(i.toString(), textX, textY);
        }

        // 绘制分钟刻度
        for (let i = 0; i < 60; i++) {
            if (i % 5 !== 0) { // 跳过小时刻度位置
                const angle = (i * 6 - 90) * Math.PI / 180;
                const x1 = this.centerX + (this.radius - 10) * Math.cos(angle);
                const y1 = this.centerY + (this.radius - 10) * Math.sin(angle);
                const x2 = this.centerX + (this.radius - 5) * Math.cos(angle);
                const y2 = this.centerY + (this.radius - 5) * Math.sin(angle);

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = '#666666';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        // 绘制中心点
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#333333';
        ctx.fill();
    }

    /**
     * 绘制时钟指针
     * @param {Object} time - 时间对象
     */
    drawHands(time) {
        // 计算角度
        const hourAngle = this.calculateHourAngle(time.hours, time.minutes);
        const minuteAngle = this.calculateMinuteAngle(time.minutes);
        const secondAngle = this.calculateSecondAngle(time.seconds);

        // 绘制时针
        this.drawHourHand(hourAngle);
        
        // 绘制分针
        this.drawMinuteHand(minuteAngle);
        
        // 绘制秒针
        this.drawSecondHand(secondAngle);
    }

    /**
     * 计算时针角度
     * @param {number} hours - 小时
     * @param {number} minutes - 分钟
     * @returns {number} 角度（弧度）
     */
    calculateHourAngle(hours, minutes) {
        // 12小时制，每小时30度，每分钟0.5度
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
        const endX = this.centerX + length * Math.cos(angle);
        const endY = this.centerY + length * Math.sin(angle);

        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
    }

    /**
     * 绘制分针
     * @param {number} angle - 角度（弧度）
     */
    drawMinuteHand(angle) {
        const length = this.radius * 0.7;
        const endX = this.centerX + length * Math.cos(angle);
        const endY = this.centerY + length * Math.sin(angle);

        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
    }

    /**
     * 绘制秒针
     * @param {number} angle - 角度（弧度）
     */
    drawSecondHand(angle) {
        const length = this.radius * 0.8;
        const endX = this.centerX + length * Math.cos(angle);
        const endY = this.centerY + length * Math.sin(angle);

        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
    }

    /**
     * 降级渲染（当Canvas不支持时）
     * @param {Object} time - 时间对象
     */
    renderFallback(time) {
        const fallbackElement = document.getElementById('digital-time');
        if (fallbackElement) {
            const timeString = `${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}:${time.seconds.toString().padStart(2, '0')}`;
            fallbackElement.textContent = timeString;
        }
        
        // 显示降级界面
        const canvas = document.getElementById('clock-canvas');
        const fallback = document.getElementById('clock-fallback');
        if (canvas && fallback) {
            canvas.style.display = 'none';
            fallback.style.display = 'flex';
        }
    }
}