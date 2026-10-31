import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Send,
  Globe,
  Square,
} from 'lucide-react';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';
import { useMerchant } from '../../context/MerchantContext';
import { useLanguage } from '../../i18n/LanguageContext';

export const MitraVoiceWidget: React.FC = () => {
  const { merchant, merchantName, storeName } = useMerchant();
  const { language, t } = useLanguage();
  const {
    status,
    transcript,
    lastReply,
    isSupported,
    errorMessage,
    speechLang,
    setSpeechLang,
    audioLevel,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    executeCommand,
  } = useVoiceAssistant();

  const [isOpen, setIsOpen] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const [textInput, setTextInput] = useState('');

  // If voice is disabled in merchant settings, do not render
  if (merchant && merchant.voice_enabled === false) {
    return null;
  }

  // Automatic Hands-Free Login Briefing on initial mount
  useEffect(() => {
    if (greeted || !merchant || !merchant.auto_login_greeting) return;

    const alreadyGreeted = sessionStorage.getItem('mitra_auto_greeted');
    if (!alreadyGreeted) {
      sessionStorage.setItem('mitra_auto_greeted', 'true');
      setGreeted(true);

      const greeting =
        speechLang.startsWith('hi')
          ? `नमस्ते ${merchantName} जी! ${storeName} में आपका स्वागत है। मित्रा वॉयस असिस्टेंट सक्रिय है।`
          : speechLang.startsWith('kn')
          ? `ನಮಸ್ಕಾರ ${merchantName} ಅವರೇ! ${storeName}ಗೆ ಸುಸ್ವಾಗತ. ಮಿತ್ರ ವಾಯ್ಸ್ ಸಹಾಯಕ ಸಿದ್ಧವಾಗಿದೆ.`
          : `Welcome back to ${storeName}, ${merchantName}. Mitra Voice Assistant is ready to assist your sales counter.`;

      const timer = setTimeout(() => {
        speak(greeting);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [merchant, merchantName, storeName, speechLang, speak, greeted]);

  const toggleMic = () => {
    if (status === 'listening') {
      stopListening();
    } else if (status === 'speaking') {
      stopSpeaking();
    } else {
      setIsOpen(true);
      startListening();
    }
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim()) return;
    const cmd = textInput.trim();
    setTextInput('');
    executeCommand(cmd);
  };

  const quickCommands = [
    { label: 'Add 5 Parle-G', cmd: 'Add 5 Parle-G to cart' },
    { label: "Today's Sales", cmd: 'How much did I sell today?' },
    { label: 'Highest Sold', cmd: 'Today highest sold product' },
    { label: 'Biscuit Stock', cmd: 'How much biscuit stock is available?' },
    { label: 'Generate QR', cmd: 'Generate QR' },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end pointer-events-auto">
      {/* Speech Assistant Popover Panel */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl p-4 text-xs space-y-3 animate-in fade-in slide-in-from-bottom-2">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-teal-500 text-white flex items-center justify-center font-bold text-3xs shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Mitra Voice Assistant</h4>
                <div className="text-3xs text-slate-400 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Hands-free POS & Store Ledger</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Selector Pill */}
              <select
                value={speechLang}
                onChange={(e) => setSpeechLang(e.target.value)}
                className="text-3xs font-semibold bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none"
                title="Change speech recognition language"
              >
                <option value="en-IN">EN (India)</option>
                <option value="en-US">EN (Global)</option>
                <option value="hi-IN">हिन्दी</option>
                <option value="kn-IN">ಕನ್ನಡ</option>
              </select>

              <button
                onClick={() => {
                  if (status === 'listening') stopListening();
                  if (status === 'speaking') stopSpeaking();
                  setIsOpen(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Status Display Area */}
          <div className="min-h-[80px] bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex flex-col justify-center text-xs space-y-2">
            {/* Listening state with LIVE audio waveform visualizer */}
            {status === 'listening' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-rose-600 font-bold text-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                    <span>Listening ({speechLang})... Speak clearly</span>
                  </div>
                  <button
                    onClick={stopListening}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 hover:bg-rose-200 font-extrabold text-3xs"
                  >
                    <Square className="w-2.5 h-2.5 fill-current" />
                    <span>Done</span>
                  </button>
                </div>

                {/* Live Mic Volume Level Meter */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-3xs text-slate-400">
                    <span>Mic Input Level:</span>
                    <span className="font-mono font-bold text-slate-600">{audioLevel}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-75 rounded-full ${
                        audioLevel > 20 ? 'bg-emerald-500' : audioLevel > 5 ? 'bg-amber-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${Math.max(5, audioLevel)}%` }}
                    />
                  </div>
                  {audioLevel <= 5 && (
                    <p className="text-3xs text-amber-600 font-medium">
                      Tip: If the meter stays at 0%, check that your microphone is unmuted in browser & Windows settings.
                    </p>
                  )}
                </div>

                <p className="text-xs font-semibold text-slate-900 bg-white p-2 rounded-lg border border-slate-200/80">
                  {transcript ? `"${transcript}"` : 'Say something like: "Add 5 Parle-G to cart" or "Today highest sold product"'}
                </p>
              </div>
            )}

            {status === 'processing' && (
              <div className="flex items-center gap-2 text-indigo-600 font-semibold py-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Analyzing voice query: "{transcript}"...</span>
              </div>
            )}

            {status === 'executing' && (
              <div className="flex items-center gap-2 text-amber-600 font-semibold py-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Executing POS / ledger command...</span>
              </div>
            )}

            {status === 'speaking' && (
              <div className="space-y-1.5 py-1">
                <div className="flex items-center justify-between text-emerald-700 font-bold text-2xs">
                  <div className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
                    <span>Mitra Speaking:</span>
                  </div>
                  <button
                    onClick={stopSpeaking}
                    className="text-3xs text-slate-500 hover:text-slate-800 underline font-medium"
                  >
                    Mute Audio
                  </button>
                </div>
                <p className="text-2xs text-slate-700 leading-snug bg-white p-2 rounded-lg border border-slate-200">
                  {lastReply}
                </p>
              </div>
            )}

            {status === 'idle' && (
              <div className="text-slate-500 text-2xs leading-relaxed space-y-1.5">
                {lastReply ? (
                  <div>
                    <span className="font-bold text-slate-700 block text-3xs uppercase tracking-wider">
                      Previous Answer:
                    </span>
                    <p className="text-slate-700 bg-white p-2 rounded-lg border border-slate-200/80">
                      {lastReply}
                    </p>
                  </div>
                ) : (
                  <p>
                    Click the microphone below and speak out loud, or use the quick command pills to control the store hands-free.
                  </p>
                )}
              </div>
            )}

            {/* Error notification display */}
            {errorMessage && (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-3xs flex items-start gap-1.5 font-medium animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{errorMessage}</span>
                  <div className="mt-1">
                    <button
                      onClick={startListening}
                      className="underline font-bold text-rose-900 hover:text-rose-950"
                    >
                      Retry Microphone
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Command Suggestions */}
          <div className="space-y-1.5">
            <span className="text-3xs font-extrabold uppercase tracking-wider text-slate-400">
              Quick Voice / Test Actions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickCommands.map((qc, i) => (
                <button
                  key={i}
                  onClick={() => executeCommand(qc.cmd)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 text-3xs font-semibold border border-slate-200/60 transition-colors"
                >
                  "{qc.label}"
                </button>
              ))}
            </div>
          </div>

          {/* Inline Text Fallback Command Bar */}
          <form onSubmit={handleManualSubmit} className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Or type voice command here..."
              className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="p-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl transition-colors"
              title="Run command"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Microphone Trigger Pill */}
      <button
        onClick={toggleMic}
        className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-lg transition-all duration-300 font-bold text-xs select-none ${
          status === 'listening'
            ? 'bg-rose-600 text-white ring-4 ring-rose-400/40 animate-pulse scale-105'
            : status === 'speaking'
            ? 'bg-emerald-600 text-white ring-4 ring-emerald-400/30'
            : status === 'processing' || status === 'executing'
            ? 'bg-indigo-600 text-white ring-4 ring-indigo-400/30'
            : 'bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white hover:scale-105 shadow-teal-900/20'
        }`}
        title="Mitra Voice Assistant (Speech-to-text & voice actions)"
        aria-label="Mitra Voice Assistant"
      >
        {status === 'listening' ? (
          <>
            <Mic className="w-4 h-4 animate-bounce" />
            <span>Listening...</span>
          </>
        ) : status === 'speaking' ? (
          <>
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>Speaking</span>
          </>
        ) : status === 'processing' || status === 'executing' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Mitra AI</span>
          </>
        ) : (
          <>
            <Mic className="w-4 h-4 text-teal-200" />
            <span>Ask Mitra</span>
          </>
        )}
      </button>
    </div>
  );
};
