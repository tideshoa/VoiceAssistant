import React, { useEffect, useState, useRef } from 'react';
import Header from './components/Header';
import TextInput from './components/TextInput';
import { useLiveGemini } from './hooks/useLiveGemini';
import { ConnectionState, MessageLog } from './types';

const App: React.FC = () => {
  const { 
    connectionState, 
    volume, 
    messages,
    userTranscript, 
    assistantTranscript, 
    connect, 
    disconnect, 
    sendTextMessage
  } = useLiveGemini();
  
  const [hasApiKey, setHasApiKey] = useState(true);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!process.env.API_KEY) {
      setHasApiKey(false);
    }
  }, []);

  // Scroll to bottom when transcripts change
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, userTranscript, assistantTranscript]);

  if (!hasApiKey) {
     return (
       <div className="flex items-center justify-center h-screen bg-slate-50">
         <div className="p-8 bg-white rounded-xl shadow-xl text-center max-w-md">
            <h2 className="text-xl font-bold text-red-600 mb-2">Configuration Error</h2>
            <p className="text-slate-600">The <code>API_KEY</code> environment variable is missing.</p>
         </div>
       </div>
     );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-100 flex flex-col h-[85vh] max-h-[800px]">
        <Header />

        {/* Transcription Display */}
        <div className="flex-1 overflow-y-auto mb-4 px-2 space-y-4 custom-scrollbar">
          
          {/* History Messages - Filter out empty messages */}
          {messages.filter(msg => msg.text && msg.text.trim().length > 0).map((msg, index) => (
             <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-3 text-sm shadow-sm ${
                   msg.role === 'user' 
                   ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' 
                   : 'bg-slate-200 text-slate-800 rounded-2xl rounded-tl-none'
                }`}>
                   <span className={`block text-[10px] font-bold uppercase mb-1 ${
                      msg.role === 'user' ? 'text-blue-200' : 'text-slate-500'
                   }`}>
                      {msg.role === 'user' ? 'You' : 'Tides Assistant'}
                   </span>
                   {msg.text}
                </div>
             </div>
          ))}

          {/* Current User Transcript (Streaming) */}
          {userTranscript && (
            <div className="flex flex-col items-end animate-pulse">
              <div className="max-w-[85%] bg-blue-100 text-blue-900 rounded-2xl rounded-tr-none p-3 text-sm border border-blue-200 shadow-sm">
                <span className="block text-[10px] font-bold text-blue-500 uppercase mb-1">Speaking...</span>
                {userTranscript}
              </div>
            </div>
          )}

          {/* Current Assistant Transcript (Streaming) */}
          {assistantTranscript && (
            <div className="flex flex-col items-start animate-pulse">
              <div className="max-w-[85%] bg-indigo-50 text-indigo-900 rounded-2xl rounded-tl-none p-3 text-sm border border-indigo-200 shadow-sm">
                <span className="block text-[10px] font-bold text-indigo-500 uppercase mb-1">Answering...</span>
                {assistantTranscript}
              </div>
            </div>
          )}
          <div ref={transcriptEndRef} />
        </div>

        {/* Unified Input Area */}
        <div className="flex-shrink-0">
            <TextInput 
                onSend={sendTextMessage} 
                disabled={!!assistantTranscript} 
                connectionState={connectionState}
                onConnect={connect}
                onDisconnect={disconnect}
                volume={volume}
            />
          
          <div className="mt-4 pt-4 border-t border-slate-100">
             <div className="flex items-start gap-3 text-xs text-slate-500">
                <span className="text-lg">💡</span>
                <p>
                  <strong>Tip:</strong> Try asking about parking rules, trash schedules, or how to submit architectural forms.
                </p>
             </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default App;