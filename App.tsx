
import React, { useState, useCallback, useRef, useEffect } from 'react';
import RouletteWheel from './components/RouletteWheel';
import SettingsPanel from './components/SettingsPanel';
import TwitchListener from './components/TwitchListener';
import { SpinResult, RouletteConfig, SpinEvent, TwitchSettings } from './types';
import { GoogleGenAI } from "@google/genai";

const LOCAL_MESSAGES = {
  WIN: ["¡F! Al congelador ", "¡L! Disfruta el frío, miau ", "Hielo para el skill issue de ", "Congeladísimo quedaste, "],
  LOSE: ["¡Zafaste por pura suerte! ", "Hoy no hay helado para ", "¡Poggers! Escapaste por los pelos, ", "Sobreviviste... por ahora, "]
};

const ROULETTE_NAMES = [
  "La Guillotina de Cristal",
  "El Triturador de Esperanzas",
  "El Freezer de la Vergüenza",
  "La Tómbola de Nitrógeno",
  "El Destino Bajo Cero",
  "La Licuadora Criogénica",
  "El Exterminador de Puntos",
  "La Ruleta del Glaciar Hambriento",
  "El Sarcófago de Hielo",
  "La Tómbola del Vacío Térmico"
];

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

  const [queue, setQueue] = useState<SpinEvent[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<SpinEvent & { targetResult?: SpinResult; currentWheelName?: string } | null>(null);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [displayMessage, setDisplayMessage] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  
  const currentCommentaryRef = useRef<string>('');

  const speak = useCallback((text: string) => {
    if (!text) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    const selectedVoice = voices.find(v => v.name === config.voiceName) || voices.find(v => v.lang.startsWith('es')) || voices[0];
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.pitch = config.pitch;
    utterance.rate = config.rate;
    synth.speak(utterance);
  }, [config.voiceName, config.pitch, config.rate]);

  const fetchAICommentary = async (username: string, won: boolean, queueSize: number, wheelName: string): Promise<string> => {
    if (config.aiCommentaryEnabled && process.env.API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const outcome = won ? 'se ha CONGELADO (PERDIÓ)' : 'ha ZAFADO (GANÓ)';
        const queueContext = queueSize > 1 ? `Hay una carnicería en progreso, ${queueSize} personas están en fila.` : 'Es un duelo solitario.';
        
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Usuario: "${username}". Resultado: ${outcome}. Nombre de la ruleta: "${wheelName}". Contexto: ${queueContext}.
          Instrucciones: Reacciona con humor negro y sarcasmo. Usa el nombre de la ruleta en tu burla. 
          Usa jerga de Twitch (F, L, Ratio, Skill Issue). Sé impredecible y cruel pero divertido. Máximo 12 palabras.`,
          config: { 
            systemInstruction: `Eres "El Guardián del Congelador". No eres un bot amable. Eres un verdugo sarcástico que ama ver a la gente perder en su "atracción" del día. 
            Cada vez que hablas, tu personalidad debe brillar. Si alguien se salva, insulta su buena suerte. Si alguien pierde, celebra su desgracia criogénica.
            RESPONDE SIEMPRE EN ESPAÑOL.`,
            temperature: 1.0
          }
        });
        return response.text?.trim() || "";
      } catch (error) { 
        console.warn("Error con Gemini:", error);
      }
    }
    return "";
  };

  const processNextInQueue = useCallback(async (event: SpinEvent, queueSize: number) => {
    setIsBusy(true);
    const won = Math.random() < config.winProbability;
    const result = won ? SpinResult.WIN : SpinResult.LOSE;
    const wheelName = ROULETTE_NAMES[Math.floor(Math.random() * ROULETTE_NAMES.length)];
    
    const templates = LOCAL_MESSAGES[won ? 'WIN' : 'LOSE'];
    currentCommentaryRef.current = `${templates[Math.floor(Math.random() * templates.length)]}${event.username}`;

    setCurrentEvent({ ...event, targetResult: result, currentWheelName: wheelName });
    setLastResult(null);
    setDisplayMessage('');
    setIsSpinning(true);
    
    let intro = `¡Prepárate! ${event.username} entra en ${wheelName}.`;
    if (queueSize > 1) {
      intro = `¡La fila para sufrir avanza! ${event.username} se enfrenta a ${wheelName} mientras otros ${queueSize} observan aterrados.`;
    }
    speak(intro);

    fetchAICommentary(event.username, won, queueSize + 1, wheelName).then(aiText => {
      if (aiText) {
        currentCommentaryRef.current = aiText;
      }
    });
  }, [config.winProbability, speak]);

  useEffect(() => {
    if (!isBusy && queue.length > 0) {
      const nextEvent = queue[0];
      setQueue(prev => prev.slice(1));
      processNextInQueue(nextEvent, queue.length);
    }
  }, [queue, isBusy, processNextInQueue]);

  const handleSpinComplete = useCallback((result: SpinResult) => {
    setIsSpinning(false);
    setLastResult(result);
    
    const finalMessage = currentCommentaryRef.current;
    setDisplayMessage(finalMessage);
    speak(finalMessage);

    setTimeout(() => {
      setCurrentEvent(null);
      setLastResult(null);
      setDisplayMessage('');
      currentCommentaryRef.current = '';
      setIsBusy(false);
    }, 10000);
  }, [speak]);

  const addToQueue = useCallback((event: SpinEvent) => {
    setQueue(prev => [...prev, event]);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden pointer-events-none bg-transparent font-sans">
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
        <div className={`transition-all duration-500 transform ${currentEvent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 scale-90'}`}>
          {currentEvent && (
            <div className="flex flex-col items-center">
              {queue.length > 0 && (
                <div className="mb-4 bg-gradient-to-r from-red-600 to-purple-600 text-white px-5 py-2 rounded-full text-[13px] font-black uppercase tracking-widest animate-pulse border-2 border-white/20 shadow-2xl">
                  <i className="fas fa-skull-crossbones mr-2"></i>
                  EN ESPERA: {queue.length} ALMAS
                </div>
              )}

              <div className="bg-gray-950/95 backdrop-blur-xl border-l-8 border-white rounded-r-3xl p-6 mb-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.8)] w-full max-w-[450px] border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-20">
                  <i className="fas fa-snowflake text-4xl text-sky-400"></i>
                </div>
                <h1 className="text-5xl font-black text-white uppercase italic truncate drop-shadow-md">
                  {currentEvent.username}
                </h1>
                <p className="text-sky-400 font-bold uppercase text-[10px] tracking-[0.5em] mt-2">
                  {currentEvent.currentWheelName}
                </p>
              </div>

              <RouletteWheel 
                isSpinning={isSpinning}
                onComplete={handleSpinComplete}
                config={config}
                winProbability={config.winProbability}
                forcedSpinDuration={4000}
                targetResult={currentEvent.targetResult}
              />

              <div className={`mt-10 transition-all duration-1000 transform flex flex-col items-center ${lastResult ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-20 scale-50'}`}>
                <div className={`px-20 py-6 rounded-lg skew-x-[-15deg] text-6xl font-black uppercase shadow-[0_0_40px_rgba(0,0,0,0.5)] border-white border-4 transition-all duration-500 ${
                  lastResult === SpinResult.WIN 
                    ? 'bg-purple-600 text-white shadow-purple-500/60 animate-bounce' 
                    : 'bg-sky-500 text-white shadow-sky-500/60'
                }`}>
                  <span className="inline-block skew-x-[15deg]">
                    {lastResult === SpinResult.WIN ? 'FRÍO F 😨' : 'VIVO 😌'}
                  </span>
                </div>
                
                {displayMessage && (
                  <div className="mt-10 w-[500px] bg-gray-950/95 backdrop-blur-3xl p-8 rounded-3xl border-2 border-white/20 text-white text-center italic text-2xl shadow-2xl animate-pulse-glow relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-sky-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter shadow-xl border border-white/30">
                      SENTENCIA DEL GUARDIÁN
                    </div>
                    "{displayMessage}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute top-6 right-6 z-50 pointer-events-auto">
        <button onClick={() => setShowSettings(!showSettings)} className="bg-gray-950/90 p-4 rounded-2xl text-white hover:bg-purple-600 transition-all border-2 border-white/10 shadow-2xl group">
          <i className={`fas ${showSettings ? 'fa-times' : 'fa-cog'} text-2xl group-hover:rotate-90 transition-transform duration-300`}></i>
        </button>
      </div>

      {showSettings && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-md z-40 pointer-events-auto p-4">
          <SettingsPanel 
            config={config} 
            setConfig={setConfig} 
            onClose={() => setShowSettings(false)} 
            onTest={() => addToQueue({ id: 'test-' + Date.now(), username: 'Streamer', rewardName: 'Test', timestamp: Date.now() })} 
            twitchSettings={twitchSettings} 
            setTwitchSettings={setTwitchSettings} 
            previewVoice={(t) => speak(t)} 
          />
        </div>
      )}
      <TwitchListener settings={twitchSettings} onRedeem={addToQueue} />
    </div>
  );
};

export default App;
