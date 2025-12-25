import React, { useState, useRef, useEffect } from 'react';
import { ConnectionState } from '../types';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  
  // Voice Props
  connectionState: ConnectionState;
  onConnect: () => void;
  onDisconnect: () => void;
  volume: number;
}

const TextInput: React.FC<Props> = ({ 
  onSend, 
  disabled, 
  connectionState, 
  onConnect, 
  onDisconnect, 
  volume 
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
      // Reset height after send
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleMicClick = () => {
    if (connectionState === ConnectionState.CONNECTED) {
      onDisconnect();
    } else {
      onConnect();
    }
  };

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  return (
    <div className="w-full max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-end gap-2 bg-white p-2 rounded-3xl border border-slate-200 shadow-lg shadow-slate-200/50 relative">
        
        {/* Microphone Button */}
        <button
          type="button"
          onClick={handleMicClick}
          disabled={disabled && !isConnected}
          className={`relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
            isConnected 
              ? 'bg-red-500 text-white shadow-red-200' 
              : isConnecting
                ? 'bg-slate-100 text-slate-400'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
          aria-label={isConnected ? "Stop Listening" : "Start Listening"}
        >
          {/* Volume Ring Animation */}
          {isConnected && (
             <div 
               className="absolute inset-0 rounded-full bg-red-500 opacity-30"
               style={{ 
                 transform: `scale(${1 + Math.min(volume * 2, 0.5)})`,
                 transition: 'transform 0.1s ease-out'
               }}
             />
          )}

          {isConnecting ? (
            <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
          ) : isConnected ? (
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 z-10">
                <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
             </svg>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
             </svg>
          )}
        </button>

        {/* Text Input Form */}
        <div className="flex-1 flex items-end gap-2 py-3">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={isConnected ? "Listening..." : "Type your question or tap Microphone to Speak"}
            className="flex-1 bg-transparent outline-none text-slate-900 placeholder:text-slate-400 disabled:opacity-50 text-sm resize-none overflow-hidden"
            style={{ minHeight: '24px', maxHeight: '120px' }}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!text.trim() || disabled}
            className="mb-[2px] p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
            aria-label="Send Message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextInput;