import { useRuntimeConfig } from 'nuxt/app';

// 向量存储接口
interface Document {
  id: string;
  content: string;
  embedding: number[];
}

// 向量存储状态
let documents: Array<Document> = [];

// 模拟嵌入
function mockEmbedding(text: string): number[] {
  // 简单的模拟嵌入，实际应用中应使用真实的嵌入模型
  const embedding = Array(10).fill(0);
  for (let i = 0; i < text.length && i < 10; i++) {
    embedding[i] = text.charCodeAt(i) / 256;
  }
  return embedding;
}

// 计算余弦相似度
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return magA * magB === 0 ? 0 : dotProduct / (magA * magB);
}

// 添加文档到向量存储
export async function addDocuments(documentsToAdd: Array<{ id: string; content: string }>) {
  // 模拟嵌入过程
  for (const doc of documentsToAdd) {
    documents.push({
      id: doc.id,
      content: doc.content,
      embedding: mockEmbedding(doc.content)
    });
  }
}

// 检索相关文档
export async function similaritySearch(query: string, k: number = 3) {
  const queryEmbedding = mockEmbedding(query);
  
  // 计算相似度并排序
  const results = documents
    .map(doc => ({
      ...doc,
      similarity: cosineSimilarity(queryEmbedding, doc.embedding)
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);

  return results.map(doc => ({
    id: doc.id,
    content: doc.content,
    similarity: doc.similarity
  }));
}

// 清除所有文档
export function clearDocuments() {
  documents = [];
}

// 导出所有函数
export const vectorStoreService = {
  addDocuments,
  similaritySearch,
  clearDocuments
};
