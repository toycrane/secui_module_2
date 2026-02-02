# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 필요한 가이드를 제공합니다.

## 프로젝트 개요

이 프로젝트는 WebSocket을 사용하여 시스템 메트릭(CPU, 메모리, 디스크, 네트워크)을 실시간으로 수집하고 시각화하는 서버 모니터링 대시보드입니다. 리소스 사용량이 설정된 임계값을 초과하면 알림을 제공합니다.

## 아키텍처

시스템은 3계층 아키텍처를 따릅니다:

1. **메트릭 수집 계층**: `systeminformation` (Node.js) 또는 `psutil` (Python)을 사용하여 OS 레벨 메트릭 수집
2. **WebSocket 서버**: Express.js + Socket.io 서버로 1초마다 연결된 클라이언트에게 메트릭 브로드캐스트
3. **React 대시보드**: Chart.js 기반 프론트엔드로 실시간 그래프 및 메트릭 카드 표시

핵심 아키텍처 패턴:
- 메트릭은 `MetricsCollector` 클래스의 비동기 메서드를 통해 수집
- WebSocket 연결은 개별 인터벌을 유지하며 `metrics:update` 이벤트 발생
- 프론트엔드는 차트 렌더링을 위해 60개 데이터 포인트의 롤링 히스토리 유지
- 알림 시스템은 임계값 초과 시 `alert:triggered` 이벤트 발생

## 기술 스택

**백엔드:**
- Node.js with Express.js (권장) 또는 Python Flask/FastAPI
- Socket.io (WebSocket 통신용)
- `systeminformation` 라이브러리 (Node.js) 또는 `psutil` (Python)

**프론트엔드:**
- React (함수형 컴포넌트 및 훅 사용)
- Socket.io-client (WebSocket 연결용)
- Chart.js with react-chartjs-2 (시각화용)
- TailwindCSS 또는 Material-UI (스타일링)

**선택사항:**
- InfluxDB 또는 TimescaleDB (시계열 데이터 저장)
- Redis (실시간 데이터 캐싱)

## 개발 명령어

### 백엔드 (Node.js)

```bash
# 의존성 설치
npm install express socket.io systeminformation cors

# 서버 실행 (기본 포트 3001)
node server.js

# 커스텀 포트로 실행
PORT=4000 node server.js
```

### 프론트엔드 (React)

```bash
# React 앱 생성
npx create-react-app dashboard-client
cd dashboard-client

# 의존성 설치
npm install socket.io-client chart.js react-chartjs-2

# 개발 서버 실행 (기본 포트 3000)
npm start

# 프로덕션 빌드
npm run build
```

### Docker

```bash
# 이미지 빌드
docker build -t server-monitor .

# 컨테이너 실행
docker run -p 3000:3000 server-monitor
```

## API 명세

### REST 엔드포인트

**GET /api/metrics/current** - 현재 모든 메트릭 스냅샷 반환 (구조):
```
{cpu: {usage, cores[], loadAverage[]}, memory: {total, used, free, usagePercent}, disk: {total, used, free, usagePercent}, network: {rx, tx}}
```

**GET /api/metrics/history?metric=cpu&duration=1h** - 과거 메트릭 데이터 조회

**POST /api/alerts/thresholds** - 알림 임계값 설정: `{metric, threshold, duration, enabled}`

### WebSocket 이벤트

**Server → Client:**
- `metrics:update` - 실시간 메트릭 (1초마다 발생)
- `alert:triggered` - 메트릭이 임계값 초과 시 발생

**Client → Server:**
- `connection` / `disconnect` - 표준 Socket.io 라이프사이클 이벤트

## 구현 단계

기능 구현 시 다음 단계적 접근 방식을 따르세요:

1. **Phase 1**: 기본 CPU/메모리 메트릭 수집 및 REST API로 시작
2. **Phase 2**: WebSocket 실시간 브로드캐스팅 추가
3. **Phase 3**: 메트릭 카드 및 라인 차트를 포함한 대시보드 UI 구축
4. **Phase 4**: 디스크 I/O, 네트워크, 프로세스 모니터링으로 확장
5. **Phase 5**: 임계값 설정 및 알림 시스템 구현
6. **Phase 6**: 성능 최적화, 에러 핸들링, 컨테이너화

## 핵심 구현 세부사항

### MetricsCollector 패턴

각 메트릭 타입별 비동기 메서드를 가진 클래스 구현:
- `getCpuMetrics()` - `si.currentLoad()` 및 `si.load()` 사용
- `getMemoryMetrics()` - `si.mem()` 사용
- `getDiskMetrics()` - 메인 디스크에 대해 `si.fsSize()[0]` 사용
- `getNetworkMetrics()` - `si.networkStats()[0]` 사용
- `getAllMetrics()` - 타임스탬프와 함께 모든 메트릭 집계

### WebSocket 인터벌 관리

각 클라이언트 연결은 1초 인터벌을 생성하며, 메모리 누수 방지를 위해 연결 종료 시 반드시 제거해야 합니다:

```javascript
io.on('connection', (socket) => {
  const interval = setInterval(async () => {
    const metrics = await collector.getAllMetrics();
    socket.emit('metrics:update', metrics);
  }, 1000);

  socket.on('disconnect', () => {
    clearInterval(interval);
  });
});
```

### 프론트엔드 데이터 관리

대시보드는 차트 렌더링을 위해 60개 데이터 포인트의 롤링 윈도우를 유지합니다. 새 메트릭 도착 시:
1. 히스토리 배열에 추가
2. 최근 60개 항목만 유지하도록 슬라이스: `newHistory.slice(-60)`
3. 업데이트된 데이터로 차트 재렌더링

### CORS 설정

백엔드는 프론트엔드 개발 서버(일반적으로 포트 3000)에 대해 CORS를 허용해야 합니다:
```javascript
io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
```

## 모니터링 메트릭

시스템은 6가지 주요 메트릭 카테고리를 추적합니다:

1. **CPU**: 사용률(%), 코어별 로드, 로드 평균(1/5/15분), 프로세스별 CPU
2. **메모리**: 총/사용/가용 용량, 사용률(%), 스왑 메모리
3. **디스크**: 파티션 용량, 읽기/쓰기 속도(MB/s), IOPS, 지연 시간
4. **네트워크**: 인바운드/아웃바운드 트래픽(MB/s), 패킷 통계, 인터페이스 통계, 연결 수
5. **프로세스**: CPU/메모리 기준 상위 N개, PID, 상태, 실행 시간, 리소스 사용량
6. **알림**: 임계값 설정, 알림 전달, 알림 이력

## 알림 시스템 설계

알림은 다음 조건에서 발생합니다:
- 메트릭이 설정된 임계값을 초과
- 지정된 기간 동안 조건이 지속
- 알림이 활성화된 상태

알림 설정 포함 항목: `metric` (이름), `threshold` (숫자 값), `duration` (초), `enabled` (불린)

알림은 브라우저 알림 또는 이메일을 통해 전달될 수 있습니다 (구현에 따라 다름).
