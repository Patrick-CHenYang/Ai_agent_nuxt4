// server/api/chat.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const messages = body.messages || [];

  console.log('🚀 [Server] 收到请求 (原生 fetch 版)');

  try {
    // ✅ 直接使用 fetch 调用 DeepSeek API
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        messages,
        stream: true, // ✅ 开启流式
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API Error: ${response.status} - ${errorText}`);
    }

    console.log('✅ [Server] DeepSeek 连接成功，开始透传流...');

    // ✅ 直接透传 DeepSeek 的原生流给前端
    // 不做任何处理，保证 100% 原汁原味
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('❌ [Server] 顶层错误:', error);
    throw createError({ 
      statusCode: 500, 
      message: 'AI Service Error',
      data: { message: error instanceof Error ? error.message : 'Unknown' }
    });
  }
});