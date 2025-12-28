
import React, { useState, useEffect } from 'react';
import { RouletteConfig, TwitchSettings } from '../types';

interface SettingsPanelProps {
  config: RouletteConfig;
  setConfig: React.Dispatch<React.SetStateAction<RouletteConfig>>;
  onClose: () => void;
  onTest: () => void;
  twitchSettings: TwitchSettings;
  setTwitchSettings: React.Dispatch<React.SetStateAction<TwitchSettings>>;
  previewVoice: (text: string, voiceName: string) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  config, setConfig, onClose, onTest, twitchSettings, setTwitchSettings, previewVoice 
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  const handlePreview = () => {
    previewVoice("Hola streamer, así es como suena esta voz en tu ruleta.", config.voiceName);
  };

  const HelpLink = ({ href, text }: { href: string, text: string }) => (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 mt-1 ml-1"
    >
      <i className="fas fa-external-link-alt text-[8px]"></i>
      {text}
    </a>
  );

  return (
    <div className="bg-gray-900 text-white w-full max-w-4xl p-8 rounded-3xl border border-gray-700 shadow-2xl overflow-y-auto max-h-[90vh] grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="md:col-span-2 flex justify-between items-center mb-2">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <i className="fas fa-magic text-purple-500"></i>
          Personalización Total
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <i className="fas fa-times text-2xl"></i>
        </button>
      </div>

      {/* COLUMNA 1: APARIENCIA Y POSICIÓN */}
      <section className="space-y-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
        <h3 className="text-purple-400 font-bold uppercase text-xs tracking-widest border-b border-gray-700 pb-2 flex items-center gap-2">
          <i className="fas fa-expand-arrows-alt"></i> Tamaño y Posición
        </h3>
        
        <div>
          <label className="flex justify-between text-sm font-medium mb-2">
            <span>Escala (Tamaño)</span>
            <span className="text-purple-400 font-mono">{(config.scale * 100).toFixed(0)}%</span>
          </label>
          <input 
            type="range" min="0.2" max="1.5" step="0.05"
            value={config.scale}
            onChange={e => setConfig({...config, scale: parseFloat(e.target.value)})}
            className="w-full accent-purple-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1 italic">Posición X (H)</label>
            <input 
              type="range" min="0" max="100" step="1"
              value={config.positionX}
              onChange={e => setConfig({...config, positionX: parseInt(e.target.value)})}
              className="w-full accent-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 italic">Posición Y (V)</label>
            <input 
              type="range" min="0" max="100" step="1"
              value={config.positionY}
              onChange={e => setConfig({...config, positionY: parseInt(e.target.value)})}
              className="w-full accent-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Color Enfriado</label>
            <input 
              type="color" value={config.winColor}
              onChange={e => setConfig({...config, winColor: e.target.value})}
              className="w-full h-8 rounded bg-gray-900 border-none cursor-pointer"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Color A Salvo</label>
            <input 
              type="color" value={config.loseColor}
              onChange={e => setConfig({...config, loseColor: e.target.value})}
              className="w-full h-8 rounded bg-gray-900 border-none cursor-pointer"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Probabilidad de Enfriar: { (config.winProbability * 100).toFixed(0) }%</label>
          <input 
            type="range" min="0" max="1" step="0.05"
            value={config.winProbability}
            onChange={e => setConfig({...config, winProbability: parseFloat(e.target.value)})}
            className="w-full accent-red-500"
          />
        </div>
      </section>

      {/* COLUMNA 2: VOZ E IA */}
      <section className="space-y-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
        <h3 className="text-purple-400 font-bold uppercase text-xs tracking-widest border-b border-gray-700 pb-2 flex items-center gap-2">
          <i className="fas fa-microphone"></i> Audio y Voz
        </h3>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium italic">Elegir Voz del Navegador</label>
          <div className="flex gap-2">
            <select 
              value={config.voiceName}
              onChange={e => setConfig({...config, voiceName: e.target.value})}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            >
              {voices.map(v => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
            </select>
            <button 
              onClick={handlePreview}
              className="bg-purple-600 hover:bg-purple-500 p-2 rounded-lg transition-colors shadow-lg w-10 h-10 flex items-center justify-center"
              title="Escuchar voz de prueba"
            >
              <i className="fas fa-play text-xs"></i>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-900/50 p-3 rounded-lg border border-gray-700">
          <input 
            type="checkbox" id="aiEnabled"
            checked={config.aiCommentaryEnabled}
            onChange={e => setConfig({...config, aiCommentaryEnabled: e.target.checked})}
            className="w-5 h-5 accent-red-500 cursor-pointer"
          />
          <label htmlFor="aiEnabled" className="text-sm font-medium cursor-pointer">Comentarios de IA (Enfriador)</label>
        </div>

        <div className="pt-4">
          <button 
            onClick={onTest}
            className="w-full bg-gradient-to-r from-red-600 to-purple-600 py-4 rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3"
          >
            <i className="fas fa-sync-alt animate-spin-slow"></i>
            Probar Ruleta
          </button>
        </div>
      </section>

      {/* TWITCH CONFIG (FULL WIDTH BELOW) */}
      <section className="md:col-span-2 pt-6 border-t border-gray-800 space-y-4">
        <h3 className="text-purple-400 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
          <i className="fab fa-twitch text-purple-500"></i> Conexión Twitch (Filtros)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <input 
                placeholder="Broadcaster ID (Tu ID numérico)" 
                value={twitchSettings.channelId}
                onChange={e => setTwitchSettings({...twitchSettings, channelId: e.target.value})}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <HelpLink href="https://twitchinsights.net/checkuser" text="¿Cuál es mi Broadcaster ID?" />
            </div>

            <div>
              <input 
                placeholder="Reward ID (El ID específico de la Ruleta)" 
                value={twitchSettings.rewardId}
                onChange={e => setTwitchSettings({...twitchSettings, rewardId: e.target.value})}
                className="w-full bg-gray-900 border border-red-900/50 rounded-lg p-3 text-xs focus:ring-2 focus:ring-red-500 outline-none"
              />
              <HelpLink href="https://dashboard.twitch.tv/viewer-rewards/channel-points/rewards" text="Ir a mis Recompensas de Twitch" />
              <p className="text-[9px] text-gray-500 italic mt-1 ml-1 leading-tight">Nota: Obtén el ID canjeando el premio con la consola de OBS abierta.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <input 
                placeholder="Twitch Client ID" 
                value={twitchSettings.clientId}
                onChange={e => setTwitchSettings({...twitchSettings, clientId: e.target.value})}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <HelpLink href="https://dev.twitch.tv/console/apps" text="Consola de Desarrolladores Twitch" />
            </div>

            <div>
              <input 
                placeholder="Access Token (OAuth)" 
                type="password"
                value={twitchSettings.accessToken}
                onChange={e => setTwitchSettings({...twitchSettings, accessToken: e.target.value})}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <HelpLink href="https://twitchtokengenerator.com/" text="Generar Token de Acceso (OAuth)" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsPanel;
