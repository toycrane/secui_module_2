import React, { useState, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import MetricCard from './components/MetricCard';
import LineChart from './components/LineChart';
import AlertPanel from './components/AlertPanel';
import SystemInfo from './components/SystemInfo';
import './App.css';

function App() {
  const { isConnected, metrics, alerts, systemInfo, removeAlert, clearAlerts } = useWebSocket();

  // 차트 데이터 히스토리
  const [cpuHistory, setCpuHistory] = useState([]);
  const [memoryHistory, setMemoryHistory] = useState([]);
  const [diskHistory, setDiskHistory] = useState([]);
  const [networkHistory, setNetworkHistory] = useState([]);

  const MAX_HISTORY = 60; // 60개 데이터 포인트 (1분)

  // 메트릭 업데이트 시 히스토리에 추가
  useEffect(() => {
    if (!metrics) return;

    const time = new Date(metrics.timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // CPU 히스토리
    setCpuHistory(prev => {
      const newHistory = [...prev, { time, value: metrics.cpu.usage }];
      return newHistory.slice(-MAX_HISTORY);
    });

    // 메모리 히스토리
    setMemoryHistory(prev => {
      const newHistory = [...prev, { time, value: metrics.memory.usagePercent }];
      return newHistory.slice(-MAX_HISTORY);
    });

    // 디스크 히스토리
    setDiskHistory(prev => {
      const newHistory = [...prev, { time, value: metrics.disk.usagePercent }];
      return newHistory.slice(-MAX_HISTORY);
    });

    // 네트워크 히스토리
    setNetworkHistory(prev => {
      const rxMBps = (metrics.network.rx / 1024 / 1024).toFixed(2);
      const txMBps = (metrics.network.tx / 1024 / 1024).toFixed(2);
      const newHistory = [...prev, { time, rx: parseFloat(rxMBps), tx: parseFloat(txMBps) }];
      return newHistory.slice(-MAX_HISTORY);
    });
  }, [metrics]);

  // 차트 데이터 준비
  const cpuChartData = {
    labels: cpuHistory.map(d => d.time),
    datasets: [{
      label: 'CPU 사용률 (%)',
      data: cpuHistory.map(d => d.value),
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const memoryChartData = {
    labels: memoryHistory.map(d => d.time),
    datasets: [{
      label: '메모리 사용률 (%)',
      data: memoryHistory.map(d => d.value),
      borderColor: 'rgb(54, 162, 235)',
      backgroundColor: 'rgba(54, 162, 235, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const diskChartData = {
    labels: diskHistory.map(d => d.time),
    datasets: [{
      label: '디스크 사용률 (%)',
      data: diskHistory.map(d => d.value),
      borderColor: 'rgb(255, 206, 86)',
      backgroundColor: 'rgba(255, 206, 86, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const networkChartData = {
    labels: networkHistory.map(d => d.time),
    datasets: [
      {
        label: '다운로드 (MB/s)',
        data: networkHistory.map(d => d.rx),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: '업로드 (MB/s)',
        data: networkHistory.map(d => d.tx),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // 로딩 상태
  if (!metrics) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>서버에 연결 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🖥️ 서버 모니터링 대시보드</h1>
        <div className="header-subtitle">실시간 시스템 리소스 모니터링</div>
      </header>

      <div className="container">
        {/* 시스템 정보 */}
        <div className="section full-width">
          <SystemInfo systemInfo={systemInfo} isConnected={isConnected} />
        </div>

        {/* 메트릭 카드 */}
        <div className="metrics-grid">
          <MetricCard
            title="CPU 사용률"
            value={metrics.cpu.usage}
            unit="%"
            icon="🔥"
            subtitle={`로드 평균: ${metrics.cpu.loadAverage.map(l => l.toFixed(2)).join(', ')}`}
          />
          <MetricCard
            title="메모리 사용률"
            value={metrics.memory.usagePercent}
            unit="%"
            icon="💾"
            subtitle={`${(metrics.memory.used / 1024 / 1024 / 1024).toFixed(2)}GB / ${(metrics.memory.total / 1024 / 1024 / 1024).toFixed(2)}GB`}
          />
          <MetricCard
            title="디스크 사용률"
            value={metrics.disk.usagePercent}
            unit="%"
            icon="💿"
            subtitle={`${(metrics.disk.used / 1024 / 1024 / 1024).toFixed(2)}GB / ${(metrics.disk.total / 1024 / 1024 / 1024).toFixed(2)}GB`}
          />
          <MetricCard
            title="네트워크"
            value={(metrics.network.rx / 1024 / 1024).toFixed(2)}
            unit="MB/s"
            icon="🌐"
            subtitle={`업로드: ${(metrics.network.tx / 1024 / 1024).toFixed(2)} MB/s`}
          />
        </div>

        {/* 차트 */}
        <div className="charts-grid">
          <LineChart title="CPU 사용률" data={cpuChartData} />
          <LineChart title="메모리 사용률" data={memoryChartData} />
        </div>

        <div className="charts-grid">
          <LineChart title="디스크 사용률" data={diskChartData} />
          <LineChart title="네트워크 트래픽" data={networkChartData} />
        </div>

        {/* 알림 패널 */}
        <div className="section full-width">
          <AlertPanel
            alerts={alerts}
            onRemove={removeAlert}
            onClearAll={clearAlerts}
          />
        </div>

        {/* 프로세스 목록 */}
        {metrics.processes && metrics.processes.length > 0 && (
          <div className="section full-width">
            <div className="process-panel">
              <h3>🔝 상위 프로세스 (CPU 기준)</h3>
              <table className="process-table">
                <thead>
                  <tr>
                    <th>PID</th>
                    <th>프로세스명</th>
                    <th>CPU (%)</th>
                    <th>메모리 (%)</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.processes.map(proc => (
                    <tr key={proc.pid}>
                      <td>{proc.pid}</td>
                      <td>{proc.name}</td>
                      <td>{proc.cpu.toFixed(2)}%</td>
                      <td>{proc.memory.toFixed(2)}%</td>
                      <td>
                        <span className={`status-badge ${proc.state}`}>
                          {proc.state}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <footer className="app-footer">
        <p>마지막 업데이트: {new Date(metrics.timestamp).toLocaleString('ko-KR')}</p>
      </footer>
    </div>
  );
}

export default App;
