import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

// 配置 marked 以支持代码高亮
marked.setOptions({
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  breaks: true,
  gfm: true
});

/**
 * 渲染 markdown 文本为 HTML
 * @param markdown  markdown 文本
 * @returns 渲染后的 HTML 字符串
 */
export function renderMarkdown(markdown: string): string {
  return marked(markdown);
}

/**
 * 提取代码块信息
 * @param markdown  markdown 文本
 * @returns 代码块数组
 */
export function extractCodeBlocks(markdown: string): {
  language: string;
  code: string;
}[] {
  const codeBlocks: {
    language: string;
    code: string;
  }[] = [];
  
  const regex = /```([\w]+)?\n([\s\S]*?)```/g;
  let match;
  
  while ((match = regex.exec(markdown)) !== null) {
    codeBlocks.push({
      language: match[1] || 'plaintext',
      code: match[2]
    });
  }
  
  return codeBlocks;
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}