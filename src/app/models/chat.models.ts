export interface Message {
  id: string;
  text: string;
  type: 'user' | 'agent';
  timestamp: Date;
}

export interface Contact {
  id: string;
  name: string;
  description: string;
  avatar: string;
  endpoint: string;
  unreadCount?: number;
}

export interface ChatResponse {
  response: string;
  success: boolean;
}