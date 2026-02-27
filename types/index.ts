export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  files?: UploadedFile[];
  timestamp: number;
  status: 'pending' | 'sending' | 'sent' | 'error';
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  progress?: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  currentMessage: string;
  uploadedFiles: UploadedFile[];
  error: string | null;
}

export interface ChatRequest {
  messages: {
    role: 'user' | 'assistant';
    content: string;
  }[];
  model: string;
  stream?: boolean;
  temperature?: number;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: string;
  }[];
}

export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: 'assistant';
      content?: string;
    };
    finish_reason: string | null;
  }[];
}