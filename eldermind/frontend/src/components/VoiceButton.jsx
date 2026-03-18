/**
 * ElderMind — VoiceButton Component
 * Owner: Shivani
 *
 * The primary user interaction. Press-and-hold to record speech.
 * 4 clearly labelled states — elderly users always know what the system is doing.
 *
 * Size: 192x192px — NEVER reduce this for any reason.
 * States: idle → recording → processing → playing → idle
 */

import { useState, useRef } from 'react';
import api from '../api';

const STATES = {
  idle:       { bg: '#3B82F6', label: 'Tap and Hold to Speak', icon: '🎤', pulse: false },
  recording:  { bg: '#EF4444', label: 'Listening...',           icon: '🔴', pulse: true  },
  processing: { bg: '#F59E0B', label: 'Thinking...',            icon: '⏳', pulse: false },
  playing:    { bg: '#22C55E', label: 'Speaking...',            icon: '🔊', pulse: false },
};

export default function VoiceButton({ userId }) {
  const [state, setState]   = useState('idle');
  const recorderRef         = useRef(null);
  const chunksRef           = useRef([]);
  const audioRef            = useRef(new Audio());

  const startRecording = async () => {
    if (state !== 'idle') return;
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorderRef.current = recorder;
      recorder.start(100);
      setState('recording');
    } catch {
      alert('Please allow microphone access and try again.');
    }
  };

  const stopRecording = async () => {
    if (state !== 'recording') return;
    setState('processing');

    const recorder = recorderRef.current;
    recorder.stop();
    recorder.stream.getTracks().forEach(t => t.stop());
    await new Promise(res => { recorder.onstop = res; });

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const form = new FormData();
    form.append('audio', blob, 'voice.webm');

    try {
      const res = await api.post(
        `/voice/process?user_id=${userId}`,
        form,
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(res.data);
      audioRef.current.src = url;
      setState('playing');
      audioRef.current.play();
      audioRef.current.onended = () => {
        setState('idle');
        URL.revokeObjectURL(url);
      };
    } catch {
      setState('idle');
      alert('Could not connect. Please try again in a moment.');
    }
  };

  const cfg      = STATES[state];
  const disabled = state === 'processing' || state === 'playing';

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'24px', padding:'32px' }}>
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={e => { e.preventDefault(); startRecording(); }}
        onTouchEnd={e => { e.preventDefault(); stopRecording(); }}
        disabled={disabled}
        aria-label={cfg.label}
        style={{
          width:'192px', height:'192px', borderRadius:'50%',
          backgroundColor: cfg.bg,
          border:'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:'8px',
          boxShadow:'0 8px 24px rgba(0,0,0,0.2)',
          animation: cfg.pulse ? 'pulse 1s infinite' : 'none',
          transition:'transform 0.1s',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span style={{ fontSize:'52px' }}>{cfg.icon}</span>
      </button>

      <p style={{ fontSize:'22px', fontWeight:'600', color:'#374151', textAlign:'center', margin:0 }}>
        {cfg.label}
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
}
