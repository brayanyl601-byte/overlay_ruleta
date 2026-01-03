
import React, { useEffect, useState, useRef } from 'react';
import { SpinResult, RouletteConfig } from '../types';

interface RouletteWheelProps {
  isSpinning: boolean;
  onComplete: (result: SpinResult) => void;
  config: RouletteConfig;
  winProbability: number;
  forcedSpinDuration?: number;
  targetResult?: SpinResult;
}

const RouletteWheel: React.FC<RouletteWheelProps> = ({ 
  isSpinning, onComplete, config, winProbability, forcedSpinDuration, targetResult 
}) => {
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<SVGSVGElement>(null);
  
  const SEGMENTS = 12;
  const segmentsArray = Array.from({ length: SEGMENTS }, (_, i) => {
    return i % 2 === 0 ? SpinResult.WIN : SpinResult.LOSE;
  });

  const duration = forcedSpinDuration || config.spinDuration;

  useEffect(() => {
    if (isSpinning && targetResult) {
      const result = targetResult;
      const segmentAngle = 360 / SEGMENTS;
      
      const matchingIndices = segmentsArray
        .map((val, idx) => (val === result ? idx : -1))
        .filter(idx => idx !== -1);
      
      const chosenSegmentIndex = matchingIndices[Math.floor(Math.random() * matchingIndices.length)];
      
      const extraTurns = 10 + Math.floor(Math.random() * 5);
      const targetRotation = rotation + (extraTurns * 360) + (chosenSegmentIndex * segmentAngle) + (segmentAngle / 2);
      
      setRotation(targetRotation);

      const timeout = setTimeout(() => {
        onComplete(result);
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [isSpinning, targetResult]);

  return (
    <div className="relative flex items-center justify-center group">
      <div className={`absolute inset-0 rounded-full border-[8px] border-purple-500/20 scale-125 transition-all duration-1000 ${isSpinning ? 'animate-pulse scale-[1.3] border-purple-500/40' : ''}`}></div>
      <div className={`absolute inset-0 rounded-full border-[2px] border-sky-400/40 scale-110 animate-[spin_8s_linear_infinite] ${isSpinning ? 'animate-[spin_2s_linear_infinite]' : ''}`}></div>
      
      <div className={`absolute inset-0 rounded-full blur-[80px] transition-all duration-1000 ${isSpinning ? 'opacity-70 bg-purple-500 scale-150' : 'opacity-20 bg-sky-500 scale-100'}`}></div>
      
      <div className="absolute -top-12 z-30 flex flex-col items-center">
        <div className="w-1.5 h-10 bg-white shadow-[0_0_15px_#fff]"></div>
        <div className="w-0 h-0 border-l-[22px] border-l-transparent border-r-[22px] border-r-transparent border-t-[32px] border-t-white drop-shadow-[0_0_15px_rgba(255,255,255,0.9)]"></div>
        <div className="w-3 h-3 bg-sky-400 rounded-full -mt-2 shadow-[0_0_10px_#0ea5e9]"></div>
      </div>

      <svg
        ref={wheelRef}
        width="460"
        height="460"
        viewBox="0 0 440 440"
        className="relative z-10 drop-shadow-[0_0_30px_rgba(0,0,0,0.9)]"
        style={{ 
          transform: `rotate(${-rotation}deg)`, 
          transitionDuration: `${duration}ms`,
          transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)'
        }}
      >
        <defs>
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g transform="translate(220, 220)">
          <circle r="215" fill="#030712" stroke="#ffffff" strokeWidth="3" />
          
          {segmentsArray.map((res, i) => {
            const angle = (360 / SEGMENTS);
            const startAngle = i * angle;
            const endAngle = (i + 1) * angle;
            const radius = 210;
            const x1 = radius * Math.cos((startAngle - 90) * Math.PI / 180);
            const y1 = radius * Math.sin((startAngle - 90) * Math.PI / 180);
            const x2 = radius * Math.cos((endAngle - 90) * Math.PI / 180);
            const y2 = radius * Math.sin((endAngle - 90) * Math.PI / 180);
            
            const pathData = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
            
            return (
              <g key={i}>
                <path
                  d={pathData}
                  fill={res === SpinResult.WIN ? config.winColor : config.loseColor}
                  fillOpacity={isSpinning ? "0.9" : "0.85"}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all duration-500"
                />
                
                <g transform={`rotate(${startAngle + angle / 2 - 90}) translate(150, 0) rotate(90)`}>
                  <text
                    y="-5"
                    fill="white"
                    textAnchor="middle"
                    className="text-2xl font-black uppercase italic tracking-tighter"
                    style={{ userSelect: 'none', filter: 'url(#neonGlow)' }}
                  >
                    {res === SpinResult.WIN ? 'F' : 'ZAFÓ'}
                  </text>
                  <text
                    y="25"
                    fill="white"
                    textAnchor="middle"
                    className="text-2xl"
                    style={{ userSelect: 'none' }}
                  >
                    {res === SpinResult.WIN ? '😨' : '😌'}
                  </text>
                </g>
              </g>
            );
          })}
          
          <circle r="48" fill="#030712" stroke="white" strokeWidth="2" />
          <circle r="40" fill="none" stroke={config.winColor} strokeWidth="2" strokeDasharray="12 6" className="animate-[spin_4s_linear_infinite]" />
          <circle r="34" fill="none" stroke={config.loseColor} strokeWidth="2" strokeDasharray="6 12" className="animate-[spin_6s_linear_infinite_reverse]" />
          
          <text y="10" textAnchor="middle" className="fill-white text-4xl font-black italic animate-pulse" style={{ userSelect: 'none' }}>Ω</text>
        </g>
      </svg>
    </div>
  );
};

export default RouletteWheel;
