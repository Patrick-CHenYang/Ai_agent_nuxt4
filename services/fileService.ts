import type { UploadedFile } from '../types';

class FileService {
  /**
   * 上传文件
   * @param file 要上传的文件
   * @param callback 上传进度回调函数
   * @returns Promise<UploadedFile> 上传后的文件信息
   */
  async uploadFile(
    file: File,
    callback?: (progress: number) => void
  ): Promise<UploadedFile> {
    return new Promise((resolve, reject) => {
      // 模拟文件上传过程
      const fileId = this.generateId();
      const reader = new FileReader();
      
      reader.onloadstart = () => {
        callback?.(0);
      };
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          callback?.(progress);
        }
      };
      
      reader.onload = () => {
        callback?.(100);
        const uploadedFile: UploadedFile = {
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          url: reader.result as string,
          status: 'completed'
        };
        resolve(uploadedFile);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to upload file'));
      };
      
      // 读取文件为 DataURL
      reader.readAsDataURL(file);
    });
  }

  /**
   * 批量上传文件
   * @param files 要上传的文件数组
   * @param callback 上传进度回调函数
   * @returns Promise<UploadedFile[]> 上传后的文件信息数组
   */
  async uploadFiles(
    files: File[],
    callback?: (progress: number, currentFile: string) => void
  ): Promise<UploadedFile[]> {
    const uploadedFiles: UploadedFile[] = [];
    let totalProgress = 0;
    const fileCount = files.length;

    for (let i = 0; i < fileCount; i++) {
      const file = files[i];
      try {
        const uploadedFile = await this.uploadFile(file, (progress) => {
          // 计算总进度
          const currentProgress = (i * 100 + progress) / fileCount;
          callback?.(Math.round(currentProgress), file.name);
        });
        uploadedFiles.push(uploadedFile);
      } catch (error) {
        console.error(`Failed to upload file ${file.name}:`, error);
      }
    }

    return uploadedFiles;
  }

  /**
   * 生成唯一ID
   * @returns 唯一ID字符串
   */
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 获取文件类型图标
   * @param fileType 文件类型
   * @returns 图标类名
   */
  getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) {
      return 'file-image';
    } else if (fileType.startsWith('text/')) {
      return 'file-text';
    } else if (fileType.startsWith('application/pdf')) {
      return 'file-pdf';
    } else if (fileType.startsWith('application/vnd.ms-excel') || 
               fileType.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      return 'file-excel';
    } else if (fileType.startsWith('application/vnd.ms-powerpoint') || 
               fileType.startsWith('application/vnd.openxmlformats-officedocument.presentationml.presentation')) {
      return 'file-powerpoint';
    } else if (fileType.startsWith('application/msword') || 
               fileType.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      return 'file-word';
    } else if (fileType.startsWith('application/json')) {
      return 'file-code';
    } else {
      return 'file-generic';
    }
  }

  /**
   * 验证文件大小
   * @param file 文件
   * @param maxSize 最大文件大小（字节）
   * @returns 是否通过验证
   */
  validateFileSize(file: File, maxSize: number = 10 * 1024 * 1024): boolean {
    return file.size <= maxSize;
  }

  /**
   * 验证文件类型
   * @param file 文件
   * @param allowedTypes 允许的文件类型数组
   * @returns 是否通过验证
   */
  validateFileType(file: File, allowedTypes: string[] = []): boolean {
    if (allowedTypes.length === 0) {
      return true;
    }
    return allowedTypes.some(type => {
      if (type.endsWith('*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });
  }
}

export const fileService = new FileService();