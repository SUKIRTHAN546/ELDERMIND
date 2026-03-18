/**
 * ElderMind — useWebSocket Hook
 * Owner: Shivani
 *
 * Keeps the FamilyDashboard live without manual refresh.
 * Auto-reconnects every 3 seconds if the connection drops.
 *
 * Usage:
 *   const { lastMessage, connected } = useWebSocket('ws://localhost:8000/ws/family');
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export default function useWebSocket(url) {
  const [lastMessage, setLastMessage] = useState(null);
  const [connected,   setConnected]   = useState(false);
  const wsRef                         = useRef(null);
  const reconnectTimer                = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws      = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen  = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      // Auto-reconnect after 3 seconds
      reconnectTimer.current = setTimeout(connect, 3000);
    };
    ws.onerror = () => ws.close();
    ws.onmessage = e => {
      try { setLastMessage(JSON.parse(e.data)); }
      catch { setLastMessage(e.data); }
    };
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { lastMessage, connected };
}
