
import React, { useEffect, useState, useRef } from 'react';
import { SpinResult, RouletteConfig } from '../types';

interface RouletteWheelProps {
  isSpinning: boolean;
  onComplete: (result: SpinResult) => void;
  config: RouletteConfig;
  winProbability: number;
}

const RouletteWheel: React.FC<RouletteWheelProps> = ({ isSpinning, onComplete, config, winProbability }) => {
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<SVGSVGElement>(null);
  
  // Create 12 segments: alternate Win/Lose based on probability
  const SEGMENTS = 12;
  const segmentsArray = Array.from({ length: SEGMENTS }, (_, i) => {
    // We force specific segments to be "Win" to match the visual
    // For simplicity, we just alternate, but the *final stopping point* 
    // is what determines the actual win probability logic.
    return i % 2 === 0 ? SpinResult.WIN : SpinResult.LOSE;
  });

  useEffect(() => {
    if (isSpinning) {
      // Logic for determining the result BEFORE spinning
      const won = Math.random() < winProbability;
      const result = won ? SpinResult.WIN : SpinResult.LOSE;
      
      // Calculate a target angle
      // Each segment is 360 / SEGMENTS = 30 degrees
      const segmentAngle = 360 / SEGMENTS;
      
      // Pick a random segment index that matches the intended result
      const matchingIndices = segmentsArray
        .map((val, idx) => (val === result ? idx : -1))
        .filter(idx => idx !== -1);
      
      const chosenSegmentIndex = matchingIndices[Math.floor(Math.random() * matchingIndices.length)];
      
      // Total rotation = current + several full turns + offset to land on chosen segment
      // Note: We subtract from 360 because rotation usually goes clockwise but index is counter-clockwise in coordinate systems
      const extraTurns = 5 + Math.floor(Math.random() * 5);
      const targetRotation = rotation + (extraTurns * 360) + (chosenSegmentIndex * segmentAngle) + (segmentAngle / 2);
      
      setRotation(targetRotation);

      const timeout = setTimeout(() => {
        onComplete(result);
      }, config.spinDuration);

      return () => clearTimeout(timeout);
    }
  }, [isSpinning]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer Glow Ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 blur-2xl opacity-40 scale-110"></div>
      
      {/* Pointer */}
      <div className="absolute -top-6 z-20 w-8 h-8 flex justify-center">
        <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-white drop-shadow-lg"></div>
      </div>

      <svg
        ref={wheelRef}
        width="400"
        height="400"
        viewBox="0 0 400 400"
        className="relative z-10 transition-transform cubic-bezier(0.15, 0, 0.15, 1)"
        style={{ 
          transform: `rotate(${-rotation}deg)`, 
          transitionDuration: `${config.spinDuration}ms`,
          transitionTimingFunction: 'cubic-bezier(0.1, 0, 0.1, 1)'
        }}
      >
        <g transform="translate(200, 200)">
          {segmentsArray.map((res, i) => {
            const angle = (360 / SEGMENTS);
            const startAngle = i * angle;
            const endAngle = (i + 1) * angle;
            const x1 = 180 * Math.cos((startAngle - 90) * Math.PI / 180);
            const y1 = 180 * Math.sin((startAngle - 90) * Math.PI / 180);
            const x2 = 180 * Math.cos((endAngle - 90) * Math.PI / 180);
            const y2 = 180 * Math.sin((endAngle - 90) * Math.PI / 180);
            
            const pathData = `M 0 0 L ${x1} ${y1} A 180 180 0 0 1 ${x2} ${y2} Z`;
            
            return (
              <g key={i}>
                <path
                  d={pathData}
                  fill={res === SpinResult.WIN ? config.winColor : config.loseColor}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  transform={`rotate(${startAngle + angle / 2 - 90}) translate(120, 0) rotate(90)`}
                  fill="white"
                  textAnchor="middle"
                  className="text-lg font-black uppercase tracking-tighter"
                  style={{ userSelect: 'none' }}
                >
                  {res === SpinResult.WIN ? 'WIN' : 'LOSE'}
                </text>
              </g>
            );
          })}
          
          {/* Inner Circle Decoration */}
          <circle r="40" fill="#1f2937" stroke="white" strokeWidth="4" />
          <text 
             y="5"
             textAnchor="middle" 
             className="fill-white text-2xl font-black"
             style={{ userSelect: 'none' }}
          >
            ★
          </text>
        </g>
      </svg>
    </div>
  );
};

export default RouletteWheel;
