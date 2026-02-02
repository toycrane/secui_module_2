# 서버 모니터링 대시보드 - 프론트엔드

React 기반 실시간 서버 모니터링 대시보드 클라이언트입니다.

## 📦 설치

```bash
cd client
npm install
```

## 🚀 실행

### 개발 모드

```bash
npm start
```

브라우저에서 http://localhost:3000 이 자동으로 열립니다.

### 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `build/` 디렉토리에 생성됩니다.

## 🎨 주요 기능

### 1. 실시간 메트릭 모니터링
- CPU, 메모리, 디스크, 네트워크 사용률 실시간 표시
- 1초마다 자동 업데이트

### 2. 시각화 차트
- Chart.js를 사용한 실시간 라인 차트
- 최근 60초 데이터 표시 (롤링 윈도우)
- 4개의 독립적인 차트 (CPU, 메모리, 디스크, 네트워크)

### 3. 알림 시스템
- 임계값 초과 시 실시간 알림
- 브라우저 알림 지원
- 알림 이력 관리

### 4. 시스템 정보
- 서버 하드웨어 정보 표시
- 실시간 연결 상태 표시

### 5. 프로세스 모니터링
- CPU 사용률 기준 상위 5개 프로세스
- PID, 프로세스명, CPU/메모리 사용률, 상태 표시

## 🔧 환경 변수

`.env` 파일을 생성하여 백엔드 서버 URL을 설정할 수 있습니다:

```
REACT_APP_SOCKET_URL=http://localhost:3001
```

설정하지 않으면 기본값 `http://localhost:3001`이 사용됩니다.

## 📁 파일 구조

```
client/
├── public/
│   └── index.html          # HTML 템플릿
├── src/
│   ├── components/         # React 컴포넌트
│   │   ├── MetricCard.js   # 메트릭 카드
│   │   ├── LineChart.js    # 라인 차트
│   │   ├── AlertPanel.js   # 알림 패널
│   │   └── SystemInfo.js   # 시스템 정보
│   ├── hooks/
│   │   └── useWebSocket.js # WebSocket 훅
│   ├── App.js              # 메인 앱
│   ├── App.css             # 앱 스타일
│   ├── index.js            # 엔트리 포인트
│   └── index.css           # 글로벌 스타일
└── package.json
```

## 🎯 컴포넌트 설명

### useWebSocket Hook
- Socket.io 연결 관리
- 실시간 메트릭 수신
- 알림 수신 및 브라우저 알림 표시
- 자동 재연결 기능

### MetricCard
- 개별 메트릭을 카드 형태로 표시
- 값에 따른 색상 변화 (녹색/노랑/빨강)
- 프로그레스 바 표시

### LineChart
- Chart.js 기반 실시간 라인 차트
- 최근 60개 데이터 포인트 표시
- 애니메이션 비활성화 (실시간 성능 향상)

### AlertPanel
- 알림 목록 표시
- 개별 알림 제거
- 모든 알림 일괄 제거

### SystemInfo
- 서버 시스템 정보 표시
- 연결 상태 표시

## 🌐 브라우저 지원

- Chrome (최신 버전)
- Firefox (최신 버전)
- Safari (최신 버전)
- Edge (최신 버전)

## 📝 참고사항

- 백엔드 서버가 실행 중이어야 합니다 (포트 3001)
- 브라우저 알림을 사용하려면 알림 권한을 허용해야 합니다
- 실시간 업데이트로 인해 메모리 사용량이 증가할 수 있습니다
