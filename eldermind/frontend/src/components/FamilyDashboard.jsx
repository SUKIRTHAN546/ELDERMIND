/**
 * ElderMind — FamilyDashboard Component
 * Owner: Shivani
 *
 * Real-time family member view showing:
 *   - Recent conversations
 *   - Upcoming reminders
 *   - Scam alerts (highlighted in amber)
 *   - Memory summary from ChromaDB
 *
 * Updates live via WebSocket — no page refresh needed.
 */

import { useState, useEffect } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import api from '../api';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws/family';

export default function FamilyDashboard({ elderUserId }) {
  const [conversations, setConversations] = useState([]);
  const [reminders,     setReminders]     = useState([]);
  const [scamAlerts,    setScamAlerts]    = useState([]);
  const [memories,      setMemories]      = useState([]);

  const { lastMessage, connected } = useWebSocket(WS_URL);

  // ── Load initial data ────────────────────────────────────────
  useEffect(() => {
    api.get(`/chat/history/${elderUserId}`).then(r => setConversations(r.data.history || [])).catch(() => {});
    api.get(`/reminders/${elderUserId}`).then(r => setReminders(r.data.reminders || [])).catch(() => {});
    api.get(`/memory/all/${elderUserId}`).then(r => setMemories(r.data.memories || [])).catch(() => {});
  }, [elderUserId]);

  // ── Handle real-time WebSocket events ───────────────────────
  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === 'new_conversation') {
      setConversations(prev => [lastMessage.data, ...prev].slice(0, 20));
    } else if (lastMessage.type === 'scam_alert') {
      setScamAlerts(prev => [lastMessage.data, ...prev]);
    } else if (lastMessage.type === 'reminder_sent') {
      setReminders(prev => prev.map(r => r.id === lastMessage.data.id ? { ...r, is_sent: true } : r));
    }
  }, [lastMessage]);

  const memoryCounts = memories.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ padding:'32px', maxWidth:'960px', margin:'0 auto', backgroundColor:'#F4F9FC', minHeight:'100vh' }}>

      {/* ── HEADER ───────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'32px' }}>
        <h1 style={{ fontSize:'32px', color:'#1B3A5C', margin:0 }}>Family Dashboard</h1>
        <span style={{
          padding:'4px 14px', borderRadius:'999px', fontSize:'16px', fontWeight:'600',
          backgroundColor: connected ? '#DCFCE7' : '#FEE2E2',
          color:           connected ? '#166534' : '#991B1B',
        }}>
          {connected ? '● Live' : '○ Reconnecting...'}
        </span>
      </div>

      {/* ── SCAM ALERTS ──────────────────────────────────────── */}
      {scamAlerts.length > 0 && (
        <div style={{ backgroundColor:'#FEF3C7', border:'2px solid #F59E0B', borderRadius:'12px', padding:'20px', marginBottom:'24px' }}>
          <h2 style={{ fontSize:'22px', color:'#92400E', margin:'0 0 12px' }}>⚠️ Scam Alerts</h2>
          {scamAlerts.map((a, i) => (
            <p key={i} style={{ fontSize:'18px', color:'#78350F', margin:'6px 0' }}>
              {a.timestamp}: {a.message}
            </p>
          ))}
        </div>
      )}

      {/* ── MAIN GRID ────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px', marginBottom:'24px' }}>
        <Section title="Recent Conversations">
          {conversations.length === 0
            ? <EmptyState text="No conversations yet" />
            : conversations.slice(0, 5).map((m, i) => (
                <div key={i} style={{ fontSize:'18px', color:'#374151', margin:'8px 0', borderBottom:'1px solid #E5E7EB', paddingBottom:'8px' }}>
                  <strong>{m.role === 'user' ? 'Amma' : 'ElderMind'}:</strong>{' '}
                  {m.content?.slice(0, 90)}{m.content?.length > 90 ? '...' : ''}
                </div>
              ))
          }
        </Section>

        <Section title="Upcoming Reminders">
          {reminders.filter(r => !r.is_sent).length === 0
            ? <EmptyState text="No upcoming reminders" />
            : reminders.filter(r => !r.is_sent).slice(0, 5).map((r, i) => (
                <div key={i} style={{ fontSize:'18px', color:'#374151', margin:'8px 0', borderBottom:'1px solid #E5E7EB', paddingBottom:'8px' }}>
                  <strong>{r.title}</strong><br />
                  <span style={{ color:'#6B7280' }}>{new Date(r.remind_at).toLocaleString('en-IN')}</span>
                </div>
              ))
          }
        </Section>
      </div>

      {/* ── MEMORY SUMMARY ───────────────────────────────────── */}
      <Section title={`What ElderMind Knows (${memories.length} memories)`}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'12px', marginTop:'8px' }}>
          {['family','medical','preferences','routine','life_memories','events'].map(cat => (
            <div key={cat} style={{
              padding:'8px 16px', borderRadius:'999px', fontSize:'18px', fontWeight:'600',
              backgroundColor: memoryCounts[cat] ? '#DBEAFE' : '#F3F4F6',
              color:           memoryCounts[cat] ? '#1D4ED8' : '#9CA3AF',
            }}>
              {cat.replace('_', ' ')} {memoryCounts[cat] ? `(${memoryCounts[cat]})` : '—'}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ backgroundColor:'#FFFFFF', borderRadius:'12px', padding:'20px', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
      <h2 style={{ fontSize:'22px', color:'#1B3A5C', margin:'0 0 16px' }}>{title}</h2>
      {children}
    </div>
  );
}

function EmptyState({ text }) {
  return <p style={{ fontSize:'18px', color:'#9CA3AF', margin:0 }}>{text}</p>;
}
