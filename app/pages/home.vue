<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex flex-col">
    <!-- 顶部导航 -->
    <header class="w-full border-b border-white/10 backdrop-blur bg-slate-900/60">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="h-9 w-9 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/40">
            <span class="text-lg font-black">AI</span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-xl font-semibold tracking-tight">我的 AI Agent · Studio</h1>
              <span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-400/40">
                实验版
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              更沉浸的聊天体验，适合长时间使用
            </p>
          </div>
        </div>

        <div class="hidden md:flex items-center gap-3 text-xs text-slate-300">
          <span class="px-2 py-1 rounded-full bg-slate-800/80 border border-slate-600/70 flex items-center gap-1">
            <span class="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_0_4px_rgba(34,197,94,0.4)]" />
            <span>已连接 · DeepSeek Agent</span>
          </span>
          <span class="px-2 py-1 rounded-full bg-slate-800/80 border border-slate-600/70">
            Esc 停止 · Enter 发送
          </span>
        </div>
      </div>
    </header>

    <!-- 主体布局：左侧聊天 + 右侧信息栏 -->
    <main class="flex-1 w-full">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[minmax(0,2.1fr)_minmax(260px,0.9fr)] gap-6">
        <!-- 左侧：聊天卡片 -->
        <section
          class="bg-slate-900/70 border border-white/10 rounded-3xl shadow-[0_18px_60px_rgba(15,23,42,0.8)] flex flex-col h-[70vh] md:h-[78vh] overflow-hidden"
        >
          <!-- 聊天顶部 -->
          <div class="px-5 pt-4 pb-3 border-b border-slate-700/80 flex items-center justify-between bg-gradient-to-r from-slate-900/90 via-slate-900 to-slate-900/90">
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm font-semibold tracking-tight text-slate-100">对话空间</h2>
                <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-600/80">
                  Beta
                </span>
              </div>
              <p class="text-[11px] text-slate-400 mt-1">
                支持多轮对话、工具调用和代码解释
              </p>
            </div>

            <div class="flex items-center gap-2 text-[11px] text-slate-300">
              <span class="px-2 py-1 rounded-full bg-slate-800/80 border border-slate-700/80">
                💬 {{ messages.length || 0 }} 条记录
              </span>
            </div>
          </div>

          <!-- 聊天内容 -->
          <div ref="chatContainer" class="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
            <div v-if="messages.length === 0" class="h-full flex flex-col items-center justify-center text-center text-slate-400">
              <div class="h-16 w-16 rounded-2xl border border-dashed border-slate-600/70 flex items-center justify-center mb-4 bg-slate-900/70">
                <span class="text-2xl">✨</span>
              </div>
              <p class="text-sm font-medium mb-1">还没有开始对话</p>
              <p class="text-xs text-slate-500 mb-4">右侧可以直接点击一个提示词，立即开始体验</p>
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px]">
                <span class="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">提示</span>
                <span>发送任意问题，我会持续用中文回答你</span>
              </div>
            </div>

            <!-- 消息列表 -->
            <div
              v-for="msg in messages"
              :key="msg._tick ? `${msg.id}-${msg._tick}` : msg.id"
              class="flex flex-col gap-1"
              :class="msg.role === 'user' ? 'items-end' : 'items-start'"
            >
              <div class="flex items-center gap-2 text-[11px] text-slate-400" :class="msg.role === 'user' ? 'flex-row-reverse' : ''">
                <span
                  class="inline-flex h-6 w-6 rounded-full items-center justify-center text-xs font-semibold"
                  :class="msg.role === 'user'
                    ? 'bg-gradient-to-tr from-blue-500 to-sky-400 text-white shadow-md shadow-blue-500/30'
                    : 'bg-slate-800 text-slate-100 border border-slate-600'
                  "
                >
                  {{ msg.role === 'user' ? '你' : 'AI' }}
                </span>
                <span>{{ msg.role === 'user' ? '你' : 'Agent · DeepSeek' }}</span>
              </div>

              <div
                class="max-w-[90%] md:max-w-[78%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm border"
                :class="msg.role === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-sky-500 text-white border-blue-400/60 rounded-br-sm'
                  : 'bg-slate-900/80 border-slate-700/80 text-slate-50 rounded-bl-sm'
                "
              >
                <!-- 使用 markdown 渲染 -->
                <div
                  class="prose prose-invert prose-sm max-w-none"
                  v-html="renderMarkdown(msg.content)"
                />

                <!-- 工具调用信息 -->
                <div v-if="msg.toolInvocations" class="mt-3 space-y-2">
                  <div
                    v-for="tool in msg.toolInvocations"
                    :key="tool.toolCallId"
                    class="text-[11px] bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-2 font-mono text-slate-300"
                  >
                    <div v-if="tool.state === 'call'" class="flex items-center gap-1 text-sky-300">
                      <span class="inline-flex h-1.5 w-1.5 rounded-full bg-sky-400 animate-ping" />
                      <span>正在调用工具：{{ tool.toolName }}</span>
                    </div>
                    <div v-else-if="tool.state === 'result'" class="text-emerald-300">
                      结果：{{ JSON.stringify(tool.result) }}
                    </div>
                    <div v-else-if="tool.state === 'error'" class="text-rose-300">
                      工具执行失败
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="isLoading && messages[messages.length - 1]?.role === 'assistant'"
              class="flex items-center gap-2 text-[11px] text-slate-400 ml-1"
            >
              <span class="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Agent 正在思考中…</span>
            </div>
          </div>

          <!-- 输入区域 -->
          <div class="border-t border-slate-800/80 bg-slate-950/80 px-4 py-3">
            <div class="flex flex-col gap-2">
              <div class="flex gap-2">
                <input
                  v-model="input"
                  @keydown.enter.exact="handleSubmit"
                  placeholder="向你的 AI 助手提问，例如：帮我优化一段 TypeScript 代码…"
                  class="flex-1 px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-sm
                         placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-400
                         disabled:opacity-60 disabled:cursor-not-allowed"
                  :disabled="isLoading"
                />

                <button
                  v-if="!isLoading"
                  @click="handleSubmit"
                  :disabled="!input.trim()"
                  class="inline-flex items-center justify-center px-4 md:px-5 py-2.5 rounded-xl
                         bg-gradient-to-r from-blue-500 to-sky-500 text-sm font-medium text-white
                         shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40
                         disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition"
                >
                  <span class="hidden sm:inline mr-1.5">发送</span>
                  <span class="sm:hidden mr-1.5">发</span>
                  <span class="text-base">➤</span>
                </button>

                <button
                  v-else
                  @click="stop"
                  class="inline-flex items-center justify-center px-4 md:px-5 py-2.5 rounded-xl
                         bg-rose-500 text-sm font-semibold text-white shadow-md shadow-rose-500/40
                         hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-500/50 transition animate-pulse"
                >
                  停止
                </button>
              </div>

              <div class="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>支持多轮对话 / 代码解释 / 工具调用</span>
                <span>Enter 发送 · Shift + Enter 换行</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 右侧：提示 & 信息面板 -->
        <aside class="space-y-4">
          <!-- 今日推荐提示词 -->
          <div class="bg-slate-900/70 border border-white/10 rounded-3xl p-4 shadow-[0_14px_40px_rgba(15,23,42,0.9)]">
            <div class="flex items-center justify-between mb-3">
              <div>
                <p class="text-xs font-semibold tracking-wide text-slate-300 uppercase">今日推荐</p>
                <p class="text-[11px] text-slate-500 mt-0.5">一键开始一个高质量对话</p>
              </div>
              <span class="inline-flex items-center justify-center h-7 px-2 rounded-full bg-slate-800 text-[11px] text-slate-300 border border-slate-700/80">
                🎯 灵感助手
              </span>
            </div>

            <div class="space-y-2">
              <button
                v-for="preset in presets"
                :key="preset.title"
                type="button"
                class="w-full text-left px-3 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80
                       hover:border-sky-500/60 transition flex flex-col gap-1 group"
                @click="input = preset.content"
              >
                <div class="flex items-center justify-between text-xs">
                  <span class="font-medium text-slate-100 group-hover:text-sky-100">
                    {{ preset.title }}
                  </span>
                  <span class="text-[10px] text-sky-300/80">{{ preset.tag }}</span>
                </div>
                <p class="text-[11px] text-slate-400 line-clamp-2">
                  {{ preset.content }}
                </p>
              </button>
            </div>
          </div>

          <!-- 会话状态 -->
          <div class="bg-slate-900/70 border border-white/10 rounded-3xl p-4 space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold text-slate-300 uppercase tracking-wide">状态</p>
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
                :class="isLoading
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/50'
                  : 'bg-slate-800 text-slate-300 border border-slate-600/80'
                "
              >
                <span
                  class="h-1.5 w-1.5 rounded-full"
                  :class="isLoading ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'"
                />
                <span>{{ isLoading ? '正在回复中' : '空闲，随时可以开始' }}</span>
              </span>
            </div>

            <div class="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div class="rounded-2xl bg-slate-900/80 border border-slate-700/80 px-2 py-2.5">
                <p class="text-[10px] text-slate-400 mb-0.5">总消息数</p>
                <p class="text-base font-semibold text-slate-50">{{ messages.length || 0 }}</p>
              </div>
              <div class="rounded-2xl bg-slate-900/80 border border-slate-700/80 px-2 py-2.5">
                <p class="text-[10px] text-slate-400 mb-0.5">工具调用</p>
                <p class="text-base font-semibold text-slate-50">
                  {{
                    messages.filter(m => m.toolInvocations && m.toolInvocations.length > 0).length || 0
                  }}
                </p>
              </div>
              <div class="rounded-2xl bg-slate-900/80 border border-slate-700/80 px-2 py-2.5">
                <p class="text-[10px] text-slate-400 mb-0.5">模式</p>
                <p class="text-xs font-semibold text-sky-300">对话 · 中文</p>
              </div>
            </div>

            <div class="rounded-2xl bg-slate-900/80 border border-slate-700/80 px-3 py-2.5 text-[11px] text-slate-400 space-y-1.5">
              <p class="font-medium text-slate-200">小贴士</p>
              <p>尽量描述清楚你的目标，而不仅仅是问题本身，效果会更好。</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue';
import { useChat } from '../../composables/useChat';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

// markdown 高亮配置（与 index.vue 保持一致）
marked.setOptions({
  highlight(code, lang) {
    if (lang && !hljs.getLanguage(lang)) {
      lang = 'plaintext';
    }

    try {
      return hljs.highlight(code, {
        language: lang || 'plaintext',
        ignoreIllegals: true,
      }).value;
    } catch (e) {
      return code;
    }
  },
  langPrefix: 'hljs language-',
  breaks: true,
  gfm: true,
});

const chatContainer = ref<HTMLElement | null>(null);

// 与 index.vue 相同的 chat 逻辑
const { messages, input, isLoading, error, handleSubmit, stop } = useChat({
  api: '/api/chat',
});

// 预设提示词（右侧卡片使用）
const presets = [
  {
    title: '代码重构建议',
    tag: '开发',
    content: '我有一段 TypeScript 代码想优化，请你从可读性、性能和可维护性三个维度给出详细重构建议，并附上示例代码。',
  },
  {
    title: '学习新技术路线',
    tag: '学习',
    content: '我想系统学习一下 Nuxt 3 + TypeScript 的最佳实践，请帮我规划一个为期两周的学习路线和每天的学习任务。',
  },
  {
    title: '产品需求梳理',
    tag: '产品',
    content: '我有一个 AI 助手产品的想法，请帮我一起梳理核心功能、用户场景、MVP 范围以及可能的技术实现方案。',
  },
];

watch(
  () => messages,
  () => {
    // 保留日志，便于调试
    console.log('home messages', messages);
  },
  { deep: true },
);

// 自动滚动逻辑（与 index.vue 一致）
let scrollInterval: number | null = null;

const startAutoScroll = () => {
  if (scrollInterval) return;

  scrollInterval = window.setInterval(() => {
    if (chatContainer.value && isLoading.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    } else {
      stopAutoScroll();
    }
  }, 100);
};

const stopAutoScroll = () => {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }

  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

watch(
  isLoading,
  (newVal) => {
    if (newVal) {
      startAutoScroll();
    } else {
      stopAutoScroll();
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  stopAutoScroll();
});

const renderMarkdown = (text: string) => {
  if (!text) return '';
  return marked.parse(text);
};
</script>

<style lang="scss" scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.8) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #38bdf8, #4f46e5);
  border-radius: 999px;
}

.prose pre {
  background-color: #020617;
  border: 1px solid rgba(148, 163, 184, 0.5);
  border-radius: 0.9rem;
  padding: 0.9rem 1rem;
  overflow-x: auto;
  margin: 0.75rem 0;
}

.prose code {
  font-family: 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
  font-size: 0.82rem;
}

.prose p code {
  background-color: rgba(15, 23, 42, 0.9);
  padding: 0.1rem 0.35rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(148, 163, 184, 0.3);
  color: #e5e7eb;
}
</style>