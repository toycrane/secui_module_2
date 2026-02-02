import React from 'react';
import './SystemInfo.css';

/**
 * 시스템 정보 컴포넌트
 */
const SystemInfo = ({ systemInfo, isConnected }) => {
  if (!systemInfo) {
    return (
      <div className="system-info">
        <div className="system-info-loading">시스템 정보 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="system-info">
      <div className="system-info-header">
        <h3>💻 시스템 정보</h3>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          {isConnected ? '연결됨' : '연결 끊김'}
        </div>
      </div>

      <div className="system-info-grid">
        <div className="info-item">
          <span className="info-label">운영체제</span>
          <span className="info-value">{systemInfo.os}</span>
        </div>

        <div className="info-item">
          <span className="info-label">플랫폼</span>
          <span className="info-value">{systemInfo.platform}</span>
        </div>

        <div className="info-item">
          <span className="info-label">제조사</span>
          <span className="info-value">{systemInfo.manufacturer}</span>
        </div>

        <div className="info-item">
          <span className="info-label">모델</span>
          <span className="info-value">{systemInfo.model}</span>
        </div>

        <div className="info-item">
          <span className="info-label">CPU</span>
          <span className="info-value">{systemInfo.cpuModel}</span>
        </div>

        <div className="info-item">
          <span className="info-label">코어 수</span>
          <span className="info-value">{systemInfo.cpuCores}개</span>
        </div>
      </div>
    </div>
  );
};

export default SystemInfo;
