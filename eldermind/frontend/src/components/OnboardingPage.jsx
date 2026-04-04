import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DEMO_USER_ID } from '../api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const SECTIONS = [
  {
    key: 'family',
    label: '👨‍👩‍👧 Family & Relationships',
    placeholder: 'e.g. Her son Karthik (42) lives in Bangalore and calls every Sunday. Her daughter Priya is a teacher in Chennai. Her husband passed away in 2018.',
    hint: 'Names, ages, where they live, how often they visit or call',
  },
  {
    key: 'medical',
    label: '💊 Health & Medications',
    placeholder: 'e.g. She has Type 2 diabetes and takes Metformin 500mg twice daily after meals. She has mild arthritis in her knees. BP is usually 130/85. Allergic to penicillin.',
    hint: 'Conditions, medicines (name + dosage + timing), allergies, doctor visits',
  },
  {
    key: 'preferences',
    label: '☕ Likes & Preferences',
    placeholder: 'e.g. She loves filter coffee (no sugar) and listens to M.S. Subbulakshmi every morning. Favourite food is idli-sambar. Hates loud TV.',
    hint: 'Food, music, hobbies, things they enjoy or dislike',
  },
  {
    key: 'routine',
    label: '🕐 Daily Routine',
    placeholder: 'e.g. Wakes up at 5:30 AM, does pooja at 6 AM. Eats breakfast at 8 AM, lunch at 12:30 PM. Takes an afternoon nap from 2-3 PM. Goes to bed by 9 PM.',
    hint: 'Wake time, meals, prayers, naps, sleep schedule, regular activities',
  },
  {
    key: 'life_memories',
    label: '📖 Life Story & Memories',
    placeholder: 'e.g. She was a school teacher for 30 years at Government Girls School, Mylapore. She loves talking about her childhood in Thanjavur. She won a state award for teaching in 1995.',
    hint: 'Career, achievements, childhood, stories they love to tell',
  },
  {
    key: 'events',
    label: '📅 Upcoming Events',
    placeholder: 'e.g. Karthik\'s birthday is on May 15th. Her doctor appointment is on April 10th at Apollo Hospital. Granddaughter\'s wedding is in June 2026.',
    hint: 'Birthdays, anniversaries, appointments, festivals, visits',
  },
];

export default function OnboardingPage({ onComplete, isUpdate = false }) {
  const [formData, setFormData] = useState(
    Object.fromEntries(SECTIONS.map(s => [s.key, '']))
  );
  const [freeText, setFreeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [existingStats, setExistingStats] = useState(null);
  const [useStructured, setUseStructured] = useState(true);

  // Check if memories already exist (for update mode detection)
  useEffect(() => {
    const checkStats = async () => {
      try {
        const res = await axios.get(`${API_URL}/memory/stats/${DEMO_USER_ID}`);
        if (res.data && res.data.total > 0) {
          setExistingStats(res.data);
        }
      } catch (e) {
        // Ignore — first time user
      }
    };
    checkStats();
  }, []);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const buildText = () => {
    if (!useStructured) return freeText;

    const parts = SECTIONS
      .filter(s => formData[s.key].trim())
      .map(s => `${s.label.replace(/^[^\s]+\s/, '')}:\n${formData[s.key].trim()}`);
    return parts.join('\n\n');
  };

  const handleSubmit = async () => {
    const text = buildText();
    if (!text.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(`${API_URL}/onboarding/process`, {
        user_id: DEMO_USER_ID,
        raw_text: text,
      });
      setResult(res.data);
      // Redirect after 2 seconds
      if (onComplete) {
        setTimeout(() => onComplete(), 2000);
      }
    } catch (e) {
      console.error('Onboarding error:', e);
      setError(e.response?.data?.detail || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const showUpdateCopy = isUpdate || (existingStats && existingStats.total > 0);

  // ── SUCCESS STATE ──────────────────────────────────────────────
  if (result) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '80px 40px', gap: 24, minHeight: 400,
      }}>
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          background: 'linear-gradient(135deg, #7BA05B 0%, #5A7A42 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 48, color: '#fff', boxShadow: '0 16px 48px rgba(123,160,91,0.35)',
        }}>✓</div>
        <h2 style={{
          fontFamily: 'Playfair Display, serif', fontSize: '2.2rem',
          fontWeight: 700, color: '#1A2F4C', textAlign: 'center',
        }}>
          {result.stored_count} memories saved!
        </h2>
        <p style={{ fontSize: '1.15rem', color: '#6B7C93', textAlign: 'center' }}>
          The companion now knows more about your loved one.
          {onComplete ? ' Redirecting...' : ''}
        </p>
        {result.memories && result.memories.length > 0 && (
          <div style={{
            maxWidth: 600, width: '100%', marginTop: 16,
            background: 'rgba(123,160,91,0.08)', borderRadius: 20, padding: 24,
            border: '1px solid rgba(123,160,91,0.2)',
          }}>
            <h4 style={{ fontSize: '1rem', color: '#5A7A42', marginBottom: 12, fontWeight: 600 }}>
              What was saved:
            </h4>
            {result.memories.slice(0, 8).map((m, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'baseline',
                marginBottom: 8, fontSize: '0.95rem', color: '#3A4A5A',
              }}>
                <span style={{
                  fontSize: '0.75rem', background: '#E6ECDD', color: '#5A7A42',
                  padding: '2px 8px', borderRadius: 8, fontWeight: 600, flexShrink: 0,
                }}>{m.category}</span>
                <span>{m.text}</span>
              </div>
            ))}
            {result.memories.length > 8 && (
              <p style={{ fontSize: '0.9rem', color: '#8A9BAA', marginTop: 8 }}>
                ...and {result.memories.length - 8} more
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── MAIN FORM ─────────────────────────────────────────────────
  return (
    <div style={{
      maxWidth: 800, margin: '0 auto', padding: '20px 0',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{
          fontFamily: 'Playfair Display, serif', fontSize: '2.4rem',
          fontWeight: 700, color: '#1A2F4C', marginBottom: 12,
        }}>
          {showUpdateCopy ? '📝 Add More Memories' : '🤝 Tell Us About Your Loved One'}
        </h2>
        <p style={{ fontSize: '1.2rem', color: '#6B7C93', lineHeight: 1.7, maxWidth: 600, margin: '0 auto' }}>
          {showUpdateCopy
            ? 'Share more details to help the companion know them better. New memories are added alongside existing ones — nothing is overwritten.'
            : 'Write about them — their family, health, daily routine, things they love. The more you share, the better their companion will know them.'}
        </p>
        {existingStats && existingStats.total > 0 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12,
            padding: '8px 20px', borderRadius: 100, background: '#F2F6EF',
            border: '1px solid #E6ECDD', fontSize: '0.95rem', color: '#5A7A42', fontWeight: 600,
          }}>
            ✅ {existingStats.total} memories already saved
          </div>
        )}
      </div>

      {/* Toggle: Structured vs Free-form */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 28, borderRadius: 16,
        overflow: 'hidden', border: '1.5px solid rgba(30,45,61,0.1)',
        maxWidth: 400, margin: '0 auto 28px auto',
      }}>
        <button
          onClick={() => setUseStructured(true)}
          style={{
            flex: 1, padding: '14px 20px', border: 'none', cursor: 'pointer',
            fontSize: '1rem', fontWeight: 600, fontFamily: 'DM Sans, sans-serif',
            background: useStructured ? '#2A3F5C' : 'rgba(255,255,255,0.8)',
            color: useStructured ? '#fff' : '#6B7C93',
            transition: 'all 0.2s',
          }}
        >📋 Guided Format</button>
        <button
          onClick={() => setUseStructured(false)}
          style={{
            flex: 1, padding: '14px 20px', border: 'none', cursor: 'pointer',
            fontSize: '1rem', fontWeight: 600, fontFamily: 'DM Sans, sans-serif',
            background: !useStructured ? '#2A3F5C' : 'rgba(255,255,255,0.8)',
            color: !useStructured ? '#fff' : '#6B7C93',
            transition: 'all 0.2s',
          }}
        >✍️ Free-form</button>
      </div>

      {/* Form content */}
      {useStructured ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {SECTIONS.map(section => (
            <div key={section.key} style={{
              background: 'rgba(255,255,255,0.85)', borderRadius: 24,
              padding: '24px 28px', border: '1px solid rgba(255,255,255,0.95)',
              boxShadow: '0 8px 32px rgba(30,45,61,0.04)',
            }}>
              <label style={{
                display: 'block', fontSize: '1.15rem', fontWeight: 700,
                color: '#1A2F4C', marginBottom: 6,
              }}>{section.label}</label>
              <p style={{
                fontSize: '0.9rem', color: '#8A9BAA', marginBottom: 12, fontStyle: 'italic',
              }}>{section.hint}</p>
              <textarea
                value={formData[section.key]}
                onChange={e => handleChange(section.key, e.target.value)}
                placeholder={section.placeholder}
                rows={3}
                style={{
                  width: '100%', padding: '16px 20px', borderRadius: 16,
                  border: '1.5px solid rgba(30,45,61,0.1)', background: 'rgba(252,248,245,0.8)',
                  fontSize: '1.05rem', fontFamily: 'DM Sans, sans-serif',
                  color: '#1E2D3D', resize: 'vertical', outline: 'none',
                  minHeight: 80, lineHeight: 1.6,
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#7BA05B'}
                onBlur={e => e.target.style.borderColor = 'rgba(30,45,61,0.1)'}
              />
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          background: 'rgba(255,255,255,0.85)', borderRadius: 24,
          padding: '28px 32px', border: '1px solid rgba(255,255,255,0.95)',
          boxShadow: '0 8px 32px rgba(30,45,61,0.04)',
        }}>
          <p style={{
            fontSize: '0.95rem', color: '#8A9BAA', marginBottom: 16, lineHeight: 1.6,
          }}>
            Write anything you know — family details, health conditions, daily routine, preferences, upcoming events. Our AI will organize it automatically.
          </p>
          <textarea
            value={freeText}
            onChange={e => setFreeText(e.target.value)}
            placeholder={`Example:\nMeenakshi Amma lives alone in Chennai. Her son Karthik (42) calls every Sunday from Bangalore. Her daughter Priya visits monthly.\n\nShe has Type 2 diabetes and takes Metformin 500mg twice daily. She also has mild knee pain and uses Volini gel.\n\nShe wakes up at 5:30 AM, does pooja, and loves filter coffee with no sugar. She listens to M.S. Subbulakshmi every morning. Her favourite food is idli with coconut chutney.\n\nKarthik's birthday is May 15th. She has a doctor appointment at Apollo Hospital on April 10th.`}
            rows={12}
            style={{
              width: '100%', padding: '20px 24px', borderRadius: 20,
              border: '1.5px solid rgba(30,45,61,0.1)', background: 'rgba(252,248,245,0.8)',
              fontSize: '1.1rem', fontFamily: 'DM Sans, sans-serif',
              color: '#1E2D3D', resize: 'vertical', outline: 'none',
              minHeight: 250, lineHeight: 1.7,
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#7BA05B'}
            onBlur={e => e.target.style.borderColor = 'rgba(30,45,61,0.1)'}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 20, padding: '16px 24px', borderRadius: 16,
          background: 'rgba(232,137,122,0.12)', border: '1px solid rgba(232,137,122,0.3)',
          color: '#A0392B', fontSize: '1rem', fontWeight: 500,
        }}>
          ❌ {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || (!useStructured ? !freeText.trim() : !Object.values(formData).some(v => v.trim()))}
        style={{
          width: '100%', marginTop: 28, padding: '22px 32px', borderRadius: 20,
          border: 'none', fontSize: '1.25rem', fontWeight: 700,
          fontFamily: 'DM Sans, sans-serif', cursor: loading ? 'wait' : 'pointer',
          background: loading
            ? 'linear-gradient(135deg, #E8A44A 0%, #C87A2A 100%)'
            : 'linear-gradient(135deg, #7BA05B 0%, #5A7A42 100%)',
          color: '#fff',
          boxShadow: '0 16px 48px rgba(123,160,91,0.3)',
          transition: 'all 0.3s', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 12, minHeight: 64,
          opacity: loading || (!useStructured ? !freeText.trim() : !Object.values(formData).some(v => v.trim())) ? 0.7 : 1,
        }}
      >
        {loading ? (
          <>
            <span style={{
              width: 24, height: 24, border: '3px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff', borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.8s linear infinite',
            }} />
            Setting up your companion...
          </>
        ) : (
          showUpdateCopy ? '💾 Save New Memories' : '🚀 Set Up Companion'
        )}
      </button>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
