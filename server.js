const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const MetricsCollector = require('./metricsCollector');
const AlertManager = require('./alertManager');

// Express 앱 및 서버 초기화
const app = express();
const server = http.createServer(app);

// Socket.io 설정
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 메트릭 수집기 및 알림 관리자 초기화
const collector = new MetricsCollector();
const alertManager = new AlertManager();

// 시스템 정보 캐시 (서버 시작 시 한 번만 수집)
let systemInfo = null;

// 연결된 클라이언트 수 추적
let connectedClients = 0;

// ==================== REST API 엔드포인트 ====================

/**
 * 서버 상태 확인
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
    connectedClients
  });
});

/**
 * 현재 메트릭 조회
 */
app.get('/api/metrics/current', async (req, res) => {
  try {
    const metrics = await collector.getAllMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('메트릭 조회 오류:', error.message);
    res.status(500).json({ error: '메트릭을 가져올 수 없습니다' });
  }
});

/**
 * 시스템 정보 조회
 */
app.get('/api/system/info', async (req, res) => {
  try {
    if (!systemInfo) {
      systemInfo = await collector.getSystemInfo();
    }
    res.json(systemInfo);
  } catch (error) {
    console.error('시스템 정보 조회 오류:', error.message);
    res.status(500).json({ error: '시스템 정보를 가져올 수 없습니다' });
  }
});

/**
 * 알림 임계값 설정 조회
 */
app.get('/api/alerts/thresholds', (req, res) => {
  try {
    const thresholds = alertManager.getThresholds();
    res.json(thresholds);
  } catch (error) {
    console.error('임계값 조회 오류:', error.message);
    res.status(500).json({ error: '임계값을 가져올 수 없습니다' });
  }
});

/**
 * 알림 임계값 설정
 */
app.post('/api/alerts/thresholds', (req, res) => {
  try {
    const { metric, threshold, duration, enabled } = req.body;

    if (!metric) {
      return res.status(400).json({ error: 'metric 필드가 필요합니다' });
    }

    const config = {};
    if (threshold !== undefined) config.value = threshold;
    if (duration !== undefined) config.duration = duration;
    if (enabled !== undefined) config.enabled = enabled;

    alertManager.setThreshold(metric, config);

    res.json({
      success: true,
      message: '임계값이 업데이트되었습니다',
      threshold: alertManager.getThresholds()[metric]
    });
  } catch (error) {
    console.error('임계값 설정 오류:', error.message);
    res.status(400).json({ error: error.message });
  }
});

/**
 * 알림 이력 조회
 */
app.get('/api/alerts/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = alertManager.getAlertHistory(limit);
    res.json(history);
  } catch (error) {
    console.error('알림 이력 조회 오류:', error.message);
    res.status(500).json({ error: '알림 이력을 가져올 수 없습니다' });
  }
});

/**
 * 알림 상태 초기화
 */
app.post('/api/alerts/reset', (req, res) => {
  try {
    alertManager.resetAlerts();
    res.json({ success: true, message: '알림 상태가 초기화되었습니다' });
  } catch (error) {
    console.error('알림 초기화 오류:', error.message);
    res.status(500).json({ error: '알림 초기화에 실패했습니다' });
  }
});

// ==================== WebSocket 연결 관리 ====================

io.on('connection', (socket) => {
  connectedClients++;
  console.log(`✅ 클라이언트 연결됨: ${socket.id} (총 ${connectedClients}명)`);

  // 1초마다 메트릭 전송
  const metricsInterval = setInterval(async () => {
    try {
      const metrics = await collector.getAllMetrics();

      // 메트릭 전송
      socket.emit('metrics:update', metrics);

      // 알림 체크
      const alerts = alertManager.checkMetrics(metrics);

      // 알림 발생 시 전송
      if (alerts.length > 0) {
        alerts.forEach(alert => {
          socket.emit('alert:triggered', alert);
        });
      }
    } catch (error) {
      console.error('메트릭 전송 오류:', error.message);
      socket.emit('error', { message: '메트릭 수집에 실패했습니다' });
    }
  }, 1000);

  // 클라이언트가 시스템 정보 요청
  socket.on('request:system-info', async () => {
    try {
      if (!systemInfo) {
        systemInfo = await collector.getSystemInfo();
      }
      socket.emit('system:info', systemInfo);
    } catch (error) {
      console.error('시스템 정보 전송 오류:', error.message);
      socket.emit('error', { message: '시스템 정보를 가져올 수 없습니다' });
    }
  });

  // 클라이언트 연결 해제
  socket.on('disconnect', () => {
    connectedClients--;
    console.log(`❌ 클라이언트 연결 해제: ${socket.id} (총 ${connectedClients}명)`);
    clearInterval(metricsInterval);
  });

  // 에러 처리
  socket.on('error', (error) => {
    console.error('Socket 오류:', error.message);
  });
});

// ==================== 서버 시작 ====================

const PORT = process.env.PORT || 3001;

server.listen(PORT, async () => {
  console.log('='.repeat(50));
  console.log(`🚀 서버 모니터링 대시보드 서버 시작`);
  console.log(`📡 포트: ${PORT}`);
  console.log(`🌐 클라이언트 URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  console.log('='.repeat(50));

  // 시스템 정보 미리 로드
  try {
    systemInfo = await collector.getSystemInfo();
    console.log('💻 시스템 정보:');
    console.log(`   - OS: ${systemInfo.os}`);
    console.log(`   - CPU: ${systemInfo.cpuModel}`);
    console.log(`   - 코어 수: ${systemInfo.cpuCores}`);
  } catch (error) {
    console.error('⚠️  시스템 정보 로드 실패:', error.message);
  }

  console.log('='.repeat(50));
  console.log('서버가 준비되었습니다. 클라이언트 연결을 대기 중...\n');
});

// 에러 핸들링
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM 신호를 받았습니다. 서버를 종료합니다...');
  server.close(() => {
    console.log('✅ 서버가 정상적으로 종료되었습니다');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT 신호를 받았습니다. 서버를 종료합니다...');
  server.close(() => {
    console.log('✅ 서버가 정상적으로 종료되었습니다');
    process.exit(0);
  });
});
