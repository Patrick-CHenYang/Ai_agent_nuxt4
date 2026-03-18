import type { LangGraph, LangGraphExecuteRequest, LangGraphExecuteResponse, LangGraphStreamChunk } from '@/types';

// 存储配置信息
let config = {
  apiKey: '',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat'
};

// 存储创建的图实例
let graphs: Record<string, any> = {};

// 从本地存储加载图
function loadGraphsFromStorage() {
  try {
    const storedGraphs = localStorage.getItem('langgraph_graphs');
    if (storedGraphs) {
      const parsedGraphs = JSON.parse(storedGraphs);
      // 重建图实例
      Object.keys(parsedGraphs).forEach(graphId => {
        const graphData = parsedGraphs[graphId];
        graphs[graphId] = {
          config: graphData.config,
          // 重新创建invoke方法
          async invoke(input: any) {
            return {
              output: `Processed by LangGraph: ${input.input}`
            };
          }
        };
      });
    }
  } catch (error) {
    console.error('Failed to load graphs from storage:', error);
    // 如果加载失败，使用空对象
    graphs = {};
  }
}

// 保存图到本地存储
function saveGraphsToStorage() {
  try {
    // 只保存配置信息，不保存方法
    const graphsToStore = Object.keys(graphs).reduce((acc, graphId) => {
      acc[graphId] = {
        config: graphs[graphId].config
      };
      return acc;
    }, {} as Record<string, any>);
    localStorage.setItem('langgraph_graphs', JSON.stringify(graphsToStore));
  } catch (error) {
    console.error('Failed to save graphs to storage:', error);
  }
}

// 初始化时加载图
loadGraphsFromStorage();

/**
 * 设置环境变量
 * @param apiKey API 密钥
 * @param baseUrl API 基础 URL
 * @param model 模型名称
 */
export function setConfig(apiKey: string, baseUrl: string, model: string = 'deepseek-chat') {
  config.apiKey = apiKey;
  config.baseUrl = baseUrl;
  config.model = model;
}

/**
 * 获取所有 LangGraph 图
 * @returns Promise<LangGraph[]> 图列表
 */
export async function getGraphs(): Promise<LangGraph[]> {
  // 从存储中获取图配置
  return Object.values(graphs).map(graph => graph.config);
}

/**
 * 创建 LangGraph 图
 * @param graph 图配置
 * @returns Promise<LangGraph> 创建的图
 */
export async function createGraph(graph: Omit<LangGraph, 'id'>): Promise<LangGraph> {
  const graphId = graph.id || Date.now().toString(36) + Math.random().toString(36).substr(2);
  const newGraph = {
    id: graphId,
    config: {
      ...graph,
      id: graphId
    },
    // 简化的图执行逻辑
    async invoke(input: any) {
      // 模拟图执行过程
      return {
        output: `Processed by LangGraph: ${input.input}`
      };
    }
  };

  // 存储图实例
  graphs[graphId] = newGraph;

  // 保存到本地存储
  saveGraphsToStorage();

  return newGraph.config;
}

/**
 * 执行 LangGraph 图
 * @param request 执行请求
 * @returns Promise<LangGraphExecuteResponse> 执行结果
 */
export async function executeGraph(request: LangGraphExecuteRequest): Promise<LangGraphExecuteResponse> {
  const graph = graphs[request.graphId];
  if (!graph) {
    throw new Error('Graph not found');
  }

  const result = await graph.invoke({
    input: request.input.prompt || ''
  });

  return {
    id: Date.now().toString(36),
    output: result,
    metadata: {
      model: config.model,
      timestamp: Date.now()
    }
  };
}

/**
 * 删除 LangGraph 图
 * @param graphId 图 ID
 * @returns Promise<boolean> 删除结果
 */
export async function deleteGraph(graphId: string): Promise<boolean> {
  if (!graphs[graphId]) {
    throw new Error('Graph not found');
  }

  delete graphs[graphId];
  
  // 保存到本地存储
  saveGraphsToStorage();
  
  return true;
}

/**
 * 流式执行 LangGraph 图
 * @param request 执行请求
 * @param callback 流式响应回调函数
 * @returns 取消函数
 */
export async function executeGraphStream(
  request: LangGraphExecuteRequest,
  callback: (chunk: LangGraphStreamChunk, error?: Error) => void
): Promise<() => void> {
  try {
    const graph = graphs[request.graphId];
    if (!graph) {
      callback({} as LangGraphStreamChunk, new Error('Graph not found'));
      return () => {};
    }

    // 调用 DeepSeek API 流式执行
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'user', content: request.input.prompt || '' }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      callback({} as LangGraphStreamChunk, new Error(errorData.error?.message || 'Failed to execute graph stream'));
      return () => {};
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callback({} as LangGraphStreamChunk, new Error('No response body'));
      return () => {};
    }

    let isCancelled = false;

    const readStream = async () => {
      if (isCancelled) {
        reader.cancel();
        return;
      }

      try {
        const { done, value } = await reader.read();

        if (done) {
          callback({
            id: '',
            type: 'finish',
            data: {}
          });
          return;
        }

        const chunkText = new TextDecoder('utf-8').decode(value);
        const lines = chunkText.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data === '[DONE]') {
              callback({
                id: '',
                type: 'finish',
                data: {}
              });
              return;
            }
            try {
              const openaiChunk = JSON.parse(data);
              if (openaiChunk.choices && openaiChunk.choices[0]) {
                const choice = openaiChunk.choices[0];
                if (choice.delta && choice.delta.content) {
                  callback({
                    id: openaiChunk.id,
                    type: 'token',
                    data: {
                      content: choice.delta.content
                    }
                  });
                }
              }
            } catch (error) {
              console.error('Error parsing stream chunk:', error);
            }
          }
        }

        await readStream();
      } catch (error) {
        callback({} as LangGraphStreamChunk, error as Error);
      }
    };

    readStream();

    return () => {
      isCancelled = true;
    };
  } catch (error) {
    callback({} as LangGraphStreamChunk, error as Error);
    return () => {};
  }
}

/**
 * 生成唯一ID
 * @returns 唯一ID字符串
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 导出所有函数
export const langGraphService = {
  setConfig,
  getGraphs,
  createGraph,
  executeGraph,
  executeGraphStream,
  deleteGraph,
  generateId
};
