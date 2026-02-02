import { useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

/**
 * WebSocket 연결을 관리하는 커스텀 훅
 */
export const useWebSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);

  useEffect(() => {
    // Socket.io 연결
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    // 연결 성공
    newSocket.on('connect', () => {
      console.log('✅ 서버에 연결되었습니다:', newSocket.id);
      setIsConnected(true);

      // 시스템 정보 요청
      newSocket.emit('request:system-info');
    });

    // 연결 해제
    newSocket.on('disconnect', (reason) => {
      console.log('❌ 서버 연결이 끊겼습니다:', reason);
      setIsConnected(false);
    });

    // 재연결 시도
    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 재연결 시도 중... (${attemptNumber})`);
    });

    // 재연결 성공
    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`✅ 재연결 성공 (${attemptNumber}번째 시도)`);
      setIsConnected(true);
      newSocket.emit('request:system-info');
    });

    // 메트릭 업데이트 수신
    newSocket.on('metrics:update', (data) => {
      setMetrics(data);
    });

    // 알림 수신
    newSocket.on('alert:triggered', (alert) => {
      console.log('🚨 알림:', alert.message);
      setAlerts(prev => [alert, ...prev].slice(0, 10)); // 최근 10개만 유지

      // 브라우저 알림
      if (Notification.permission === 'granted') {
        new Notification('서버 알림', {
          body: alert.message,
          icon: '/favicon.ico'
        });
      }
    });

    // 시스템 정보 수신
    newSocket.on('system:info', (info) => {
      console.log('💻 시스템 정보:', info);
      setSystemInfo(info);
    });

    // 에러 처리
    newSocket.on('error', (error) => {
      console.error('❌ Socket 오류:', error);
    });

    setSocket(newSocket);

    // 브라우저 알림 권한 요청
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // 클린업
    return () => {
      newSocket.close();
    };
  }, []);

  // 알림 제거
  const removeAlert = useCallback((timestamp) => {
    setAlerts(prev => prev.filter(alert => alert.timestamp !== timestamp));
  }, []);

  // 알림 모두 제거
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    socket,
    isConnected,
    metrics,
    alerts,
    systemInfo,
    removeAlert,
    clearAlerts
  };
};
