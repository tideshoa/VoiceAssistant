export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface AudioVisualizerProps {
  isActive: boolean;
  volume: number; // 0 to 1
}

export interface MessageLog {
  role: 'user' | 'assistant';
  text?: string;
}