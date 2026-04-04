import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DEMO_USER_ID } from '../api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function ReminderPanel() {
  const [reminders, setReminders] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [remindAt, setRemindAt] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchReminders = async () => {
    try {
      const res = await axios.get(`${API_URL}/reminders/${DEMO_USER_ID}`);
      setReminders(res.data);
    } catch {
      // backend not connected yet
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const createReminder = async () => {
    if (!title || !message || !remindAt || !phone) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post(`${API_URL}/reminders/create`, {
        user_id: DEMO_USER_ID,
        title,
        message,
        remind_at: remindAt,
        phone_number: phone,
      });
      setSuccess('Reminder created! SMS will be sent at the scheduled time.');
      setTitle('');
      setMessage('');
      setRemindAt('');
      setPhone('');
      fetchReminders();
    } catch {
      setError('Could not create reminder. Please check backend connection.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-blue-800 mb-4">⏰ Medication Reminders</h2>

      {/* Form */}
      <div className="flex flex-col gap-5 mb-6">
        <input
          className="border-2 border-gray-300 rounded-xl p-4 text-lg focus:outline-none focus:border-blue-500"
          placeholder="Reminder title (e.g. Morning Medicine)"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <input
          className="border-2 border-gray-300 rounded-xl p-4 text-lg focus:outline-none focus:border-blue-500"
          placeholder="Message (e.g. Take 2 tablets with water)"
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <input
          className="border-2 border-gray-300 rounded-xl p-4 text-lg focus:outline-none focus:border-blue-500"
          type="datetime-local"
          value={remindAt}
          onChange={e => setRemindAt(e.target.value)}
        />
        <input
          className="border-2 border-gray-300 rounded-xl p-4 text-lg focus:outline-none focus:border-blue-500"
          placeholder="Phone number (e.g. +91XXXXXXXXXX)"
          value={phone}
          onChange={e => setPhone(e.target.value)}
        />

        {error && <p className="text-red-600 text-lg">{error}</p>}
        {success && <p className="text-green-600 text-lg">{success}</p>}

        <button
          className="bg-blue-600 text-white py-4 rounded-xl text-lg font-bold hover:bg-blue-700 disabled:opacity-50"
          onClick={createReminder}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Set Reminder'}
        </button>
      </div>

      {/* Reminders List */}
      {reminders.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-semibold text-gray-700">Upcoming Reminders</h3>
          {reminders.map((r, i) => (
            <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-lg font-bold text-blue-700">{r.title}</p>
              <p className="text-lg text-gray-600">{r.message}</p>
              <p className="text-base text-gray-400">📅 {new Date(r.remind_at).toLocaleString()}</p>
              <p className={`text-base font-semibold ${r.is_sent ? 'text-green-600' : 'text-yellow-600'}`}>
                {r.is_sent ? '✅ Sent' : '⏳ Pending'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
