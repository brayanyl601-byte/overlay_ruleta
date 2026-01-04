
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
    // Solo intentar conexión si tenemos las credenciales básicas necesarias
    if (!settings.channelId || !settings.accessToken || !settings.clientId) {
      console.log("TwitchListener: Faltan credenciales (Channel ID, Token o Client ID). Esperando configuración...");
      return;
    }

    const connect = () => {
      console.log("TwitchListener: Iniciando conexión a Twitch EventSub...");
      const ws = new WebSocket('wss://eventsub.wss.twitch.tv/ws');
      wsRef.current = ws;

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        
        // 1. Manejo de bienvenida y suscripción
        if (data.metadata.message_type === 'session_welcome') {
          sessionIdRef.current = data.payload.session.id;
          console.log("TwitchListener: Sesión de WebSocket establecida:", sessionIdRef.current);
          subscribeToRedemptions(sessionIdRef.current!);
        }

        // 2. Manejo de notificaciones de canje
        if (data.metadata.message_type === 'notification') {
          const payload = data.payload.event;
          const receivedRewardId = payload.reward.id;
          const configuredRewardId = settings.rewardId?.trim();

          // REGRA DE FILTRADO ESTRICTO
          // Si el usuario puso un ID en la configuración, comparamos rigurosamente
          if (configuredRewardId && configuredRewardId !== "") {
            // Comparamos IDs ignorando mayúsculas/minúsculas y espacios
            if (receivedRewardId.toLowerCase() !== configuredRewardId.toLowerCase()) {
              console.log(`[Twitch] Canje IGNORADO: "${payload.reward.title}" (ID: ${receivedRewardId}). Se esperaba: ${configuredRewardId}`);
              return; // Detenemos la ejecución aquí, no se manda a la ruleta
            }
          }

          console.log(`[Twitch] Canje ACEPTADO: "${payload.reward.title}" para el usuario ${payload.user_name}`);
          
          onRedeem({
            id: payload.id,
            username: payload.user_name,
            rewardName: payload.reward.title,
            timestamp: Date.now()
          });
        }
      };

      ws.onclose = (e) => {
        console.log("TwitchListener: Conexión cerrada. Motivo:", e.reason, "Reintentando en 10s...");
        setTimeout(connect, 10000);
      };

      ws.onerror = (err) => {
        console.error("TwitchListener: Error en el WebSocket de Twitch", err);
      };
    };

    const subscribeToRedemptions = async (sessionId: string) => {
      try {
        // Intentamos suscribirnos a nivel de API de Twitch
        // Nota: Twitch permite filtrar por reward_id en la propia suscripción
        const condition: any = { broadcaster_user_id: settings.channelId };
        const rewardId = settings.rewardId?.trim();
        
        if (rewardId && rewardId !== "") {
          condition.reward_id = rewardId;
        }

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
            condition: condition,
            transport: {
              method: 'websocket',
              session_id: sessionId
            }
          })
        });
        
        if (!response.ok) {
          const err = await response.json();
          console.error("TwitchListener: Error en la suscripción de Twitch API", err);
        } else {
          console.log(`TwitchListener: Suscripción confirmada para ${rewardId ? `ID: ${rewardId}` : 'TODAS las recompensas'}`);
        }
      } catch (err) {
        console.error("TwitchListener: Error de red al intentar suscribirse", err);
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        console.log("TwitchListener: Limpiando conexión anterior...");
        wsRef.current.close();
      }
    };
  }, [settings.channelId, settings.rewardId, settings.clientId, settings.accessToken, onRedeem]);

  return null;
};

export default TwitchListener;
