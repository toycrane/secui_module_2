import React from 'react';
import './MetricCard.css';

/**
 * 메트릭 카드 컴포넌트
 */
const MetricCard = ({ title, value, unit, icon, color, subtitle }) => {
  // 값에 따른 상태 색상 결정
  const getStatusColor = () => {
    if (!value || typeof value !== 'number') return '#6c757d';

    if (value >= 90) return '#dc3545'; // 위험 (빨강)
    if (value >= 75) return '#ffc107'; // 경고 (노랑)
    return '#28a745'; // 정상 (초록)
  };

  const statusColor = color || getStatusColor();

  return (
    <div className="metric-card" style={{ borderLeftColor: statusColor }}>
      <div className="metric-header">
        <span className="metric-icon" style={{ backgroundColor: statusColor + '20' }}>
          {icon}
        </span>
        <h3 className="metric-title">{title}</h3>
      </div>

      <div className="metric-body">
        <div className="metric-value-container">
          <span className="metric-value" style={{ color: statusColor }}>
            {typeof value === 'number' ? value.toFixed(2) : value || '--'}
          </span>
          {unit && <span className="metric-unit">{unit}</span>}
        </div>

        {subtitle && (
          <div className="metric-subtitle">{subtitle}</div>
        )}
      </div>

      {/* 상태 바 */}
      {typeof value === 'number' && (
        <div className="metric-progress">
          <div
            className="metric-progress-bar"
            style={{
              width: `${Math.min(value, 100)}%`,
              backgroundColor: statusColor
            }}
          />
        </div>
      )}
    </div>
  );
};

export default MetricCard;
