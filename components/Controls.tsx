import React from 'react';
import { ConnectionState } from '../types';

interface Props {
  state: ConnectionState;
  onConnect: () => void;
  onDisconnect: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

const Controls: React.FC<Props> = ({ state, onConnect, onDisconnect, isMuted, onToggleMute }) => {
  const isConnected = state === ConnectionState.CONNECTED;
  const isConnecting = state === ConnectionState.CONNECTING;

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xs mx-auto mt-6">
      {!isConnected ? (
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
          <button
            onClick={onConnect}
            disabled={isConnecting}
            className={`relative group flex items-center justify-center w-20 h-20 rounded-full shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              isConnecting
                ? 'bg-slate-100 cursor-not-allowed'
                : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-blue-500/25'
            }`}
            aria-label="Start Conversation"
          >
            {isConnecting ? (
               <div className="absolute inset-0 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin"></div>
            ) : (
                <>
                    <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
                        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                        <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                    </svg>
                </>
            )}
          </button>
          <p className="text-slate-500 text-sm font-medium">
             {isConnecting ? 'Connecting...' : 'Tap microphone to start'}
          </p>
        </div>
      ) : (
        <>
           <div className="flex gap-4 w-full animate-in slide-in-from-bottom-4 fade-in duration-500">
              <button
                onClick={onToggleMute}
                className={`flex-1 flex flex-col items-center justify-center py-4 px-4 rounded-2xl font-medium transition-all ${
                  isMuted 
                    ? 'bg-red-50 text-red-500 border-2 border-red-100 hover:bg-red-100' 
                    : 'bg-white text-slate-600 border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50 shadow-sm'
                }`}
              >
                {isMuted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mb-1">
                        <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM20.57 16.476c-.225.085-.475.143-.736.166a7.512 7.512 0 01-4.834-1.28l-1.932-1.932a3.75 3.75 0 00-3.326-3.326l-1.932-1.932a7.512 7.512 0 011.28-4.834.75.75 0 011.174.157c.325.56.54 1.162.628 1.789a2.25 2.25 0 002.25 2.25c.627.088 1.229.304 1.789.628a.75.75 0 01.157 1.174z" />
                        <path d="M12 12.75a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H12.75a.75.75 0 01-.75-.75V12.75z" />
                        <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 001.636 3.872L5.213 19.8A6.742 6.742 0 014.5 15v-3.75A.75.75 0 015.25 10.5z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mb-1">
                        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                        <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                    </svg>
                )}
                <span className="text-xs">{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>
              
              <button
                onClick={onDisconnect}
                className="flex-1 flex flex-col items-center justify-center py-4 px-4 rounded-2xl font-medium bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100 hover:border-red-200 transition-all shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mb-1">
                  <path d="M13.49 3.029a1.5 1.5 0 00-2.98 0l-.675 6.363a1.5 1.5 0 01-1.42 1.35l-6.363.675a1.5 1.5 0 000 2.98l6.363.675a1.5 1.5 0 011.42 1.35l.675 6.363a1.5 1.5 0 002.98 0l.675-6.363a1.5 1.5 0 011.42-1.35l6.363-.675a1.5 1.5 0 000-2.98l-6.363-.675a1.5 1.5 0 01-1.42-1.35l-.675-6.363z" />
                </svg>
                <span className="text-xs">End</span>
              </button>
           </div>
           <p className="text-center text-xs text-slate-400 mt-2">
             Using Gemini 2.5 Live API
           </p>
        </>
      )}
    </div>
  );
};

export default Controls;