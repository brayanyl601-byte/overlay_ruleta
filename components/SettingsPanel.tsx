
import React, { useState, useEffect } from 'react';
import { RouletteConfig, TwitchSettings } from '../types';

interface SettingsPanelProps {
  config: RouletteConfig;
  setConfig: React.Dispatch<React.SetStateAction<RouletteConfig>>;
  onClose: () => void;
  onTest: () => void;
  twitchSettings: TwitchSettings;
  setTwitchSettings: React.Dispatch<React.SetStateAction<TwitchSettings>>;
  previewVoice: (text: string) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  config, setConfig, onClose, onTest, twitchSettings, setTwitchSettings, previewVoice 
}) => {
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const updateVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      // Filtrar y ordenar: Primero las de español, luego el resto
      const spanishVoices = allVoices.filter(v => v.lang.startsWith('es'));
      const otherVoices = allVoices.filter(v => !v.lang.startsWith('es'));
      setBrowserVoices([...spanishVoices, ...otherVoices]);
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  const HelpLink = ({ href, text }: { href: string; text: string }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[10px] text-sky-400 hover:text-white transition-colors block mt-1 underline">
      {text}
    </a>
  );

  return (
    <div className="bg-gray-950 text-white w-full max-w-6xl p-8 rounded-[2rem] border-2 border-white/20 shadow-[0_0_80px_rgba(0,0,0,1)] overflow-y-auto max-h-[90vh] relative scrollbar-hide pointer-events-auto">
      <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
        <h2 className="text-3xl font-black italic uppercase flex items-center gap-4">
          <span className="bg-white text-black px-3 py-0.5 rounded-sm text-2xl">CONFIG</span>
          CENTRO DE CONTROL
        </h2>
        <button onClick={onClose} className="hover:text-red-500 transition-all"><i className="fas fa-times text-2xl"></i></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUMNA 1: POSICIÓN Y ESCALA */}
        <div className="space-y-6">
          <section className="bg-white/5 p-6 rounded-3xl border border-white/10">
            <h3 className="text-sky-400 font-black uppercase text-[10px] tracking-widest mb-4 border-b border-white/5 pb-2">Ubicación en OBS</h3>
            <div className="space-y-5">
              <div>
                <label className="flex justify-between text-[10px] font-bold uppercase text-gray-400 mb-2">Posición Horizontal (X): {config.positionX}%</label>
                <input type="range" min="0" max="100" value={config.positionX} onChange={e => setConfig({...config, positionX: parseInt(e.target.value)})} className="w-full h-1 bg-gray-800 rounded-full appearance-none accent-white" />
              </div>
              <div>
                <label className="flex justify-between text-[10px] font-bold uppercase text-gray-400 mb-2">Posición Vertical (Y): {config.positionY}%</label>
                <input type="range" min="0" max="100" value={config.positionY} onChange={e => setConfig({...config, positionY: parseInt(e.target.value)})} className="w-full h-1 bg-gray-800 rounded-full appearance-none accent-white" />
              </div>
              <div>
                <label className="flex justify-between text-[10px] font-bold uppercase text-gray-400 mb-2">Escala: {(config.scale * 100).toFixed(0)}%</label>
                <input type="range" min="0.3" max="1.5" step="0.05" value={config.scale} onChange={e => setConfig({...config, scale: parseFloat(e.target.value)})} className="w-full h-1 bg-gray-800 rounded-full appearance-none accent-white" />
              </div>
            </div>
          </section>

          <section className="bg-white/5 p-6 rounded-3xl border border-white/10">
            <h3 className="text-purple-400 font-black uppercase text-[10px] tracking-widest mb-4 border-b border-white/5 pb-2">Dificultad</h3>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Probabilidad de ganar: {(config.winProbability * 100).toFixed(0)}%</label>
              <input type="range" min="0" max="1" step="0.01" value={config.winProbability} onChange={e => setConfig({...config, winProbability: parseFloat(e.target.value)})} className="w-full h-1 bg-gray-800 rounded-full appearance-none accent-purple-500" />
            </div>
          </section>
        </div>

        {/* COLUMNA 2: CONFIGURACIÓN DE VOZ (GRATIS Y FLUIDA) */}
        <div className="space-y-6">
          <section className="bg-white/5 p-6 rounded-3xl border border-white/10">
            <h3 className="text-yellow-400 font-black uppercase text-[10px] tracking-widest mb-4 border-b border-white/5 pb-2">Voz del Narrador (Español)</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] text-gray-500 uppercase font-black mb-1">Elegir Voz (Preferido: es-ES/MX)</label>
                <select 
                  value={config.voiceName} 
                  onChange={e => setConfig({...config, voiceName: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-[11px] outline-none text-sky-200"
                >
                  <option value="">Seleccionar voz...</option>
                  {browserVoices.map(v => (
                    <option key={v.name} value={v.name} className="bg-gray-900">
                      {v.name} ({v.lang}) {v.lang.startsWith('es') ? '🇪🇸' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase font-black mb-1">Tono (Pitch)</label>
                  <input type="range" min="0.5" max="2" step="0.1" value={config.pitch} onChange={e => setConfig({...config, pitch: parseFloat(e.target.value)})} className="w-full h-1 bg-gray-800 rounded-full appearance-none accent-white" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase font-black mb-1">Velocidad (Rate)</label>
                  <input type="range" min="0.5" max="2" step="0.1" value={config.rate} onChange={e => setConfig({...config, rate: parseFloat(e.target.value)})} className="w-full h-1 bg-gray-800 rounded-full appearance-none accent-white" />
                </div>
              </div>
              
              <button 
                onClick={() => previewVoice("¡Hola! Así sonaré en tu directo cuando alguien use sus puntos de canal.")}
                className="w-full py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase hover:bg-white/10 transition-all"
              >Probar Voz Ahora</button>
            </div>
          </section>

          <section className="bg-white/5 p-6 rounded-3xl border border-white/10">
            <h3 className="text-green-400 font-black uppercase text-[10px] tracking-widest mb-4 border-b border-white/5 pb-2">Inteligencia Artificial</h3>
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Comentarios de Gemini</label>
              <button 
                onClick={() => setConfig({...config, aiCommentaryEnabled: !config.aiCommentaryEnabled})}
                className={`w-12 h-6 rounded-full transition-all relative ${config.aiCommentaryEnabled ? 'bg-green-500' : 'bg-gray-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.aiCommentaryEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            <p className="text-[9px] text-gray-500 mt-2 italic">Usa Gemini para generar texto sarcástico, pero usa la voz del navegador para máxima fluidez.</p>
          </section>
        </div>

        {/* COLUMNA 3: CONEXIÓN TWITCH */}
        <div className="space-y-6">
          <section className="bg-white/5 p-6 rounded-3xl border border-white/10">
            <h3 className="text-sky-400 font-black uppercase text-[10px] tracking-widest mb-4 border-b border-white/5 pb-2">Conexión Twitch</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] text-gray-500 uppercase font-black">User ID (Canal)</label>
                <input value={twitchSettings.channelId} onChange={e => setTwitchSettings({...twitchSettings, channelId: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-mono" placeholder="ID Numérico" />
                <HelpLink href="https://twitchinsights.net/checkuser" text="→ Obtener mi ID de Twitch" />
              </div>
              <div>
                <label className="block text-[9px] text-gray-500 uppercase font-black">Reward ID</label>
                <input value={twitchSettings.rewardId} onChange={e => setTwitchSettings({...twitchSettings, rewardId: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-mono" placeholder="ID de la recompensa" />
                <HelpLink href="https://dashboard.twitch.tv/viewer-rewards/channel-points/rewards" text="→ Ver mis Recompensas" />
              </div>
              <div>
                <label className="block text-[9px] text-gray-500 uppercase font-black">Client ID</label>
                <input value={twitchSettings.clientId} onChange={e => setTwitchSettings({...twitchSettings, clientId: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-mono" />
                <HelpLink href="https://dev.twitch.tv/console/apps" text="→ Obtener Client ID (Dev Console)" />
              </div>
              <div>
                <label className="block text-[9px] text-gray-500 uppercase font-black">OAuth Token</label>
                <input type="password" value={twitchSettings.accessToken} onChange={e => setTwitchSettings({...twitchSettings, accessToken: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-mono" />
                <HelpLink href="https://twitchtokengenerator.com/" text="→ Generar Access Token" />
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/10">
        <button onClick={onTest} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-lg italic hover:bg-sky-400 transition-all transform active:scale-[0.98]">
          Girar Ruleta (Test de Visuales y Voz)
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel;
