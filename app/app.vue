<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center py-10">
    <h1 class="text-3xl font-bold mb-6 text-gray-800">🤖 我的 AI Agent (完美版)</h1>

    <!-- 聊天容器 -->
    <div class="w-full max-w-2xl bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[600px]">
      
      <!-- ✅ 关键：给滚动容器一个 ref -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4" ref="chatContainer">
        
        <div v-if="messages.length === 0" class="text-center text-gray-400 mt-20">
          开始对话吧！
        </div>

        <!-- ✅ 关键：使用 msg.id 作为 key，确保每条消息独立渲染 -->
        <div v-for="msg in messages" :key="msg.renderKey ? `${msg.id}-${msg.renderKey}` : msg.id"
             class="flex flex-col" 
             :class="msg.role === 'user' ? 'items-end' : 'items-start'">
          
          <span class="text-xs text-gray-500 mb-1">{{ msg.role === 'user' ? '你' : 'Agent' }}</span>
          
          <div class="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm"
               :class="msg.role === 'user' 
                 ? 'bg-blue-600 text-white rounded-br-none' 
                 : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'">
            
            <!-- ✅ 关键：内容区域也加上 key，或者让 Vue 自动追踪 -->
            <div class="prose prose-sm max-w-none" 
                 :class="msg.role === 'user' ? 'prose-invert' : ''" 
                 v-html="renderMarkdown(msg.content)">
            </div>

            <!-- 工具卡片 -->
            <div v-if="msg.toolInvocations" class="mt-3 space-y-2">
              <div v-for="tool in msg.toolInvocations" :key="tool.toolCallId" 
                   class="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 font-mono">
                <div v-if="tool.state === 'call'" class="text-blue-600 animate-pulse">
                  🛠️ 正在执行: {{ tool.toolName }}
                </div>
                <div v-else-if="tool.state === 'result'" class="text-green-600">
                  ✅ 结果: {{ JSON.stringify(tool.result) }}
                </div>
              </div>
            </div>

          </div>
        </div>
        
        <div v-if="isLoading && messages[messages.length-1]?.role === 'assistant'" class="text-xs text-gray-400 ml-2">
          Agent 正在思考...
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="p-4 border-t bg-gray-50 flex gap-2">
        <input 
          v-model="input" 
          @keydown.enter="handleSubmit"
          placeholder="输入消息..." 
          class="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="isLoading"
        />
        
        <button 
          v-if="!isLoading"
          @click="handleSubmit" 
          :disabled="!input.trim()"
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          发送
        </button>

        <button 
          v-else
          @click="stop" 
          class="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition animate-pulse font-bold"
        >
          停止
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChat } from '../composables/useChat';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { ref, watch, nextTick, onUnmounted } from 'vue';

// 配置 marked
marked.setOptions({
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: 'hljs language-'
});

const chatContainer = ref<HTMLElement | null>(null);
const { messages, input, isLoading, error, handleSubmit, stop } = useChat({
  api: '/api/chat',
});
watch(() => messages, (newValue) => {
  console.log('messages',messages)
},{deep:true})
// ✅ 核心变量：用于控制自动滚动的定时器
let scrollInterval: number | null = null;

// 启动自动滚动定时器
const startAutoScroll = () => {
  if (scrollInterval) return; // 防止重复启动
  
  scrollInterval = window.setInterval(() => {
    if (chatContainer.value && isLoading.value) {
      // 只要还在加载，就强制滚到底部
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    } else {
      // 如果加载结束，停止定时器
      stopAutoScroll();
    }
  }, 100); // 每 100ms 检查并滚动一次
};

// 停止自动滚动
const stopAutoScroll = () => {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }
  // 最后再确保滚一次到底
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

// ✅ 监听加载状态，自动控制定时器
watch(isLoading, (newVal) => {
  if (newVal) {
    startAutoScroll();
  } else {
    stopAutoScroll();
  }
}, { immediate: true });

// 清理定时器
onUnmounted(() => {
  stopAutoScroll();
});

const renderMarkdown = (text: string) => {
  if (!text) return '';
  return marked.parse(text);
};
</script>
<style>
.prose pre {
  background-color: #f6f8fa;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
  margin: 1em 0;
}
.prose code {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
}
.prose p code {
  background-color: rgba(175, 184, 193, 0.2);
  padding: 0.2em 0.4em;
  border-radius: 6px;
  color: #24292f;
}
/* 如果是用户气泡，代码颜色要反色 */
.prose-invert code {
  color: #fff;
  background-color: rgba(255,255,255,0.2);
}
</style>