// composables/useChat.ts
import { ref } from 'vue';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  renderKey?: number; // 用于强制重绘
  toolInvocations?: any[]; 
  tool_call_id?: string;
}

export interface UseChatOptions {
  api: string;
  onError?: (err: Error) => void;
  onFinish?: (msg: Message) => void;
}

const availableTools = {
  getCurrentTime: async ({ timezone }: { timezone: string }) => {
    await new Promise(r => setTimeout(r, 800));
    return { 
      currentTime: new Date().toLocaleString('zh-CN', { timeZone: timezone || 'Asia/Shanghai' }),
      timezone 
    };
  },
};

export function useChat(options: UseChatOptions) {
  const messages = ref<Message[]>([]);
  const input = ref('');
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  
  let abortController: AbortController | null = null;

  const stop = () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
      isLoading.value = false;
    }
  };

  // ✅ 核心函数：接收当前历史，返回新的历史
  const submitRequest = async (currentHistory: Message[], isToolResponse: boolean = false) => {
    
    // 1. 准备要发送的消息列表 (直接复用传入的 history，确保顺序不变)
    const msgsToSend = currentHistory.filter(m => m.role !== 'system');

    // 如果不是工具回调（即用户手动发送），才处理输入框和创建新气泡
    if (!isToolResponse) {
      if (!input.value.trim() || isLoading.value) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: input.value,
      };
      
      // 创建助手消息占位
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        toolInvocations: [],
        renderKey: 0
      };

      // ✅ 关键：先更新 UI (push 到 messages.value)
      messages.value.push(userMessage, assistantMessage);
      input.value = '';
      
      // ✅ 关键：构造新的历史数组用于发送 (包含刚才 push 的两条)
      const newHistory = [
        ...currentHistory, 
        userMessage, 
        assistantMessage
      ];
      
      // 使用新历史发起请求
      await executeFetch(newHistory, assistantMessage, false);

    } else {
      // --- 工具回调模式 ---
      // 此时 currentHistory 已经包含了 User -> Assistant(tool_calls) -> Tool(result)
      // 我们只需要创建一个新的助手气泡用于接收回复
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        toolInvocations: [],
        renderKey: 0
      };
      
      messages.value.push(assistantMessage);
      
      const newHistory = [...currentHistory, assistantMessage];
      
      await executeFetch(newHistory, assistantMessage, true);
    }
  };

  // ✅ 提取执行逻辑，方便递归调用
  const executeFetch = async (historyToSend: Message[], targetAssistantMsg: Message, isRecursive: boolean) => {
    
    if (!isRecursive) {
       isLoading.value = true;
       error.value = null;
       abortController = new AbortController();
    }

    try {
      const response = await fetch(options.api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyToSend }),
        signal: abortController?.signal,
      });
console.log('response',response)
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`DeepSeek API Error: ${response.status} - ${errText}`);
      }
      if (!response.body) throw new Error('No body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let tempToolArgs: Record<string, string> = {};

      while (true) {
        const { done, value } = await reader.read();
        if (done || !abortController) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; 

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith('data:')) continue;
          const dataStr = trimmedLine.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') break;
          try {
            const chunk = JSON.parse(dataStr);
            const delta = chunk.choices?.[0]?.delta;
            if (!delta) continue;
            console.log(11111,delta)

            // ✅ 打字机效果：逐字符处理 + renderKey 强制重绘
            if (delta.content) {
              const chars = delta.content.split('');
              for (const char of chars) {
                targetAssistantMsg.content += char;
                targetAssistantMsg.renderKey = (targetAssistantMsg.renderKey || 0) + 1;
                await new Promise(resolve => setTimeout(resolve, 16)); // 16ms ≈ 60fps
              }
            }

            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                let toolCall = targetAssistantMsg.toolInvocations?.find((t: any) => t.toolCallId === tc.id);
                if (!toolCall) {
                  toolCall = {
                    state: 'call',
                    toolCallId: tc.id,
                    toolName: tc.function?.name,
                    args: {},
                    result: null
                  };
                  targetAssistantMsg.toolInvocations!.push(toolCall);
                  tempToolArgs[tc.id] = '';
                }
                if (tc.function?.arguments) {
                  tempToolArgs[tc.id] += tc.function.arguments;
                  try {
                    toolCall.args = JSON.parse(tempToolArgs[tc.id]);
                    targetAssistantMsg.renderKey = (targetAssistantMsg.renderKey || 0) + 1; // 触发重绘
                    await new Promise(resolve => setTimeout(resolve, 16));
                  } catch (e) {}
                }
              }
            }
          } catch (e) {}
        }
      }

      // 🌟 检测工具并递归
      if (targetAssistantMsg.toolInvocations && targetAssistantMsg.toolInvocations.length > 0) {
        console.log(222222,targetAssistantMsg.toolInvocations)
        const toolResults: Message[] = [];
        for (const tool of targetAssistantMsg.toolInvocations) {
          const toolFn = availableTools[tool.toolName as keyof typeof availableTools];
          if (toolFn) {
            try {
              tool.state = 'call'; 
              const result = await toolFn(tool.args);
              tool.state = 'result';
              tool.result = result;
              
              toolResults.push({
                id: `tool-res-${Date.now()}-${tool.toolCallId}`,
                role: 'tool',
                content: JSON.stringify(result),
                tool_call_id: tool.toolCallId
              });
            } catch (err) {
              tool.state = 'error';
              tool.result = { error: 'Failed' };
            }
          }
        }

        // ✅ 关键修复：
        // 1. 更新 UI
        messages.value.push(...toolResults);
        
        // 2. 构造新的历史数组：原历史 + 工具结果
        // 这样保证了 [..., Assistant(with tool_calls), Tool(result)] 的绝对顺序
        const nextHistory = [...historyToSend, ...toolResults];

        // 3. 递归调用
        await submitRequest(nextHistory, true); 
        
      } else {
        console.log(3333333,targetAssistantMsg.toolInvocations)
        if (!isRecursive && options.onFinish) options.onFinish(targetAssistantMsg);
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Stopped by user');
        return;
      }
      
      console.error(err);
      error.value = err instanceof Error ? err : new Error('Unknown error');
      
      if (!isRecursive && options.onError) options.onError(error.value);
      
      // 清理空消息
      if (!isRecursive && messages.value.length > 0) {
         const lastMsg = messages.value[messages.value.length - 1];
         if (lastMsg.role === 'assistant' && lastMsg.content === '') {
           messages.value.pop();
         }
      }
    } finally {
      if (!isRecursive) {
        isLoading.value = false;
        abortController = null;
      }
    }
  };

  const handleSubmit = (e?: Event) => {
    e?.preventDefault();
    // 初始调用，传入当前的 messages 副本
    submitRequest([...messages.value], false);
  };

  return { 
    messages, 
    input, 
    isLoading, 
    error, 
    handleSubmit,
    stop
  };
}