import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
export const DEMO_USER_ID = 'demo_elderly_user';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Chat
export const sendMessage = (message, user_id = DEMO_USER_ID) =>
  api.post('/chat', { message, user_id });

// Reminders
export const createReminder = (data) =>
  api.post('/reminders/create', data);

export const getReminders = (user_id = DEMO_USER_ID) =>
  api.get(`/reminders/${user_id}`);

// Memory
export const storeMemory = (data) =>
  api.post('/memory/store', data);

export const retrieveMemory = (user_id, query) =>
  api.post('/memory/retrieve', { user_id, query });

// Auth
export const login = (username, password) =>
  api.post('/auth/login', { username, password });

// Voice
export const transcribeAudio = (audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.wav');
  return api.post('/voice/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export default api;
