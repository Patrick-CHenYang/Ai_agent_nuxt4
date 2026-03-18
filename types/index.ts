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

// LangGraph 节点类型
export interface LangGraphNode {
  id: string;
  type: 'llm' | 'tool' | 'conditional' | 'custom';
  name: string;
  description: string;
  configuration: Record<string, any>;
}

// LangGraph 边类型
export interface LangGraphEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

// LangGraph 图类型
export interface LangGraph {
  id: string;
  name: string;
  description: string;
  nodes: LangGraphNode[];
  edges: LangGraphEdge[];
  entrypoint: string;
}

// LangGraph 执行请求类型
export interface LangGraphExecuteRequest {
  graphId: string;
  input: Record<string, any>;
  stream?: boolean;
}

// LangGraph 执行响应类型
export interface LangGraphExecuteResponse {
  id: string;
  output: Record<string, any>;
  metadata: Record<string, any>;
}

// LangGraph 流式响应块类型
export interface LangGraphStreamChunk {
  id: string;
  type: 'token' | 'tool_call' | 'tool_response' | 'finish';
  data: any;
}