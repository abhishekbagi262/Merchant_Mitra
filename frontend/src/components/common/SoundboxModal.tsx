import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, CheckCircle, RotateCcw, X } from 'lucide-react';
import { SoundboxAnnouncement } from '../../types/api';

interface SoundboxModalProps {
  announcement: SoundboxAnnouncement | null;
  onClose: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const SoundboxModal: React.FC<SoundboxModalProps> = ({
  announcement,
  onClose,
  isMuted,
  onToggleMute,
}) => {
  const [hasPlayed, setHasPlayed] = useState(false);

  const speak = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Try to find an Indian English voice or Hindi voice
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(
      (v) => v.lang === 'en-IN' || v.lang.includes('IN') || v.name.includes('India')
    );
    if (indianVoice) {
      utterance.voice = indianVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (announcement && !hasPlayed) {
      speak(announcement.announcement_text);
      setHasPlayed(true);
    }
  }, [announcement, hasPlayed, isMuted]);

  if (!announcement) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Top Soundbox Speaker Header */}
        <div className="bg-gradient-to-r from-teal-700 to-emerald-800 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Soundbox Speaker Icon with Pulse Animation */}
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/15 border-2 border-white/30 mb-3 shadow-inner">
            <Volume2 className="w-10 h-10 text-white animate-pulse" />
            <div className="absolute -inset-1 rounded-full border border-teal-300/40 animate-ping opacity-75" />
          </div>

          <h3 className="text-xl font-bold tracking-tight">Paytm-style Soundbox</h3>
          <p className="text-xs text-teal-100 mt-1 uppercase tracking-widest font-semibold">
            MerchantMitra Audio Confirmation
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
            <CheckCircle className="w-4 h-4" />
            Simulated Payment Confirmed
          </div>

          {/* Announcement Text Display */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-lg font-semibold text-slate-800 leading-snug">
              "{announcement.announcement_text}"
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left bg-slate-50 p-3 rounded-lg text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block font-medium">Order Number</span>
              <span className="font-semibold text-slate-800">{announcement.order_number}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Txn Reference</span>
              <span className="font-semibold text-slate-800 truncate block">
                {announcement.transaction_reference}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => speak(announcement.announcement_text)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Replay Audio
            </button>
            <button
              onClick={onToggleMute}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isMuted
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
