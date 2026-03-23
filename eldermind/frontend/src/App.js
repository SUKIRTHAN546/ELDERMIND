import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Mic, Bell, Users, Settings, PlusCircle, Pill, Phone, Brain, AlertTriangle, CheckCircle, Clock, Calendar, Smartphone, Shield, Activity, Send } from 'lucide-react';
import Logo from './components/Logo';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    font-family: 'DM Sans', sans-serif;
    background: #FCF8F5;
    color: #1A2F4C;
    height: 100vh;
    overflow: hidden;
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
  }

  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(circle at 15% 50%, rgba(123, 160, 91, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 85% 30%, rgba(26, 47, 76, 0.05) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }

  #root { position: relative; z-index: 1; height: 100vh; display: flex; }

  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(168, 201, 138, 0.5); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(123, 160, 91, 0.8); }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  @keyframes dotBounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
      40% { transform: translateY(-6px); opacity: 1; }
  }

  .fade-up-1 { animation: fadeUp 0.5s 0.1s ease both; }
  .fade-up-2 { animation: fadeUp 0.5s 0.2s ease both; }
  .fade-up-3 { animation: fadeUp 0.5s 0.3s ease both; }

  .glass-panel {
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 12px 40px rgba(30, 45, 61, 0.04);
  }

  .sidebar-btn {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    border-radius: 16px;
    border: none;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 1.05rem;
    font-weight: 500;
    transition: all 0.2s ease;
    width: 100%;
    text-align: left;
    background: transparent;
  }
  .sidebar-btn:hover:not(.active) {
    background: rgba(42, 63, 92, 0.04);
  }
  .sidebar-btn.active {
    background: #2A3F5C;
    color: #FFFFFF;
    box-shadow: 0 8px 24px rgba(42, 63, 92, 0.15);
  }

  .chat-input {
    flex: 1;
    padding: 20px 24px;
    border-radius: 24px;
    border: 1.5px solid rgba(30,45,61,0.12);
    background: rgba(255,255,255,0.9);
    font-size: 1.05rem;
    color: #1E2D3D;
    outline: none;
    font-family: 'DM Sans', sans-serif;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .chat-input:focus { 
    border-color: #7BA05B;
    box-shadow: 0 4px 20px rgba(123, 160, 91, 0.15);
  }

  .field-input {
    width: 100%;
    padding: 18px 18px 18px 56px;
    border-radius: 20px;
    border: 1.5px solid rgba(30,45,61,0.10);
    background: rgba(255,255,255,0.7);
    font-size: 1.05rem;
    color: #1E2D3D;
    outline: none;
    font-family: 'DM Sans', sans-serif;
    transition: border-color 0.2s;
  }
  .field-input:focus { border-color: #7BA05B; }
  
  .quick-action-card {
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.9);
    border-radius: 24px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 8px 32px rgba(30, 45, 61, 0.03);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .quick-action-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(30, 45, 61, 0.08);
  }

  .stat-card {
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(30,45,61,0.08) !important;
  }
`;

const TABS = [
  { id: 'chat', icon: MessageSquare, label: 'Chat Assistant' },
  { id: 'voice', icon: Mic, label: 'Voice Mode' },
  { id: 'reminders', icon: Bell, label: 'Reminders' },
  { id: 'family', icon: Users, label: 'Family Dashboard' },
];

function Sidebar({ active, setActive }) {
  return (
    <aside style={{
      width: 320, minWidth: 320, height: '100%', 
      borderRight: '1px solid rgba(30,45,61,0.06)',
      display: 'flex', flexDirection: 'column',
      padding: '40px 32px', background: 'rgba(255,255,255,0.4)',
      backdropFilter: 'blur(24px)', zIndex: 10
    }}>
      <div style={{ marginBottom: 56 }}>
        <Logo size={80} layout="horizontal" />
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button 
              key={tab.id} 
              className={`sidebar-btn fade-up-1 ${active === tab.id ? 'active' : ''}`}
              onClick={() => setActive(tab.id)}
              style={{ color: active === tab.id ? '#FFFFFF' : '#6B7C93' }}
            >
              <Icon size={24} style={{ opacity: active === tab.id ? 1 : 0.7 }} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <div style={{
          padding: '24px', borderRadius: '24px', 
          background: 'linear-gradient(135deg, #7BA05B 0%, #5A7A42 100%)',
          color: '#fff', display: 'flex', flexDirection: 'column', gap: 12,
          boxShadow: '0 12px 32px rgba(123, 160, 91, 0.25)'
        }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Talk to ElderMind</h4>
          <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>Need immediate assistance?</p>
          <button style={{
            background: '#fff', color: '#5A7A42', border: 'none', 
            padding: '12px 16px', borderRadius: '14px', fontWeight: 700,
            cursor: 'pointer', marginTop: 8, transition: 'transform 0.2s', fontSize: '1rem',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8
          }} onClick={() => setActive('voice')}
             onMouseOver={e => e.currentTarget.style.transform='scale(1.02)'}
             onMouseOut={e => e.currentTarget.style.transform='scale(1)'}>
            <Mic size={18} />
            Start Voice
          </button>
        </div>
      </div>
    </aside>
  );
}

function MainHeader() {
  return (
    <div className="fade-up-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
      <div>
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '3.2rem', fontWeight: 700, color: '#1A2F4C',
          letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 12,
        }}>Good Morning</h1>
        <p style={{
          fontSize: '1.25rem', color: '#6B7C93', fontWeight: 400,
          fontStyle: 'italic',
        }}>How are you feeling today?</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: '#F2F6EF', padding: '10px 20px',
          borderRadius: '100px', border: '1px solid #E6ECDD'
        }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#7BA05B', display: 'inline-block' }} />
          <span style={{ fontSize: '1.05rem', fontWeight: 600, color: '#5A7A42' }}>ElderMind Online</span>
        </div>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', border: '1px solid rgba(30,45,61,0.08)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)', transition: 'transform 0.2s', color: '#8898AA'
        }}>
          <Settings size={28} />
        </div>
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { label: 'Medicines', icon: Pill },
    { label: 'Call Family', icon: Phone },
    { label: 'Memory', icon: Brain },
    { label: 'Emergency', icon: AlertTriangle },
  ];
  return (
    <div className="fade-up-2" style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px'
    }}>
      {actions.map((act, i) => {
        const Icon = act.icon;
        return (
          <div key={i} className="quick-action-card" style={{ color: '#1A2F4C' }}>
            <Icon size={36} strokeWidth={1.5} style={{ opacity: 0.8 }} />
            <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{act.label}</span>
          </div>
        )
      })}
    </div>
  );
}

function ChatSection() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am ElderMind. How are you feeling today?', time: '9:00 AM' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const send = async () => {
    if (!input.trim() || loading) return;
    setMessages(p => [...p, { role: 'user', content: input, time: now() }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, user_id: 1 }),
      });
      const data = await res.json();
      setMessages(p => [...p, { role: 'assistant', content: data.response, time: now() }]);
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: 'I am here for you. Please check your connection.', time: now() }]);
    }
    setLoading(false);
  };

  return (
    <div className="glass-panel fade-up-3" style={{ display: 'flex', flexDirection: 'column', flex: 1, borderRadius: 32, overflow: 'hidden' }}>
      <div style={{ padding: '24px 40px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 20 }}>
         <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #7BA05B, #5A7A42)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff', fontWeight: 700 }}>E</div>
         <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1A2F4C' }}>ElderMind Assistant</h2>
            <p style={{ fontSize: '1rem', color: '#6B7C93', marginTop: 2 }}>Always here to listen</p>
         </div>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px', display: 'flex', flexDirection: 'column', gap: 32 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '65%', padding: '20px 28px',
              borderRadius: msg.role === 'user' ? '28px 28px 8px 28px' : '28px 28px 28px 8px',
              background: msg.role === 'user' ? 'linear-gradient(135deg, #1E2D3D 0%, #2E4057 100%)' : 'rgba(255,255,255,1)',
              color: msg.role === 'user' ? '#fff' : '#1E2D3D',
              fontSize: '1.15rem', lineHeight: 1.6,
              boxShadow: msg.role === 'user' ? '0 12px 32px rgba(30,45,61,0.2)' : '0 12px 32px rgba(30,45,61,0.06)',
            }}>{msg.content}</div>
            <span style={{ fontSize: '0.9rem', color: '#8A9BAA', marginTop: 10, alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', padding: '0 8px' }}>{msg.time}</span>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ padding: '24px 32px', borderRadius: '28px 28px 28px 8px', background: 'rgba(255,255,255,1)', boxShadow: '0 12px 32px rgba(30,45,61,0.06)', display: 'flex', gap: 8, alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: '#7BA05B', display: 'inline-block', animation: `dotBounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} style={{ height: 32, flexShrink: 0 }} />
      </div>
      
      <div style={{ padding: '32px 40px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', gap: 20, alignItems: 'center', background: 'rgba(255,255,255,0.6)' }}>
        <input className="chat-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Type your message to ElderMind..." disabled={loading} />
        <button onClick={send} disabled={loading || !input.trim()} style={{
          width: 72, height: 72, borderRadius: '50%', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          background: input.trim() ? 'linear-gradient(135deg, #7BA05B 0%, #5A7A42 100%)' : 'rgba(30,45,61,0.1)',
          color: input.trim() ? '#fff' : '#8A9BAA',
          boxShadow: input.trim() ? '0 12px 32px rgba(123,160,91,0.35)' : 'none',
          transition: 'all 0.2s',
          transform: input.trim() ? 'scale(1)' : 'scale(0.95)'
        }}>
          <Send size={28} style={{ marginLeft: -2 }} />
        </button>
      </div>
    </div>
  );
}

function VoiceSection() {
  const [state, setState] = useState('idle');
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];
      mediaRecorder.current.ondataavailable = e => chunks.current.push(e.data);
      mediaRecorder.current.onstop = () => { setState('processing'); setTimeout(() => setState('idle'), 2000); };
      mediaRecorder.current.start();
      setState('recording');
    } catch { setState('error'); }
  };

  const stop = () => { if (mediaRecorder.current) mediaRecorder.current.stop(); };

  const config = {
    idle: { label: 'Hold to Speak', sub: 'Press and hold the button to talk to ElderMind', bg: 'linear-gradient(135deg, #7BA05B 0%, #5A7A42 100%)', shadow: '0 24px 64px rgba(123,160,91,0.4)', icon: Mic, anim: 'none' },
    recording: { label: 'Listening...', sub: 'Release when you are done speaking', bg: 'linear-gradient(135deg, #E8897A 0%, #C0392B 100%)', shadow: '0 24px 64px rgba(232,137,122,0.5)', icon: Mic, anim: 'pulse 1.5s ease-in-out infinite' },
    processing: { label: 'Processing...', sub: 'ElderMind is thinking', bg: 'linear-gradient(135deg, #E8A44A 0%, #C87A2A 100%)', shadow: '0 24px 64px rgba(232,164,74,0.4)', icon: Clock, anim: 'none' },
    error: { label: 'Try Again', sub: 'Please allow microphone access in your browser', bg: 'linear-gradient(135deg, #7A8A9A 0%, #5A6A7A 100%)', shadow: '0 24px 64px rgba(90,106,122,0.3)', icon: AlertTriangle, anim: 'none' },
  };
  const c = config[state];
  const Icon = c.icon;

  return (
    <div className="glass-panel fade-up-3" style={{ flex: 1, borderRadius: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 48 }}>
      
      <div style={{ textAlign: 'center' }}>
         <h2 style={{ fontSize: '2.8rem', fontFamily: 'Playfair Display, serif', fontWeight: 700, color: '#1A2F4C', marginBottom: 16 }}>Voice Mode</h2>
         <p style={{ fontSize: '1.3rem', color: '#6B7C93' }}>Speak naturally. ElderMind is listening.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', height: 80, margin: '20px 0' }}>
        {[3, 5, 8, 12, 16, 24, 18, 12, 20, 14, 8, 12, 7, 4].map((h, i) => (
          <div key={i} style={{ width: 8, height: state === 'recording' ? h * 4.5 : h * 1.5, borderRadius: 4, background: state === 'recording' ? '#E8897A' : '#A8C98A', transition: 'height 0.2s ease', opacity: state === 'recording' ? 1 : 0.5 }} />
        ))}
      </div>

      <button onMouseDown={start} onMouseUp={stop} onTouchStart={start} onTouchEnd={stop} disabled={state === 'processing'}
        style={{ width: 280, height: 280, borderRadius: '50%', border: 'none', background: c.bg, boxShadow: c.shadow, animation: c.anim, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, cursor: state === 'processing' ? 'wait' : 'pointer', transition: 'all 0.3s' }}>
        <Icon size={72} color="#fff" strokeWidth={1.5} />
        <span style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 600 }}>{c.label}</span>
      </button>

      <p style={{ color: '#5A6A7A', fontSize: '1.25rem', textAlign: 'center' }}>{c.sub}</p>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginTop: 40 }}>
        {['Tamil', 'Bengali', 'English', 'Spanish'].map(lang => (
          <span key={lang} style={{ padding: '12px 28px', borderRadius: 100, background: 'rgba(123,160,91,0.08)', border: '1.5px solid rgba(123,160,91,0.3)', color: '#5A7A42', fontSize: '1.15rem', fontWeight: 600 }}>{lang}</span>
        ))}
      </div>
    </div>
  );
}

function RemindersSection() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [time, setTime] = useState('');
  const [phone, setPhone] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!title || !time) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaved(true); setLoading(false);
    setTimeout(() => setSaved(false), 3000);
    setTitle(''); setMessage(''); setTime(''); setPhone('');
  };

  const Field = ({ icon: Icon, placeholder, value, onChange, type }) => (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', color: '#8A9BAA', display: 'flex' }}>
         <Icon size={22} strokeWidth={2} />
      </span>
      <input className="field-input" type={type || 'text'} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );

  return (
    <div className="glass-panel fade-up-3" style={{ flex: 1, borderRadius: 32, padding: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 720, width: '100%', display: 'flex', flexDirection: 'column', gap: 28 }}>
         <h2 style={{ fontSize: '2.6rem', fontFamily: 'Playfair Display, serif', fontWeight: 700, color: '#1A2F4C', textAlign: 'center', marginBottom: 8 }}>Set a Reminder</h2>
         <p style={{ color: '#6B7C93', fontSize: '1.2rem', textAlign: 'center', marginBottom: 32 }}>Set medication or event reminders — we'll send an SMS at the right time to ensure you never miss anything.</p>

         <Field icon={PlusCircle} placeholder="Reminder title (e.g. Morning Medicine)" value={title} onChange={setTitle} />
         <Field icon={MessageSquare} placeholder="Message (e.g. Take 2 tablets with water)" value={message} onChange={setMessage} />
         <Field icon={Calendar} placeholder="Date & Time" value={time} onChange={setTime} type="datetime-local" />
         <Field icon={Smartphone} placeholder="Phone number (+91XXXXXXXXXX)" value={phone} onChange={setPhone} />
         
         {saved && <div className="fade-up-1" style={{ padding: '20px 32px', borderRadius: 20, background: 'rgba(123,160,91,0.15)', border: '1.5px solid rgba(123,160,91,0.3)', color: '#4A6A32', fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 16 }}>
            <CheckCircle size={24} /> Reminder set successfully! You will receive an SMS on time.
         </div>}
         
         <button onClick={save} disabled={loading || !title || !time} style={{
            padding: '24px', borderRadius: 24, border: 'none', width: '100%', marginTop: 20,
            fontSize: '1.2rem', fontWeight: 700, fontFamily: 'DM Sans, sans-serif',
            background: title && time ? 'linear-gradient(135deg, #1A2F4C 0%, #2E4057 100%)' : 'rgba(30,45,61,0.1)',
            color: title && time ? '#fff' : '#8A9BAA',
            boxShadow: title && time ? '0 16px 40px rgba(26,47,76,0.25)' : 'none',
            cursor: title && time ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12
         }}>
             {!loading && <Calendar size={20} />}
             {loading ? 'Saving...' : 'Set Reminder'}
         </button>
      </div>
    </div>
  );
}

function FamilySection() {
  const stats = [
    { icon: MessageSquare, label: 'Conversations Today', value: '3', color: '#7BA05B' },
    { icon: Clock, label: 'Reminders Set', value: '2', color: '#E8A44A' },
    { icon: Shield, label: 'Scam Alerts Prevented', value: '0', color: '#E8897A' },
    { icon: Mic, label: 'Voice Sessions', value: '1', color: '#1E2D3D' },
  ];

  return (
    <div className="glass-panel fade-up-3" style={{ flex: 1, borderRadius: 32, padding: 56, display: 'flex', gap: 64 }}>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 40 }}>
         <div>
            <h2 style={{ fontSize: '2.6rem', fontFamily: 'Playfair Display, serif', fontWeight: 700, color: '#1A2F4C', marginBottom: 12 }}>Family Dashboard</h2>
            <p style={{ color: '#6B7C93', fontSize: '1.25rem' }}>Monitor well-being and stay connected with your loved ones.</p>
         </div>

         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderRadius: 24, background: 'rgba(232,164,74,0.12)', border: '1px solid rgba(232,164,74,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
               <Activity size={24} color="#E8A44A" />
               <span style={{ fontSize: '1.15rem', fontWeight: 600, color: '#5A6A7A' }}>Live Analytics Connected</span>
            </div>
            <span style={{ fontSize: '1.05rem', color: '#8A9BAA', fontWeight: 500 }}>Updated Just Now</span>
         </div>
         
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            {stats.map((s, i) => {
               const Icon = s.icon;
               return (
                 <div key={i} style={{ padding: '32px', borderRadius: 28, background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(255,255,255,1)', boxShadow: '0 12px 40px rgba(30,45,61,0.06)', display: 'flex', flexDirection: 'column', gap: 16 }} className="stat-card">
                 <Icon size={40} color={s.color} strokeWidth={1.5} />
                 <span style={{ fontSize: '3.4rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</span>
                 <span style={{ fontSize: '1.15rem', color: '#5A6A7A', fontWeight: 500 }}>{s.label}</span>
                 </div>
               )
            })}
         </div>
      </div>

      <div style={{ width: 440, display: 'flex', flexDirection: 'column' }}>
         <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#5A6A7A', marginBottom: 32, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent Activity Stream</h3>
         <div style={{ flex: 1, padding: '40px', borderRadius: 32, background: 'rgba(255,255,255,0.6)', border: '2px dashed rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A9BAA', fontSize: '1.25rem', textAlign: 'center', lineHeight: 1.6, flexDirection: 'column', gap: 16 }}>
            <Shield size={48} color="#A8C98A" strokeWidth={1} />
            <div>No recent critical activities. <br/> Everything looks good!</div>
         </div>
      </div>
    </div>
  );
}

const SECTION_INFO = {
  chat: { title: 'Chat with ElderMind', sub: 'Your AI companion is here' },
  voice: { title: 'Voice Assistant', sub: 'Speak naturally in any language' },
  reminders: { title: 'Medication Reminders', sub: 'Never miss a dose' },
  family: { title: 'Family Dashboard', sub: 'Stay connected with loved ones' },
};

const SECTIONS = { chat: ChatSection, voice: VoiceSection, reminders: RemindersSection, family: FamilySection };

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const ActiveSection = SECTIONS[activeTab];

  return (
    <>
      <style>{styles}</style>
      <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#FCF8F5' }}>
        <Sidebar active={activeTab} setActive={setActiveTab} />
        
        <main style={{ flex: 1, padding: '48px 64px', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
          <MainHeader />
          <QuickActions />
          <ActiveSection />
        </main>
      </div>
    </>
  );
}