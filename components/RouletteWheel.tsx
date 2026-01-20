
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { SpinResult, RouletteConfig } from '../types';

interface RouletteWheelProps {
  eventId: string;
  isSpinning: boolean;
  onComplete: (result: SpinResult) => void;
  config: RouletteConfig;
  winProbability: number;
  targetResult?: SpinResult;
}

const RouletteWheel: React.FC<RouletteWheelProps> = ({ 
  eventId, isSpinning, onComplete, config, targetResult 
}) => {
  const [rotation, setRotation] = useState(0);
  const currentRotationRef = useRef(0);
  const processedEventIdRef = useRef<string | null>(null);
  
  const SEGMENTS = 12;
  const segmentsArray = useMemo(() => Array.from({ length: SEGMENTS }, (_, i) => i % 2 === 0 ? SpinResult.WIN : SpinResult.LOSE), []);

  const duration = config.spinDuration || 4000;

  useEffect(() => {
    // PROTECCIÓN: Solo girar si el evento es nuevo y se ha ordenado el giro
    if (isSpinning && targetResult && processedEventIdRef.current !== eventId) {
      processedEventIdRef.current = eventId;
      
      const segmentAngle = 360 / SEGMENTS;
      const matchingIndices = segmentsArray
        .map((val, idx) => (val === targetResult ? idx : -1))
        .filter(idx => idx !== -1);
      
      const chosenSegmentIndex = matchingIndices[Math.floor(Math.random() * matchingIndices.length)];
      
      // Mínimo 10 vueltas para que se vea rápido y emocionante
      const extraTurns = 10 + Math.floor(Math.random() * 5);
      const targetRotation = currentRotationRef.current + (extraTurns * 360) + (chosenSegmentIndex * segmentAngle) + (segmentAngle / 2);
      
      // Actualizar estado y referencia
      currentRotationRef.current = targetRotation;
      setRotation(targetRotation);

      const timeout = setTimeout(() => {
        onComplete(targetResult);
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [isSpinning, targetResult, eventId, onComplete, segmentsArray, duration]);

  return (
    <div className="relative flex items-center justify-center group">
      <div className={`absolute inset-0 rounded-full border-[8px] border-purple-500/20 scale-125 transition-all duration-1000 ${isSpinning ? 'animate-pulse scale-[1.3]' : ''}`}></div>
      
      <div className="absolute -top-12 z-30 flex flex-col items-center">
        <div className="w-1.5 h-10 bg-white shadow-[0_0_15px_#fff]"></div>
        <div className="w-0 h-0 border-l-[22px] border-l-transparent border-r-[22px] border-r-transparent border-t-[32px] border-t-white drop-shadow-[0_0_15px_white]"></div>
      </div>

      <svg
        width="460"
        height="460"
        viewBox="0 0 440 440"
        className="relative z-10 drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]"
        style={{ 
          transform: `rotate(${-rotation}deg)`, 
          transition: isSpinning ? `transform ${duration}ms cubic-bezier(0.15, 0, 0.15, 1)` : 'none'
        }}
      >
        <g transform="translate(220, 220)">
          <circle r="215" fill="#030712" stroke="white" strokeWidth="3" />
          {segmentsArray.map((res, i) => {
            const angle = (360 / SEGMENTS);
            const startAngle = i * angle;
            const endAngle = (i + 1) * angle;
            const radius = 210;
            const x1 = radius * Math.cos((startAngle - 90) * Math.PI / 180);
            const y1 = radius * Math.sin((startAngle - 90) * Math.PI / 180);
            const x2 = radius * Math.cos((endAngle - 90) * Math.PI / 180);
            const y2 = radius * Math.sin((endAngle - 90) * Math.PI / 180);
            return (
              <g key={i}>
                <path
                  d={`M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                  fill={res === SpinResult.WIN ? config.winColor : config.loseColor}
                  fillOpacity="0.9" stroke="white" strokeWidth="1.5"
                />
                <g transform={`rotate(${startAngle + angle / 2 - 90}) translate(150, 0) rotate(90)`}>
                  <text y="-5" fill="white" textAnchor="middle" className="text-2xl font-black uppercase italic tracking-tighter">
                    {res === SpinResult.WIN ? 'F' : 'VIVO'}
                  </text>
                  <text y="25" fill="white" textAnchor="middle" className="text-2xl">
                    {res === SpinResult.WIN ? '😨' : '😌'}
                  </text>
                </g>
              </g>
            );
          })}
          <circle r="45" fill="#030712" stroke="white" strokeWidth="2" />
          <text y="12" textAnchor="middle" className="fill-white text-4xl font-black italic">Ω</text>
        </g>
      </svg>
    </div>
  );
};

export default RouletteWheel;
