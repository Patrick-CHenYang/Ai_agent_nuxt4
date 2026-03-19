<template>
  <div class="langgraph-demo">
    <!-- 左侧边栏 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>LangGraph Demo</h2>
      </div>
      
      <!-- LangGraph 概念 -->
      <div class="sidebar-section">
        <h3>LangGraph 概念</h3>
        <ul class="concept-list">
          <li @click="selectConcept('nodes')">
            <span class="concept-icon node-icon">○</span>
            <span>节点 (Nodes)</span>
          </li>
          <li @click="selectConcept('edges')">
            <span class="concept-icon edge-icon">→</span>
            <span>边 (Edges)</span>
          </li>
          <li @click="selectConcept('graphs')">
            <span class="concept-icon graph-icon">☰</span>
            <span>图 (Graphs)</span>
          </li>
          <li @click="selectConcept('streaming')">
            <span class="concept-icon stream-icon">~</span>
            <span>流式执行</span>
          </li>
          <li @click="selectConcept('rag')">
            <span class="concept-icon rag-icon">📚</span>
            <span>RAG</span>
          </li>
          <li @click="selectConcept('skills')">
            <span class="concept-icon skills-icon">🛠️</span>
            <span>Skills</span>
          </li>
        </ul>
      </div>
      
      <!-- 预设示例 -->
      <div class="sidebar-section">
        <h3>预设示例</h3>
        <ul class="example-list">
          <li @click="loadExample('qa')">
            <span class="example-icon">💬</span>
            <span>问答系统</span>
          </li>
          <li @click="loadExample('content')">
            <span class="example-icon">📝</span>
            <span>内容生成器</span>
          </li>
          <li @click="loadExample('summarization')">
            <span class="example-icon">📊</span>
            <span>文本摘要</span>
          </li>
          <li @click="loadExample('translation')">
            <span class="example-icon">🌐</span>
            <span>翻译系统</span>
          </li>
          <li @click="loadExample('rag')">
            <span class="example-icon">📚</span>
            <span>RAG 问答</span>
          </li>
          <li @click="loadExample('skills')">
            <span class="example-icon">🛠️</span>
            <span>Skills 示例</span>
          </li>
        </ul>
      </div>
      
      <!-- 可用图 -->
      <div class="graph-list-section">
        <h3>可用图</h3>
        <ul class="graph-list">
          <li 
            v-for="graph in availableGraphs" 
            :key="graph.id"
            :class="{ active: selectedGraph?.id === graph.id }"
          >
            <div class="graph-item-content" @click="selectGraph(graph)">
              <span class="graph-name">{{ graph.name }}</span>
              <span class="graph-node-count">{{ graph.nodes.length }} 节点</span>
            </div>
            <button 
              class="graph-delete-btn" 
              @click.stop="deleteGraph(graph.id)"
              title="删除图"
            >
              ×
            </button>
          </li>
        </ul>
      </div>
    </div>
    
    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 顶部导航 -->
      <div class="top-nav">
        <div class="nav-left">
          <h1 v-if="selectedGraph">LangGraph: {{ selectedGraph.name }}</h1>
          <h1 v-else>LangGraph Demo</h1>
        </div>
        <div class="nav-right">
          <button 
            class="btn btn-secondary" 
            @click="showAddGraphModal = true"
            :disabled="isLoading"
          >
            新增图
          </button>
          <button 
            class="btn btn-primary" 
            @click="refreshGraphs"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="loading-spinner"></span>
            刷新图列表
          </button>
        </div>
      </div>
      
      <!-- 图信息 -->
      <div v-if="selectedGraph" class="graph-info-container">
        <div class="graph-info-header" @click="toggleGraphInfo">
          <h3>{{ selectedGraph.name }} - 图结构</h3>
          <button class="toggle-btn" :class="{ active: showGraphInfo }">
            {{ showGraphInfo ? '▼' : '▶' }}
          </button>
        </div>
        <div v-if="showGraphInfo" class="graph-info-content">
          <div class="graph-header">
            <p>{{ selectedGraph.description }}</p>
          </div>
          <div class="graph-structure">
            <div class="nodes-section">
              <h4>节点 ({{ selectedGraph.nodes.length }})</h4>
              <div class="nodes-list">
                <div 
                  v-for="node in selectedGraph.nodes" 
                  :key="node.id"
                  class="node-item"
                  :class="node.type"
                >
                  <span class="node-type">{{ node.type.toUpperCase() }}</span>
                  <span class="node-name">{{ node.name }}</span>
                  <span class="node-description">{{ node.description }}</span>
                </div>
              </div>
            </div>
            <div class="edges-section">
              <h4>边 ({{ selectedGraph.edges.length }})</h4>
              <div class="edges-list">
                <div 
                  v-for="edge in selectedGraph.edges" 
                  :key="edge.id"
                  class="edge-item"
                >
                  <span class="edge-source">{{ getNodeName(edge.source) }}</span>
                  <span class="edge-arrow">→</span>
                  <span class="edge-target">{{ getNodeName(edge.target) }}</span>
                  <span v-if="edge.condition" class="edge-condition">({{ edge.condition }})</span>
                </div>
              </div>
            </div>
            <div class="entrypoint-section">
              <h4>入口点</h4>
              <div class="entrypoint-item">
                <span>{{ getNodeName(selectedGraph.entrypoint) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 聊天界面 -->
      <div class="chat-container">
        <div class="chat-messages" ref="chatMessagesRef">
          <ChatMessage 
            v-for="message in messages" 
            :key="message.id" 
            :message="message"
          />
          <div v-if="isStreaming" class="chat-message assistant sending">
            <div class="message-avatar">
              <div class="avatar assistant">A</div>
            </div>
            <div class="message-content">
              <div class="message-header">
                <span class="message-role">Assistant</span>
                <span class="message-time">{{ formatTime(Date.now()) }}</span>
              </div>
              <div class="message-body">
                <div class="message-text" v-html="renderMarkdown(streamingContent)"></div>
                <div class="message-status">
                  <div class="loading-indicator">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                  </div>
                  <span>Streaming...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 输入区域 -->
        <div class="chat-input-container">
          <div class="input-wrapper">
            <textarea 
              v-model="userInput" 
              class="chat-input" 
              placeholder="输入消息..."
              rows="1"
              @keydown.enter.exact.prevent="sendMessage"
              @keydown.enter.shift="$event.target.value += '\n'"
              :disabled="isStreaming"
            ></textarea>
            <div class="input-actions">
              <button 
                class="btn btn-secondary" 
                @click="clearInput"
                :disabled="!userInput.trim()"
              >
                清除
              </button>
              <button 
                class="btn btn-primary" 
                @click="sendMessage"
                :disabled="!userInput.trim() || isStreaming"
              >
                发送
              </button>
            </div>
          </div>
          <div v-if="isStreaming" class="streaming-controls">
            <button 
              class="btn btn-danger" 
              @click="stopStreaming"
            >
              停止流式
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 新增图模态框 -->
  <div v-if="showAddGraphModal" class="modal-overlay" @click="showAddGraphModal = false">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>新增图</h3>
        <button class="modal-close" @click="showAddGraphModal = false">×</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="graph-name">图名称</label>
          <input 
            type="text" 
            id="graph-name" 
            v-model="newGraphName" 
            placeholder="请输入图名称"
            class="form-input"
          >
        </div>
        <div class="form-group">
          <label for="graph-description">图描述</label>
          <textarea 
            id="graph-description" 
            v-model="newGraphDescription" 
            placeholder="请输入图描述"
            class="form-textarea"
            rows="3"
          ></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="showAddGraphModal = false">取消</button>
        <button class="btn btn-primary" @click="addGraph">确认</button>
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { ref, onMounted, computed } from 'vue';
import { useRuntimeConfig } from 'nuxt/app';
import ChatMessage from './components/ChatMessage.vue';
import { renderMarkdown } from './utils/markdownUtils';
import { langGraphService, generateId } from './services/langGraphService';
import type { LangGraph, ChatMessage as ChatMessageType } from '@/types';

// 获取运行时配置
const config = useRuntimeConfig();
const apiKey = config.public.langGraphApiKey;
const baseUrl = config.public.langGraphBaseUrl || 'https://api.langgraph.com';

// 状态管理
const availableGraphs = ref<LangGraph[]>([]);
const selectedGraph = ref<LangGraph | null>(null);
const messages = ref<ChatMessageType[]>([]);
const userInput = ref('');
const isLoading = ref(false);
const isStreaming = ref(false);
const streamingContent = ref('');
const selectedConcept = ref('nodes');
const conceptExplanation = ref('');
const chatMessagesRef = ref<HTMLElement | null>(null);
let streamCancel: (() => void) | null = null;

// 消息历史存储，为每个图保存对应的消息
const messagesHistory = ref<Record<string, ChatMessageType[]>>({});

// 从本地存储加载消息历史
function loadMessagesFromStorage() {
  try {
    const storedMessages = localStorage.getItem('langgraph_messages');
    if (storedMessages) {
      messagesHistory.value = JSON.parse(storedMessages);
    }
  } catch (error) {
    console.error('Failed to load messages from storage:', error);
    messagesHistory.value = {};
  }
}

// 保存消息历史到本地存储
function saveMessagesToStorage() {
  try {
    localStorage.setItem('langgraph_messages', JSON.stringify(messagesHistory.value));
  } catch (error) {
    console.error('Failed to save messages to storage:', error);
  }
}

// 初始化
onMounted(async () => {
  // 设置配置
  langGraphService.setConfig(apiKey, baseUrl);
  
  // 加载消息历史
  loadMessagesFromStorage();
  
  // 加载图列表
  await refreshGraphs();
  
  // 如果没有图，创建默认图
  if (availableGraphs.value.length === 0) {
    await createDefaultGraphs();
    await refreshGraphs();
  }
  
  // 加载默认示例
  loadExample('qa');
});

// 创建默认图
async function createDefaultGraphs() {
  try {
    // 检查是否已存在问答系统图
    const hasQAGraph = availableGraphs.value.some(g => g.name === '问答系统');
    if (!hasQAGraph) {
      // 创建问答系统图
      await langGraphService.createGraph({
        name: '问答系统',
        description: '基于 LangGraph 的智能问答系统',
        nodes: [
          {
            id: '1-1',
            type: 'llm',
            name: 'Question Analyzer',
            description: '分析用户问题',
            configuration: { model: 'deepseek-chat' }
          },
          {
            id: '1-2',
            type: 'tool',
            name: 'Knowledge Base',
            description: '查询知识库',
            configuration: { endpoint: 'https://api.knowledge.com' }
          },
          {
            id: '1-3',
            type: 'llm',
            name: 'Answer Generator',
            description: '生成回答',
            configuration: { model: 'deepseek-chat' }
          }
        ],
        edges: [
          {
            id: '1-1-2',
            source: '1-1',
            target: '1-2'
          },
          {
            id: '1-2-3',
            source: '1-2',
            target: '1-3'
          }
        ],
        entrypoint: '1-1'
      });
    }
    
    // 检查是否已存在内容生成器图
    const hasContentGraph = availableGraphs.value.some(g => g.name === '内容生成器');
    if (!hasContentGraph) {
      // 创建内容生成器图
      await langGraphService.createGraph({
        name: '内容生成器',
        description: '基于 LangGraph 的内容生成系统',
        nodes: [
          {
            id: '2-1',
            type: 'llm',
            name: 'Content Planner',
            description: '规划内容结构',
            configuration: { model: 'deepseek-chat' }
          },
          {
            id: '2-2',
            type: 'llm',
            name: 'Content Writer',
            description: '生成内容',
            configuration: { model: 'deepseek-chat' }
          },
          {
            id: '2-3',
            type: 'conditional',
            name: 'Content Reviewer',
            description: '审查内容质量',
            configuration: { threshold: 0.8 }
          },
          {
            id: '2-4',
            type: 'llm',
            name: 'Content Reviser',
            description: '修改内容',
            configuration: { model: 'deepseek-chat' }
          }
        ],
        edges: [
          {
            id: '2-1-2',
            source: '2-1',
            target: '2-2'
          },
          {
            id: '2-2-3',
            source: '2-2',
            target: '2-3'
          },
          {
            id: '2-3-2',
            source: '2-3',
            target: '2-2',
            condition: 'needs_revision'
          },
          {
            id: '2-3-4',
            source: '2-3',
            target: '2-4',
            condition: 'needs_revision'
          }
        ],
        entrypoint: '2-1'
      });
    }
  } catch (error) {
    console.error('Failed to create default graphs:', error);
  }
}

// 刷新图列表
async function refreshGraphs() {
  isLoading.value = true;
  try {
    // 调用 langGraphService 获取真正的图列表
    availableGraphs.value = await langGraphService.getGraphs();
    // 显示刷新成功消息
    messages.value.push({
      id: generateId(),
      role: 'assistant',
      content: '图列表已刷新',
      timestamp: Date.now(),
      status: 'sent'
    });
    // 滚动到聊天底部
    scrollToBottom();
  } catch (error) {
    console.error('Failed to load graphs:', error);
    // 显示错误消息
    messages.value.push({
      id: generateId(),
      role: 'assistant',
      content: `刷新图列表失败: ${error instanceof Error ? error.message : '未知错误'}`,
      timestamp: Date.now(),
      status: 'error'
    });
    // 滚动到聊天底部
    scrollToBottom();
  } finally {
    isLoading.value = false;
  }
}

// 选择图
function selectGraph(graph: LangGraph) {
  // 保存当前图的消息
  if (selectedGraph.value) {
    messagesHistory.value[selectedGraph.value.id] = [...messages.value];
    saveMessagesToStorage();
  }
  
  // 切换到新图
  selectedGraph.value = graph;
  
  // 加载新图的消息历史
  if (messagesHistory.value[graph.id]) {
    messages.value = [...messagesHistory.value[graph.id]];
  } else {
    // 清空消息
    messages.value = [];
    // 添加系统消息
    messages.value.push({
      id: generateId(),
      role: 'assistant',
      content: `已选择图: **${graph.name}**\n\n${graph.description}`,
      timestamp: Date.now(),
      status: 'sent'
    });
  }
  
  // 滚动到聊天底部
  scrollToBottom();
}

// 选择概念
function selectConcept(concept: string) {
  selectedConcept.value = concept;
  
  // 显示概念解释
  switch (concept) {
    case 'nodes':
      conceptExplanation.value = `**节点 (Nodes)** 是 LangGraph 中的基本执行单元，负责执行特定的任务。\n\n节点类型包括：\n- **LLM 节点**：调用语言模型处理输入\n- **工具节点**：执行外部工具或 API 调用\n- **条件节点**：根据条件决定执行路径\n- **自定义节点**：执行自定义逻辑`;
      break;
    case 'edges':
      conceptExplanation.value = `**边 (Edges)** 定义了节点之间的连接关系，控制数据的流动方向。\n\n边可以：\n- 连接两个节点\n- 包含条件表达式，根据条件决定是否执行\n- 定义执行顺序和数据流`;
      break;
    case 'graphs':
      conceptExplanation.value = `**图 (Graphs)** 是由节点和边组成的完整工作流。\n\n图的特点：\n- 有一个入口点 (entrypoint)\n- 定义了完整的执行流程\n- 可以包含复杂的分支和循环\n- 支持状态管理和数据传递`;
      break;
    case 'streaming':
      conceptExplanation.value = `**流式执行** 允许 LangGraph 在执行过程中实时返回结果。\n\n流式执行的优势：\n- 实时反馈，无需等待整个流程完成\n- 更好的用户体验\n- 支持长时间运行的任务\n- 可以在执行过程中中断或调整`;
      break;
    case 'rag':
      conceptExplanation.value = `**RAG (Retrieval Augmented Generation)** 是一种增强语言模型能力的技术。\n\nRAG 的工作原理：\n- **检索**：从知识库中检索与用户问题相关的文档\n- **增强**：将检索到的文档作为上下文添加到提示中\n- **生成**：让语言模型基于增强的提示生成回答\n\nRAG 的优势：\n- 提供最新信息，不受模型训练数据的限制\n- 减少模型幻觉，提高回答的准确性\n- 可以引用来源，增强回答的可信度`;
      break;
    case 'skills':
      conceptExplanation.value = `**Skills** 是 LangGraph 中可以调用的外部工具和服务。\n\nSkills 的特点：\n- **模块化**：每个技能都是独立的功能模块\n- **可扩展**：可以轻松添加新的技能\n- **灵活调用**：可以在图的不同节点中调用不同的技能\n\n常见的 Skills 类型：\n- **Web 搜索**：获取网络信息\n- **计算器**：执行数学计算\n- **数据库查询**：查询和操作数据库\n- **文件操作**：读写文件`;
      break;
  }
  
  // 添加系统消息
  messages.value.push({
    id: generateId(),
    role: 'assistant',
    content: conceptExplanation.value,
    timestamp: Date.now(),
    status: 'sent'
  });
  // 滚动到聊天底部
  scrollToBottom();
}

// 加载示例
function loadExample(example: string) {
  let graphName = '';
  let prompt = '';
  
  switch (example) {
    case 'qa':
      graphName = '问答系统';
      prompt = '什么是 LangGraph？';
      break;
    case 'content':
      graphName = '内容生成器';
      prompt = '生成一篇关于人工智能发展趋势的文章';
      break;
    case 'summarization':
      graphName = '问答系统';
      prompt = '总结以下内容：LangGraph 是一个用于构建复杂 AI 应用的框架，它允许开发者创建由多个节点组成的图，每个节点可以执行不同的任务，如调用 LLM、执行工具等。通过定义节点之间的边，开发者可以控制数据的流动和执行的顺序。LangGraph 支持流式执行，允许实时返回结果。';
      break;
    case 'translation':
      graphName = '问答系统';
      prompt = '将 "Hello, how are you?" 翻译成中文';
      break;
    case 'rag':
      graphName = '问答系统';
      prompt = 'LangGraph 有哪些特点？';
      break;
    case 'skills':
      graphName = '问答系统';
      prompt = 'LangGraph 如何与外部工具集成？';
      break;
  }
  
  // 选择对应的图
  const graph = availableGraphs.value.find(g => g.name === graphName);
  if (graph) {
    selectGraph(graph);
  }
  
  // 设置输入
  userInput.value = prompt;
}

// 获取节点名称
function getNodeName(nodeId: string): string {
  if (!selectedGraph.value) return nodeId;
  const node = selectedGraph.value.nodes.find(n => n.id === nodeId);
  return node ? node.name : nodeId;
}

// 发送消息
async function sendMessage() {
  if (!userInput.value.trim() || !selectedGraph.value) return;
  
  const message = userInput.value.trim();
  userInput.value = '';
  
  // 添加用户消息
  messages.value.push({
    id: generateId(),
    role: 'user',
    content: message,
    timestamp: Date.now(),
    status: 'sent'
  });
  // 滚动到聊天底部
  scrollToBottom();
  
  // 开始流式执行
  isStreaming.value = true;
  streamingContent.value = '';
  
  try {
    // 调用 DeepSeek API 流式执行
    streamCancel = await langGraphService.executeGraphStream(
      {
        graphId: selectedGraph.value.id,
        input: { prompt: message }
      },
      (chunk, error) => {
        if (error) {
          console.error('Stream error:', error);
          messages.value.push({
            id: generateId(),
            role: 'assistant',
            content: `执行失败: ${error.message}`,
            timestamp: Date.now(),
            status: 'error'
          });
          isStreaming.value = false;
          streamingContent.value = '';
          // 滚动到聊天底部
          scrollToBottom();
          return;
        }
        
        if (chunk.type === 'token' && chunk.data.content) {
          console.log('chunk.data.content',chunk.data.content)
          streamingContent.value += chunk.data.content;
        } else if (chunk.type === 'finish') {
          // 完成流式响应
          messages.value.push({
            id: generateId(),
            role: 'assistant',
            content: streamingContent.value,
            timestamp: Date.now(),
            status: 'sent'
          });
          isStreaming.value = false;
          streamingContent.value = '';
          // 保存消息历史
          if (selectedGraph.value) {
            messagesHistory.value[selectedGraph.value.id] = [...messages.value];
            saveMessagesToStorage();
          }
          // 不再自动滚动到聊天底部
        }
      }
    );
  } catch (error) {
    console.error('Failed to execute graph:', error);
    messages.value.push({
      id: generateId(),
      role: 'assistant',
      content: `执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
      timestamp: Date.now(),
      status: 'error'
    });
    isStreaming.value = false;
    streamingContent.value = '';
    // 保存消息历史
    if (selectedGraph.value) {
      messagesHistory.value[selectedGraph.value.id] = [...messages.value];
      saveMessagesToStorage();
    }
    // 滚动到聊天底部
    scrollToBottom();
  }
}

// 停止流式
function stopStreaming() {
  if (streamCancel) {
    streamCancel();
    streamCancel = null;
  }
  isStreaming.value = false;
  streamingContent.value = '';
  messages.value.push({
    id: generateId(),
    role: 'assistant',
    content: '流式执行已停止',
    timestamp: Date.now(),
    status: 'sent'
  });
  // 保存消息历史
  if (selectedGraph.value) {
    messagesHistory.value[selectedGraph.value.id] = [...messages.value];
    saveMessagesToStorage();
  }
  // 滚动到聊天底部
  scrollToBottom();
}

// 使用 RAG 发送消息
async function sendMessageWithRAG() {
  if (!userInput.value.trim() || !selectedGraph.value) return;
  
  const message = userInput.value.trim();
  userInput.value = '';
  
  // 添加用户消息
  messages.value.push({
    id: generateId(),
    role: 'user',
    content: message,
    timestamp: Date.now(),
    status: 'sent'
  });
  // 滚动到聊天底部
  scrollToBottom();
  
  // 开始执行
  isStreaming.value = true;
  streamingContent.value = '正在使用 RAG 检索相关信息...';
  
  try {
    // 调用 RAG 执行
    const result = await langGraphService.executeGraphWithRAG({
      graphId: selectedGraph.value.id,
      input: { prompt: message }
    });
    
    isStreaming.value = false;
    streamingContent.value = '';
    
    // 添加助手消息
    messages.value.push({
      id: generateId(),
      role: 'assistant',
      content: result.output.content,
      timestamp: Date.now(),
      status: 'sent',
      metadata: result.metadata
    });
    
    // 保存消息历史
    if (selectedGraph.value) {
      messagesHistory.value[selectedGraph.value.id] = [...messages.value];
      saveMessagesToStorage();
    }
    
    // 滚动到聊天底部
    scrollToBottom();
  } catch (error) {
    console.error('Failed to execute RAG:', error);
    isStreaming.value = false;
    streamingContent.value = '';
    messages.value.push({
      id: generateId(),
      role: 'assistant',
      content: `RAG 执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
      timestamp: Date.now(),
      status: 'error'
    });
    // 保存消息历史
    if (selectedGraph.value) {
      messagesHistory.value[selectedGraph.value.id] = [...messages.value];
      saveMessagesToStorage();
    }
    // 滚动到聊天底部
    scrollToBottom();
  }
}

// 使用 Skills 发送消息
async function sendMessageWithSkills() {
  if (!userInput.value.trim() || !selectedGraph.value) return;
  
  const message = userInput.value.trim();
  userInput.value = '';
  
  // 添加用户消息
  messages.value.push({
    id: generateId(),
    role: 'user',
    content: message,
    timestamp: Date.now(),
    status: 'sent'
  });
  // 滚动到聊天底部
  scrollToBottom();
  
  // 开始执行
  isStreaming.value = true;
  streamingContent.value = '正在使用 Skills 执行任务...';
  
  try {
    // 调用 Skills 执行
    const result = await langGraphService.executeGraphWithSkills({
      graphId: selectedGraph.value.id,
      input: { prompt: message, skillName: 'webSearch' }
    });
    
    isStreaming.value = false;
    streamingContent.value = '';
    
    // 添加助手消息
    messages.value.push({
      id: generateId(),
      role: 'assistant',
      content: result.output.content,
      timestamp: Date.now(),
      status: 'sent',
      metadata: result.metadata
    });
    
    // 保存消息历史
    if (selectedGraph.value) {
      messagesHistory.value[selectedGraph.value.id] = [...messages.value];
      saveMessagesToStorage();
    }
    
    // 滚动到聊天底部
    scrollToBottom();
  } catch (error) {
    console.error('Failed to execute with skills:', error);
    isStreaming.value = false;
    streamingContent.value = '';
    messages.value.push({
      id: generateId(),
      role: 'assistant',
      content: `Skills 执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
      timestamp: Date.now(),
      status: 'error'
    });
    // 保存消息历史
    if (selectedGraph.value) {
      messagesHistory.value[selectedGraph.value.id] = [...messages.value];
      saveMessagesToStorage();
    }
    // 滚动到聊天底部
    scrollToBottom();
  }
}

// 清除输入
function clearInput() {
  userInput.value = '';
}

// 格式化时间
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// 滚动到聊天底部
function scrollToBottom() {
  setTimeout(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
    }
  }, 100);
}

// 删除图
async function deleteGraph(graphId: string) {
  try {
    await langGraphService.deleteGraph(graphId);
    // 删除对应的消息历史
    delete messagesHistory.value[graphId];
    saveMessagesToStorage();
    // 刷新图列表
    await refreshGraphs();
    // 如果删除的是当前选中的图，清除选中状态
    if (selectedGraph.value && selectedGraph.value.id === graphId) {
      selectedGraph.value = null;
      messages.value = [];
    }
  } catch (error) {
    console.error('Failed to delete graph:', error);
    messages.value.push({
      id: generateId(),
      role: 'assistant',
      content: `删除图失败: ${error instanceof Error ? error.message : '未知错误'}`,
      timestamp: Date.now(),
      status: 'error'
    });
    scrollToBottom();
  }
}

// 新增图相关状态
const showAddGraphModal = ref(false);
const newGraphName = ref('');
const newGraphDescription = ref('');

// 图信息显示状态
const showGraphInfo = ref(false);

// 切换图信息显示
function toggleGraphInfo() {
  showGraphInfo.value = !showGraphInfo.value;
}

// 新增图
async function addGraph() {
  if (!newGraphName.value.trim()) {
    messages.value.push({
      id: generateId(),
      role: 'assistant',
      content: '请输入图名称',
      timestamp: Date.now(),
      status: 'error'
    });
    scrollToBottom();
    return;
  }
  
  try {
    // 创建新图
    await langGraphService.createGraph({
      name: newGraphName.value.trim(),
      description: newGraphDescription.value.trim() || '新创建的图',
      nodes: [
        {
          id: '1',
          type: 'llm',
          name: 'LLM Node',
          description: '处理输入使用 LLM',
          configuration: { model: 'deepseek-chat' }
        }
      ],
      edges: [],
      entrypoint: '1'
    });
    
    // 关闭模态框
    showAddGraphModal.value = false;
    // 清空输入
    newGraphName.value = '';
    newGraphDescription.value = '';
    // 刷新图列表
    await refreshGraphs();
  } catch (error) {
    console.error('Failed to add graph:', error);
    messages.value.push({
      id: generateId(),
      role: 'assistant',
      content: `新增图失败: ${error instanceof Error ? error.message : '未知错误'}`,
      timestamp: Date.now(),
      status: 'error'
    });
    scrollToBottom();
  }
}
</script>

<style lang='scss' scoped>
.langgraph-demo {
  display: flex;
  height: 100vh;
  background-color: #f5f7fa;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 左侧边栏 */
.sidebar {
  width: 340px;
  background-color: white;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
  height: 100vh;
  overflow-y: hidden;
  overflow-x: hidden;

  .sidebar-header {
    padding: 20px;
    border-bottom: 1px solid #e8e8e8;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
  }

  .sidebar-section {
    padding: 15px 20px;
    border-bottom: 1px solid #e8e8e8;
    max-height: 200px;
    overflow-y: auto;

    h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }
  }

  .concept-list, .example-list {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      display: flex;
      align-items: center;
      padding: 8px 10px;
      margin-bottom: 6px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 13px;

      &:hover {
        background-color: #f0f2f5;
        transform: translateX(3px);
      }

      &.active {
        background-color: #e6f7ff;
        color: #1890ff;
      }
    }
  }

  .concept-icon, .example-icon {
    margin-right: 10px;
    font-size: 16px;

    &.node-icon {
      color: #1890ff;
    }

    &.edge-icon {
      color: #52c41a;
    }

    &.graph-icon {
      color: #faad14;
    }

    &.stream-icon {
      color: #f5222d;
    }

    &.rag-icon {
      color: #722ed1;
    }

    &.skills-icon {
      color: #13c2c2;
    }
  }

  .example-icon {
    font-size: 18px;
  }

  /* 图列表区域 */
  .graph-list-section {
    flex: 1;
    overflow-y: auto;
    padding: 15px 20px;
    border-top: 1px solid #e8e8e8;
    min-height: 300px;

    h3 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }

    .graph-list {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        display: flex;
        align-items: center;
        padding: 12px 14px;
        margin-bottom: 8px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background-color: #f0f2f5;
        }

        &.active {
          background-color: #e6f7ff;
          color: #1890ff;
        }

        .graph-item-content {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;

          .graph-name {
            font-size: 14px;
            font-weight: 500;
          }

          .graph-node-count {
            font-size: 12px;
            color: #999;
          }
        }

        .graph-delete-btn {
          width: 22px;
          height: 22px;
          border: none;
          border-radius: 50%;
          background-color: #ff4d4f;
          color: white;
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 10px;
          transition: all 0.3s ease;

          &:hover {
            background-color: #ff7875;
            transform: scale(1.1);
          }
        }
      }
    }
  }
}

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部导航 */
.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: white;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #333;
  }

  .btn {
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;

    &.btn-primary {
      background-color: #1890ff;
      color: white;

      &:hover {
        background-color: #40a9ff;
      }

      &:disabled {
        background-color: #d9d9d9;
        cursor: not-allowed;
      }
    }

    &.btn-secondary {
      background-color: #f0f0f0;
      color: #333;

      &:hover {
        background-color: #e0e0e0;
      }

      &:disabled {
        background-color: #f5f5f5;
        color: #999;
        cursor: not-allowed;
      }
    }

    &.btn-danger {
      background-color: #ff4d4f;
      color: white;

      &:hover {
        background-color: #ff7875;
      }
    }

    .loading-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
      margin-right: 8px;
    }
  }
}

/* 图信息 */
.graph-info-container {
  margin: 10px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  background-color: white;

  .graph-info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background-color: #f5f5f5;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background-color: #e8e8e8;
    }

    h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }

    .toggle-btn {
      width: 24px;
      height: 24px;
      border: none;
      background: none;
      font-size: 12px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.3s ease;

      &:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }

      &.active {
        transform: rotate(0deg);
      }
    }
  }

  .graph-info-content {
    padding: 16px;
    max-height: 300px;
    overflow-y: auto;
    animation: slideDown 0.3s ease-in-out;

    .graph-header {
      margin-bottom: 16px;

      p {
        margin: 0;
        font-size: 14px;
        color: #666;
        line-height: 1.5;
      }
    }

    .graph-structure {
      .nodes-section, .edges-section, .entrypoint-section {
        margin-bottom: 16px;

        h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: #666;
        }
      }

      .nodes-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 8px;
      }

      .node-item {
        padding: 10px;
        border-radius: 6px;
        border-left: 3px solid #1890ff;
        background-color: #f0f8ff;

        &.llm {
          border-left-color: #1890ff;
          background-color: #f0f8ff;
        }

        &.tool {
          border-left-color: #52c41a;
          background-color: #f6ffed;
        }

        &.conditional {
          border-left-color: #faad14;
          background-color: #fffbe6;
        }

        &.custom {
          border-left-color: #f5222d;
          background-color: #fff2f0;
        }

        .node-type {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 6px;
          background-color: rgba(0, 0, 0, 0.1);
        }

        .node-name {
          display: block;
          font-weight: 600;
          margin-bottom: 3px;
          font-size: 13px;
        }

        .node-description {
          display: block;
          font-size: 11px;
          color: #666;
        }
      }

      .edges-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .edge-item {
        display: flex;
        align-items: center;
        padding: 6px 10px;
        border-radius: 6px;
        background-color: #f5f5f5;

        .edge-source, .edge-target {
          font-size: 13px;
          font-weight: 500;
        }

        .edge-arrow {
          margin: 0 8px;
          color: #999;
          font-size: 12px;
        }

        .edge-condition {
          margin-left: 8px;
          font-size: 11px;
          color: #666;
          background-color: #e8e8e8;
          padding: 2px 6px;
          border-radius: 4px;
        }
      }

      .entrypoint-item {
        padding: 6px 10px;
        border-radius: 6px;
        background-color: #f0f8ff;
        border-left: 3px solid #1890ff;

        span {
          font-weight: 500;
          font-size: 13px;
        }
      }
    }
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 300px;
  }
}

/* 聊天容器 */
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin: 0 20px 20px 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* 聊天消息 */
.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* 输入区域 */
.chat-input-container {
  border-top: 1px solid #e8e8e8;
  padding: 16px;
  background-color: #fafafa;

  .input-wrapper {
    display: flex;
    gap: 10px;
    align-items: flex-end;

    .chat-input {
      flex: 1;
      padding: 16px;
      border: 1px solid #d9d9d9;
      border-radius: 8px;
      resize: none;
      font-size: 14px;
      font-family: inherit;
      line-height: 1.5;
      transition: all 0.3s ease;
      min-height: 60px;
      max-height: 180px;

      &:focus {
        outline: none;
        border-color: #1890ff;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
      }

      &:disabled {
        background-color: #f5f5f5;
        cursor: not-allowed;
      }
    }

    .input-actions {
      display: flex;
      gap: 10px;
      align-items: flex-end;

      .btn {
        padding: 16px 20px;
        font-size: 14px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }

  .streaming-controls {
    margin-top: 10px;
    text-align: right;
  }
}

/* 动画 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .langgraph-demo {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: 200px;
    overflow-y: auto;
  }

  .graph-info {
    margin: 10px;
    max-height: 200px;
  }

  .chat-container {
    margin: 10px;
  }
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }

  .modal-close {
    width: 24px;
    height: 24px;
    border: none;
    background: none;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    color: #999;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s ease;

    &:hover {
      background-color: #f0f0f0;
      color: #333;
    }
  }
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;

  label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #333;
  }

  .form-input,
  .form-textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    font-size: 14px;
    transition: all 0.3s ease;

    &:focus {
      outline: none;
      border-color: #1890ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  }

  .form-textarea {
    resize: vertical;
    min-height: 80px;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #e8e8e8;
  background-color: #fafafa;
}
</style>