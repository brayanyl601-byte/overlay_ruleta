
import React, { useState, useEffect, useCallback, useRef } from 'react';
import RouletteWheel from './components/RouletteWheel';
import SettingsPanel from './components/SettingsPanel';
import TwitchListener from './components/TwitchListener';
import { SpinResult, RouletteConfig, SpinEvent, TwitchSettings } from './types';
import { GoogleGenAI } from "@google/genai";

// Temática de supervivencia/enfriamiento
const LOCAL_MESSAGES = {
  WIN: [
    "Lo lamento, momento de enfriar a ",
    "El destino ha decidido enfriar a ",
    "F en el chat, vamos a enfriar a "
  ],
  LOSE: [
    "Tienes suerte, sigues vivo ",
    "Te has salvado por los pelos, ",
    "Hoy no es tu día de irte al refri, "
  ]
};

const App: React.FC = () => {
  const [config, setConfig] = useState<RouletteConfig>({
    winProbability: 0.3,
    winColor: '#ef4444', // Rojo para "Enfriado"
    loseColor: '#22c55e', // Verde para "Vivo"
    spinDuration: 4000,
    voiceName: '',
    pitch: 1.0,
    rate: 1.0,
    aiCommentaryEnabled: true,
    scale: 0.8,
    positionX: 50,
    positionY: 50
  });

  const [twitchSettings, setTwitchSettings] = useState<TwitchSettings>({
    channelId: '',
    rewardId: '',
    clientId: '',
    accessToken: ''
  });

  const [isSpinning, setIsSpinning] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<SpinEvent | null>(null);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [displayMessage, setDisplayMessage] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);

  const synth = window.speechSynthesis;

  const speak = useCallback((text: string, forceVoice?: string) => {
    if (!text) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    const voiceToUse = forceVoice || config.voiceName;
    const selectedVoice = voices.find(v => v.name === voiceToUse) || voices[0];
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.pitch = config.pitch;
    utterance.rate = config.rate;
    synth.speak(utterance);
  }, [config.voiceName, config.pitch, config.rate]);

  const handleOutcome = useCallback(async (username: string, won: boolean) => {
    let finalMessage = "";
    const resultType = won ? 'WIN' : 'LOSE';
    
    if (config.aiCommentaryEnabled && process.env.API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        // Fix: Corrected template literal syntax and interpolation closing brace
        const prompt = `Actúa como un verdugo cómico en un stream de Twitch. El usuario "${username}" acaba de girar la ruleta de la muerte. Resultado: ${won ? 'CAYÓ EN EL REFRIGERADOR (VA A SER ENFRIADO)' : 'SE SALVÓ (SIGUE VIVO)'}. Escribe una frase muy corta (máximo 10 palabras) burlándote o felicitándolo según el caso.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: { 
            temperature: 0.8
            // Removed maxOutputTokens to follow guidelines: set both maxOutputTokens and thinkingBudget or neither.
          }
        });
        
        finalMessage = response.text?.trim() || "";
      } catch (error) {
        console.warn("Gemini falló, usando mensaje local.");
      }
    }

    if (!finalMessage) {
      const templates = LOCAL_MESSAGES[resultType];
      const template = templates[Math.floor(Math.random() * templates.length)];
      finalMessage = `${template}${username}`;
    }

    setDisplayMessage(finalMessage);
    speak(finalMessage);
    
  }, [config.aiCommentaryEnabled, speak]);

  const handleSpinComplete = useCallback((result: SpinResult) => {
    setIsSpinning(false);
    setLastResult(result);
    
    if (currentEvent) {
      handleOutcome(currentEvent.username, result === SpinResult.WIN);
    }

    setTimeout(() => {
      setCurrentEvent(null);
      setLastResult(null);
      setDisplayMessage('');
    }, 12000);
  }, [currentEvent, handleOutcome]);

  const triggerSpin = useCallback((event: SpinEvent) => {
    if (isSpinning) return;
    
    setCurrentEvent(event);
    setLastResult(null);
    setDisplayMessage('');
    setIsSpinning(true);
    
    // Fix: Ensured standard backticks for template literals
    speak(`¡Preparen el hielo! ${event.username} está tentando al destino.`);
  }, [isSpinning, speak]);

  const handleTestSpin = () => {
    triggerSpin({
      id: Math.random().toString(),
      username: 'StreamerTest',
      rewardName: 'Prueba de Supervivencia',
      timestamp: Date.now()
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden pointer-events-none">
      {/* Indicador de Estado */}
      {!currentEvent && (
        <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] text-gray-300 font-medium uppercase tracking-widest italic">Modo Enfriador: ON</span>
        </div>
      )}

      {/* Main Overlay Content */}
      <div 
        className="absolute transition-all duration-500 ease-out flex items-center justify-center"
        style={{
          left: `${config.positionX}%`,
          top: `${config.positionY}%`,
          transform: `translate(-50%, -50%) scale(${config.scale})`,
          width: '500px',
          height: '700px'
        }}
      >
        <div className={`transition-all duration-700 transform ${currentEvent ? 'opacity-100' : 'opacity-0 scale-90'}`}>
          {currentEvent && (
            <div className="flex flex-col items-center">
              <div className="bg-black/80 backdrop-blur-md border-2 border-red-500 rounded-2xl p-6 mb-8 text-center animate-pulse-glow shadow-2xl w-full max-w-[400px]">
                <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter italic truncate">
                  {currentEvent.username}
                </h1>
                <p className="text-red-400 font-bold uppercase text-xs tracking-[0.2em]">
                  ¿AL REFRIGERADOR?
                </p>
              </div>

              <RouletteWheel 
                isSpinning={isSpinning}
                onComplete={handleSpinComplete}
                config={config}
                winProbability={config.winProbability}
              />

              <div className={`mt-10 transition-all duration-500 transform flex flex-col items-center ${lastResult ? 'opacity-100 translate-y-0 scale-110' : 'opacity-0 translate-y-10 scale-50'}`}>
                <div className={`px-12 py-6 rounded-full text-5xl font-black uppercase italic shadow-2xl border-4 ${
                  lastResult === SpinResult.WIN 
                    ? 'bg-red-600 border-red-400 text-white animate-bounce' 
                    : 'bg-green-600 border-green-400 text-white'
                }`}>
                  {lastResult === SpinResult.WIN ? '¡ENFRIADO!' : 'A SALVO'}
                </div>
                
                {displayMessage && (
                  <div className="mt-6 w-[400px] bg-black/90 p-5 rounded-xl border-2 border-white/10 text-white text-center italic text-xl shadow-2xl">
                    "{displayMessage}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botón de Ajustes */}
      <div className="absolute top-4 right-4 z-50 pointer-events-auto">
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="bg-gray-800/80 p-3 rounded-full text-white hover:bg-red-600 transition-all shadow-lg border border-white/10"
        >
          <i className={`fas ${showSettings ? 'fa-times' : 'fa-cog'} text-xl`}></i>
        </button>
      </div>

      {showSettings && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-40 pointer-events-auto">
          <SettingsPanel 
            config={config} 
            setConfig={setConfig} 
            onClose={() => setShowSettings(false)}
            onTest={handleTestSpin}
            twitchSettings={twitchSettings}
            setTwitchSettings={setTwitchSettings}
            previewVoice={(text, voice) => speak(text, voice)}
          />
        </div>
      )}

      <TwitchListener 
        settings={twitchSettings} 
        onRedeem={triggerSpin} 
      />
    </div>
  );
};

export default App;
