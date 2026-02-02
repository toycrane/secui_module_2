/**
 * 알림 임계값을 관리하고 알림을 발생시키는 클래스
 */
class AlertManager {
  constructor() {
    // 알림 설정 저장
    this.thresholds = {
      cpu: { value: 80, duration: 60, enabled: true },
      memory: { value: 85, duration: 60, enabled: true },
      disk: { value: 90, duration: 300, enabled: true }
    };

    // 알림 상태 추적
    this.alertStates = {};

    // 알림 이력
    this.alertHistory = [];
  }

  /**
   * 임계값 설정
   * @param {string} metric - 메트릭 이름 (cpu, memory, disk)
   * @param {Object} config - 설정 {value, duration, enabled}
   */
  setThreshold(metric, config) {
    if (!this.thresholds.hasOwnProperty(metric)) {
      throw new Error(`알 수 없는 메트릭: ${metric}`);
    }

    this.thresholds[metric] = {
      ...this.thresholds[metric],
      ...config
    };

    console.log(`${metric} 임계값 업데이트:`, this.thresholds[metric]);
  }

  /**
   * 모든 임계값 설정 조회
   * @returns {Object} 임계값 설정
   */
  getThresholds() {
    return this.thresholds;
  }

  /**
   * 메트릭 값을 체크하고 알림 발생 여부 확인
   * @param {Object} metrics - 현재 메트릭 데이터
   * @returns {Array} 발생한 알림 목록
   */
  checkMetrics(metrics) {
    const alerts = [];

    // CPU 체크
    if (this.thresholds.cpu.enabled) {
      const cpuAlert = this._checkThreshold(
        'cpu',
        metrics.cpu.usage,
        this.thresholds.cpu.value,
        this.thresholds.cpu.duration,
        metrics.timestamp
      );
      if (cpuAlert) alerts.push(cpuAlert);
    }

    // 메모리 체크
    if (this.thresholds.memory.enabled) {
      const memoryAlert = this._checkThreshold(
        'memory',
        metrics.memory.usagePercent,
        this.thresholds.memory.value,
        this.thresholds.memory.duration,
        metrics.timestamp
      );
      if (memoryAlert) alerts.push(memoryAlert);
    }

    // 디스크 체크
    if (this.thresholds.disk.enabled) {
      const diskAlert = this._checkThreshold(
        'disk',
        metrics.disk.usagePercent,
        this.thresholds.disk.value,
        this.thresholds.disk.duration,
        metrics.timestamp
      );
      if (diskAlert) alerts.push(diskAlert);
    }

    return alerts;
  }

  /**
   * 개별 메트릭 임계값 체크
   * @private
   */
  _checkThreshold(metric, currentValue, threshold, duration, timestamp) {
    const stateKey = metric;

    // 임계값 초과 여부
    const isExceeded = currentValue > threshold;

    if (!this.alertStates[stateKey]) {
      this.alertStates[stateKey] = {
        exceededSince: null,
        lastAlertTime: null,
        isActive: false
      };
    }

    const state = this.alertStates[stateKey];

    if (isExceeded) {
      // 처음 임계값을 초과한 경우
      if (!state.exceededSince) {
        state.exceededSince = timestamp;
      }

      // 지정된 기간 동안 임계값을 초과한 경우
      const exceededDuration = (timestamp - state.exceededSince) / 1000;

      if (exceededDuration >= duration && !state.isActive) {
        state.isActive = true;
        state.lastAlertTime = timestamp;

        const alert = {
          metric,
          value: currentValue,
          threshold,
          timestamp,
          message: `${metric.toUpperCase()} 사용량이 임계값을 초과했습니다 (${currentValue.toFixed(2)}% > ${threshold}%)`
        };

        // 알림 이력에 추가
        this.alertHistory.push(alert);

        // 최근 100개만 유지
        if (this.alertHistory.length > 100) {
          this.alertHistory.shift();
        }

        console.log('🚨 알림 발생:', alert.message);
        return alert;
      }
    } else {
      // 임계값 미만으로 돌아온 경우 상태 초기화
      if (state.isActive) {
        console.log(`✅ ${metric.toUpperCase()} 정상화됨`);
      }
      state.exceededSince = null;
      state.isActive = false;
    }

    return null;
  }

  /**
   * 알림 이력 조회
   * @param {number} limit - 조회할 개수
   * @returns {Array} 알림 이력
   */
  getAlertHistory(limit = 50) {
    return this.alertHistory.slice(-limit).reverse();
  }

  /**
   * 알림 상태 초기화
   */
  resetAlerts() {
    this.alertStates = {};
    console.log('알림 상태가 초기화되었습니다');
  }
}

module.exports = AlertManager;
