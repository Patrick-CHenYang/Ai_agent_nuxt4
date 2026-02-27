import type { ChatRequest, ChatResponse, StreamChunk } from '../types';

// 存储配置信息
let config = {
  apiKey: '',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat'
};

/**
 * 设置环境变量
 * @param apiKey API 密钥
 * @param baseUrl API 基础 URL
 * @param model 模型名称
 */
export function setConfig(apiKey: string, baseUrl: string, model: string) {
  config.apiKey = apiKey;
  config.baseUrl = baseUrl;
  config.model = model;
}

/**
 * 发送聊天请求
 * @param messages 聊天消息数组
 * @param stream 是否使用流式响应
 * @param temperature 温度参数
 * @returns Promise<ChatResponse> 聊天响应
 */
export async function sendChatRequest(
  messages: { role: 'user' | 'assistant'; content: string }[],
  stream: boolean = false,
  temperature: number = 0.7
): Promise<ChatResponse> {
  const request: ChatRequest = {
    messages,
    model: config.model,
    stream,
    temperature
  };

  const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to send chat request');
  }

  return response.json();
}

/**
 * 发送流式聊天请求
 * @param messages 聊天消息数组
 * @param callback 流式响应回调函数
 * @param temperature 温度参数
 * @returns 取消函数
 */
export async function sendStreamingChatRequest(
  messages: { role: 'user' | 'assistant'; content: string }[],
  callback: (chunk: StreamChunk, error?: Error) => void,
  temperature: number = 0.7
): Promise<() => void> {
  const request: ChatRequest = {
    messages,
    model: config.model,
    stream: true,
    temperature
  };

  const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const errorData = await response.json();
    callback({} as StreamChunk, new Error(errorData.error?.message || 'Failed to send streaming chat request'));
    return () => {};
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callback({} as StreamChunk, new Error('No response body'));
    return () => {};
  }

  let isCancelled = false;

  const readStream = async () => {
    if (isCancelled) {
      reader.cancel();
      return;
    }

    try {
      const { done, value } = await reader.read();

      if (done) {
        return;
      }

      const chunkText = new TextDecoder('utf-8').decode(value);
      const lines = chunkText.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          if (data === '[DONE]') {
            return;
          }
          try {
            const chunk: StreamChunk = JSON.parse(data);
            callback(chunk);
          } catch (error) {
            console.error('Error parsing stream chunk:', error);
          }
        }
      }

      await readStream();
    } catch (error) {
      callback({} as StreamChunk, error as Error);
    }
  };

  readStream();

  return () => {
    isCancelled = true;
  };
}

/**
 * 生成唯一ID
 * @returns 唯一ID字符串
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 导出所有函数
export const chatService = {
  setConfig,
  sendChatRequest,
  sendStreamingChatRequest,
  generateId
};