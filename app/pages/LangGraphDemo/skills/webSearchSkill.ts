import { Skill } from './baseSkill';

export function createWebSearchSkill(): Skill {
  return {
    name: 'webSearch',
    description: '搜索网络信息',
    async execute(input: any) {
      const query = input.query || input.question;
      // 模拟搜索结果
      const searchResults = [
        {
          title: 'LangGraph 官方文档',
          url: 'https://langchain.com/langgraph',
          content: 'LangGraph 是一个用于构建复杂 AI 应用的框架，它允许开发者创建由多个节点组成的图，每个节点可以执行不同的任务。'
        },
        {
          title: 'LangGraph 教程',
          url: 'https://langchain.com/langgraph/tutorials',
          content: 'LangGraph 教程涵盖了从基础到高级的各种使用场景，帮助开发者快速上手。'
        }
      ];
      
      return {
        ...input,
        searchResults
      };
    }
  };
}

export const webSearchSkill = createWebSearchSkill();
