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
      <div v-if="files && files.length > 0" class="message-files">
        <div v-for="file in files" :key="file.id" class="file-attachment">
          <div v-if="file.type.startsWith('image/')" class="image-preview">
            <img :src="file.url" :alt="file.name" class="preview-image" />
          </div>
          <div v-else :class="['file-icon', fileService.getFileIcon(file.type)]"></div>
          <div class="file-info">
            <div class="file-name">{{ file.name }}</div>
            <div class="file-size">{{ formatFileSize(file.size) }}</div>
          </div>
          <div v-if="file.status === 'uploading'" class="file-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${file.progress}%` }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { renderMarkdown, formatFileSize } from '../utils/markdownUtils';
import { fileService } from '../services/fileService';
import type { ChatMessage } from '../types';

const props = defineProps<{
  message: ChatMessage;
}>();

const { message } = props;
const { role, content, files, timestamp, status } = message;

const renderedContent = computed(() => {
  return renderMarkdown(content);
});

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
</script>

<style lang="scss" scoped>
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

    .message-files {
      margin-top: 12px;

      .file-attachment {
          display: flex;
          align-items: center;
          padding: 8px;
          background-color: rgba(0, 0, 0, 0.05);
          border-radius: 8px;
          margin-bottom: 8px;

          .image-preview {
            margin-right: 12px;
            border-radius: 4px;
            overflow: hidden;

            .preview-image {
              width: 64px;
              height: 64px;
              object-fit: cover;
            }
          }

          .file-icon {
            width: 24px;
            height: 24px;
            margin-right: 12px;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;

            &.file-image {
              background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMThjLTMuMzEgMC02LTIuNjktNi02czIuNjktNiA2LTYgNiAyLjY5IDYgNi0yLjY5IDYtNiA2em0wLTExYy0yLjIxIDAtNCAyLjc5LTQgNXM0IDIuNzkgNCA0LTQgMi43OS00IDQtNCA0LTQtMi43OS00LTQem02IDZhMiAyIDAgMSAxLTIgMnYtNGgtMnY0aDJ6Ii8+PC9zdmc+');
            }

            &.file-text {
              background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMjFoLTJWOGgxMnYxM3ptMC0xMWgtMlY0aDJ2N3ptLTYgMGMtMS4xIDAtMi4wLjktMiAycy45IDIgMiAyIDItLjkgMi0yLS45LTItMi0yeiIvPjwvc3ZnPg==');
            }

            &.file-pdf {
              background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMjF2LTZoLTJ2LTdoLTJ2LTZoLTJ2LTdoMnYtN2gydi03aDJ2N2gydjZoMnY3em0wLTE5aC0yVjFoMnY1em00IDBoLTJWMWgydjV6bTQgMGgtMlYxaDJ2NXptNC0xN2gtMlYxaDJ2NnoiLz48L3N2Zz4=');
            }

            &.file-excel {
              background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMjF2LTZoLTJ2LTdoLTJ2LTZoLTJ2LTdoMnYtN2gydi03aDJ2N2gydjZoMnY3em0wLTE5aC0yVjFoMnY1em00IDBoLTJWMWgydjV6bTQgMGgtMlYxaDJ2NXptNC0xN2gtMlYxaDJ2NnoiLz48L3N2Zz4=');
            }

            &.file-powerpoint {
              background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMjF2LTZoLTJ2LTdoLTJ2LTZoLTJ2LTdoMnYtN2gydi03aDJ2N2gydjZoMnY3em0wLTE5aC0yVjFoMnY1em00IDBoLTJWMWgydjV6bTQgMGgtMlYxaDJ2NXptNC0xN2gtMlYxaDJ2NnoiLz48L3N2Zz4=');
            }

            &.file-word {
              background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMjF2LTZoLTJ2LTdoLTJ2LTZoLTJ2LTdoMnYtN2gydi03aDJ2N2gydjZoMnY3em0wLTE5aC0yVjFoMnY1em00IDBoLTJWMWgydjV6bTQgMGgtMlYxaDJ2NXptNC0xN2gtMlYxaDJ2NnoiLz48L3N2Zz4=');
            }

            &.file-code {
              background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMjFoLTJWOGgxMnYxM3ptMC0xMWgtMlY0aDJ2N3ptLTYgMGMtMS4xIDAtMi4wLjktMiAycy45IDIgMiAyIDItLjkgMi0yLS45LTItMi0yeiIvPjwvc3ZnPg==');
            }

            &.file-generic {
              background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMjFoLTJWOGgxMnYxM3ptMC0xMWgtMlY0aDJ2N3ptLTYgMGMtMS4xIDAtMi4wLjktMiAycy45IDIgMiAyIDItLjkgMi0yLS45LTItMi0yeiIvPjwvc3ZnPg==');
            }
          }

          .file-info {
            flex: 1;

            .file-name {
              font-size: 14px;
              margin-bottom: 4px;
            }

            .file-size {
              font-size: 12px;
              color: #999;
            }
          }

          .file-progress {
            width: 80px;
            margin-left: 12px;

            .progress-bar {
              width: 100%;
              height: 6px;
              background-color: #e0e0e0;
              border-radius: 3px;
              overflow: hidden;

              .progress-fill {
                height: 100%;
                background-color: #1890ff;
                border-radius: 3px;
                transition: width 0.3s ease;
              }
            }
          }
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