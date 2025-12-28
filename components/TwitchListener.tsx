
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
    // Only attempt connection if we have basic settings
    if (!settings.channelId || !settings.accessToken || !settings.clientId) {
      console.log("TwitchListener: Missing credentials for live connection. Staying in test mode.");
      return;
    }

    const connect = () => {
      console.log("TwitchListener: Connecting to Twitch EventSub WebSocket...");
      const ws = new WebSocket('wss://eventsub.wss.twitch.tv/ws');
      wsRef.current = ws;

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        
        if (data.metadata.message_type === 'session_welcome') {
          sessionIdRef.current = data.payload.session.id;
          console.log("TwitchListener: Welcome received. Session ID:", sessionIdRef.current);
          
          // To finalize connection, we'd normally make a POST request to Twitch API 
          // to subscribe to 'channel.channel_points_custom_reward_redemption.add'.
          // Since this is a client-side demo, we'll log instructions.
          subscribeToRedemptions(sessionIdRef.current!);
        }

        if (data.metadata.message_type === 'notification') {
          const payload = data.payload.event;
          // Filter by reward ID if specified
          if (settings.rewardId && payload.reward.id !== settings.rewardId) return;

          onRedeem({
            id: payload.id,
            username: payload.user_name,
            rewardName: payload.reward.title,
            timestamp: Date.now()
          });
        }
      };

      ws.onclose = () => {
        console.log("TwitchListener: Connection closed. Retrying in 10s...");
        setTimeout(connect, 10000);
      };

      ws.onerror = (err) => {
        console.error("TwitchListener: WS Error", err);
      };
    };

    const subscribeToRedemptions = async (sessionId: string) => {
      try {
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
          const err = await response.json();
          console.error("TwitchListener: Failed to subscribe", err);
        } else {
          console.log("TwitchListener: Successfully subscribed to redemptions!");
        }
      } catch (err) {
        console.error("TwitchListener: Subscription error", err);
      }
    };

    connect();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [settings, onRedeem]);

  return null; // Invisible component
};

export default TwitchListener;
