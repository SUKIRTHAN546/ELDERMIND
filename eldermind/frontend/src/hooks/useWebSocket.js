import { useEffect, useRef, useState } from 'react';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws/family';

export default function useWebSocket() {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    connect();
    return () => ws.current?.close();
  }, []);

  const connect = () => {
    try {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => setConnected(true);

      ws.current.onmessage = (e) => {
        const data = JSON.parse(e.data);
        setMessages(prev => [data, ...prev].slice(0, 20));
      };

      ws.current.onclose = () => {
        setConnected(false);
        setTimeout(connect, 5000);
      };

      ws.current.onerror = () => setConnected(false);

    } catch {
      setConnected(false);
    }
  };

  const sendMessage = (data) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  };

  return { messages, connected, sendMessage };
}