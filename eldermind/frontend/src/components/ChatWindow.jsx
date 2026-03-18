/**
 * ElderMind — ChatWindow Component
 * Owner: Shivani
 *
 * Displays conversation as speech bubbles.
 * Also accepts text input for family members who prefer typing.
 *
 * Design rules:
 *   - 20px minimum font size everywhere
 *   - Auto-scrolls to latest message
 *   - Clear visual distinction between user and assistant bubbles
 */

import { useState, useRef, useEffect } from 'react';
import api from '../api';

export default function ChatWindow({ userId }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Vanakkam! I am ElderMind. How are you feeling today?' }
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const res = await api.post('/chat/', {
        user_id:        userId,
        message:        text,
        memory_context: '',
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I am having a little trouble. Please try again in a moment.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', backgroundColor:'#F4F9FC' }}>

      {/* ── MESSAGES ─────────────────────────────────────────── */}
      <div style={{
        flex:1, overflowY:'auto', padding:'24px',
        display:'flex', flexDirection:'column', gap:'16px',
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth:'70%', padding:'16px 20px', borderRadius:'20px',
              fontSize:'20px', lineHeight:'1.7',
              backgroundColor: m.role === 'user' ? '#3B82F6' : '#FFFFFF',
              color:           m.role === 'user' ? '#FFFFFF'  : '#1F2937',
              boxShadow:'0 2px 8px rgba(0,0,0,0.1)',
              borderBottomRightRadius: m.role === 'user' ? '4px'  : '20px',
              borderBottomLeftRadius:  m.role === 'user' ? '20px' : '4px',
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display:'flex', justifyContent:'flex-start' }}>
            <div style={{ padding:'16px 20px', borderRadius:'20px', backgroundColor:'#E5E7EB', fontSize:'20px' }}>
              Thinking...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── INPUT BAR ─────────────────────────────────────────── */}
      <div style={{ padding:'16px 24px', borderTop:'1px solid #E5E7EB', display:'flex', gap:'12px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Type a message..."
          style={{
            flex:1, padding:'14px 18px', fontSize:'20px',
            borderRadius:'12px', border:'2px solid #D1D5DB', outline:'none',
          }}
        />
        <button
          onClick={send}
          disabled={loading}
          style={{
            padding:'14px 28px', fontSize:'20px',
            backgroundColor: loading ? '#9CA3AF' : '#3B82F6',
            color:'#FFFFFF', border:'none', borderRadius:'12px',
            cursor: loading ? 'not-allowed' : 'pointer', fontWeight:'600',
            minWidth:'60px', minHeight:'60px',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
