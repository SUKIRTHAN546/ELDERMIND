import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Mic, Bell, Users, Settings, PlusCircle, Pill, Phone, Brain, AlertTriangle, CheckCircle, Clock, Calendar, Smartphone, Shield, Activity, Send, BookOpen } from 'lucide-react';
import Logo from './components/Logo';
import OnboardingPage from './components/OnboardingPage';
import { DEMO_USER_ID } from './api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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
  @keyframes spin {
    to { transform: rotate(360deg); }
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
  { id: 'voice', icon: Mic, label: 'Voice Mode' },
  { id: 'chat', icon: MessageSquare, label: 'Chat Assistant' },
  { id: 'reminders', icon: Bell, label: 'Reminders' },
  { id: 'family', icon: Users, label: 'Family Dashboard' },
  { id: 'onboarding', icon: BookOpen, label: 'Setup / Memories' },
];

function Sidebar({ active, onTabSelect }) {
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
              onClick={() => onTabSelect(tab.id)}
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
          }} onClick={() => onTabSelect('voice')}
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
      const res = await fetch(`${API_URL}/chat/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, user_id: DEMO_USER_ID }),
      });
      const data = await res.json();
      setMessages(p => [...p, { role: 'assistant', content: data.reply || 'I am here for you.', time: now() }]);
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

// ─── VOICE SECTION (Task 3 + Task 4) ─────────────────────────────
function VoiceSection({ playGreetingSignal = 0 }) {
  const [state, setState] = useState('idle');
  const [lastReply, setLastReply] = useState('');
  const [greetingText, setGreetingText] = useState('');
  const [greetingLoading, setGreetingLoading] = useState(true);
  const [greetingAudioUrl, setGreetingAudioUrl] = useState('');
  const [replyAudioUrl, setReplyAudioUrl] = useState('');
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const streamRef = useRef(null);
  const replyTimer = useRef(null);
  const greetingFetched = useRef(false);
  const audioRef = useRef(null);
  const lastPlayedSignal = useRef(0);
  const greetingAudioUrlRef = useRef('');
  const replyAudioUrlRef = useRef('');
  const hasUserInteractedRef = useRef(playGreetingSignal > 0);
  const pendingGreetingAutoplayRef = useRef(false);

  const getRecordingOptions = () => {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
    ];

    for (const mimeType of candidates) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported(mimeType)) {
        return {
          mimeType,
          extension: mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm',
        };
      }
    }

    return { mimeType: '', extension: 'webm' };
  };

  const playAudioUrl = useCallback(async (url) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      await audio.play();
      return true;
    } catch (e) {
      console.error('Audio play error:', e);
      return false;
    }
  }, []);

  const attemptGreetingAutoplay = useCallback(async () => {
    const url = greetingAudioUrlRef.current;
    if (!url) return false;
    if (!hasUserInteractedRef.current) {
      pendingGreetingAutoplayRef.current = true;
      return false;
    }

    const didPlay = await playAudioUrl(url);
    pendingGreetingAutoplayRef.current = !didPlay;
    if (!didPlay) {
      setLastReply('Greeting is ready. Press Play Greeting if your browser still blocks autoplay.');
    }
    return didPlay;
  }, [playAudioUrl]);

  const storeAudioBlob = useCallback((blob, kind = 'reply') => {
    const url = URL.createObjectURL(blob);
    if (kind === 'greeting') {
      if (greetingAudioUrlRef.current) URL.revokeObjectURL(greetingAudioUrlRef.current);
      greetingAudioUrlRef.current = url;
      setGreetingAudioUrl(url);
    } else {
      if (replyAudioUrlRef.current) URL.revokeObjectURL(replyAudioUrlRef.current);
      replyAudioUrlRef.current = url;
      setReplyAudioUrl(url);
    }
    return url;
  }, []);

  const playAudioBlob = useCallback(async (blob, kind = 'reply') => {
    const url = storeAudioBlob(blob, kind);
    return playAudioUrl(url);
  }, [playAudioUrl, storeAudioBlob]);

  useEffect(() => {
    if (!playGreetingSignal) return;
    hasUserInteractedRef.current = true;
  }, [playGreetingSignal]);

  useEffect(() => {
    const markInteracted = () => {
      const wasPending = pendingGreetingAutoplayRef.current;
      hasUserInteractedRef.current = true;
      if (wasPending) {
        attemptGreetingAutoplay();
      }
    };

    window.addEventListener('pointerdown', markInteracted, { passive: true });
    window.addEventListener('keydown', markInteracted);
    return () => {
      window.removeEventListener('pointerdown', markInteracted);
      window.removeEventListener('keydown', markInteracted);
    };
  }, [attemptGreetingAutoplay]);

  // ── Task 4: Fetch greeting on mount ───────────────────────────
  useEffect(() => {
    if (greetingFetched.current) return;
    greetingFetched.current = true;

    const fetchGreeting = async () => {
      try {
        const res = await fetch(`${API_URL}/chat/greeting/${DEMO_USER_ID}`);
        if (!res.ok) throw new Error(`Greeting fetch failed with status ${res.status}`);
        const data = await res.json();

        setGreetingText(data.greeting_tamil || data.greeting || '');
        setGreetingLoading(false);

        try {
          const audioRes = await fetch(
            `${API_URL}/voice/speak?text=${encodeURIComponent(data.greeting || '')}&user_id=${encodeURIComponent(DEMO_USER_ID)}`
          );
          if (!audioRes.ok) throw new Error(`Greeting audio fetch failed with status ${audioRes.status}`);

          const blob = await audioRes.blob();
          storeAudioBlob(blob, 'greeting');

          const didPlay = await attemptGreetingAutoplay();
          if (!didPlay) {
            setLastReply(
              hasUserInteractedRef.current
                ? 'Greeting is ready. Press Play Greeting if your browser still blocks autoplay.'
                : 'Greeting is ready. It will play after your first tap, or you can press Play Greeting.'
            );
          }
        } catch (e) {
          console.warn('Greeting audio fetch failed:', e);
          setLastReply('Greeting text loaded, but the audio greeting could not be prepared.');
        }
      } catch (e) {
        console.warn('Greeting fetch failed:', e);
        setGreetingLoading(false);
        setLastReply(`Could not connect to ElderMind server at ${API_URL}. Start the backend and reload.`);
      }
    };

    fetchGreeting();
  }, [attemptGreetingAutoplay, storeAudioBlob]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (replyTimer.current) clearTimeout(replyTimer.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (greetingAudioUrlRef.current) URL.revokeObjectURL(greetingAudioUrlRef.current);
      if (replyAudioUrlRef.current) URL.revokeObjectURL(replyAudioUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (!greetingAudioUrl) return;
    if (!playGreetingSignal) return;
    if (playGreetingSignal === lastPlayedSignal.current) return;

    lastPlayedSignal.current = playGreetingSignal;
    hasUserInteractedRef.current = true;
    attemptGreetingAutoplay();
  }, [attemptGreetingAutoplay, playGreetingSignal, greetingAudioUrl]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const { mimeType } = getRecordingOptions();
      mediaRecorder.current = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunks.current = [];
      mediaRecorder.current.ondataavailable = e => chunks.current.push(e.data);
      mediaRecorder.current.onstop = handleStop;
      mediaRecorder.current.start();
      setState('recording');
      // Clear previous reply
      if (replyTimer.current) clearTimeout(replyTimer.current);
      setLastReply('');
      setGreetingText('');
    } catch { setState('error'); setTimeout(() => setState('idle'), 3000); }
  };

  const stop = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      setState('processing');
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const handleStop = async () => {
    const { mimeType, extension } = getRecordingOptions();
    const blob = new Blob(chunks.current, { type: mimeType || chunks.current[0]?.type || 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', blob, `recording.${extension}`);

    try {
      const res = await fetch(
        `${API_URL}/voice/process?user_id=${encodeURIComponent(DEMO_USER_ID)}`,
        { method: 'POST', body: formData }
      );
      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const audioBlob = await res.blob();
      const isSilent = res.headers.get('X-ElderMind-Silent') === '1';
      const reason = res.headers.get('X-ElderMind-Reason') || '';
      let didPlay = false;
      if (!isSilent) {
        didPlay = await playAudioBlob(audioBlob, 'reply');
      }

      setLastReply(
        isSilent
          ? (reason === 'empty_transcript'
              ? 'I could not hear speech clearly. Please hold the button and speak a little longer.'
              : 'I could not generate audible audio. Please try again.')
          : (didPlay ? 'Playing response...' : 'Audio playback was blocked by the browser.')
      );
      replyTimer.current = setTimeout(() => setLastReply(''), 30000);
      setState('idle');
    } catch (e) {
      console.error('Voice pipeline error:', e);
      setState('error');
      setLastReply('Could not process. Please try again.');
      setTimeout(() => { setState('idle'); setLastReply(''); }, 5000);
    }
  };

  const config = {
    idle: { label: 'Hold to Speak', sub: 'Press and hold the button to talk to ElderMind', bg: 'linear-gradient(135deg, #7BA05B 0%, #5A7A42 100%)', shadow: '0 24px 64px rgba(123,160,91,0.4)', icon: Mic, anim: 'none' },
    recording: { label: 'Listening...', sub: 'Release when you are done speaking', bg: 'linear-gradient(135deg, #E8897A 0%, #C0392B 100%)', shadow: '0 24px 64px rgba(232,137,122,0.5)', icon: Mic, anim: 'pulse 1.5s ease-in-out infinite' },
    processing: { label: 'Thinking...', sub: 'ElderMind is preparing a response', bg: 'linear-gradient(135deg, #E8A44A 0%, #C87A2A 100%)', shadow: '0 24px 64px rgba(232,164,74,0.4)', icon: Clock, anim: 'none' },
    error: { label: 'Try Again', sub: 'Please allow microphone access in your browser', bg: 'linear-gradient(135deg, #7A8A9A 0%, #5A6A7A 100%)', shadow: '0 24px 64px rgba(90,106,122,0.3)', icon: AlertTriangle, anim: 'none' },
  };
  const c = config[state];
  const Icon = c.icon;

  return (
    <div className="glass-panel fade-up-3" style={{ flex: 1, borderRadius: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 32 }}>
      
      <div style={{ textAlign: 'center' }}>
         <h2 style={{ fontSize: '2.8rem', fontFamily: 'Playfair Display, serif', fontWeight: 700, color: '#1A2F4C', marginBottom: 16 }}>Voice Mode</h2>
         <p style={{ fontSize: '1.3rem', color: '#6B7C93' }}>Speak naturally. ElderMind is listening.</p>
      </div>

      {/* Greeting text (Task 4) */}
      {greetingLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', borderRadius: 16, background: 'rgba(123,160,91,0.08)' }}>
          <span style={{ width: 16, height: 16, border: '2px solid rgba(123,160,91,0.3)', borderTopColor: '#7BA05B', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: '1rem', color: '#6B7C93' }}>Preparing your greeting...</span>
        </div>
      )}
      {greetingText && !greetingLoading && (
        <div className="fade-up-1" style={{
          maxWidth: 560, width: '100%', textAlign: 'center',
          padding: '20px 32px', borderRadius: 24,
          background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(123,160,91,0.2)',
          boxShadow: '0 8px 32px rgba(30,45,61,0.06)',
        }}>
          <p style={{ fontSize: '1.3rem', color: '#1A2F4C', lineHeight: 1.7, fontWeight: 500 }}>
            {greetingText}
          </p>
        </div>
      )}

      {(greetingAudioUrl || replyAudioUrl) && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {greetingAudioUrl && (
              <button
                onClick={() => playAudioUrl(greetingAudioUrl)}
                style={{
                  border: 'none',
                  borderRadius: 999,
                  padding: '12px 18px',
                  background: '#2A3F5C',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Play Greeting
              </button>
            )}
            {replyAudioUrl && (
              <button
                onClick={() => playAudioUrl(replyAudioUrl)}
                style={{
                  border: '1px solid rgba(42,63,92,0.18)',
                  borderRadius: 999,
                  padding: '12px 18px',
                  background: '#fff',
                  color: '#2A3F5C',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Replay Reply
              </button>
            )}
          </div>
          <audio
            controls
            preload="auto"
            src={replyAudioUrl || greetingAudioUrl}
            style={{ width: 360, maxWidth: '100%' }}
          />
        </div>
      )}

      {/* Waveform visualizer */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', height: 80, margin: '8px 0' }}>
        {[3, 5, 8, 12, 16, 24, 18, 12, 20, 14, 8, 12, 7, 4].map((h, i) => (
          <div key={i} style={{ width: 8, height: state === 'recording' ? h * 4.5 : h * 1.5, borderRadius: 4, background: state === 'recording' ? '#E8897A' : '#A8C98A', transition: 'height 0.2s ease', opacity: state === 'recording' ? 1 : 0.5 }} />
        ))}
      </div>

      {/* Main voice button */}
      <button onMouseDown={start} onMouseUp={stop} onTouchStart={start} onTouchEnd={stop} disabled={state === 'processing'}
        style={{ width: 280, height: 280, borderRadius: '50%', border: 'none', background: c.bg, boxShadow: c.shadow, animation: c.anim, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, cursor: state === 'processing' ? 'wait' : 'pointer', transition: 'all 0.3s' }}>
        <Icon size={72} color="#fff" strokeWidth={1.5} />
        <span style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 600 }}>{c.label}</span>
      </button>

      <p style={{ color: '#5A6A7A', fontSize: '1.25rem', textAlign: 'center' }}>{c.sub}</p>

      {/* Last reply text — auto-clears after 30s */}
      {lastReply && (
        <div className="fade-up-1" style={{
          maxWidth: 560, width: '100%', textAlign: 'center',
          padding: '20px 32px', borderRadius: 24,
          background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(123,160,91,0.2)',
          boxShadow: '0 8px 32px rgba(30,45,61,0.06)',
        }}>
          <p style={{ fontSize: '1.25rem', color: '#1A2F4C', lineHeight: 1.6, fontWeight: 500 }}>
            {lastReply}
          </p>
        </div>
      )}

      {/* Language badges */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginTop: 16 }}>
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

// ─── FAMILY DASHBOARD (Task 5: "Update Memories" button) ─────────
function FamilySection({ onNavigateToOnboarding }) {
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

         {/* Task 5: Update Memories button */}
         <button
           onClick={onNavigateToOnboarding}
           style={{
             padding: '20px 32px', borderRadius: 20, border: 'none',
             background: 'linear-gradient(135deg, #7BA05B 0%, #5A7A42 100%)',
             color: '#fff', fontSize: '1.15rem', fontWeight: 700,
             fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
             display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
             boxShadow: '0 12px 32px rgba(123,160,91,0.25)',
             transition: 'transform 0.2s, box-shadow 0.2s',
           }}
           onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(123,160,91,0.35)'; }}
           onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(123,160,91,0.25)'; }}
         >
           <BookOpen size={22} />
           Update Memories
         </button>
         
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

// ─── ONBOARDING SECTION (Task 5) ────────────────────────────────
function OnboardingSection({ onComplete }) {
  return (
    <div className="glass-panel fade-up-3" style={{ flex: 1, borderRadius: 32, padding: '40px 48px', overflowY: 'auto' }}>
      <OnboardingPage onComplete={onComplete} />
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('voice'); // Task 3: default to voice
  const [playGreetingSignal, setPlayGreetingSignal] = useState(0);

  const handleTabSelect = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'voice') {
      setPlayGreetingSignal((value) => value + 1);
    }
  };

  const handleOnboardingComplete = () => {
    handleTabSelect('voice');
  };

  const renderSection = () => {
    switch (activeTab) {
      case 'chat': return <ChatSection />;
      case 'voice': return <VoiceSection playGreetingSignal={playGreetingSignal} />;
      case 'reminders': return <RemindersSection />;
      case 'family': return <FamilySection onNavigateToOnboarding={() => handleTabSelect('onboarding')} />;
      case 'onboarding': return <OnboardingSection onComplete={handleOnboardingComplete} />;
      default: return <VoiceSection playGreetingSignal={playGreetingSignal} />;
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#FCF8F5' }}>
        <Sidebar active={activeTab} onTabSelect={handleTabSelect} />
        
        <main style={{ flex: 1, padding: '48px 64px', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
          <MainHeader />
          <QuickActions />
          {renderSection()}
        </main>
      </div>
    </>
  );
}
