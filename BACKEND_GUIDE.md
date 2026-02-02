# 백엔드 서버 실행 가이드

## 📦 설치

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가하세요:

```bash
cp .env.example .env
```

`.env` 파일 내용:
```
PORT=3001
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

## 🚀 실행

### 개발 모드 (nodemon 사용)

```bash
npm run dev
```

### 프로덕션 모드

```bash
npm start
```

## 📡 API 엔드포인트

### 1. 헬스 체크
```
GET /api/health
```

**응답 예시:**
```json
{
  "status": "ok",
  "timestamp": 1706889600000,
  "uptime": 123.45,
  "connectedClients": 2
}
```

### 2. 현재 메트릭 조회
```
GET /api/metrics/current
```

**응답 예시:**
```json
{
  "timestamp": 1706889600000,
  "cpu": {
    "usage": 45.2,
    "cores": [23.1, 56.7, 32.4, 67.8],
    "loadAverage": [2.1, 1.8, 1.5]
  },
  "memory": {
    "total": 16777216000,
    "used": 8388608000,
    "free": 8388608000,
    "usagePercent": 50.0
  },
  "disk": {
    "total": 512000000000,
    "used": 256000000000,
    "free": 256000000000,
    "usagePercent": 50.0,
    "filesystem": "NTFS",
    "mount": "C:"
  },
  "network": {
    "rx": 1024000,
    "tx": 2048000,
    "interface": "eth0"
  },
  "processes": [
    {
      "pid": 1234,
      "name": "node",
      "cpu": 12.5,
      "memory": 5.2,
      "state": "running"
    }
  ]
}
```

### 3. 시스템 정보 조회
```
GET /api/system/info
```

**응답 예시:**
```json
{
  "manufacturer": "Dell Inc.",
  "model": "OptiPlex 7090",
  "os": "Windows 10 Pro",
  "platform": "win32",
  "cpuModel": "Intel Core i7-10700",
  "cpuCores": 8
}
```

### 4. 알림 임계값 조회
```
GET /api/alerts/thresholds
```

**응답 예시:**
```json
{
  "cpu": {
    "value": 80,
    "duration": 60,
    "enabled": true
  },
  "memory": {
    "value": 85,
    "duration": 60,
    "enabled": true
  },
  "disk": {
    "value": 90,
    "duration": 300,
    "enabled": true
  }
}
```

### 5. 알림 임계값 설정
```
POST /api/alerts/thresholds
Content-Type: application/json
```

**요청 본문:**
```json
{
  "metric": "cpu",
  "threshold": 85,
  "duration": 120,
  "enabled": true
}
```

**응답 예시:**
```json
{
  "success": true,
  "message": "임계값이 업데이트되었습니다",
  "threshold": {
    "value": 85,
    "duration": 120,
    "enabled": true
  }
}
```

### 6. 알림 이력 조회
```
GET /api/alerts/history?limit=50
```

**응답 예시:**
```json
[
  {
    "metric": "cpu",
    "value": 85.5,
    "threshold": 80,
    "timestamp": 1706889600000,
    "message": "CPU 사용량이 임계값을 초과했습니다 (85.50% > 80%)"
  }
]
```

### 7. 알림 상태 초기화
```
POST /api/alerts/reset
```

**응답 예시:**
```json
{
  "success": true,
  "message": "알림 상태가 초기화되었습니다"
}
```

## 🔌 WebSocket 이벤트

### Server → Client 이벤트

#### `metrics:update`
1초마다 실시간 메트릭 데이터 전송

**데이터 구조:**
```json
{
  "timestamp": 1706889600000,
  "cpu": { ... },
  "memory": { ... },
  "disk": { ... },
  "network": { ... },
  "processes": [ ... ]
}
```

#### `alert:triggered`
메트릭이 임계값을 초과했을 때 발생

**데이터 구조:**
```json
{
  "metric": "cpu",
  "value": 85.0,
  "threshold": 80.0,
  "timestamp": 1706889600000,
  "message": "CPU 사용량이 임계값을 초과했습니다 (85.00% > 80%)"
}
```

#### `system:info`
시스템 정보 전송

#### `error`
오류 발생 시 전송

### Client → Server 이벤트

#### `request:system-info`
시스템 정보 요청

```javascript
socket.emit('request:system-info');
```

## 🗂️ 파일 구조

```
books/
├── server.js              # 메인 서버 파일
├── metricsCollector.js    # 메트릭 수집 클래스
├── alertManager.js        # 알림 관리 클래스
├── package.json           # 의존성 관리
├── .env.example           # 환경 변수 예시
├── .gitignore            # Git 제외 파일
├── README.md             # 프로젝트 문서
├── CLAUDE.md             # Claude Code 가이드
└── BACKEND_GUIDE.md      # 이 파일
```

## 🧪 테스트

### cURL을 사용한 API 테스트

```bash
# 헬스 체크
curl http://localhost:3001/api/health

# 현재 메트릭 조회
curl http://localhost:3001/api/metrics/current

# 시스템 정보 조회
curl http://localhost:3001/api/system/info

# 알림 임계값 설정
curl -X POST http://localhost:3001/api/alerts/thresholds \
  -H "Content-Type: application/json" \
  -d '{"metric":"cpu","threshold":90,"duration":60,"enabled":true}'
```

### WebSocket 연결 테스트 (Node.js)

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('서버에 연결되었습니다');
  socket.emit('request:system-info');
});

socket.on('metrics:update', (data) => {
  console.log('메트릭 업데이트:', data);
});

socket.on('alert:triggered', (alert) => {
  console.log('알림 발생:', alert);
});

socket.on('system:info', (info) => {
  console.log('시스템 정보:', info);
});

socket.on('disconnect', () => {
  console.log('서버 연결이 끊겼습니다');
});
```

## 🐛 문제 해결

### 포트가 이미 사용 중인 경우

`.env` 파일에서 다른 포트로 변경:
```
PORT=3002
```

### CORS 오류가 발생하는 경우

`.env` 파일에서 클라이언트 URL 확인:
```
CLIENT_URL=http://localhost:3000
```

### 메트릭 수집 오류

일부 시스템에서는 권한 문제로 특정 메트릭을 수집하지 못할 수 있습니다. 이 경우 메트릭 수집기가 기본값(0)을 반환하며, 콘솔에 오류 메시지가 표시됩니다.

## 📝 참고사항

- 서버는 1초마다 메트릭을 수집하고 WebSocket을 통해 클라이언트에 전송합니다
- 알림은 설정된 임계값과 지속 시간을 기반으로 발생합니다
- 최대 100개의 알림 이력이 메모리에 저장됩니다
- 프로세스 목록은 CPU 사용률 기준 상위 5개만 반환됩니다
