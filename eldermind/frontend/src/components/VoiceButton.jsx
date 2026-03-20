import React, { useState, useRef } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function VoiceButton({ onTranscript }) {
  const [state, setState] = useState('idle'); // idle, recording, processing, error
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];
      mediaRecorder.current.ondataavailable = e => chunks.current.push(e.data);
      mediaRecorder.current.onstop = handleStop;
      mediaRecorder.current.start();
      setState('recording');
    } catch {
      setState('error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setState('processing');
    }
  };

  const handleStop = async () => {
    const blob = new Blob(chunks.current, { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('audio', blob, 'recording.wav');
    try {
      const res = await axios.post(`${API_URL}/voice/transcribe`, formData);
      if (onTranscript) onTranscript(res.data.transcript);
      setState('idle');
    } catch {
      setState('error');
    }
  };

  const labels = {
    idle: '🎤 Hold to Speak',
    recording: '🔴 Recording... Release to Send',
    processing: '⏳ Processing...',
    error: '❌ Error — Try Again',
  };

  const colors = {
    idle: 'bg-blue-600 hover:bg-blue-700',
    recording: 'bg-red-500 animate-pulse',
    processing: 'bg-yellow-500',
    error: 'bg-gray-500',
  };

  return (
    <div className="flex justify-center my-6">
      <button
        className={`w-48 h-48 rounded-full text-white text-xl font-bold ${colors[state]} transition-all`}
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        disabled={state === 'processing'}
        aria-label={labels[state]}
      >
        {labels[state]}
      </button>
    </div>
  );
}