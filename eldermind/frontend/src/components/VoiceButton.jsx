import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DEMO_USER_ID } from '../api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * VoiceButton — the sole interaction interface for the elderly user.
 * Records audio → sends to /voice/process → plays returned WAV → shows reply text.
 * 
 * Props:
 *   onReplyText(text)  — optional callback when AI reply text is available
 *   greetingText       — optional greeting text to display initially
 */
export default function VoiceButton({ onReplyText, greetingText }) {
  const [state, setState] = useState('idle'); // idle, recording, processing, error
  const [lastReply, setLastReply] = useState('');
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const replyTimer = useRef(null);
  const streamRef = useRef(null);
  const audioRef = useRef(null);

  const getRecordingOptions = useCallback(() => {
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
  }, []);

  // Show greeting text if provided
  useEffect(() => {
    if (greetingText) {
      setLastReply(greetingText);
      // Auto-clear after 30 seconds
      replyTimer.current = setTimeout(() => setLastReply(''), 30000);
    }
    return () => {
      if (replyTimer.current) clearTimeout(replyTimer.current);
    };
  }, [greetingText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playAudioBlob = useCallback(async (blob) => {
    try {
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      await audio.play();
      audio.onended = () => URL.revokeObjectURL(url);
      return true;
    } catch (e) {
      console.error('Audio play error:', e);
      return false;
    }
  }, []);

  const startRecording = async () => {
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
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      setState('processing');
    }
    // Release mic
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

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      // Get the WAV audio response
      const audioBlob = await res.blob();
      const isSilent = res.headers.get('X-ElderMind-Silent') === '1';
      const reason = res.headers.get('X-ElderMind-Reason') || '';
      let didPlay = false;
      if (!isSilent) {
        didPlay = await playAudioBlob(audioBlob);
      }

      // Try to get the reply text from a header or display a generic message
      // The voice pipeline returns audio only, so we show a status message
      const replyText = isSilent
        ? (reason === 'empty_transcript'
            ? 'I could not hear speech clearly. Please hold the button and speak a little longer.'
            : 'I could not generate audible audio. Please try again.')
        : (didPlay ? 'Playing response...' : 'Audio playback was blocked by the browser.');
      setLastReply(replyText);
      if (onReplyText) onReplyText(replyText);

      // Auto-clear reply text after 30 seconds
      replyTimer.current = setTimeout(() => setLastReply(''), 30000);

      setState('idle');
    } catch (e) {
      console.error('Voice pipeline error:', e);
      setState('error');
      setLastReply('Could not process. Please try again.');
      setTimeout(() => setState('idle'), 3000);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
    }}>
      {/* Main voice button */}
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        disabled={state === 'processing'}
        aria-label={state === 'recording' ? 'Release to send' : 'Hold to speak'}
        style={{
          width: 200, height: 200, borderRadius: '50%', border: 'none',
          cursor: state === 'processing' ? 'wait' : 'pointer',
          background: state === 'recording'
            ? 'linear-gradient(135deg, #E8897A 0%, #C0392B 100%)'
            : state === 'processing'
              ? 'linear-gradient(135deg, #E8A44A 0%, #C87A2A 100%)'
              : state === 'error'
                ? 'linear-gradient(135deg, #7A8A9A 0%, #5A6A7A 100%)'
                : 'linear-gradient(135deg, #7BA05B 0%, #5A7A42 100%)',
          boxShadow: state === 'recording'
            ? '0 24px 64px rgba(232,137,122,0.5)'
            : '0 24px 64px rgba(123,160,91,0.4)',
          animation: state === 'recording' ? 'pulse 1.5s ease-in-out infinite' : 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 10, transition: 'all 0.3s',
          color: '#fff', fontSize: '1.1rem', fontWeight: 600,
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        <span style={{ fontSize: '3rem' }}>
          {state === 'recording' ? '🔴' : state === 'processing' ? '⏳' : state === 'error' ? '❌' : '🎤'}
        </span>
        <span>
          {state === 'recording' ? 'Listening...'
            : state === 'processing' ? 'Thinking...'
            : state === 'error' ? 'Try Again'
            : 'Hold to Speak'}
        </span>
      </button>

      {/* Last reply text — large, centered, readable */}
      {lastReply && (
        <div style={{
          maxWidth: 500, width: '100%', textAlign: 'center',
          padding: '20px 28px', borderRadius: 20,
          background: 'rgba(255,255,255,0.9)',
          border: '1px solid rgba(123,160,91,0.2)',
          boxShadow: '0 8px 24px rgba(30,45,61,0.06)',
          animation: 'fadeUp 0.4s ease both',
        }}>
          <p style={{
            fontSize: '1.25rem', color: '#1A2F4C', lineHeight: 1.6,
            fontWeight: 500, margin: 0,
          }}>
            {lastReply}
          </p>
        </div>
      )}
    </div>
  );
}
