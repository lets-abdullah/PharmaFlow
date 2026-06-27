import React, { useState, useRef, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import {
  Send,
  Stethoscope,
  Bot,
  User,
  AlertTriangle,
  ChevronDown,
  BookOpen,
  Shield,
  Activity,
  Star,
  MessageCircle,
  Sparkles,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AiDoctorResponse {
  response?: string;
  recommendations?: string[];
  warnings?: string[];
  references?: string[];
  follow_up_questions?: string[];
  confidence?: string | number;
  emergency_level?: string;
  consult_physician?: string | boolean;
  related_specialties?: string[];
  // The API may nest data differently — handle both shapes
  [key: string]: unknown;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  data?: AiDoctorResponse;
  timestamp: Date;
}

// ---------------------------------------------------------------------------
// Specializations
// ---------------------------------------------------------------------------

const SPECIALIZATIONS = [
  { label: 'General Medicine', value: 'general' },
  { label: 'Internal Medicine', value: 'internal_medicine' },
  { label: 'Family Medicine', value: 'family_medicine' },
  { label: 'Cardiology', value: 'cardiology' },
  { label: 'Neurology', value: 'neurology' },
  { label: 'Dermatology', value: 'dermatology' },
  { label: 'Pediatrics', value: 'pediatrics' },
  { label: 'Psychiatry', value: 'psychiatry' },
  { label: 'Surgery', value: 'surgery' },
  { label: 'Orthopedics', value: 'orthopedics' },
  { label: 'Gastroenterology', value: 'gastroenterology' },
  { label: 'Pulmonology', value: 'pulmonology' },
  { label: 'Oncology', value: 'oncology' },
  { label: 'Endocrinology', value: 'endocrinology' },
  { label: 'Gynecology', value: 'gynecology' },
  { label: 'Emergency Medicine', value: 'emergency_medicine' },
  { label: 'Ophthalmology', value: 'ophthalmology' },
  { label: 'ENT', value: 'ent' },
  { label: 'Dentistry', value: 'dentistry' },
  { label: 'Nutrition', value: 'nutrition' },
  { label: 'Pain Management', value: 'pain_management' },
  { label: 'Preventive Medicine', value: 'preventive_medicine' },
] as const;

const EXAMPLE_QUESTIONS = [
  'What are common causes of headaches?',
  'How can I improve my sleep quality?',
  'What should I know about blood pressure management?',
  'What are early warning signs of diabetes?',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Extract a plain-text response string from potentially nested API shapes */
function extractResponse(data: AiDoctorResponse): string {
  if (typeof data.response === 'string' && data.response.length > 0) return data.response;
  // Some API versions nest data differently
  if (typeof (data as any).message === 'string') return (data as any).message;
  if (typeof (data as any).answer === 'string') return (data as any).answer;
  return 'The AI Doctor could not generate a response. Please try rephrasing your question.';
}

function toArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.filter((v) => typeof v === 'string' && v.length > 0);
  return [];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 max-w-3xl">
      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
        <Bot size={18} />
      </div>
      <div className="bg-white rounded-2xl rounded-tl-sm px-5 py-4 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function UserBubble({ message }: { message: ChatMessage; key?: React.Key }) {
  return (
    <div className="flex items-start gap-3 max-w-3xl ml-auto flex-row-reverse">
      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
        <User size={18} />
      </div>
      <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-sm">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}

function AssistantBubble({
  message,
  onFollowUp,
}: {
  message: ChatMessage;
  onFollowUp: (q: string) => void;
  key?: React.Key;
}) {
  const data = message.data;
  const recommendations = toArray(data?.recommendations);
  const warnings = toArray(data?.warnings);
  const references = toArray(data?.references);
  const followUps = toArray(data?.follow_up_questions);
  const relatedSpecialties = toArray(data?.related_specialties);

  const confidence = data?.confidence;
  const emergencyLevel = data?.emergency_level;
  const consultPhysician = data?.consult_physician;

  return (
    <div className="flex items-start gap-3 max-w-3xl">
      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
        <Bot size={18} />
      </div>
      <div className="flex-1 space-y-3 min-w-0">
        {/* Main response */}
        <div className="bg-white rounded-2xl rounded-tl-sm px-5 py-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-amber-600" />
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Medical Warnings</span>
            </div>
            <ul className="space-y-1.5">
              {warnings.map((w, i) => (
                <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Star size={16} className="text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Recommendations</span>
            </div>
            <ul className="space-y-1.5">
              {recommendations.map((r, i) => (
                <li key={i} className="text-sm text-emerald-800 flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* References */}
        {references.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={16} className="text-blue-600" />
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">References</span>
            </div>
            <ul className="space-y-1.5">
              {references.map((ref, i) => (
                <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  {ref}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Metadata badges */}
        {(confidence || emergencyLevel || consultPhysician !== undefined) && (
          <div className="flex flex-wrap gap-2">
            {confidence && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Activity size={12} />
                Confidence: {String(confidence)}
              </span>
            )}
            {emergencyLevel && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                  String(emergencyLevel).toLowerCase() === 'high' || String(emergencyLevel).toLowerCase() === 'emergency'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : String(emergencyLevel).toLowerCase() === 'medium'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-green-50 text-green-700 border-green-200'
                }`}
              >
                <Shield size={12} />
                Emergency: {String(emergencyLevel)}
              </span>
            )}
            {consultPhysician !== undefined && consultPhysician !== null && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                  consultPhysician === true || String(consultPhysician).toLowerCase() === 'yes' || String(consultPhysician).toLowerCase() === 'recommended'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-green-50 text-green-700 border-green-200'
                }`}
              >
                <Stethoscope size={12} />
                Physician: {String(consultPhysician)}
              </span>
            )}
          </div>
        )}

        {/* Related specialties */}
        {relatedSpecialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1 self-center">Related:</span>
            {relatedSpecialties.map((s, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Follow-up suggestions */}
        {followUps.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <MessageCircle size={12} />
              Follow-up Questions
            </span>
            <div className="flex flex-wrap gap-2">
              {followUps.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onFollowUp(q)}
                  className="text-left text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorBubble({ message }: { message: ChatMessage; key?: React.Key }) {
  return (
    <div className="flex items-start gap-3 max-w-3xl">
      <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
        <AlertTriangle size={18} />
      </div>
      <div className="bg-red-50 border border-red-200 rounded-2xl rounded-tl-sm px-5 py-4">
        <p className="text-sm text-red-700">{message.content}</p>
      </div>
    </div>
  );
}

function EmptyState({ onExampleClick }: { onExampleClick: (q: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center mb-6 shadow-lg">
        <Stethoscope size={36} className="text-white" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">AI Doctor Assistant</h2>
      <p className="text-sm text-gray-500 max-w-md mb-8 leading-relaxed">
        Ask any medical question and receive AI-generated guidance. Select a specialization for more focused answers.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {EXAMPLE_QUESTIONS.map((q, i) => (
          <button
            key={i}
            onClick={() => onExampleClick(q)}
            className="text-left p-4 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-sm text-gray-700 font-medium group"
          >
            <Sparkles size={14} className="text-blue-500 mb-1.5 group-hover:text-blue-600 transition-colors" />
            {q}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-gray-400 mt-8 max-w-sm leading-relaxed">
        ⚠️ This AI assistant provides general health information only. It is not a substitute for professional medical advice, diagnosis, or treatment.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function AiDoctor() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [specialization, setSpecialization] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [showSpecDropdown, setShowSpecDropdown] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSpecDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = SPECIALIZATIONS.find((s) => s.value === specialization)?.label ?? 'General Medicine';

  // -----------------------------------------------------------------------
  // Send message
  // -----------------------------------------------------------------------
  async function handleSend(overrideMessage?: string) {
    const text = (overrideMessage ?? input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await apiFetch('/api/ai-doctor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          specialization,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg: ChatMessage = {
          id: uid(),
          role: 'error',
          content: data?.message || `Something went wrong (${res.status}). Please try again.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        return;
      }

      const responseText = extractResponse(data);
      const assistantMsg: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: responseText,
        data,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: uid(),
        role: 'error',
        content: 'Network error. Please check your connection and try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      // Re-focus the input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleFollowUp(question: string) {
    handleSend(question);
  }

  function handleExampleClick(question: string) {
    handleSend(question);
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Stethoscope size={24} className="text-emerald-600" />
            AI Doctor
          </h1>
          <p className="text-gray-500 text-sm">Get AI-powered medical guidance across 22+ specializations.</p>
        </div>

        {/* Specialization dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowSpecDropdown((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors text-sm font-medium text-gray-700 shadow-sm min-w-[200px] justify-between"
          >
            <span className="truncate">{selectedLabel}</span>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${showSpecDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showSpecDropdown && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-72 overflow-y-auto py-1">
              {SPECIALIZATIONS.map((spec) => (
                <button
                  key={spec.value}
                  onClick={() => {
                    setSpecialization(spec.value);
                    setShowSpecDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    specialization === spec.value
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {spec.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          {messages.length === 0 && !isLoading ? (
            <EmptyState onExampleClick={handleExampleClick} />
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => {
                if (msg.role === 'user') return <UserBubble key={msg.id} message={msg} />;
                if (msg.role === 'assistant')
                  return <AssistantBubble key={msg.id} message={msg} onFollowUp={handleFollowUp} />;
                return <ErrorBubble key={msg.id} message={msg} />;
              })}
              {isLoading && <TypingIndicator />}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="border-t border-gray-200 bg-white px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3 max-w-3xl mx-auto">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a medical question..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition"
              maxLength={2000}
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            AI-generated medical guidance — not a substitute for professional advice.
          </p>
        </div>
      </div>
    </div>
  );
}
