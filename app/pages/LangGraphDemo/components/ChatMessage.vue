<template>
  <div :class="['chat-message', role, status]">
    <div class="message-avatar">
      <div :class="['avatar', role]">
        {{ role === 'user' ? 'U' : 'A' }}
      </div>
    </div>
    <div class="message-content">
      <div class="message-header">
        <span class="message-role">{{ role === 'user' ? 'You' : 'Assistant' }}</span>
        <span class="message-time">{{ formatTime(timestamp) }}</span>
      </div>
      <div class="message-body">
        <div v-if="status === 'sending'" class="message-status">
          <div class="loading-indicator">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
          <span>Sending...</span>
        </div>
        <div v-else-if="status === 'error'" class="message-error">
          <span>Failed to send</span>
        </div>
        <div v-else class="message-text" v-html="renderedContent"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { computed } from 'vue';
import { renderMarkdown } from '../utils/markdownUtils';
import type { ChatMessage } from '@/types';

const props = defineProps<{
  message: ChatMessage;
}>();

const { message } = props;
const { role, content, timestamp, status } = message;

const renderedContent = computed(() => {
  return renderMarkdown(content);
});

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
</script>

<style lang='scss' scoped>
.chat-message {
  display: flex;
  margin-bottom: 16px;
  animation: fadeIn 0.3s ease-in-out;

  &.user {
    flex-direction: row-reverse;

    .message-avatar {
      margin-left: 12px;
      margin-right: 0;
    }

    .message-content {
      background-color: #e6f7ff;
      border-radius: 18px 4px 18px 18px;
      color: #003a5d;
    }
  }

  &.assistant {
    .message-content {
      background-color: #f5f5f5;
      border-radius: 4px 18px 18px 18px;
      color: #333;
    }
  }

  &.sending {
    opacity: 0.7;
  }

  &.error {
    opacity: 0.7;
  }

  .message-avatar {
    margin-right: 12px;

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;

      &.user {
        background-color: #1890ff;
        color: white;
      }

      &.assistant {
        background-color: #52c41a;
        color: white;
      }
    }
  }

  .message-content {
    max-width: 70%;
    padding: 12px 16px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 12px;

      .message-role {
        font-weight: bold;
      }

      .message-time {
        color: #999;
      }
    }

    .message-body {
      line-height: 1.5;

      .message-text {
        white-space: pre-wrap;
        word-break: break-word;

        :deep(h1),
        :deep(h2),
        :deep(h3),
        :deep(h4),
        :deep(h5),
        :deep(h6) {
          margin: 12px 0 8px 0;
          font-weight: bold;
        }

        :deep(h1) { font-size: 1.5em; }
        :deep(h2) { font-size: 1.3em; }
        :deep(h3) { font-size: 1.1em; }

        :deep(p) {
          margin-bottom: 8px;
        }

        :deep(ul),
        :deep(ol) {
          margin: 8px 0;
          padding-left: 24px;
        }

        :deep(li) {
          margin-bottom: 4px;
        }

        :deep(blockquote) {
          border-left: 4px solid #1890ff;
          padding-left: 12px;
          margin: 8px 0;
          color: #666;
          font-style: italic;
        }

        :deep(code) {
          background-color: #f0f0f0;
          padding: 2px 4px;
          border-radius: 4px;
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.9em;
        }

        :deep(pre) {
          background-color: #f0f0f0;
          padding: 12px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 8px 0;

          :deep(code) {
            background-color: transparent;
            padding: 0;
          }
        }

        :deep(a) {
          color: #1890ff;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }

      .message-status {
        display: flex;
        align-items: center;
        color: #999;

        .loading-indicator {
          display: flex;
          margin-right: 8px;

          .dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: #1890ff;
            margin: 0 2px;
            animation: pulse 1.5s infinite ease-in-out;

            &:nth-child(2) {
              animation-delay: 0.2s;
            }

            &:nth-child(3) {
              animation-delay: 0.4s;
            }
          }
        }
      }

      .message-error {
        color: #ff4d4f;
      }
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}
</style>
