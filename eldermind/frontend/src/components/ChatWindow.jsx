import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function ChatWindow() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am ElderMind. How are you feeling today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/chat`, {
        message: input,
        user_id: 1
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not connect. Please try again.' }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-blue-800 mb-4">💬 Chat with ElderMind</h2>

      {/* Message Area */}
      <div className="h-80 overflow-y-auto flex flex-col gap-4 mb-4 p-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-4 rounded-xl max-w-xs text-lg ${
              msg.role === 'user'
                ? 'bg-blue-100 self-end text-right'
                : 'bg-gray-100 self-start'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="bg-gray-100 self-start p-4 rounded-xl text-lg text-gray-500">
            ElderMind is typing...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="flex gap-4">
        <input
          className="flex-1 border-2 border-gray-300 rounded-xl p-4 text-lg focus:outline-none focus:border-blue-500"
          placeholder="Type your message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
        />
        <button
          className="bg-blue-600 text-white px-6 py-4 rounded-xl text-lg font-bold hover:bg-blue-700 disabled:opacity-50"
          onClick={sendMessage}
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}