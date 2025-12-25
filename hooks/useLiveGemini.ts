import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ConnectionState, MessageLog } from '../types';
import { SYSTEM_INSTRUCTION, MODEL_NAME } from '../constants';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../utils/audio-utils';

export const useLiveGemini = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [volume, setVolume] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  // Real-time transcription state
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [userTranscript, setUserTranscript] = useState('');
  const [assistantTranscript, setAssistantTranscript] = useState('');
  
  // Refs for robust state management inside async callbacks
  const isMutedRef = useRef(isMuted);
  const userTranscriptBuffer = useRef('');
  const assistantTranscriptBuffer = useRef('');

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);
  
  // References for audio handling
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null); // To store the active session
  const closeRef = useRef<(() => void) | null>(null); // Function to close session

  const disconnect = useCallback(() => {
    // Clean up audio sources
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    activeSourcesRef.current.clear();

    // Clean up input
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    
    // Clean up output
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    // Close session
    if (closeRef.current) {
      closeRef.current();
      closeRef.current = null;
    }
    
    // Flush pending transcripts to history before clearing
    // Capture values into local variables to avoid race conditions
    const pendingUserText = userTranscriptBuffer.current;
    if (pendingUserText && pendingUserText.trim().length > 0) {
        setMessages(prev => [...prev, { role: 'user', text: pendingUserText }]);
    }

    const pendingAssistantText = assistantTranscriptBuffer.current;
    if (pendingAssistantText && pendingAssistantText.trim().length > 0) {
        setMessages(prev => [...prev, { role: 'assistant', text: pendingAssistantText }]);
    }

    sessionRef.current = null;
    setConnectionState(ConnectionState.DISCONNECTED);
    setVolume(0);
    nextStartTimeRef.current = 0;
    
    // Reset transcripts and buffers
    setUserTranscript('');
    setAssistantTranscript('');
    userTranscriptBuffer.current = '';
    assistantTranscriptBuffer.current = '';
    
    // IMPORTANT: Do NOT clear messages here. We want to persist history.
  }, []);

  const connect = useCallback(async () => {
    try {
      setConnectionState(ConnectionState.CONNECTING);

      if (!process.env.API_KEY) {
        throw new Error("API Key not found");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Setup Audio Contexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      // Setup Output Gain
      const gainNode = outputCtx.createGain();
      gainNode.connect(outputCtx.destination);
      outputNodeRef.current = gainNode;

      // Request Mic Access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Setup Connection
      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION,
          inputAudioTranscription: {}, 
          outputAudioTranscription: {}, 
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
        callbacks: {
          onopen: async () => {
            setConnectionState(ConnectionState.CONNECTED);
            
            // Start processing input audio
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = processor;
            
            processor.onaudioprocess = (e) => {
              if (isMutedRef.current) return; 

              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate volume for visualizer
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              setVolume(Math.min(1, rms * 5)); // Amplify for visualizer

              const pcmBlob = createPcmBlob(inputData);
              
              sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const serverContent = msg.serverContent;
            
            // 1. Handle Input Transcription (User speaking)
            if (serverContent?.inputTranscription) {
               const text = serverContent.inputTranscription.text;
               if (text) {
                   // User is speaking, so we might need to interrupt assistant
                   const currentAssistantText = assistantTranscriptBuffer.current;
                   if (currentAssistantText && currentAssistantText.trim()) {
                       setMessages(prev => [...prev, { role: 'assistant', text: currentAssistantText }]);
                       assistantTranscriptBuffer.current = '';
                       setAssistantTranscript('');
                   }
                   
                   userTranscriptBuffer.current += text;
                   setUserTranscript(userTranscriptBuffer.current);
               }
            }

            // 2. Handle Output Transcription (Model speaking)
            if (serverContent?.outputTranscription) {
                const text = serverContent.outputTranscription.text;
                if (text) {
                   // Model starts speaking, flush user transcript if pending
                   const currentUserText = userTranscriptBuffer.current;
                   if (currentUserText && currentUserText.trim()) {
                       setMessages(prev => [...prev, { role: 'user', text: currentUserText }]);
                       userTranscriptBuffer.current = '';
                       setUserTranscript('');
                   }
                   
                   assistantTranscriptBuffer.current += text;
                   setAssistantTranscript(assistantTranscriptBuffer.current);
                }
            }
            
            // 3. Handle Turn Complete (Model finished)
            if (serverContent?.turnComplete) {
                // Flush Assistant Transcript
                const currentAssistantText = assistantTranscriptBuffer.current;
                if (currentAssistantText && currentAssistantText.trim()) {
                    setMessages(prev => [...prev, { role: 'assistant', text: currentAssistantText }]);
                    assistantTranscriptBuffer.current = '';
                    setAssistantTranscript('');
                }
                
                // Flush User Transcript (just in case it wasn't flushed by output start)
                const currentUserText = userTranscriptBuffer.current;
                if (currentUserText && currentUserText.trim()) {
                     setMessages(prev => [...prev, { role: 'user', text: currentUserText }]);
                     userTranscriptBuffer.current = '';
                     setUserTranscript('');
                }
            }

            // Handle Audio Output
            const base64Audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputCtx && outputNodeRef.current) {
              const audioData = base64ToUint8Array(base64Audio);
              const audioBuffer = await decodeAudioData(audioData, outputCtx);
              
              // Schedule Playback
              const currentTime = outputCtx.currentTime;
              if (nextStartTimeRef.current < currentTime) {
                 nextStartTimeRef.current = currentTime;
              }
              
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNodeRef.current);
              source.start(nextStartTimeRef.current);
              
              activeSourcesRef.current.add(source);
              source.onended = () => {
                activeSourcesRef.current.delete(source);
              };

              nextStartTimeRef.current += audioBuffer.duration;
            }

            // Handle Interruption
            if (serverContent?.interrupted) {
               activeSourcesRef.current.forEach(src => {
                 try { src.stop(); } catch(e){}
               });
               activeSourcesRef.current.clear();
               nextStartTimeRef.current = 0;

               // If interrupted, flush what we have of assistant
               const currentAssistantText = assistantTranscriptBuffer.current;
               if (currentAssistantText && currentAssistantText.trim()) {
                  setMessages(prev => [...prev, { role: 'assistant', text: currentAssistantText }]);
               }
               assistantTranscriptBuffer.current = '';
               setAssistantTranscript('');
            }
          },
          onclose: () => {
            disconnect();
          },
          onerror: (err) => {
            console.error(err);
            setConnectionState(ConnectionState.ERROR);
            disconnect();
          }
        }
      });
      
      // Store session and close method
      const session = await sessionPromise;
      sessionRef.current = session;
      closeRef.current = () => {
         if(typeof (session as any).close === 'function') {
             (session as any).close();
         }
      };

    } catch (error) {
      console.error("Connection failed", error);
      setConnectionState(ConnectionState.ERROR);
    }
  }, [disconnect]);

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const sendTextMessage = useCallback(async (text: string) => {
    try {
        // 1. Add user message locally
        setMessages(prev => [...prev, { role: 'user', text }]);
        
        // 2. Initialize Chat
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Construct history from messages
        const history = messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text || '' }]
        }));

        const chat = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: { systemInstruction: SYSTEM_INSTRUCTION },
            history: history
        });

        // 3. Send Message Stream
        const result = await chat.sendMessageStream({ message: text });
        
        let fullText = "";
        for await (const chunk of result) {
            const chunkText = chunk.text;
            if (chunkText) {
                fullText += chunkText;
                setAssistantTranscript(fullText); 
            }
        }

        // 4. Commit to history
        setAssistantTranscript('');
        if (fullText.trim()) {
            setMessages(prev => [...prev, { role: 'assistant', text: fullText }]);
        }

    } catch (error) {
        console.error("Text message failed", error);
        setAssistantTranscript('');
        setMessages(prev => [...prev, { role: 'assistant', text: "I'm sorry, I encountered an error processing your request." }]);
    }
  }, [messages]);

  return {
    connectionState,
    volume,
    isMuted,
    messages,
    userTranscript,
    assistantTranscript,
    connect,
    disconnect,
    toggleMute,
    sendTextMessage
  };
};