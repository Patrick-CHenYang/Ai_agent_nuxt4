<template>
  <div class="trae-agent">
    <!-- 左侧目录区域 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>AI Agent</h2>
        <button class="new-chat-button" @click="createNewChat">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          New Chat
        </button>
      </div>
      <div class="chat-list">
        <div 
          v-for="chat in chats" 
          :key="chat.id"
          class="chat-item"
          :class="{ active: currentChatId === chat.id }"
          @click="switchChat(chat.id)"
        >
          <div class="chat-preview">
            <div class="chat-title">{{ chat.title }}</div>
            <div class="chat-last-message">{{ chat.lastMessage }}</div>
            <div class="chat-time">{{ formatTime(chat.lastTimestamp) }}</div>
          </div>
          <button class="delete-chat-button" @click.stop="deleteChat(chat.id)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 右侧聊天区域 -->
    <div class="main-content">
      <div class="agent-header">
        <h1>{{ currentChat.title }}</h1>
        <div class="header-actions">
          <button class="clear-button" @click="clearMessages">Clear</button>
        </div>
      </div>
      
      <div class="chat-container">
        <div class="chat-messages" ref="messagesContainer">
          <ChatMessage 
            v-for="message in currentChat.messages" 
            :key="message.id" 
            :message="message"
          />
          <div v-if="isStreaming" class="chat-message assistant streaming">
            <div class="message-avatar">
              <div class="avatar assistant">A</div>
            </div>
            <div class="message-content">
              <div class="message-header">
                <span class="message-role">Assistant</span>
                <span class="message-time">{{ formatTime(Date.now()) }}</span>
              </div>
              <div class="message-body">
                <div class="message-text" v-html="renderMarkdown(currentMessage)"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="chat-input-area">
          <div class="input-container">
            <div class="input-wrapper">
              <textarea 
                v-model="inputMessage"
                placeholder="Type your message..."
                class="message-input"
                @keydown.enter.exact.prevent="sendMessage"
                @keydown.enter.shift="$event.target.value += '\n'"
                @paste="handlePaste"
              ></textarea>
              <div class="input-attachments">
                <FileUpload 
                  ref="fileUpload"
                  @filesChange="handleFilesChange"
                  @fileUpload="handleFileUpload"
                  @fileError="handleFileError"
                />
              </div>
            </div>
            <div class="input-actions">
              <button 
                class="send-button" 
                @click="sendMessage"
                :disabled="!inputMessage.trim() && uploadedFiles.length === 0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button 
                v-if="isStreaming" 
                class="stop-button" 
                @click="stopStreaming"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="4" width="4" height="16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <rect x="14" y="4" width="4" height="16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          <div v-if="uploadedFiles.length > 0" class="uploaded-files">
            <div 
              v-for="file in uploadedFiles" 
              :key="file.id"
              class="uploaded-file-item"
            >
              <div class="file-info">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
              </div>
              <button 
                class="remove-file-button" 
                @click="removeFile(file.id)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="#ff4d4f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import { useRuntimeConfig } from 'nuxt/app';
import ChatMessage from '../../components/ChatMessage.vue';
import FileUpload from '../../components/FileUpload.vue';
import { chatService } from '../../services/chatService';
import { renderMarkdown, formatFileSize } from '../../utils/markdownUtils';
import { typingEffect } from '../../utils/typingEffect';
import type { ChatMessage as ChatMessageType, UploadedFile } from '../../types';

// 获取环境变量并设置到 chatService
const config = useRuntimeConfig();
const apiKey = config.public?.OPENAI_API_KEY || '';
const baseUrl = config.public?.OPENAI_BASE_URL || 'https://api.deepseek.com';
const model = config.public?.DEEPSEEK_MODEL || 'deepseek-chat';

// 设置环境变量
chatService.setConfig(apiKey, baseUrl, model);

// 响应式数据
const chats = ref<Array<{
  id: string;
  title: string;
  messages: ChatMessageType[];
  lastMessage: string;
  lastTimestamp: number;
}>>([]);
const currentChatId = ref<string>('');
const inputMessage = ref('');
const uploadedFiles = ref<UploadedFile[]>([]);
const isLoading = ref(false);
const isStreaming = ref(false);
const currentMessage = ref('');
const messagesContainer = ref<HTMLElement | null>(null);
const fileUpload = ref<InstanceType<typeof FileUpload> | null>(null);

// 计算属性
const currentChat = computed(() => {
  return chats.value.find(chat => chat.id === currentChatId.value) || {
    id: '',
    title: 'New Chat',
    messages: [],
    lastMessage: '',
    lastTimestamp: Date.now()
  };
});

// 状态管理
let cancelStreaming: (() => void) | null = null;
let typingCancel: (() => void) | null = null;

// 方法
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function createNewChat() {
  const newChatId = chatService.generateId();
  const newChat = {
    id: newChatId,
    title: 'New Chat',
    messages: [],
    lastMessage: '',
    lastTimestamp: Date.now()
  };
  chats.value.push(newChat);
  currentChatId.value = newChatId;
  scrollToBottom();
}

function switchChat(chatId: string) {
  // 切换聊天时重置当前消息和流式状态
  currentMessage.value = '';
  isStreaming.value = false;
  isLoading.value = false;
  // 不要取消正在进行的流式请求，让它继续完成
  // 这样即使切换窗口，之前的聊天回答仍然会完成
  currentChatId.value = chatId;
  scrollToBottom();
}

function deleteChat(chatId: string) {
  const index = chats.value.findIndex(chat => chat.id === chatId);
  if (index !== -1) {
    chats.value.splice(index, 1);
    if (currentChatId.value === chatId) {
      currentChatId.value = chats.value.length > 0 ? chats.value[0].id : '';
    }
  }
}

function updateChatTitle(chatId: string, title: string) {
  const chat = chats.value.find(c => c.id === chatId);
  if (chat) {
    chat.title = title;
  }
}

function updateChatLastMessage(chatId: string, message: string) {
  const chat = chats.value.find(c => c.id === chatId);
  if (chat) {
    chat.lastMessage = message.length > 50 ? message.substring(0, 50) + '...' : message;
    chat.lastTimestamp = Date.now();
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

function handleFilesChange(files: UploadedFile[]) {
  uploadedFiles.value = files;
}

function handleFileUpload(file: UploadedFile) {
  console.log('File uploaded:', file);
}

function handleFileError(error: string) {
  console.error('File upload error:', error);
  // 可以在这里添加错误提示
}

function removeFile(fileId: string) {
  uploadedFiles.value = uploadedFiles.value.filter(file => file.id !== fileId);
  // 不再操作 fileUpload.value.files，因为我们已经修改了 FileUpload 组件
}

async function handlePaste(event: ClipboardEvent) {
  const clipboardData = event.clipboardData;
  if (!clipboardData) return;

  const items = clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.indexOf('image') !== -1) {
      event.preventDefault();
      const file = item.getAsFile();
      if (file) {
        // 处理图片文件上传
        await uploadFile(file);
      }
    }
  }
}

async function uploadFile(file: File) {
  try {
    // 模拟文件上传过程
    const fileId = chatService.generateId();
    // 确保文件有名称
    const fileName = file.name || `image_${Date.now()}.png`;
    const tempFile = {
      id: fileId,
      name: fileName,
      type: file.type,
      size: file.size,
      url: '',
      progress: 0,
      status: 'uploading' as const
    };

    // 添加到文件列表
    uploadedFiles.value.push(tempFile);
    // 不再操作 fileUpload.value.files，因为我们已经修改了 FileUpload 组件

    // 读取文件为 DataURL
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const index = uploadedFiles.value.findIndex(f => f.id === fileId);
      if (index !== -1) {
        uploadedFiles.value[index] = {
          ...uploadedFiles.value[index],
          url,
          progress: 100,
          status: 'completed' as const
        };
      }
    };
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('Error uploading file:', error);
  }
}

async function sendMessage() {
  const content = inputMessage.value.trim();
  if (!content && uploadedFiles.value.length === 0) return;

  // 确保有当前聊天
  if (!currentChatId.value) {
    createNewChat();
  }

  // 记录当前聊天ID，确保消息添加到正确的聊天会话
  const targetChatId = currentChatId.value;

  // 创建用户消息
  const userMessage: ChatMessageType = {
    id: chatService.generateId(),
    role: 'user',
    content,
    files: uploadedFiles.value.length > 0 ? [...uploadedFiles.value] : undefined,
    timestamp: Date.now(),
    status: 'sending'
  };

  // 添加到当前聊天的消息列表
  const chat = chats.value.find(c => c.id === targetChatId);
  if (chat) {
    chat.messages.push(userMessage);
    // 更新聊天的最后消息
    updateChatLastMessage(chat.id, content);
    // 如果是第一次消息，更新聊天标题
    if (chat.messages.length === 1) {
      updateChatTitle(chat.id, content.length > 20 ? content.substring(0, 20) + '...' : content);
    }
  }

  inputMessage.value = '';
  uploadedFiles.value = [];
  // 不再操作 fileUpload.value.files，因为我们已经修改了 FileUpload 组件
  scrollToBottom();

  // 更新消息状态为已发送
  userMessage.status = 'sent';

  try {
    isLoading.value = true;
    isStreaming.value = true;
    currentMessage.value = '';

    // 准备发送给 API 的消息
    const apiMessages = currentChat.value.messages.map(msg => ({
      role: msg.role,
      content: msg.content + (msg.files ? `\n\nFiles: ${msg.files.map(f => f.name).join(', ')}` : '')
    }));

    // 存储流式消息内容的变量，确保即使切换窗口也能完整保存
    let streamingContent = '';

    // 发送流式请求
    cancelStreaming = await chatService.sendStreamingChatRequest(
      apiMessages,
      (chunk, error) => {
        if (error) {
          console.error('Streaming error:', error);
          // 只有当当前聊天是目标聊天时才更新状态
          if (currentChatId.value === targetChatId) {
            isStreaming.value = false;
            isLoading.value = false;
          }
          return;
        }

        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          // 保存内容到局部变量
          streamingContent += content;
          // 只有当当前聊天是目标聊天时才更新显示
          if (currentChatId.value === targetChatId) {
            currentMessage.value = streamingContent;
            scrollToBottom();
          }
        }

        if (chunk.choices[0]?.finish_reason) {
          // 流式结束，创建完整的助手消息
          const assistantMessage: ChatMessageType = {
            id: chatService.generateId(),
            role: 'assistant',
            content: streamingContent,
            timestamp: Date.now(),
            status: 'sent'
          };

          // 添加到目标聊天的消息列表，而不是当前显示的聊天
          const targetChat = chats.value.find(c => c.id === targetChatId);
          if (targetChat) {
            targetChat.messages.push(assistantMessage);
            // 更新聊天的最后消息
            updateChatLastMessage(targetChat.id, streamingContent);
          }

          // 只有当当前聊天是目标聊天时才更新状态
          if (currentChatId.value === targetChatId) {
            isStreaming.value = false;
            isLoading.value = false;
            currentMessage.value = '';
            scrollToBottom();
          }
        }
      }
    );
  } catch (error) {
    console.error('Error sending message:', error);
    isLoading.value = false;
    isStreaming.value = false;
    // 可以在这里添加错误提示
  }
}

function stopStreaming() {
  if (cancelStreaming) {
    cancelStreaming();
    cancelStreaming = null;
  }
  if (typingCancel) {
    typingCancel();
    typingCancel = null;
  }
  isStreaming.value = false;
  isLoading.value = false;
}

function clearMessages() {
  const chat = chats.value.find(c => c.id === currentChatId.value);
  if (chat) {
    chat.messages = [];
    chat.lastMessage = '';
  }
  inputMessage.value = '';
  uploadedFiles.value = [];
  // 不再操作 fileUpload.value.files，因为我们已经修改了 FileUpload 组件
  currentMessage.value = '';
  stopStreaming();
}

// 生命周期
onMounted(() => {
  // 创建默认聊天
  createNewChat();
  scrollToBottom();
});

// 监听消息变化，自动滚动到底部
watch(() => currentChat.value.messages, () => {
  scrollToBottom();
}, { deep: true });
</script>

<style lang="scss" scoped>
.trae-agent {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

  // 左侧边栏
  .sidebar {
    width: 280px;
    background: white;
    border-right: 1px solid #e0e0e0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);

    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid #e0e0e0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

      h2 {
        margin: 0 0 16px 0;
        font-size: 18px;
        font-weight: bold;
        color: white;
        text-align: center;
      }

      .new-chat-button {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 12px;
        padding: 12px 16px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        &:active {
          transform: translateY(0);
        }
      }
    }

    .chat-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px;

      .chat-item {
        display: flex;
        align-items: center;
        padding: 14px;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-bottom: 6px;
        background: white;
        border: 1px solid #f0f0f0;

        &:hover {
          background: #f8f9fa;
          transform: translateX(4px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        &.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .chat-preview {
          flex: 1;
          min-width: 0;

          .chat-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 6px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .chat-last-message {
            font-size: 12px;
            opacity: 0.8;
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .chat-time {
            font-size: 11px;
            opacity: 0.6;
          }

          .chat-item:not(.active) & {
            .chat-title {
              color: #333;
            }
            .chat-last-message {
              color: #666;
            }
            .chat-time {
              color: #999;
            }
          }
        }

        .delete-chat-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          transition: all 0.3s ease;
          // opacity: 0;

          .chat-item:hover & {
            opacity: 1;
          }

          .chat-item:not(.active) & {
            color: #999;

            &:hover {
              background-color: rgba(255, 77, 79, 0.1);
              color: #ff4d4f;
            }
          }

          .chat-item.active & {
            color: rgba(255, 255, 255, 0.7);

            &:hover {
              background-color: rgba(255, 255, 255, 0.1);
              color: white;
            }
          }
        }
      }
    }
  }

  // 右侧主内容区域
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: white;
    margin: 12px;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

    .agent-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px 16px 0 0;

      h1 {
        margin: 0;
        font-size: 20px;
        font-weight: bold;
        color: white;
      }

      .header-actions {
        .clear-button {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-1px);
          }
        }
      }
    }

    .chat-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .chat-messages {
        flex: 1;
        padding: 24px;
        overflow-y: auto;
        scroll-behavior: smooth;
        background: #fafafa;

        .chat-message {
          &.streaming {
            opacity: 0.8;
          }
        }
      }

      .chat-input-area {
        padding: 20px 24px;
        background: white;
        border-top: 1px solid #e0e0e0;

        .input-container {
          display: flex;
          margin-top: 16px;

          .input-wrapper {
            flex: 1;
            position: relative;

            .message-input {
              width: 100%;
              padding: 16px 20px 16px 56px;
              border: 2px solid #e0e0e0;
              border-radius: 16px 0 0 16px;
              resize: none;
              font-size: 14px;
              line-height: 1.5;
              min-height: 100px;
              max-height: 200px;
              font-family: inherit;
              transition: all 0.3s ease;

              &:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
              }
            }

            .input-attachments {
              position: absolute;
              top: 12px;
              left: 12px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
          }

          .input-actions {
            display: flex;
            flex-direction: column;

            .send-button {
              min-height:50px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border: none;
              border-radius: 0 16px 0 0;
              padding: 0 28px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.3s ease;

              &:hover:not(:disabled) {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
              }

              &:active:not(:disabled) {
                transform: translateY(0);
              }

              &:disabled {
                background: #d9d9d9;
                cursor: not-allowed;
              }
            }

            .stop-button {
              min-height:50px;
              background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
              color: white;
              border: none;
              border-radius: 0 0 16px 0;
              padding: 0 28px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.3s ease;

              &:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(255, 77, 79, 0.4);
              }

              &:active {
                transform: translateY(0);
              }
            }
          }
        }

        .uploaded-files {
          margin-top: 12px;

          .uploaded-file-item {
            display: flex;
            align-items: center;
            padding: 10px 16px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 10px;
            margin-bottom: 8px;
            transition: all 0.3s ease;

            &:hover {
              transform: translateY(-1px);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .file-info {
              flex: 1;

              .file-name {
                font-size: 13px;
                font-weight: 500;
                margin-right: 8px;
                color: #333;
              }

              .file-size {
                font-size: 11px;
                color: #666;
              }
            }

            .remove-file-button {
              background: none;
              border: none;
              cursor: pointer;
              padding: 6px;
              border-radius: 6px;
              transition: all 0.3s ease;

              &:hover {
                background-color: rgba(255, 77, 79, 0.1);
                transform: scale(1.1);
              }
            }
          }
        }
      }
    }
  }
}

/* 自定义滚动条样式 */
.chat-messages::-webkit-scrollbar,
.chat-list::-webkit-scrollbar {
  width: 8px;
}

.chat-messages::-webkit-scrollbar-track,
.chat-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb,
.chat-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb:hover,
.chat-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>