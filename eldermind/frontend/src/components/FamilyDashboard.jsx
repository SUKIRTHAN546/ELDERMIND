import React, { useState, useEffect, useRef } from 'react';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws/family';

export default function FamilyDashboard() {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [scamAlerts, setScamAlerts] = useState([]);
  const ws = useRef(null);

  useEffect(() => {
    connectWebSocket();
    return () => ws.current?.close();
  }, []);

  const connectWebSocket = () => {
    try {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => setConnected(true);

      ws.current.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === 'scam_alert') {
          setScamAlerts(prev => [data, ...prev].slice(0, 5));
        } else {
          setEvents(prev => [data, ...prev].slice(0, 10));
        }
      };

      ws.current.onclose = () => {
        setConnected(false);
        // Retry connection after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      ws.current.onerror = () => {
        setConnected(false);
      };
    } catch {
      setConnected(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-blue-800">👨‍👩‍👧 Family Dashboard</h2>
        <span className={`text-base font-semibold px-3 py-1 rounded-full ${
          connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
        }`}>
          {connected ? '🟢 Live' : '🔴 Offline'}
        </span>
      </div>

      {/* Scam Alerts */}
      {scamAlerts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-red-700 mb-3">⚠️ Scam Alerts</h3>
          {scamAlerts.map((alert, i) => (
            <div key={i} className="bg-red-50 border border-red-300 rounded-xl p-4 mb-3">
              <p className="text-lg font-bold text-red-700">
                Risk Score: {(alert.risk_score * 100).toFixed(0)}%
              </p>
              <p className="text-lg text-gray-700">{alert.message}</p>
              <p className="text-base text-gray-400">{alert.timestamp}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent Conversations */}
      <h3 className="text-xl font-semibold text-gray-700 mb-3">💬 Recent Activity</h3>
      {events.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <p className="text-lg text-gray-500">
            {connected
              ? 'Waiting for activity...'
              : 'Connecting to live feed...'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((event, i) => (
            <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-lg text-gray-800">{event.content}</p>
              <p className="text-base text-gray-400">{event.created_at}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}