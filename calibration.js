(function() {
    'use strict';

    // 初始化变量
    const MAX_ALLOWED_DEVIATION = 100; // 最大允许偏差（单位：像素）
    let calibrationData = {};
    let currentPointIndex = 0;

    // 创建校准界面
    function createCalibrationUI() {
        const container = document.createElement('div');
        container.id = 'calibration-container';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100vw'; // 占据整个屏幕宽度
        container.style.height = '100vh'; // 占据整个屏幕高度
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        container.style.zIndex = '9999';
        container.style.display = 'none';

        // 校准说明
        const instructions = document.createElement('div');
        instructions.id = 'instructions';
        instructions.style.position = 'absolute';
        instructions.style.top = '50%';
        instructions.style.left = '50%';
        instructions.style.transform = 'translate(-50%, -50%)';
        instructions.style.color = '#fff';
        instructions.style.textAlign = 'center';
        instructions.innerHTML = `
            <h2>Calibration</h2>
            <p>Please click on each of the 9 points on the screen. You must click on each point 5 times until it turns yellow. This will calibrate your eye movements.</p>
            <button id="start-calibration">OK</button>
        `;
        container.appendChild(instructions);

        // 校准点
        const points = [
            { id: 1, top: '10%', left: '15%' },
            { id: 2, top: '10%', left: '50%' },
            { id: 3, top: '10%', right: '15%' },
            { id: 4, top: '50%', left: '15%' },
            { id: 5, top: '50%', right: '15%' },
            { id: 6, bottom: '10%', left: '15%' },
            { id: 7, bottom: '10%', left: '50%' },
            { id: 8, bottom: '10%', right: '15%' }
        ];
        points.forEach((point) => {
            const el = document.createElement('div');
            el.classList.add('calibration-point');
            el.dataset.id = point.id;
            el.style.position = 'absolute';
            el.style.top = point.top || 'auto';
            el.style.bottom = point.bottom || 'auto';
            el.style.left = point.left || 'auto';
            el.style.right = point.right || 'auto';
            el.style.width = '20px';
            el.style.height = '20px';
            el.style.backgroundColor = 'red';
            el.style.borderRadius = '50%';
            el.style.display = 'none';
            container.appendChild(el);
        });

        // 中间点
        const middleDot = document.createElement('div');
        middleDot.id = 'middle-dot';
        middleDot.style.position = 'absolute';
        middleDot.style.top = '50%';
        middleDot.style.left = '50%';
        middleDot.style.transform = 'translate(-50%, -50%)';
        middleDot.style.width = '20px';
        middleDot.style.height = '20px';
        middleDot.style.backgroundColor = 'green';
        middleDot.style.borderRadius = '50%';
        middleDot.style.display = 'none';
        container.appendChild(middleDot);

        // 准确率提示
        const accuracyMessage = document.createElement('div');
        accuracyMessage.id = 'accuracy-message';
        accuracyMessage.style.position = 'absolute';
        accuracyMessage.style.top = '50%';
        accuracyMessage.style.left = '50%';
        accuracyMessage.style.transform = 'translate(-50%, -50%)';
        accuracyMessage.style.color = '#fff';
        accuracyMessage.style.textAlign = 'center';
        accuracyMessage.style.display = 'none';
        accuracyMessage.innerHTML = `
            <h2>Your accuracy measure is <span id="accuracy-value">0%</span>.</h2>
            <button id="close-calibration">关闭校准</button>
        `;
        container.appendChild(accuracyMessage);

        document.body.appendChild(container);

        // 开始校准
        document.getElementById('start-calibration').addEventListener('click', () => {
            instructions.style.display = 'none';
            startCalibration();
        });

        // 关闭校准界面
        document.getElementById('close-calibration').addEventListener('click', () => {
            container.style.display = 'none'; // 隐藏校准界面
        });
    }

    // 开始校准
    function startCalibration() {
        const points = document.querySelectorAll('.calibration-point');
        points.forEach((point) => {
            point.style.display = 'block';
            calibrationData[point.dataset.id] = { clicks: 0, gazePoints: [] };
        });
        activatePoint(points[currentPointIndex]);
    }

    // 激活当前点
    function activatePoint(point) {
        point.classList.add('active');

        // 开始收集眼动数据
        webgazer.setGazeListener(function(data, elapsedTime) {
            if (data != null && point.classList.contains('active')) {
                const pointId = point.dataset.id;
                calibrationData[pointId].gazePoints.push({ x: data.x, y: data.y });
            }
        });

        point.addEventListener('click', handlePointClick);
    }

    // 处理点点击事件
    function handlePointClick(event) {
        const point = event.target;
        const pointId = point.dataset.id;

        // 更新点击次数
        calibrationData[pointId].clicks++;
        if (calibrationData[pointId].clicks >= 5) {
            point.classList.remove('active');
            point.style.display = 'none';
            point.removeEventListener('click', handlePointClick);

            // 改变按钮颜色
            changeButtonColor();

            // 检查是否完成所有边缘点
            currentPointIndex++;
            const points = document.querySelectorAll('.calibration-point');
            if (currentPointIndex < points.length) {
                activatePoint(points[currentPointIndex]);
            } else {
                startMiddleDot();
            }
        }
    }

    // 开始中间点校准
    function startMiddleDot() {
        const middleDot = document.getElementById('middle-dot');
        middleDot.style.display = 'block';

        setTimeout(() => {
            webgazer.setGazeListener(null); // 停止收集眼动数据
            calculateAccuracy();
        }, 5000); // 5 秒后停止收集
    }

    // 计算准确率
    function calculateAccuracy() {
        let totalDeviation = 0;
        let totalPoints = 0;

        for (const [pointId, data] of Object.entries(calibrationData)) {
            const targetPoint = getPointPosition(document.querySelector(`.calibration-point[data-id="${pointId}"]`));
            const gazePoints = data.gazePoints;

            for (const gazePoint of gazePoints) {
                const deviation = calculateDistance(gazePoint, targetPoint);
                totalDeviation += deviation;
                totalPoints++;
            }
        }

        const averageDeviation = totalDeviation / totalPoints;
        const accuracy = Math.max(0, (1 - averageDeviation / MAX_ALLOWED_DEVIATION) * 100).toFixed(2);

        document.getElementById('accuracy-value').textContent = `${accuracy}%`;
        document.getElementById('accuracy-message').style.display = 'block';
    }

    // 获取点的位置
    function getPointPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    // 计算两点之间的距离
    function calculateDistance(pointA, pointB) {
        return Math.sqrt(Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2));
    }

    // 改变按钮颜色
    function changeButtonColor() {
        const colors = ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3']; // 颜色列表
        const button = document.querySelector('#calibration-container button.active');
        if (button) {
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            button.style.backgroundColor = randomColor;
        }
    }

    // 初始化校准功能
    createCalibrationUI();

    // 添加启动按钮
    const calibrationButton = document.createElement('button');
    calibrationButton.innerText = '开始校准';
    calibrationButton.style.position = 'fixed';
    calibrationButton.style.top = '50px';
    calibrationButton.style.right = '10px';
    calibrationButton.style.zIndex = '9999';
    calibrationButton.style.padding = '10px';
    calibrationButton.style.backgroundColor = '#007bff';
    calibrationButton.style.color = '#fff';
    calibrationButton.style.border = 'none';
    calibrationButton.style.borderRadius = '5px';
    calibrationButton.style.cursor = 'pointer';
    calibrationButton.onclick = () => {
        document.getElementById('calibration-container').style.display = 'block';
    };
    document.body.appendChild(calibrationButton);
})();
