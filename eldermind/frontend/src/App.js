import React, { useState, useRef, useEffect } from 'react';
import Logo from './components/Logo';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    font-family: 'DM Sans', sans-serif;
    background: #FCF8F5;
    color: #1A2F4C;
    min-height: 100vh;
    font-size: 18px;
    line-height: 1.7;
    -webkit-font-smoothing: antialiased;
  }

  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 20% 10%, rgba(255,255,255,0.8) 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at 80% 80%, rgba(135,178,110,0.06) 0%, transparent 60%);
    pointer-events: none;
    z-index: 0;
  }

  #root { position: relative; z-index: 1; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-thumb { background: #A8C98A; border-radius: 3px; }

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

  .fade-up-1 { animation: fadeUp 0.6s 0.1s ease both; }
  .fade-up-2 { animation: fadeUp 0.6s 0.2s ease both; }
  .fade-up-3 { animation: fadeUp 0.6s 0.3s ease both; }
  .fade-up-4 { animation: fadeUp 0.6s 0.4s ease both; }
  .fade-up-5 { animation: fadeUp 0.6s 0.5s ease both; }
  .logo-float { animation: float 4s ease-in-out infinite; }

  .chat-input {
    flex: 1;
    padding: 14px 18px;
    border-radius: 20px;
    border: 1.5px solid rgba(30,45,61,0.12);
    background: rgba(255,255,255,0.8);
    font-size: 1rem;
    color: #1E2D3D;
    outline: none;
    font-family: 'DM Sans', sans-serif;
    transition: border-color 0.2s;
  }
  .chat-input:focus { border-color: #7BA05B; }

  .field-input {
    width: 100%;
    padding: 14px 14px 14px 44px;
    border-radius: 16px;
    border: 1.5px solid rgba(30,45,61,0.10);
    background: rgba(255,255,255,0.7);
    font-size: 0.95rem;
    color: #1E2D3D;
    outline: none;
    font-family: 'DM Sans', sans-serif;
    transition: border-color 0.2s;
  }
  .field-input:focus { border-color: #7BA05B; }

  .tab-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 10px 6px;
    border-radius: 36px;
    border: none;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    transition: all 0.25s ease;
  }
`;

function Navbar() {
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '24px 24px 0', background: 'transparent'
    }}>
      <Logo size={42} layout="horizontal" />

      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: 'rgba(30,45,61,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', border: '1px solid rgba(30,45,61,0.08)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
      }}>
        <span style={{ fontSize: '1.2rem', color: '#8898AA' }}>⚙️</span>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <header style={{ textAlign: 'center', padding: '36px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 className="fade-up-1" style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: 'clamp(2.4rem, 6vw, 3rem)',
        fontWeight: 700, color: '#1A2F4C',
        letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 8,
      }}>Good Morning <span style={{ fontSize: '0.9em' }}>💙</span></h1>

      <p className="fade-up-2" style={{
        fontSize: '1.15rem', color: '#6B7C93', fontWeight: 300,
        fontStyle: 'italic', margin: '0 auto 32px',
      }}>How are you feeling today?</p>

      {/* Talk to ElderMind Button */}
      <button className="fade-up-3" style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        background: 'linear-gradient(180deg, #95B978 0%, #76A158 100%)',
        color: '#FFFFFF', fontSize: '1.15rem', fontWeight: '600',
        padding: '16px 40px', borderRadius: '100px',
        border: '3px solid rgba(255,255,255,0.7)',
        boxShadow: '0 12px 28px rgba(118, 161, 88, 0.4), inset 0 2px 4px rgba(255,255,255,0.4)',
        cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
        transition: 'transform 0.2s'
      }}>
        <span style={{ fontSize: '1.4rem' }}>🎤</span>
        Talk to ElderMind
      </button>
    </header>
  );
}

const TABS = [
  { id: 'chat', icon: '💬', label: 'Chat' },
  { id: 'voice', icon: '🎤', label: 'Voice' },
  { id: 'reminders', icon: '⏰', label: 'Reminders' },
  { id: 'family', icon: '👨‍👩‍👧', label: 'Family' },
];

function NavTabs({ active, setActive }) {
  return (
    <nav className="fade-up-4" style={{
      display: 'flex', gap: 4, padding: '10px',
      background: '#FFFFFF', borderRadius: '100px',
      margin: '0 24px 24px', boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
      justifyContent: 'space-between'
    }}>
      {TABS.map(tab => {
        const isActive = active === tab.id;
        return (
          <button key={tab.id} className="tab-btn" onClick={() => setActive(tab.id)} style={{
            background: isActive ? '#2A3F5C' : 'transparent',
            color: isActive ? '#FFFFFF' : '#6B7C93',
            fontWeight: isActive ? 600 : 500,
            borderRadius: '100px',
            padding: '12px 0',
            width: '23%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: isActive ? '0 4px 12px rgba(42, 63, 92, 0.3)' : 'none'
          }}>
            <span style={{ fontSize: '1.4rem', filter: isActive ? 'brightness(0) invert(1)' : 'none', transition: 'filter 0.2s' }}>
              {tab.icon}
            </span>
            <span style={{ fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif' }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function QuickActions() {
  const actions = [
    { label: 'Medicines', icon: '💊' },
    { label: 'Call Family', icon: '📞' },
    { label: 'Memory', icon: '🧠' },
    { label: 'Emergency', icon: '🚨' },
  ];
  return (
    <div className="fade-up-5" style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
      padding: '0 24px', marginBottom: '32px'
    }}>
      {actions.map((act, i) => (
        <div key={i} style={{
          background: '#FFFFFF', borderRadius: '24px', padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.03)', cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}>
          <span style={{ fontSize: '2.2rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>{act.icon}</span>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1A2F4C' }}>{act.label}</span>
        </div>
      ))}
    </div>
  );
}

function ChatSection() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am ElderMind. How are you feeling today? 😊', time: '9:00 AM' }
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
      setMessages(p => [...p, { role: 'assistant', content: 'I am here for you. Please check your connection. 💙', time: now() }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 520 }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'assistant' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #7BA05B, #5A7A42)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 700 }}>E</div>
                <span style={{ fontSize: '0.78rem', color: '#8A9BAA', fontWeight: 500 }}>ElderMind</span>
              </div>
            )}
            <div style={{
              maxWidth: '78%', padding: '14px 18px',
              borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
              background: msg.role === 'user' ? 'linear-gradient(135deg, #1E2D3D 0%, #2E4057 100%)' : 'rgba(255,255,255,0.9)',
              color: msg.role === 'user' ? '#fff' : '#1E2D3D',
              fontSize: '1rem', lineHeight: 1.6,
              boxShadow: msg.role === 'user' ? '0 4px 16px rgba(30,45,61,0.25)' : '0 4px 24px rgba(30,45,61,0.08)',
              border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.8)' : 'none',
            }}>{msg.content}</div>
            <span style={{ fontSize: '0.72rem', color: '#8A9BAA', marginTop: 4 }}>{msg.time}</span>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #7BA05B, #5A7A42)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 700 }}>E</div>
            <div style={{ padding: '14px 18px', borderRadius: '20px 20px 20px 4px', background: 'rgba(255,255,255,0.9)', boxShadow: '0 4px 24px rgba(30,45,61,0.08)', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#7BA05B', display: 'inline-block', animation: `dotBounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '12px 16px 16px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', gap: 10, alignItems: 'center' }}>
        <input className="chat-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Type your message..." disabled={loading} />
        <button onClick={send} disabled={loading || !input.trim()} style={{
          width: 50, height: 50, borderRadius: '50%', border: 'none', fontSize: '1.2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          background: input.trim() ? 'linear-gradient(135deg, #7BA05B 0%, #5A7A42 100%)' : 'rgba(30,45,61,0.1)',
          color: input.trim() ? '#fff' : '#8A9BAA',
          boxShadow: input.trim() ? '0 4px 16px rgba(123,160,91,0.35)' : 'none',
        }}>➤</button>
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
    idle: { label: 'Hold to Speak', sub: 'Press and hold the button', bg: 'linear-gradient(135deg, #7BA05B 0%, #5A7A42 100%)', shadow: '0 12px 40px rgba(123,160,91,0.4)', icon: '🎤', anim: 'none' },
    recording: { label: 'Listening...', sub: 'Release when done speaking', bg: 'linear-gradient(135deg, #E8897A 0%, #C0392B 100%)', shadow: '0 12px 40px rgba(232,137,122,0.5)', icon: '🔴', anim: 'pulse 1.5s ease-in-out infinite' },
    processing: { label: 'Processing...', sub: 'ElderMind is thinking', bg: 'linear-gradient(135deg, #E8A44A 0%, #C87A2A 100%)', shadow: '0 12px 40px rgba(232,164,74,0.4)', icon: '⏳', anim: 'none' },
    error: { label: 'Try Again', sub: 'Allow microphone access', bg: 'linear-gradient(135deg, #7A8A9A 0%, #5A6A7A 100%)', shadow: '0 12px 40px rgba(90,106,122,0.3)', icon: '❌', anim: 'none' },
  };
  const c = config[state];

  return (
    <div style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', height: 40 }}>
        {[3, 5, 8, 12, 8, 16, 10, 6, 14, 8, 5, 10, 7, 4].map((h, i) => (
          <div key={i} style={{ width: 3, height: state === 'recording' ? h * 3 : h, borderRadius: 2, background: state === 'recording' ? '#E8897A' : '#A8C98A', transition: 'height 0.3s ease', opacity: state === 'recording' ? 1 : 0.4 }} />
        ))}
      </div>
      <button onMouseDown={start} onMouseUp={stop} onTouchStart={start} onTouchEnd={stop} disabled={state === 'processing'}
        style={{ width: 160, height: 160, borderRadius: '50%', border: 'none', background: c.bg, boxShadow: c.shadow, animation: c.anim, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: state === 'processing' ? 'wait' : 'pointer' }}>
        <span style={{ fontSize: 48 }}>{c.icon}</span>
        <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>{c.label}</span>
      </button>
      <p style={{ color: '#5A6A7A', fontSize: '0.95rem', textAlign: 'center' }}>{c.sub}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['🇮🇳 Tamil', '🇮🇳 Hindi', '🇬🇧 English'].map(lang => (
          <span key={lang} style={{ padding: '6px 14px', borderRadius: 100, background: 'rgba(123,160,91,0.10)', border: '1px solid rgba(123,160,91,0.2)', color: '#5A7A42', fontSize: '0.82rem', fontWeight: 500 }}>{lang}</span>
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

  const Field = ({ icon, placeholder, value, onChange, type }) => (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem' }}>{icon}</span>
      <input className="field-input" type={type || 'text'} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ color: '#5A6A7A', fontSize: '0.9rem' }}>Set medication or event reminders — we'll send an SMS at the right time.</p>
      <Field icon="📋" placeholder="Reminder title (e.g. Morning Medicine)" value={title} onChange={setTitle} />
      <Field icon="💬" placeholder="Message (e.g. Take 2 tablets with water)" value={message} onChange={setMessage} />
      <Field icon="🕐" placeholder="Date & Time" value={time} onChange={setTime} type="datetime-local" />
      <Field icon="📱" placeholder="Phone number (+91XXXXXXXXXX)" value={phone} onChange={setPhone} />
      {saved && <div style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(123,160,91,0.12)', border: '1px solid rgba(123,160,91,0.25)', color: '#5A7A42', fontSize: '0.9rem', fontWeight: 500 }}>✅ Reminder set! SMS will arrive on time.</div>}
      <button onClick={save} disabled={loading || !title || !time} style={{
        padding: '16px', borderRadius: 20, border: 'none', width: '100%',
        fontSize: '1rem', fontWeight: 600, fontFamily: 'DM Sans, sans-serif',
        background: title && time ? 'linear-gradient(135deg, #1E2D3D 0%, #2E4057 100%)' : 'rgba(30,45,61,0.1)',
        color: title && time ? '#fff' : '#8A9BAA',
        boxShadow: title && time ? '0 6px 24px rgba(30,45,61,0.25)' : 'none',
        cursor: title && time ? 'pointer' : 'not-allowed',
      }}>{loading ? '⏳ Saving...' : '📅 Set Reminder'}</button>
    </div>
  );
}

function FamilySection() {
  const stats = [
    { icon: '💬', label: 'Conversations Today', value: '3', color: '#7BA05B' },
    { icon: '⏰', label: 'Reminders Set', value: '2', color: '#E8A44A' },
    { icon: '🛡️', label: 'Scam Alerts', value: '0', color: '#E8897A' },
    { icon: '🎤', label: 'Voice Sessions', value: '1', color: '#1E2D3D' },
  ];

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 16, background: 'rgba(232,164,74,0.10)', border: '1px solid rgba(232,164,74,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#E8A44A', display: 'inline-block' }} />
          <span style={{ fontSize: '0.88rem', fontWeight: 500, color: '#5A6A7A' }}>Connecting to live feed...</span>
        </div>
        <span style={{ fontSize: '0.78rem', color: '#8A9BAA' }}>Today</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ padding: '16px', borderRadius: 20, background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 24px rgba(30,45,61,0.08)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
            <span style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</span>
            <span style={{ fontSize: '0.78rem', color: '#5A6A7A', lineHeight: 1.3 }}>{s.label}</span>
          </div>
        ))}
      </div>
      <div>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#5A6A7A', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent Activity</h3>
        <div style={{ padding: '20px', borderRadius: 20, background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.8)', textAlign: 'center', color: '#8A9BAA', fontSize: '0.9rem' }}>
          Waiting for activity from ElderMind...
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
  const info = SECTION_INFO[activeTab];

  return (
    <>
      <style>{styles}</style>
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', paddingBottom: 40, position: 'relative' }}>
        <Navbar />
        <Hero />
        <NavTabs active={activeTab} setActive={setActiveTab} />
        <QuickActions />

        <div className="fade-up-5" style={{
          background: '#FFFFFF',
          borderRadius: '40px 40px 0 0',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.03)',
          padding: '32px 24px 0',
          minHeight: '400px',
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 700, color: '#1A2F4C', marginBottom: '4px' }}>{info.title}</h2>
              <p style={{ fontSize: '0.9rem', color: '#6B7C93' }}>{info.sub}</p>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#F2F6EF', padding: '6px 6px 6px 12px',
              borderRadius: '100px', border: '1px solid #E6ECDD'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7BA05B', display: 'inline-block' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#5A7A42' }}>Online</span>
              </div>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer'
              }}>
                <span style={{ fontSize: '1.2rem', color: '#1A2F4C' }}>↓</span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, margin: '0 -24px' }}>
            <ActiveSection />
          </div>
        </div>
      </div>
    </>
  );
}