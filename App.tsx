
import React, { useState, useCallback, useRef } from 'react';
import RouletteWheel from './components/RouletteWheel';
import SettingsPanel from './components/SettingsPanel';
import TwitchListener from './components/TwitchListener';
import { SpinResult, RouletteConfig, SpinEvent, TwitchSettings } from './types';
import { GoogleGenAI } from "@google/genai";

const LOCAL_MESSAGES = {
  WIN: ["¡F! Directo al refri ", "¡Congelado! ", "Hielo para ", "¡L! Disfruta el frío "],
  LOSE: ["¡Zafaste! ", "Muy caliente para el hielo ", "¡Poggers! Te salvaste ", "Sobreviviste, "]
};

const App: React.FC = () => {
  const [config, setConfig] = useState<RouletteConfig>({
    winProbability: 0.3,
    winColor: '#9333ea', 
    loseColor: '#0ea5e9', 
    spinDuration: 4000,
    voiceName: '',
    pitch: 1.0,
    rate: 1.05,
    aiCommentaryEnabled: true,
    scale: 0.8,
    positionX: 50,
    positionY: 50
  });

  const [twitchSettings, setTwitchSettings] = useState<TwitchSettings>({
    channelId: '', rewardId: '', clientId: '', accessToken: ''
  });

  const [isSpinning, setIsSpinning] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<SpinEvent & { targetResult?: SpinResult } | null>(null);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [displayMessage, setDisplayMessage] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  
  const preloadedTextRef = useRef<string>('');

  const speak = useCallback((text: string) => {
    if (!text) return;
    const synth = window.speechSynthesis;
    synth.cancel(); // Stop any current speech
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    const selectedVoice = voices.find(v => v.name === config.voiceName) || voices.find(v => v.lang.startsWith('es')) || voices[0];
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.pitch = config.pitch;
    utterance.rate = config.rate;
    synth.speak(utterance);
  }, [config.voiceName, config.pitch, config.rate]);

  const prepareCommentary = async (username: string, won: boolean) => {
    preloadedTextRef.current = '';
    
    if (config.aiCommentaryEnabled && process.env.API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const resultText = won ? 'FUE ENFRIADO (PERDIÓ)' : 'SE SALVÓ (GANÓ)';
        
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `El usuario "${username}" ${resultText}. Reacciona sarcásticamente en español.`,
          config: { 
            systemInstruction: `Eres "El Guardián del Congelador". Sarcástico, gracioso y rápido. Máximo 10 palabras. Responde siempre en español.`,
            temperature: 0.95
          }
        });
        preloadedTextRef.current = response.text?.trim() || "";
      } catch (error) { 
        console.warn("Gemini Text Generation Error", error); 
      }
    }

    if (!preloadedTextRef.current) {
      const templates = LOCAL_MESSAGES[won ? 'WIN' : 'LOSE'];
      preloadedTextRef.current = `${templates[Math.floor(Math.random() * templates.length)]}${username}`;
    }
  };

  const handleSpinComplete = useCallback((result: SpinResult) => {
    setIsSpinning(false);
    setLastResult(result);
    setDisplayMessage(preloadedTextRef.current);
    speak(preloadedTextRef.current);

    setTimeout(() => {
      setCurrentEvent(null);
      setLastResult(null);
      setDisplayMessage('');
    }, 10000);
  }, [speak]);

  const triggerSpin = useCallback((event: SpinEvent) => {
    if (isSpinning) return;
    const won = Math.random() < config.winProbability;
    const result = won ? SpinResult.WIN : SpinResult.LOSE;
    
    setCurrentEvent({ ...event, targetResult: result });
    setLastResult(null);
    setDisplayMessage('');
    setIsSpinning(true);
    
    // Start generating commentary immediately so it's ready when the wheel stops
    prepareCommentary(event.username, won);
    speak(`¡Atención! ${event.username} está girando.`);
  }, [isSpinning, config.winProbability, speak]);

  return (
    <div className="relative w-screen h-screen overflow-hidden pointer-events-none bg-transparent">
      <div 
        className="absolute transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] flex items-center justify-center"
        style={{
          left: `${config.positionX}%`,
          top: `${config.positionY}%`,
          transform: `translate(-50%, -50%) scale(${config.scale})`,
          width: '600px',
          height: '800px'
        }}
      >
        <div className={`transition-all duration-500 transform ${currentEvent ? 'opacity-100' : 'opacity-0 scale-90'}`}>
          {currentEvent && (
            <div className="flex flex-col items-center">
              <div className="bg-gray-950/90 backdrop-blur-xl border-l-4 border-white rounded-r-2xl p-6 mb-8 text-center shadow-[0_0_30px_rgba(0,0,0,0.5)] w-full max-w-[400px]">
                <h1 className="text-4xl font-black text-white uppercase italic truncate">
                  {currentEvent.username}
                </h1>
                <p className="text-sky-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-1">SISTEMA ENFRIADOR ACTIVO</p>
              </div>

              <RouletteWheel 
                isSpinning={isSpinning}
                onComplete={handleSpinComplete}
                config={config}
                winProbability={config.winProbability}
                forcedSpinDuration={4000}
                targetResult={currentEvent.targetResult}
              />

              <div className={`mt-10 transition-all duration-700 transform flex flex-col items-center ${lastResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 scale-50'}`}>
                <div className={`px-16 py-5 rounded-sm skew-x-[-12deg] text-5xl font-black uppercase shadow-2xl border-white border-2 ${
                  lastResult === SpinResult.WIN ? 'bg-purple-600 text-white' : 'bg-sky-500 text-white'
                }`}>
                  <span className="inline-block skew-x-[12deg]">{lastResult === SpinResult.WIN ? 'ENFRIADO' : 'A SALVO'}</span>
                </div>
                
                {displayMessage && (
                  <div className="mt-8 w-[450px] bg-gray-950/95 backdrop-blur-2xl p-6 rounded-2xl border border-white/20 text-white text-center italic text-xl shadow-2xl">
                    "{displayMessage}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute top-6 right-6 z-50 pointer-events-auto">
        <button onClick={() => setShowSettings(!showSettings)} className="bg-gray-950/90 p-4 rounded-xl text-white hover:bg-purple-600 transition-all border border-white/20 shadow-xl">
          <i className={`fas ${showSettings ? 'fa-times' : 'fa-sliders'} text-xl`}></i>
        </button>
      </div>

      {showSettings && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-40 pointer-events-auto">
          <SettingsPanel 
            config={config} 
            setConfig={setConfig} 
            onClose={() => setShowSettings(false)} 
            onTest={() => triggerSpin({ id: 'test', username: 'TestUser', rewardName: 'Test', timestamp: Date.now() })} 
            twitchSettings={twitchSettings} 
            setTwitchSettings={setTwitchSettings} 
            previewVoice={(t) => speak(t)} 
          />
        </div>
      )}
      <TwitchListener settings={twitchSettings} onRedeem={triggerSpin} />
    </div>
  );
};

export default App;
