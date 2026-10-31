import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/client';
import { VoiceAssistantStatus, VoiceLanguage } from '../types/voice';
import { useLanguage } from '../i18n/LanguageContext';
import { useMerchant } from '../context/MerchantContext';
import { Product } from '../types/api';

// Number words parser for common English, Hindi, and Kannada numbers
function parseNumberFromSpeech(text: string): number {
  const numMatch = text.match(/\b\d+\b/);
  if (numMatch) return parseInt(numMatch[0], 10);

  const wordMap: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    ek: 1, do: 2, teen: 3, chaar: 4, paanch: 5, chhah: 6, saat: 7, aath: 8, nau: 9, dus: 10,
    ondu: 1, eradu: 2, mooru: 3, naalku: 4, aidu: 5, aaru: 6, eelu: 7, entu: 8, ombattu: 9, hattu: 10,
    एक: 1, दो: 2, तीन: 3, चार: 4, पांच: 5,
    ಒಂದು: 1, ಎರಡು: 2, ಮೂರು: 3, ನಾಲ್ಕು: 4, ಐದು: 5,
  };

  const words = text.toLowerCase().split(/\s+/);
  for (const w of words) {
    if (wordMap[w]) return wordMap[w];
  }
  return 1; // Default quantity 1
}

export function useVoiceAssistant() {
  const { language } = useLanguage();
  const { merchant } = useMerchant();

  const [status, setStatus] = useState<VoiceAssistantStatus>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [lastReply, setLastReply] = useState<string>('');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [selectedLang, setSelectedLang] = useState<string>(() => {
    return (merchant?.preferred_speech_lang as string) || (language === 'hi' ? 'hi-IN' : language === 'kn' ? 'kn-IN' : 'en-IN');
  });

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const cachedProductsRef = useRef<Product[]>([]);
  const silenceTimeoutRef = useRef<any>(null);
  const lastSpokenTextRef = useRef<string>('');

  // Audio stream & analyser references for visual feedback
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Sync default speech lang if merchant settings load
  useEffect(() => {
    if (merchant?.preferred_speech_lang) {
      setSelectedLang(merchant.preferred_speech_lang);
    }
  }, [merchant?.preferred_speech_lang]);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMessage('Web Speech API is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
    }
  }, []);

  // Pre-cache products for instant local voice matching
  useEffect(() => {
    api
      .getProducts()
      .then((prods) => {
        cachedProductsRef.current = prods;
      })
      .catch((err) => console.warn('Could not cache products for voice:', err));
  }, []);

  // Clean up audio streams
  const cleanupAudioStream = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Speak text using SpeechSynthesis
  const speak = useCallback(
    (text: string, onDone?: () => void) => {
      if (!('speechSynthesis' in window)) {
        if (onDone) onDone();
        return;
      }

      window.speechSynthesis.cancel();
      setStatus('speaking');
      setLastReply(text);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLang;
      utterance.rate = 0.98;
      utterance.pitch = 1.0;

      // Select matching voice
      const voices = window.speechSynthesis.getVoices();
      const matchVoice = voices.find(
        (v) => v.lang === selectedLang || v.lang.startsWith(selectedLang.split('-')[0])
      );
      if (matchVoice) {
        utterance.voice = matchVoice;
      }

      utterance.onend = () => {
        setStatus('idle');
        if (onDone) onDone();
      };

      utterance.onerror = () => {
        setStatus('idle');
        if (onDone) onDone();
      };

      window.speechSynthesis.speak(utterance);
    },
    [selectedLang]
  );

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setStatus('idle');
  }, []);

  // Execute structured command
  const executeCommand = useCallback(
    async (rawText: string) => {
      const q = rawText.toLowerCase().trim();
      if (!q) {
        setStatus('idle');
        return;
      }

      setStatus('executing');
      setErrorMessage(null);

      // 1. ADD TO POS CART ACTION
      const isAddCart =
        q.includes('add') ||
        q.includes('cart') ||
        q.includes('जोड़ें') ||
        q.includes('ಖರೀದಿಸಿ') ||
        q.includes('ಸೇರಿಸಿ');

      if (isAddCart && !q.includes('clear') && !q.includes('empty') && !q.includes('summary')) {
        const quantity = parseNumberFromSpeech(q);
        const products = cachedProductsRef.current;
        let matchedProduct: Product | undefined;

        const brandNames = [
          'parle', 'good day', 'amul', 'salt', 'atta', 'maggi', 'oil',
          'tea', 'coffee', 'dettol', 'surf', 'vim', 'lays', 'kurkure',
          'thums up', 'coke', 'colgate', 'bread', 'egg', 'sugar', 'dal',
        ];

        for (const brand of brandNames) {
          if (q.includes(brand)) {
            matchedProduct = products.find((p) => p.name.toLowerCase().includes(brand));
            if (matchedProduct) break;
          }
        }

        if (!matchedProduct) {
          for (const p of products) {
            if (q.includes(p.name.toLowerCase())) {
              matchedProduct = p;
              break;
            }
          }
        }

        if (matchedProduct) {
          window.dispatchEvent(
            new CustomEvent('mitra-pos-voice-event', {
              detail: {
                action: 'ADD_ITEM',
                productId: matchedProduct.id,
                productName: matchedProduct.name,
                quantity: quantity,
              },
            })
          );

          let reply = `Added ${quantity} units of ${matchedProduct.name} to POS cart.`;
          if (selectedLang.startsWith('hi')) {
            reply = `${matchedProduct.name} के ${quantity} पैकेट कार्ट में जोड़ दिए गए हैं।`;
          } else if (selectedLang.startsWith('kn')) {
            reply = `${matchedProduct.name} ಸರಕಿನ ${quantity} ಯುನಿಟ್‌ಗಳನ್ನು ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ.`;
          }

          speak(reply);
          return;
        }
      }

      // 2. CLEAR CART ACTION
      if (
        q.includes('clear cart') ||
        q.includes('empty cart') ||
        q.includes('कार्ट खाली') ||
        q.includes('ಕಾರ್ಟ್ ಖಾಲಿ')
      ) {
        window.dispatchEvent(
          new CustomEvent('mitra-pos-voice-event', {
            detail: { action: 'CLEAR_CART' },
          })
        );
        let reply = 'Cart has been cleared.';
        if (selectedLang.startsWith('hi')) reply = 'कार्ट खाली कर दिया गया है।';
        if (selectedLang.startsWith('kn')) reply = 'ಕಾರ್ಟ್ ಖಾಲಿ ಮಾಡಲಾಗಿದೆ.';
        speak(reply);
        return;
      }

      // 3. GENERATE QR ACTION
      if (
        q.includes('generate qr') ||
        q.includes('create qr') ||
        q.includes('payment qr') ||
        q.includes('show qr') ||
        q.includes('क्यूआर') ||
        q.includes('ಕ್ಯೂಆರ್')
      ) {
        window.dispatchEvent(
          new CustomEvent('mitra-pos-voice-event', {
            detail: { action: 'GENERATE_QR' },
          })
        );
        let reply = 'Opening demo UPI QR payment code.';
        if (selectedLang.startsWith('hi')) reply = 'डेमो यूपीआई क्यूआर कोड खोला जा रहा है।';
        if (selectedLang.startsWith('kn')) reply = 'ಡೆಮೊ ಯುಪಿಐ ಕ್ಯೂಆರ್ ಕೋಡ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ.';
        speak(reply);
        return;
      }

      // 4. APPLY DISCOUNT
      if (q.includes('discount') || q.includes('छूट') || q.includes('ರಿಯಾಯಿತಿ')) {
        const val = parseNumberFromSpeech(q);
        const isPercent = q.includes('%') || q.includes('percent') || q.includes('प्रतिशत');
        window.dispatchEvent(
          new CustomEvent('mitra-pos-voice-event', {
            detail: {
              action: 'APPLY_DISCOUNT',
              discountType: isPercent ? 'PERCENT' : 'FIXED',
              discountValue: val,
            },
          })
        );
        let reply = `Applied ${val}${isPercent ? '%' : ' rupees'} discount to cart.`;
        if (selectedLang.startsWith('hi'))
          reply = `कार्ट पर ${val}${isPercent ? '% ' : ' रुपये '}छूट लागू कर दी गई है।`;
        if (selectedLang.startsWith('kn'))
          reply = `ಕಾರ್ಟ್‌ಗೆ ${val}${isPercent ? '% ' : ' ರೂಪಾಯಿ '}ರಿಯಾಯಿತಿ ಅನ್ವಯಿಸಲಾಗಿದೆ.`;
        speak(reply);
        return;
      }

      // 5. TODAY'S SALES VOICE REPORT
      if (
        q.includes("today's sale") ||
        q.includes('today sale') ||
        q.includes('how much did i sell') ||
        q.includes('आज की बिक्री') ||
        q.includes('ಇಂದಿನ ಮಾರಾಟ')
      ) {
        try {
          const kpis = await api.getDashboard();
          let reply = `Today your store has generated ₹${kpis.today_sales} across ${kpis.today_transactions_count} orders.`;
          if (selectedLang.startsWith('hi')) {
            reply = `आज आपकी दुकान पर कुल ₹${kpis.today_sales} की बिक्री और ${kpis.today_transactions_count} बिल दर्ज हुए हैं।`;
          } else if (selectedLang.startsWith('kn')) {
            reply = `ಇಂದು ನಿಮ್ಮ ಅಂಗಡಿಯಲ್ಲಿ ₹${kpis.today_sales} ಮೊತ್ತದ ಮಾರಾಟ ಮತ್ತು ${kpis.today_transactions_count} ಬಿಲ್‌ಗಳಾಗಿವೆ.`;
          }
          speak(reply);
          return;
        } catch (err) {
          console.warn('Dashboard query error in voice:', err);
        }
      }

      // 6. GENERAL QUERY FALLBACK (Ask Mitra Controlled Engine)
      try {
        const res = await api.askMitra(rawText, language);
        speak(res.reply);
      } catch (err: any) {
        setErrorMessage('Could not query assistant engine.');
        speak('Sorry, I encountered an error checking the store database.');
      }
    },
    [language, selectedLang, speak]
  );

  // Stop listening helper
  const stopListening = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      isListeningRef.current = false;
    }
    cleanupAudioStream();
    if (status === 'listening') {
      setStatus('idle');
    }
  }, [cleanupAudioStream, status]);

  // Start listening with explicit microphone stream permission
  const startListening = useCallback(async () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMessage('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    // Cancel speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setErrorMessage(null);
    setTranscript('');
    lastSpokenTextRef.current = '';

    // 1. Explicitly prompt user for microphone access & measure live volume level
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        // Set up Web Audio Analyser for live visualizer
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 128;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          audioContextRef.current = audioCtx;
          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const updateVolume = () => {
            if (isListeningRef.current && analyser) {
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              const avg = sum / dataArray.length;
              setAudioLevel(Math.min(100, Math.round((avg / 80) * 100)));
              animFrameRef.current = requestAnimationFrame(updateVolume);
            }
          };
          updateVolume();
        } catch (audioErr) {
          console.warn('Audio analyser could not start:', audioErr);
        }
      }
    } catch (permErr: any) {
      console.warn('Microphone permission blocked or unavailable:', permErr);
      setErrorMessage("Microphone access is blocked. Please click the lock or camera icon in your browser address bar and select 'Allow' for microphone.");
      setStatus('error');
      return;
    }

    // 2. Start Speech Recognition
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = selectedLang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setStatus('listening');
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript + ' ';
          } else {
            interimText += event.results[i][0].transcript;
          }
        }

        const combined = (finalText + interimText).trim();
        if (combined) {
          setTranscript(combined);
          lastSpokenTextRef.current = combined;
        }

        // Auto execute on 1.8s silence
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = setTimeout(() => {
          if (lastSpokenTextRef.current && isListeningRef.current) {
            const textToRun = lastSpokenTextRef.current;
            stopListening();
            executeCommand(textToRun);
          }
        }, 1800);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setErrorMessage("Microphone access is blocked in your browser. Click the lock icon in the address bar and set Microphone to 'Allow'.");
          setStatus('error');
          stopListening();
        } else if (event.error === 'audio-capture') {
          setErrorMessage("No microphone detected on your system. Please connect a working mic or use typing mode below.");
          setStatus('error');
          stopListening();
        } else if (event.error === 'no-speech') {
          // If no speech heard after timeout, don't crash
          setErrorMessage("No speech detected. Check that your microphone is selected and unmuted in Windows Sound settings, or try speaking closer.");
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          // If stopped naturally without error and there was spoken text, execute
          if (lastSpokenTextRef.current) {
            const textToRun = lastSpokenTextRef.current;
            stopListening();
            executeCommand(textToRun);
          } else {
            stopListening();
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Failed to start speech recognition engine:', err);
      setErrorMessage("Could not initialize speech engine: " + (err.message || 'unknown error'));
      setStatus('error');
      cleanupAudioStream();
      isListeningRef.current = false;
    }
  }, [selectedLang, executeCommand, cleanupAudioStream, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupAudioStream();
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [cleanupAudioStream]);

  return {
    status,
    transcript,
    lastReply,
    isSupported,
    errorMessage,
    speechLang: selectedLang,
    setSpeechLang: setSelectedLang,
    audioLevel,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    executeCommand,
  };
}
