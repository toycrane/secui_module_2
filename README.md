# 실시간 시스템 리소스 대시보드

서버의 주요 시스템 리소스를 실시간으로 모니터링하는 대시보드 구현 가이드입니다.

## 📋 목차

1. [개요](#개요)
2. [주요 기능](#주요-기능)
3. [기술 스택](#기술-스택)
4. [아키텍처](#아키텍처)
5. [구현 단계](#구현-단계)
6. [API 설계](#api-설계)
7. [설치 및 실행](#설치-및-실행)
8. [예제 코드](#예제-코드)

## 개요

실시간으로 서버의 CPU, 메모리, 디스크, 네트워크 등의 시스템 리소스를 모니터링하고 시각화하는 웹 기반 대시보드입니다. WebSocket을 통해 실시간 데이터를 전송하며, 임계값 초과 시 알림을 제공합니다.

## 주요 기능

### 1. CPU 모니터링
- 전체 CPU 사용률 (%)
- 코어별 사용률
- 로드 평균 (1분, 5분, 15분)
- 프로세스별 CPU 사용량

### 2. 메모리 모니터링
- 총 메모리 용량
- 사용 중인 메모리
- 사용 가능한 메모리
- 스왑 메모리 사용량
- 메모리 사용률 (%)

### 3. 디스크 I/O
- 파티션별 용량 및 사용률
- 읽기/쓰기 속도 (MB/s)
- IOPS (초당 입출력 작업)
- 디스크 대기 시간

### 4. 네트워크 트래픽
- 인바운드 트래픽 (MB/s)
- 아웃바운드 트래픽 (MB/s)
- 패킷 송수신 통계
- 네트워크 인터페이스별 통계
- 연결 수 (TCP, UDP)

### 5. 프로세스 모니터링
- Top N 프로세스 (CPU/메모리 기준)
- 프로세스 상태 및 PID
- 실행 시간
- 리소스 사용량

### 6. 알림 시스템
- 임계값 설정 (CPU, 메모리, 디스크)
- 실시간 알림 (브라우저 알림, 이메일)
- 알림 이력 관리
- 임계값 초과 횟수 추적

## 기술 스택

### 백엔드
- **Node.js** (Express.js) 또는 **Python** (Flask/FastAPI)
- **WebSocket** (Socket.io 또는 ws)
- **시스템 메트릭 수집**:
  - Node.js: `systeminformation`, `os-utils`, `pidusage`
  - Python: `psutil`, `py-cpuinfo`

### 프론트엔드
- **React** 또는 **Vue.js**
- **Chart.js** 또는 **Apache ECharts** (차트 라이브러리)
- **Socket.io-client** (WebSocket 클라이언트)
- **TailwindCSS** 또는 **Material-UI** (스타일링)

### 데이터베이스 (선택사항)
- **InfluxDB** 또는 **TimescaleDB** (시계열 데이터)
- **Redis** (실시간 데이터 캐싱)

## 아키텍처

```
┌─────────────────┐
│   웹 브라우저    │
│   (Frontend)    │
└────────┬────────┘
         │ WebSocket
         │ (실시간 데이터)
┌────────▼────────┐
│  Express.js     │
│  WebSocket      │
│  Server         │
└────────┬────────┘
         │
┌────────▼────────┐
│  Metrics        │
│  Collector      │
│  (systeminfor-  │
│   mation)       │
└────────┬────────┘
         │
┌────────▼────────┐
│  Operating      │
│  System         │
│  (리소스)        │
└─────────────────┘
```

## 구현 단계

### Phase 1: 기본 메트릭 수집 (1-2일)
1. 백엔드 프로젝트 초기화
2. CPU, 메모리 기본 메트릭 수집 모듈 구현
3. REST API 엔드포인트 생성

### Phase 2: 실시간 통신 (1-2일)
1. WebSocket 서버 구현
2. 메트릭 데이터 실시간 브로드캐스트
3. 클라이언트 WebSocket 연결 구현

### Phase 3: 프론트엔드 대시보드 (2-3일)
1. 대시보드 레이아웃 설계
2. 실시간 차트 구현 (라인 차트, 게이지 차트)
3. 메트릭 카드 컴포넌트 제작

### Phase 4: 고급 기능 (2-3일)
1. 디스크 I/O 및 네트워크 모니터링 추가
2. 프로세스 목록 표시
3. 필터링 및 검색 기능

### Phase 5: 알림 시스템 (1-2일)
1. 임계값 설정 UI
2. 알림 로직 구현
3. 브라우저 알림 연동

### Phase 6: 최적화 및 배포 (1-2일)
1. 성능 최적화
2. 에러 핸들링
3. 도커라이징 및 배포

## API 설계

### REST API

#### GET /api/metrics/current
현재 시스템 메트릭 조회

**Response:**
```json
{
  "timestamp": 1706889600000,
  "cpu": {
    "usage": 45.2,
    "cores": [23.1, 56.7, 32.4, 67.8],
    "loadAverage": [2.1, 1.8, 1.5]
  },
  "memory": {
    "total": 16777216,
    "used": 8388608,
    "free": 8388608,
    "usagePercent": 50.0
  },
  "disk": {
    "total": 512000000,
    "used": 256000000,
    "free": 256000000,
    "usagePercent": 50.0
  },
  "network": {
    "rx": 1024,
    "tx": 2048
  }
}
```

#### GET /api/metrics/history?metric=cpu&duration=1h
과거 메트릭 데이터 조회

#### POST /api/alerts/thresholds
알림 임계값 설정

**Request:**
```json
{
  "metric": "cpu",
  "threshold": 80,
  "duration": 300,
  "enabled": true
}
```

### WebSocket Events

#### Server → Client

**event: `metrics:update`**
```json
{
  "timestamp": 1706889600000,
  "cpu": 45.2,
  "memory": 50.0,
  "disk": 60.0,
  "network": {
    "rx": 1024,
    "tx": 2048
  }
}
```

**event: `alert:triggered`**
```json
{
  "metric": "cpu",
  "value": 85.0,
  "threshold": 80.0,
  "timestamp": 1706889600000,
  "message": "CPU usage exceeded threshold"
}
```

## 설치 및 실행

### 백엔드 (Node.js)

```bash
# 의존성 설치
npm install express socket.io systeminformation cors

# 서버 실행
node server.js
```

### 프론트엔드 (React)

```bash
# 프로젝트 생성
npx create-react-app dashboard-client
cd dashboard-client

# 의존성 설치
npm install socket.io-client chart.js react-chartjs-2

# 개발 서버 실행
npm start
```

### Docker로 실행

```bash
# 이미지 빌드
docker build -t server-monitor .

# 컨테이너 실행
docker run -p 3000:3000 server-monitor
```

## 예제 코드

### 백엔드: 메트릭 수집 (Node.js)

```javascript
const si = require('systeminformation');

class MetricsCollector {
  async getCpuMetrics() {
    const load = await si.currentLoad();
    return {
      usage: load.currentLoad.toFixed(2),
      cores: load.cpus.map(cpu => cpu.load.toFixed(2)),
      loadAverage: (await si.load()).avgLoad
    };
  }

  async getMemoryMetrics() {
    const mem = await si.mem();
    return {
      total: mem.total,
      used: mem.used,
      free: mem.free,
      usagePercent: ((mem.used / mem.total) * 100).toFixed(2)
    };
  }

  async getDiskMetrics() {
    const disk = await si.fsSize();
    const mainDisk = disk[0];
    return {
      total: mainDisk.size,
      used: mainDisk.used,
      free: mainDisk.available,
      usagePercent: mainDisk.use.toFixed(2)
    };
  }

  async getNetworkMetrics() {
    const net = await si.networkStats();
    return {
      rx: net[0].rx_sec,
      tx: net[0].tx_sec
    };
  }

  async getAllMetrics() {
    return {
      timestamp: Date.now(),
      cpu: await this.getCpuMetrics(),
      memory: await this.getMemoryMetrics(),
      disk: await this.getDiskMetrics(),
      network: await this.getNetworkMetrics()
    };
  }
}

module.exports = MetricsCollector;
```

### 백엔드: WebSocket 서버

```javascript
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const MetricsCollector = require('./metricsCollector');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const collector = new MetricsCollector();

// REST API
app.get('/api/metrics/current', async (req, res) => {
  const metrics = await collector.getAllMetrics();
  res.json(metrics);
});

// WebSocket 연결
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // 1초마다 메트릭 전송
  const interval = setInterval(async () => {
    const metrics = await collector.getAllMetrics();
    socket.emit('metrics:update', metrics);
  }, 1000);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    clearInterval(interval);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 프론트엔드: 대시보드 컴포넌트 (React)

```javascript
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import io from 'socket.io-client';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [cpuHistory, setCpuHistory] = useState([]);

  useEffect(() => {
    const socket = io('http://localhost:3001');

    socket.on('metrics:update', (data) => {
      setMetrics(data);

      // CPU 히스토리 업데이트 (최근 60개만 유지)
      setCpuHistory(prev => {
        const newHistory = [...prev, {
          time: new Date(data.timestamp).toLocaleTimeString(),
          value: data.cpu.usage
        }];
        return newHistory.slice(-60);
      });
    });

    return () => socket.disconnect();
  }, []);

  if (!metrics) return <div>Loading...</div>;

  const chartData = {
    labels: cpuHistory.map(d => d.time),
    datasets: [{
      label: 'CPU Usage (%)',
      data: cpuHistory.map(d => d.value),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  return (
    <div className="dashboard">
      <h1>Server Monitor Dashboard</h1>

      <div className="metrics-grid">
        <div className="metric-card">
          <h3>CPU Usage</h3>
          <div className="metric-value">{metrics.cpu.usage}%</div>
        </div>

        <div className="metric-card">
          <h3>Memory Usage</h3>
          <div className="metric-value">{metrics.memory.usagePercent}%</div>
        </div>

        <div className="metric-card">
          <h3>Disk Usage</h3>
          <div className="metric-value">{metrics.disk.usagePercent}%</div>
        </div>

        <div className="metric-card">
          <h3>Network</h3>
          <div className="metric-value">
            ↓ {(metrics.network.rx / 1024).toFixed(2)} KB/s<br/>
            ↑ {(metrics.network.tx / 1024).toFixed(2)} KB/s
          </div>
        </div>
      </div>

      <div className="chart-container">
        <Line data={chartData} options={{
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              max: 100
            }
          }
        }} />
      </div>
    </div>
  );
};

export default Dashboard;
```

## 추가 개선 사항

1. **데이터 저장**: InfluxDB를 사용한 시계열 데이터 저장
2. **다중 서버 지원**: 여러 서버를 동시에 모니터링
3. **사용자 인증**: JWT 기반 인증 시스템
4. **대시보드 커스터마이징**: 사용자별 위젯 설정
5. **모바일 앱**: React Native를 통한 모바일 모니터링
6. **Slack/Discord 알림**: 웹훅을 통한 외부 알림 연동
7. **AI 이상 탐지**: 머신러닝 기반 이상 패턴 감지

## 참고 자료

- [systeminformation 라이브러리](https://github.com/sebhildebrandt/systeminformation)
- [Socket.io 문서](https://socket.io/docs/)
- [Chart.js 문서](https://www.chartjs.org/)
- [psutil (Python)](https://psutil.readthedocs.io/)

## 라이센스

MIT License
