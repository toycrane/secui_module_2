import React from 'react';
import './AlertPanel.css';

/**
 * 알림 패널 컴포넌트
 */
const AlertPanel = ({ alerts, onRemove, onClearAll }) => {
  if (alerts.length === 0) {
    return (
      <div className="alert-panel">
        <div className="alert-header">
          <h3>🔔 알림</h3>
        </div>
        <div className="alert-empty">
          <p>알림이 없습니다</p>
        </div>
      </div>
    );
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getAlertIcon = (metric) => {
    switch(metric) {
      case 'cpu': return '🔥';
      case 'memory': return '💾';
      case 'disk': return '💿';
      default: return '⚠️';
    }
  };

  return (
    <div className="alert-panel">
      <div className="alert-header">
        <h3>🔔 알림 ({alerts.length})</h3>
        {alerts.length > 0 && (
          <button className="clear-all-btn" onClick={onClearAll}>
            모두 지우기
          </button>
        )}
      </div>

      <div className="alert-list">
        {alerts.map((alert) => (
          <div key={alert.timestamp} className="alert-item">
            <div className="alert-icon">
              {getAlertIcon(alert.metric)}
            </div>
            <div className="alert-content">
              <div className="alert-message">{alert.message}</div>
              <div className="alert-time">{formatTime(alert.timestamp)}</div>
            </div>
            <button
              className="alert-close-btn"
              onClick={() => onRemove(alert.timestamp)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertPanel;
