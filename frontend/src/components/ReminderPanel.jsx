/**
 * ElderMind — ReminderPanel Component
 * Owner: Shivani
 *
 * Family members use this to:
 *   1. View upcoming and sent reminders
 *   2. Create new medication / appointment reminders
 *
 * All form fields meet the 60x60px minimum touch target rule.
 */

import { useState, useEffect } from 'react';
import api from '../api';

export default function ReminderPanel({ elderUserId, familyPhone }) {
  const [reminders, setReminders] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [form, setForm] = useState({
    title:        '',
    message:      '',
    remind_at:    '',
    phone_number: familyPhone || '',
    is_recurring: false,
  });

  useEffect(() => {
    loadReminders();
  }, [elderUserId]);

  const loadReminders = async () => {
    try {
      const res = await api.get(`/reminders/${elderUserId}`);
      setReminders(res.data.reminders || []);
    } catch {
      console.error('Failed to load reminders');
    }
  };

  const createReminder = async () => {
    if (!form.title || !form.remind_at || !form.phone_number) {
      alert('Please fill in Title, Date/Time, and Phone Number.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/reminders/create', {
        user_id:      elderUserId,
        title:        form.title,
        message:      form.message,
        remind_at:    new Date(form.remind_at).toISOString(),
        is_recurring: form.is_recurring,
        phone_number: form.phone_number,
      });
      setForm({ title:'', message:'', remind_at:'', phone_number: familyPhone || '', is_recurring:false });
      await loadReminders();
    } catch {
      alert('Could not create reminder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteReminder = async (id) => {
    if (!window.confirm('Delete this reminder?')) return;
    try {
      await api.delete(`/reminders/${id}`);
      await loadReminders();
    } catch {
      alert('Could not delete reminder.');
    }
  };

  const pending = reminders.filter(r => !r.is_sent);
  const sent    = reminders.filter(r =>  r.is_sent);

  return (
    <div style={{ padding:'24px', backgroundColor:'#F4F9FC', minHeight:'100%' }}>
      <h2 style={{ fontSize:'28px', color:'#1B3A5C', marginBottom:'24px' }}>Reminders</h2>

      {/* ── CREATE FORM ──────────────────────────────────────── */}
      <div style={{ backgroundColor:'#FFFFFF', borderRadius:'12px', padding:'24px', marginBottom:'32px', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontSize:'22px', color:'#1B3A5C', marginBottom:'20px' }}>Add New Reminder</h3>

        {[
          { label:'Title',        key:'title',        type:'text',           placeholder:'e.g. Morning Metformin' },
          { label:'Message',      key:'message',      type:'text',           placeholder:'e.g. Take 1 tablet with water' },
          { label:'Date & Time',  key:'remind_at',    type:'datetime-local', placeholder:'' },
          { label:'Send SMS to',  key:'phone_number', type:'tel',            placeholder:'+91XXXXXXXXXX' },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key} style={{ marginBottom:'16px' }}>
            <label style={{ display:'block', fontSize:'20px', color:'#374151', marginBottom:'6px', fontWeight:'600' }}>
              {label}
            </label>
            <input
              type={type}
              value={form[key]}
              onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
              placeholder={placeholder}
              style={{
                width:'100%', padding:'14px 16px', fontSize:'20px',
                borderRadius:'10px', border:'2px solid #D1D5DB', outline:'none',
                boxSizing:'border-box',
              }}
            />
          </div>
        ))}

        <label style={{ display:'flex', alignItems:'center', gap:'12px', fontSize:'20px', color:'#374151', marginBottom:'20px', cursor:'pointer' }}>
          <input
            type="checkbox"
            checked={form.is_recurring}
            onChange={e => setForm(prev => ({ ...prev, is_recurring: e.target.checked }))}
            style={{ width:'24px', height:'24px', cursor:'pointer' }}
          />
          Recurring reminder
        </label>

        <button
          onClick={createReminder}
          disabled={loading}
          style={{
            width:'100%', padding:'16px', fontSize:'22px', fontWeight:'700',
            backgroundColor: loading ? '#9CA3AF' : '#3B82F6',
            color:'#FFFFFF', border:'none', borderRadius:'12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            minHeight:'60px',
          }}
        >
          {loading ? 'Creating...' : 'Create Reminder'}
        </button>
      </div>

      {/* ── PENDING ──────────────────────────────────────────── */}
      <ReminderList title="Upcoming" items={pending} onDelete={deleteReminder} color="#1B3A5C" />

      {/* ── SENT ─────────────────────────────────────────────── */}
      <ReminderList title="Sent"     items={sent}    onDelete={deleteReminder} color="#6B7280" />
    </div>
  );
}

function ReminderList({ title, items, onDelete, color }) {
  if (items.length === 0) return null;
  return (
    <div style={{ backgroundColor:'#FFFFFF', borderRadius:'12px', padding:'20px', marginBottom:'20px', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
      <h3 style={{ fontSize:'22px', color, marginBottom:'16px' }}>{title} ({items.length})</h3>
      {items.map(r => (
        <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #F3F4F6', paddingBottom:'12px', marginBottom:'12px' }}>
          <div>
            <p style={{ fontSize:'20px', fontWeight:'600', color:'#1F2937', margin:'0 0 4px' }}>{r.title}</p>
            <p style={{ fontSize:'18px', color:'#6B7280', margin:0 }}>
              {new Date(r.remind_at).toLocaleString('en-IN')}
              {r.is_recurring ? ' · Recurring' : ''}
            </p>
          </div>
          <button
            onClick={() => onDelete(r.id)}
            style={{ padding:'10px 18px', fontSize:'18px', backgroundColor:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:'8px', cursor:'pointer', minWidth:'60px', minHeight:'44px' }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
