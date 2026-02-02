const si = require('systeminformation');

/**
 * 시스템 메트릭을 수집하는 클래스
 */
class MetricsCollector {
  /**
   * CPU 메트릭 수집
   * @returns {Object} CPU 사용률, 코어별 로드, 로드 평균
   */
  async getCpuMetrics() {
    try {
      const load = await si.currentLoad();
      const loadAvg = await si.load();

      return {
        usage: parseFloat(load.currentLoad.toFixed(2)),
        cores: load.cpus.map(cpu => parseFloat(cpu.load.toFixed(2))),
        loadAverage: loadAvg.avgLoad.map(avg => parseFloat(avg.toFixed(2)))
      };
    } catch (error) {
      console.error('CPU 메트릭 수집 오류:', error.message);
      return {
        usage: 0,
        cores: [],
        loadAverage: [0, 0, 0]
      };
    }
  }

  /**
   * 메모리 메트릭 수집
   * @returns {Object} 총/사용/가용 메모리 및 사용률
   */
  async getMemoryMetrics() {
    try {
      const mem = await si.mem();

      return {
        total: mem.total,
        used: mem.used,
        free: mem.free,
        usagePercent: parseFloat(((mem.used / mem.total) * 100).toFixed(2))
      };
    } catch (error) {
      console.error('메모리 메트릭 수집 오류:', error.message);
      return {
        total: 0,
        used: 0,
        free: 0,
        usagePercent: 0
      };
    }
  }

  /**
   * 디스크 메트릭 수집
   * @returns {Object} 디스크 용량 및 사용률
   */
  async getDiskMetrics() {
    try {
      const disk = await si.fsSize();

      if (!disk || disk.length === 0) {
        throw new Error('디스크 정보를 찾을 수 없습니다');
      }

      const mainDisk = disk[0];

      return {
        total: mainDisk.size,
        used: mainDisk.used,
        free: mainDisk.available,
        usagePercent: parseFloat(mainDisk.use.toFixed(2)),
        filesystem: mainDisk.fs,
        mount: mainDisk.mount
      };
    } catch (error) {
      console.error('디스크 메트릭 수집 오류:', error.message);
      return {
        total: 0,
        used: 0,
        free: 0,
        usagePercent: 0,
        filesystem: 'unknown',
        mount: '/'
      };
    }
  }

  /**
   * 네트워크 메트릭 수집
   * @returns {Object} 네트워크 송수신 속도
   */
  async getNetworkMetrics() {
    try {
      const net = await si.networkStats();

      if (!net || net.length === 0) {
        throw new Error('네트워크 정보를 찾을 수 없습니다');
      }

      const mainInterface = net[0];

      return {
        rx: mainInterface.rx_sec || 0,
        tx: mainInterface.tx_sec || 0,
        interface: mainInterface.iface
      };
    } catch (error) {
      console.error('네트워크 메트릭 수집 오류:', error.message);
      return {
        rx: 0,
        tx: 0,
        interface: 'unknown'
      };
    }
  }

  /**
   * 프로세스 메트릭 수집 (상위 5개 프로세스)
   * @returns {Array} 프로세스 목록
   */
  async getProcessMetrics() {
    try {
      const processes = await si.processes();

      // CPU 사용률 기준 상위 5개 프로세스
      const topProcesses = processes.list
        .sort((a, b) => b.cpu - a.cpu)
        .slice(0, 5)
        .map(proc => ({
          pid: proc.pid,
          name: proc.name,
          cpu: parseFloat(proc.cpu.toFixed(2)),
          memory: parseFloat(proc.mem.toFixed(2)),
          state: proc.state
        }));

      return topProcesses;
    } catch (error) {
      console.error('프로세스 메트릭 수집 오류:', error.message);
      return [];
    }
  }

  /**
   * 시스템 정보 수집
   * @returns {Object} 시스템 기본 정보
   */
  async getSystemInfo() {
    try {
      const system = await si.system();
      const osInfo = await si.osInfo();
      const cpu = await si.cpu();

      return {
        manufacturer: system.manufacturer,
        model: system.model,
        os: osInfo.distro,
        platform: osInfo.platform,
        cpuModel: cpu.manufacturer + ' ' + cpu.brand,
        cpuCores: cpu.cores
      };
    } catch (error) {
      console.error('시스템 정보 수집 오류:', error.message);
      return {
        manufacturer: 'unknown',
        model: 'unknown',
        os: 'unknown',
        platform: 'unknown',
        cpuModel: 'unknown',
        cpuCores: 0
      };
    }
  }

  /**
   * 모든 메트릭을 수집하여 반환
   * @returns {Object} 모든 시스템 메트릭
   */
  async getAllMetrics() {
    try {
      const [cpu, memory, disk, network, processes] = await Promise.all([
        this.getCpuMetrics(),
        this.getMemoryMetrics(),
        this.getDiskMetrics(),
        this.getNetworkMetrics(),
        this.getProcessMetrics()
      ]);

      return {
        timestamp: Date.now(),
        cpu,
        memory,
        disk,
        network,
        processes
      };
    } catch (error) {
      console.error('전체 메트릭 수집 오류:', error.message);
      throw error;
    }
  }
}

module.exports = MetricsCollector;
