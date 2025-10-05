export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  imageUrl?: string;
  x: number;
  y: number;
}

export type ConnectionStyle = 'line' | 'arrow1' | 'arrow2' | 'arrow-both';

export interface Connection {
  id: string;
  startNoteId: string;
  endNoteId: string;
  color: string;
  style: ConnectionStyle;
}
