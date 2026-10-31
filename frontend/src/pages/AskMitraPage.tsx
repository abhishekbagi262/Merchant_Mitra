import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  User,
  Database,
  ArrowRight,
  Mic,
  MicOff,
  Volume2,
} from 'lucide-react';
import { api } from '../api/client';
import { SuggestedQuestion, AssistantQueryResponse } from '../types/api';
import { useLanguage } from '../i18n/LanguageContext';
import { useMerchant } from '../context/MerchantContext';
import { DemoBadge } from '../components/common/DemoBadge';

interface ChatMessage {
  id: string;
  sender: 'user' | 'mitra';
  text: string;
  intent?: string;
  structuredData?: any;
  timestamp: Date;
}

export const AskMitraPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { merchantName, storeName } = useMerchant();

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'mitra',
      text:
        language === 'hi'
          ? `नमस्ते ${merchantName} जी! मैं मित्रा हूँ, ${storeName} का एआई व्यापार सहायक। आप मुझसे आज की बिक्री, Parle-G के स्टॉक, बिस्कुट श्रेणी या निष्क्रिय ग्राहकों के बारे में पूछ सकते हैं।`
          : language === 'kn'
          ? `ನಮಸ್ಕಾರ ${merchantName} ಅವರೇ! ನಾನು ನಿಮ್ಮ ಎಐ ವ್ಯಾಪಾರ ಮಿತ್ರ (${storeName}). ಇಂದಿನ ಮಾರಾಟ, Parle-G ದಾಸ್ತಾನು, ಬಿಸ್ಕತ್ತು ವಿಭಾಗ ಅಥವಾ ಗ್ರಾಹಕರ ಬಗ್ಗೆ ಕೇಳಿ.`
          : `Hello ${merchantName}! I am Mitra, your retail business assistant for ${storeName}. Ask me anything about today's sales, Parle-G inventory, biscuit category stock, gross profit, or inactive regular customers.`,
      timestamp: new Date(),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  const suggestedQuestions: SuggestedQuestion[] = [
    { id: '1', label: "Today's Sales", query: 'How much did I sell today?' },
    { id: '2', label: 'Parle-G Stock', query: 'What is my current stock of Parle-G?' },
    { id: '3', label: 'Biscuit Category', query: 'How much biscuit stock is available?' },
    { id: '4', label: 'Gross Profit', query: 'How much gross profit did I make?' },
    { id: '5', label: 'Low Stock Items', query: 'Which products may run out soon?' },
    { id: '6', label: 'Lapsed Regulars', query: 'Who are my inactive frequent customers?' },
  ];

  const handleSend = async (queryToSend?: string) => {
    const q = (queryToSend || inputQuery).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const resp: AssistantQueryResponse = await api.askMitra(q, language);
      const mitraMsg: ChatMessage = {
        id: `mitra-${Date.now()}`,
        sender: 'mitra',
        text: resp.reply,
        intent: resp.intent,
        structuredData: resp.structured_data,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, mitraMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'mitra',
        text: 'I encountered an issue querying the database. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'mitra',
        text: `Chat history cleared. How can I assist ${storeName} today?`,
        timestamp: new Date(),
      },
    ]);
  };

  // Inline voice input
  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = language === 'hi' ? 'hi-IN' : language === 'kn' ? 'kn-IN' : 'en-IN';
      rec.interimResults = false;
      rec.continuous = false;

      rec.onstart = () => setIsListening(true);
      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        if (text) {
          setInputQuery(text);
          handleSend(text);
        }
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.warn('Voice recognition error:', err);
      setIsListening(false);
    }
  };

  const handleSpeakMessage = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : language === 'kn' ? 'kn-IN' : 'en-IN';
    utterance.rate = 0.96;

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
      {/* Top Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{t.assistant.title}</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              Controlled Query Layer
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">{t.assistant.subtitle}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <DemoBadge />
          <button
            onClick={handleClearChat}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title={t.assistant.clearChat}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Zero Hallucination Guarantee Banner */}
      <div className="bg-teal-900 text-teal-100 p-3 rounded-xl border border-teal-800 text-2xs flex items-center gap-2.5 shrink-0 shadow-xs">
        <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
        <div>
          <strong className="text-white font-semibold">Zero Hallucination Architecture:</strong>{' '}
          {t.assistant.disclaimer}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'mitra' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                msg.sender === 'user'
                  ? 'bg-slate-900 text-white rounded-tr-none'
                  : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="whitespace-pre-wrap flex-1">{msg.text}</p>
                {msg.sender === 'mitra' && (
                  <button
                    onClick={() => handleSpeakMessage(msg.id, msg.text)}
                    className={`p-1 rounded-lg transition-colors shrink-0 ${
                      speakingMessageId === msg.id
                        ? 'bg-teal-100 text-teal-700 animate-pulse'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/60'
                    }`}
                    title="Read answer aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Structured Database Facts Tag */}
              {msg.intent && (
                <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-3xs font-mono text-slate-500">
                  <Database className="w-3 h-3 text-teal-600" />
                  <span>Query Intent: {msg.intent}</span>
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 rounded-2xl rounded-tl-none p-3.5 border border-slate-200/80 flex items-center gap-2 text-xs text-slate-500">
              <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-3xs text-slate-400 ml-1">Querying database...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Questions Pills */}
      <div className="shrink-0 space-y-1.5">
        <span className="text-3xs font-bold uppercase tracking-wider text-slate-400 block px-1">
          {t.assistant.suggestedQueries}
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {suggestedQuestions.map((sq) => (
            <button
              key={sq.id}
              onClick={() => handleSend(sq.query)}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-teal-50 hover:text-teal-800 text-slate-700 border border-slate-200 text-2xs font-semibold shrink-0 transition-colors shadow-2xs"
            >
              {sq.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input Box with Microphone Voice Button */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isListening ? 'Listening to speech...' : t.assistant.inputPlaceholder}
          className="flex-1 px-4 py-2 text-xs text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400"
        />

        {/* Microphone speech-to-text button */}
        <button
          onClick={toggleListening}
          className={`p-2.5 rounded-xl transition-all shrink-0 ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-300'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
          title={isListening ? 'Stop listening' : 'Voice input (Speak to ask)'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <button
          onClick={() => handleSend()}
          disabled={!inputQuery.trim() || loading}
          className="p-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
