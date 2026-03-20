import React from 'react';
import ChatWindow from './components/ChatWindow';
import VoiceButton from './components/VoiceButton';
import ReminderPanel from './components/ReminderPanel';
import FamilyDashboard from './components/FamilyDashboard';

function App() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto mb-8 text-center">
        <h1 className="text-4xl font-bold text-blue-800 mb-2">🧠 ElderMind</h1>
        <p className="text-xl text-gray-500">Your caring AI companion</p>
      </div>
      <VoiceButton onTranscript={(text) => console.log('Transcript:', text)} />
      <ChatWindow />
      <ReminderPanel />
      <FamilyDashboard />
    </div>
  );
}

export default App;