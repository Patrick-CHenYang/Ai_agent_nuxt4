<template>
  <div class="code-block">
    <div class="code-header">
      <span class="language">{{ language }}</span>
      <button 
        class="copy-button" 
        @click="copyCode"
        :class="{ 'copied': copied }"
      >
        {{ copied ? 'Copied!' : 'Copy' }}
      </button>
    </div>
    <pre class="code-content"><code :class="`language-${language}`" v-html="highlightedCode"></code></pre>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import hljs from 'highlight.js';

const props = defineProps<{
  code: string;
  language: string;
}>();

const { code, language } = props;
const copied = ref(false);

const highlightedCode = computed(() => {
  const lang = hljs.getLanguage(language) ? language : 'plaintext';
  return hljs.highlight(code, { language: lang }).value;
});

function copyCode() {
  navigator.clipboard.writeText(code).then(() => {
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  });
}

onMounted(() => {
  // 确保代码高亮正确应用
  hljs.highlightAll();
});
</script>

<style lang="scss" scoped>
.code-block {
  margin: 12px 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background-color: #f0f0f0;
    border-bottom: 1px solid #e0e0e0;

    .language {
      font-size: 12px;
      font-weight: bold;
      color: #666;
      text-transform: uppercase;
    }

    .copy-button {
      background-color: #1890ff;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background-color: #40a9ff;
      }

      &:active {
        background-color: #096dd9;
      }

      &.copied {
        background-color: #52c41a;
      }
    }
  }

  .code-content {
    margin: 0;
    padding: 16px;
    background-color: #fafafa;
    overflow-x: auto;
    max-height: 400px;
    overflow-y: auto;

    code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 14px;
      line-height: 1.5;
    }
  }
}

/* 自定义滚动条样式 */
.code-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.code-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.code-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.code-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>