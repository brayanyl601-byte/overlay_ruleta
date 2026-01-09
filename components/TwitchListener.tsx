
import React, { useEffect, useRef } from 'react';
import { TwitchSettings, SpinEvent } from '../types';

interface TwitchListenerProps {
  settings: TwitchSettings;
  onRedeem: (event: SpinEvent) => void;
}

const TwitchListener: React.FC<TwitchListenerProps> = ({ settings, onRedeem }) => {
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!settings.channelId || !settings.accessToken || !settings.clientId) {
      console.log("TwitchListener: Faltan credenciales configuradas.");
      return;
    }

    const connect = () => {
      console.log("TwitchListener: Conectando...");
      const ws = new WebSocket('wss://eventsub.wss.twitch.tv/ws');
      wsRef.current = ws;

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        
        if (data.metadata.message_type === 'session_welcome') {
          sessionIdRef.current = data.payload.session.id;
          subscribeToRedemptions(sessionIdRef.current!);
        }

        if (data.metadata.message_type === 'notification') {
          const payload = data.payload.event;
          const receivedRewardId = payload.reward.id;
          const receivedRewardTitle = payload.reward.title;
          const filterValue = settings.rewardId?.trim().toLowerCase();

          // LÓGICA DE FILTRADO MEJORADA (POR NOMBRE O POR ID)
          if (filterValue && filterValue !== "") {
            const matchesId = receivedRewardId.toLowerCase() === filterValue;
            const matchesTitle = receivedRewardTitle.toLowerCase().includes(filterValue);

            if (!matchesId && !matchesTitle) {
              console.log(`[Twitch] Canje IGNORADO. Recibido: "${receivedRewardTitle}" (${receivedRewardId}). Buscado: "${filterValue}"`);
              return; // Bloquea cualquier otro canje que no sea el buscado
            }
          } else {
            // Si el usuario no configuró nada en el campo, por seguridad ignoramos todo
            console.warn("TwitchListener: No has configurado el nombre de la recompensa. Ignorando canje para evitar spam.");
            return;
          }

          console.log(`[Twitch] ¡CANJE VÁLIDO! Activando ruleta para: ${payload.user_name}`);
          
          onRedeem({
            id: payload.id,
            username: payload.user_name,
            rewardName: payload.reward.title,
            timestamp: Date.now()
          });
        }
      };

      ws.onclose = () => setTimeout(connect, 10000);
    };

    const subscribeToRedemptions = async (sessionId: string) => {
      try {
        // Nos suscribimos a TODOS los canjes del canal. 
        // El filtrado estricto lo hacemos arriba en 'onmessage' comparando con el nombre.
        const response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
          method: 'POST',
          headers: {
            'Client-ID': settings.clientId,
            'Authorization': `Bearer ${settings.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'channel.channel_points_custom_reward_redemption.add',
            version: '1',
            condition: { broadcaster_user_id: settings.channelId },
            transport: {
              method: 'websocket',
              session_id: sessionId
            }
          })
        });
        
        if (!response.ok) {
          console.error("TwitchListener: Error suscripción", await response.json());
        } else {
          console.log("TwitchListener: Escuchando recompensas del canal...");
        }
      } catch (err) {
        console.error("TwitchListener: Error de red", err);
      }
    };

    connect();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [settings.channelId, settings.rewardId, settings.clientId, settings.accessToken, onRedeem]);

  return null;
};

export default TwitchListener;
