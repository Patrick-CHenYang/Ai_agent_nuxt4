// server/api/chat.post.ts
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

const deepseek = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.deepseek.com',
  apiKey: process.env.OPENAI_API_KEY,
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const messages = body.messages || [];

  console.log('🚀 [Server] 收到请求，消息数量:', messages.length);
  console.log('🔑 [Server] API Key 前缀:', process.env.OPENAI_API_KEY?.substring(0, 10) + '...');

  try {
    // 1. 创建流式生成
    const result = streamText({
      model: deepseek(process.env.DEEPSEEK_MODEL || 'deepseek-chat'),
      messages,
      tools: {
        getCurrentTime: {
          description: '获取当前的日期和时间',
          parameters: z.object({ timezone: z.string() }),
          execute: async ({ timezone }) => {
            await new Promise((resolve) => setTimeout(resolve, 500));
            return { 
              currentTime: new Date().toLocaleString('zh-CN', { timeZone: timezone || 'Asia/Shanghai' }) 
            };
          },
        },
      },
      system: '你是一个有用的助手。如果用户问时间，请调用工具。',
      maxTokens: 2000,
    });

    console.log('✅ [Server] 流已创建，准备返回响应...');

    // 2. 返回流式响应 (使用 v4/v5 兼容写法)
    // 如果 toDataStreamResponse 不存在，尝试 result.toResponse() 或 sendStream(event, result.toAIStream())
    return result.toDataStreamResponse();

  } catch (error) {
    console.error('❌ [Server] 发生严重错误:', error);
    
    // 3. 【关键】如果是 AI SDK 的错误，尝试提取详细信息
    if (error instanceof Error) {
      console.error('❌ [Server] 错误名称:', error.name);
      console.error('❌ [Server] 错误消息:', error.message);
      console.error('❌ [Server] 错误堆栈:', error.stack);
      
      // 如果是 API 调用失败，error.cause 可能包含原始响应
      if ((error as any).cause) {
         console.error('❌ [Server] 根本原因 (Cause):', (error as any).cause);
      }
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'AI Service Error',
      data: { 
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown'
      },
    });
  }
});