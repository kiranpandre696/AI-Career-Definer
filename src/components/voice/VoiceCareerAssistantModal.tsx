import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  X,
  Send,
  Loader2,
  Globe,
  ExternalLink,
  ChevronRight,
  Play,
  Square,
  AlertCircle,
  HelpCircle,
  Briefcase,
  GraduationCap,
  Award,
  ArrowRight,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { Job, Examination } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface VoiceCareerAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
  onSelectJob?: (job: Job) => void;
}

type Language = 'en' | 'te' | 'hi';

export const VoiceCareerAssistantModal: React.FC<VoiceCareerAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectJob,
}) => {
  const { profile } = useAuth();

  const [language, setLanguage] = useState<Language>('en');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [answer, setAnswer] = useState<{
    category?: string;
    text: string;
    audioSummary: string;
    matchedJobs?: Job[];
    matchedExams?: Examination[];
    actionButtons?: Array<{ label: string; path: string }>;
  } | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check Web Speech API support safely without requesting permission
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Cleanup speech synthesis on unmount or close
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Stop audio playback when modal is closed
  useEffect(() => {
    if (!isOpen) {
      stopAudio();
      stopListening();
    }
  }, [isOpen]);

  const getLanguageCode = (lang: Language): string => {
    switch (lang) {
      case 'te':
        return 'te-IN';
      case 'hi':
        return 'hi-IN';
      case 'en':
      default:
        return 'en-IN';
    }
  };

  // Start speech recognition ONLY upon explicit user click
  const startListening = () => {
    setRecognitionError(null);
    stopAudio();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecognitionError('Speech recognition is not supported in this browser. You can type your query below.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = getLanguageCode(language);
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setRecognitionError(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setRecognitionError('Microphone permission was denied. Please allow microphone access or type your question.');
        } else if (event.error === 'no-speech') {
          setRecognitionError('No speech detected. Please tap the microphone and speak clearly.');
        } else {
          setRecognitionError(`Speech recognition notice: ${event.error}. You can also type your question.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setRecognitionError('Could not start speech recognition. Please type your query.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Process query via secure backend route
  const handleAskAssistant = async (queryText?: string) => {
    const textToSend = queryText || transcript;
    if (!textToSend.trim()) return;

    stopListening();
    stopAudio();
    setIsProcessing(true);
    setRecognitionError(null);

    try {
      const res = await apiRequest('/api/voice-assistant/ask', {
        method: 'POST',
        body: JSON.stringify({
          message: textToSend.trim(),
          language,
          studentProfile: profile,
        }),
      });

      if (res.success) {
        setAnswer({
          category: res.category,
          text: res.text,
          audioSummary: res.audioSummary || res.text,
          matchedJobs: res.matchedJobs || [],
          matchedExams: res.matchedExams || [],
          actionButtons: res.actionButtons || [],
        });

        // Automatically speak the short audio summary in the chosen language
        if (res.audioSummary) {
          playAudio(res.audioSummary, language);
        }
      } else {
        setRecognitionError(res.message || 'Failed to receive guidance. Please try again.');
      }
    } catch (err: any) {
      console.error('Voice Assistant submission error:', err);
      setRecognitionError('Failed to connect to the Career Assistant server. Please check your connection.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Text-To-Speech (TTS) engine
  const playAudio = (textToSpeak: string, lang: Language) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    // Clean markdown characters from text for natural speech readout
    const cleanText = textToSpeak
      .replace(/[#*_`~\[\]\(\)]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = getLanguageCode(lang);
    utterance.rate = 0.95; // Clear and understandable speed
    utterance.pitch = 1.0;

    // Pick language-specific voice if available
    const voices = window.speechSynthesis.getVoices();
    const targetLangCode = getLanguageCode(lang).toLowerCase();
    const matchingVoice = voices.find((v) =>
      v.lang.toLowerCase().startsWith(targetLangCode.split('-')[0])
    );
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
      setIsPlayingAudio(true);
    };

    utterance.onend = () => {
      setIsPlayingAudio(false);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  // Sample quick questions by language covering 10 career categories
  const samplePrompts: Record<Language, string[]> = {
    en: [
      'What are the best government jobs after graduation?',
      'How should I prepare for UPSC and SSC CGL?',
      'How can I scan and analyze my resume?',
      'Show me high-paying jobs in the private IT sector.',
      'Where can I practice AI Mock Interviews?',
      'How do I create a career roadmap for Banking?',
    ],
    te: [
      'గ్రాడ్యుయేషన్ తర్వాత మంచి ప్రభుత్వ ఉద్యోగాలు ఏమిటి?',
      'యూపీఎస్సీ మరియు ఎస్.ఎస్.సి పరీక్షల ప్రిపరేషన్ ఎలా మొదలుపెట్టాలి?',
      'నా రెజ్యూమ్‌ని స్కాన్ చేసి జాబ్స్ ఎలా మ్యాచ్ చేయాలి?',
      'బ్యాంకింగ్ మరియు రైల్వే పరీక్షల సిలబస్ ఏమిటి?',
      'ఐటీ ప్రైవేట్ ఉద్యోగాలకు ఏ నైపుణ్యాలు కావాలి?',
      'AI మాక్ ఇంటర్వ్యూ ఎలా ప్రాక్టీస్ చేయాలి?',
    ],
    hi: [
      'स्नातक के बाद सर्वोत्तम सरकारी नौकरियां कौन सी हैं?',
      'यूपीएससी और एसएससी सीजीएल की तैयारी कैसे शुरू करें?',
      'मैं अपना रिज्यूमे स्कैन और एनालाइज कैसे करूँ?',
      'बैंकिंग और रेलवे भर्ती की पात्रता और सिलेबस क्या है?',
      'प्राइवेट आईटी सेक्टर में किन स्किल्स की मांग है?',
      'AI मॉक इंटरव्यू का अभ्यास कैसे करें?',
    ],
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with National Saffron/Navy Identity */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between border-b border-blue-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                  AI Voice Career Assistant
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-blue-950 uppercase tracking-wider">
                  Multilingual
                </span>
              </div>
              <p className="text-xs text-blue-200/80">
                Ask career, exam, and job questions using your voice
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close AI Voice Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Selector Bar */}
        <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold">
            <Globe className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Voice Language:</span>
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700">
            <button
              onClick={() => {
                setLanguage('en');
                stopListening();
                stopAudio();
              }}
              className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-blue-900 text-white dark:bg-amber-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              onClick={() => {
                setLanguage('te');
                stopListening();
                stopAudio();
              }}
              className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                language === 'te'
                  ? 'bg-blue-900 text-white dark:bg-amber-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              తెలుగు
            </button>
            <button
              onClick={() => {
                setLanguage('hi');
                stopListening();
                stopAudio();
              }}
              className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                language === 'hi'
                  ? 'bg-blue-900 text-white dark:bg-amber-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>

        {/* Scrollable Main Interaction Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-900 dark:text-slate-100">
          {/* Microphone Interactive Stage */}
          <div className="flex flex-col items-center justify-center py-4 sm:py-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative">
              {/* Animated Wave Rings when listening */}
              {isListening && (
                <>
                  <span className="absolute -inset-4 rounded-full bg-rose-500/20 animate-ping" />
                  <span className="absolute -inset-8 rounded-full bg-rose-500/10 animate-pulse" />
                </>
              )}

              {/* Animated Wave Rings when speaking */}
              {isPlayingAudio && !isListening && (
                <>
                  <span className="absolute -inset-3 rounded-full bg-amber-500/20 animate-pulse" />
                </>
              )}

              {/* Central Large Microphone Button */}
              <button
                type="button"
                onClick={toggleListening}
                disabled={isProcessing}
                className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-200 cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-300 dark:ring-rose-900/50 scale-105'
                    : isPlayingAudio
                    ? 'bg-amber-600 hover:bg-amber-700 text-white ring-4 ring-amber-300 dark:ring-amber-900/50'
                    : 'bg-blue-900 hover:bg-blue-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white hover:scale-105'
                }`}
                aria-label={isListening ? 'Stop Listening' : 'Start Speaking'}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
                    <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Listening</span>
                  </>
                ) : isPlayingAudio ? (
                  <>
                    <Volume2 className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
                    <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Speaking</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-8 h-8 sm:w-10 sm:h-10" />
                    <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Tap To Speak</span>
                  </>
                )}
              </button>
            </div>

            {/* Status Hint */}
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-4 text-center px-4">
              {isListening ? (
                <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping inline-block" />
                  Listening in {language === 'te' ? 'తెలుగు' : language === 'hi' ? 'हिन्दी' : 'English'}... Speak now
                </span>
              ) : isProcessing ? (
                <span className="text-blue-900 dark:text-amber-400 font-bold flex items-center justify-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing your career query...
                </span>
              ) : isPlayingAudio ? (
                <span className="text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center gap-1.5">
                  <Volume2 className="w-4 h-4" />
                  Speaking guidance aloud... Tap mic to ask another question
                </span>
              ) : (
                'Click the microphone to ask anything about jobs, exams, or career choices'
              )}
            </p>

            {/* Permission or error notice */}
            {recognitionError && (
              <div className="mt-3 mx-4 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>{recognitionError}</span>
              </div>
            )}
          </div>

          {/* Transcript / Text Input Box with Live Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Your Question Preview</span>
              {transcript && (
                <button
                  type="button"
                  onClick={() => setTranscript('')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-normal cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="relative">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={
                  language === 'te'
                    ? 'మీ ప్రశ్న ఇక్కడ కనిపిస్తుంది లేదా నేరుగా టైప్ చేయవచ్చు...'
                    : language === 'hi'
                    ? 'आपका प्रश्न यहाँ दिखेगा या आप सीधे टाइप भी कर सकते हैं...'
                    : 'Your voice transcript will appear here, or you can type directly...'
                }
                rows={2}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-900 dark:focus:ring-amber-500 pr-12 resize-none"
              />

              <button
                type="button"
                onClick={() => handleAskAssistant()}
                disabled={!transcript.trim() || isProcessing}
                className="absolute right-2.5 bottom-2.5 p-2 rounded-lg bg-blue-900 hover:bg-blue-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
                title="Send Question"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Suggested Quick Questions */}
          {!answer && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                Popular Questions in {language === 'te' ? 'తెలుగు' : language === 'hi' ? 'हिन्दी' : 'English'}:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {samplePrompts[language].map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTranscript(prompt);
                      handleAskAssistant(prompt);
                    }}
                    className="p-2.5 text-left text-xs bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center justify-between group"
                  >
                    <span className="line-clamp-2">{prompt}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-900 dark:group-hover:text-amber-400 shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Answer & Audio Playback Box */}
          {answer && (
            <div className="space-y-4 pt-2">
              <div className="p-4 sm:p-5 rounded-xl bg-blue-50/50 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 space-y-3">
                {/* Answer Header & Voice Playback Controls */}
                <div className="flex items-center justify-between border-b border-blue-100 dark:border-slate-700 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-xs sm:text-sm text-blue-950 dark:text-white">
                      AI Career Guidance
                    </span>
                    {answer.category && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                        {answer.category}
                      </span>
                    )}
                  </div>

                  {/* Audio Controls */}
                  <div className="flex items-center gap-1.5">
                    {isPlayingAudio ? (
                      <button
                        type="button"
                        onClick={stopAudio}
                        className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-200 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" /> Stop Audio
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => playAudio(answer.audioSummary, language)}
                        className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-200 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Read Aloud
                      </button>
                    )}
                  </div>
                </div>

                {/* Spoken summary callout */}
                {answer.audioSummary && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 rounded-r-lg text-xs sm:text-sm text-slate-800 dark:text-slate-200 italic">
                    "{answer.audioSummary}"
                  </div>
                )}

                {/* Structured Text Content */}
                <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed space-y-2 whitespace-pre-line">
                  {answer.text}
                </div>

                {/* Interactive Website Action Buttons */}
                {answer.actionButtons && answer.actionButtons.length > 0 && (
                  <div className="pt-3 border-t border-blue-100 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                      Interactive Portal Navigation:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {answer.actionButtons.map((btn, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            onClose();
                            if (onNavigate) onNavigate(btn.path);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 text-blue-900 dark:text-amber-300 border border-blue-200 dark:border-slate-600 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          <span>{btn.label}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-blue-600 dark:text-amber-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Matched Opportunities from Database */}
              {((answer.matchedJobs && answer.matchedJobs.length > 0) ||
                (answer.matchedExams && answer.matchedExams.length > 0)) && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-900 dark:text-amber-500" />
                    Relevant Opportunities from Platform Database
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {answer.matchedJobs?.map((job) => (
                      <div
                        key={job.id}
                        onClick={() => {
                          onClose();
                          if (onSelectJob) onSelectJob(job);
                          else if (onNavigate) onNavigate(`/jobs/${job.id}`);
                        }}
                        className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-900 dark:hover:border-amber-500 transition-all cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-xs text-blue-950 dark:text-white line-clamp-1">
                              {job.title}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block line-clamp-1">
                              {job.organization?.name || 'Govt Department'}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 shrink-0">
                            {job.qualification}
                          </span>
                        </div>
                      </div>
                    ))}

                    {answer.matchedExams?.map((exam) => (
                      <div
                        key={exam.id}
                        onClick={() => {
                          onClose();
                          if (onNavigate) onNavigate(`/examinations/${exam.id}`);
                        }}
                        className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-600 transition-all cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                              {exam.name}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block line-clamp-1">
                              {exam.organization?.name || exam.shortName || 'Govt Examination'}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 shrink-0">
                            Exam
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span>Supported: Telugu, Hindi, English</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
