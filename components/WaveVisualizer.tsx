import React from 'react';
import { ConnectionState } from '../types';

interface Props {
  state: ConnectionState;
  volume: number;
}

const WaveVisualizer: React.FC<Props> = ({ state, volume }) => {
  if (state !== ConnectionState.CONNECTED) {
    return (
      <div className="flex justify-center items-center h-48 w-full bg-blue-50/50 rounded-2xl border-2 border-dashed border-blue-200">
        <p className="text-blue-400 font-medium">
          {state === ConnectionState.CONNECTING ? 'Connecting to Tides...' : 'Ready to Connect'}
        </p>
      </div>
    );
  }

  // Create 5 bars
  const bars = [1, 2, 3, 4, 5];

  return (
    <div className="flex justify-center items-center h-48 w-full bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl shadow-lg shadow-blue-200 overflow-hidden relative">
      <div className="flex items-center gap-3 z-10">
        {bars.map((i) => {
          // Dynamic height based on volume
          // We use a base height plus the volume modifier
          const heightRem = 2 + (volume * 8 * (Math.random() * 0.5 + 0.5)); 
          return (
            <div
              key={i}
              className="w-4 bg-white rounded-full transition-all duration-75 ease-out"
              style={{
                 height: `${Math.min(heightRem, 10)}rem`,
                 opacity: 0.8 + (volume * 0.2)
              }}
            />
          );
        })}
      </div>
      
      {/* Background ambient effect */}
      <div className="absolute inset-0 bg-white opacity-10 animate-pulse"></div>
    </div>
  );
};

export default WaveVisualizer;