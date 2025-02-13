// calibration.js - 九点校准功能

(function() {
    'use strict';

    // 计算校准点位置
    const calibrationPoints = [
        { id: 'Pt1', x: 10, y: 10 },
        { id: 'Pt2', x: 30, y: 10 },
        { id: 'Pt3', x: 50, y: 10 },
        { id: 'Pt4', x: 70, y: 10 },
        { id: 'Pt5', x: 10, y: 50 },
        { id: 'Pt6', x: 30, y: 50 },
        { id: 'Pt7', x: 50, y: 50 },
        { id: 'Pt8', x: 70, y: 50 },
        { id: 'Pt9', x: 50, y: 90 }
    ];

    // 创建校准点
    function createCalibrationPoints() {
        const container = document.createElement('div');
        container.className = 'calibration-container';
        document.body.appendChild(container);

        calibrationPoints.forEach(point => {
            const button = document.createElement('button');
            button.id = point.id;
            button.className = 'calibration-point';
            button.style.position = 'absolute';
            button.style.left = `${point.x}%`;
            button.style.top = `${point.y}%`;
            button.style.backgroundColor = 'red';
            button.style.opacity = 0.2;
            button.style.borderRadius = '50%';
            button.style.width = '20px';
            button.style.height = '20px';
            button.addEventListener('click', () => onCalibrationPointClick(button));
            container.appendChild(button);
        });
    }

    // 校准点点击事件
    function onCalibrationPointClick(button) {
        button.style.backgroundColor = 'yellow';  // 成功点击，改成黄色
        button.style.opacity = 1;

        // 在这里可以调用WebGazer的校准调整方法
        if (typeof webgazer !== 'undefined') {
            webgazer.adjustCalibration(button.id); // 假设WebGazer有这个方法来调整模型
        }

        // 判断是否完成校准
        checkCalibrationCompletion();
    }

    // 检查校准是否完成
    function checkCalibrationCompletion() {
        const remainingPoints = document.querySelectorAll('.calibration-point[style*="background-color: red"]');
        if (remainingPoints.length === 0) {
            alert('校准完成!');
            // 你可以在这里执行一些动作，比如保存数据等
        }
    }

    // 启动校准
    function startCalibration() {
        createCalibrationPoints();
        console.log('九点校准已开始');
    }

    // 对外暴露开始校准的接口
    window.startCalibration = startCalibration;

})();
