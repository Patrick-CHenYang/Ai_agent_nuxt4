<template>
  <div class="file-upload">
    <button 
      class="upload-button"
      @click="triggerFileInput"
      title="Upload file"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4V16M12 16L8 12M12 16L16 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M20 18H4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <input 
      type="file" 
      ref="fileInput"
      multiple
      :accept="accept"
      @change="handleFileSelect"
      class="file-input"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { fileService } from '../services/fileService';
import { formatFileSize } from '../utils/markdownUtils';
import type { UploadedFile } from '../types';

const props = defineProps<{
  accept?: string;
  maxSize?: number;
  supportedTypes?: string;
}>();

const emit = defineEmits<{
  (e: 'filesChange', files: UploadedFile[]): void;
  (e: 'fileUpload', file: UploadedFile): void;
  (e: 'fileError', error: string): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragover = ref(false);
const files = ref<UploadedFile[]>([]);

const accept = computed(() => props.accept || '*');
const maxSize = computed(() => props.maxSize || 10 * 1024 * 1024);
const supportedTypes = computed(() => props.supportedTypes || 'All files');

function triggerFileInput() {
  fileInput.value?.click();
}

function handleDragOver() {
  isDragover.value = true;
}

function handleDragLeave() {
  isDragover.value = false;
}

async function handleDrop(event: DragEvent) {
  isDragover.value = false;
  const droppedFiles = event.dataTransfer?.files;
  if (droppedFiles) {
    await processFiles(Array.from(droppedFiles));
  }
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const selectedFiles = target.files;
  if (selectedFiles) {
    await processFiles(Array.from(selectedFiles));
    // 重置文件输入，允许重复选择相同的文件
    target.value = '';
  }
}

async function processFiles(selectedFiles: File[]) {
  for (const file of selectedFiles) {
    // 验证文件大小
    if (!fileService.validateFileSize(file, maxSize.value)) {
      emit('fileError', `File ${file.name} exceeds the maximum size limit`);
      continue;
    }

    // 验证文件类型
    if (!fileService.validateFileType(file, accept.value.split(','))) {
      emit('fileError', `File type ${file.type} is not supported`);
      continue;
    }

    // 创建临时文件对象
    const tempFile: UploadedFile = {
      id: fileService.generateId(),
      name: file.name,
      type: file.type,
      size: file.size,
      url: '',
      progress: 0,
      status: 'uploading'
    };

    // 添加到文件列表
    files.value.push(tempFile);
    emit('filesChange', files.value);

    try {
      // 上传文件
      const uploadedFile = await fileService.uploadFile(file, (progress) => {
        const index = files.value.findIndex(f => f.id === tempFile.id);
        if (index !== -1) {
          files.value[index].progress = progress;
          emit('filesChange', files.value);
        }
      });

      // 更新文件状态
      const index = files.value.findIndex(f => f.id === tempFile.id);
      if (index !== -1) {
        files.value[index] = uploadedFile;
        emit('filesChange', files.value);
        emit('fileUpload', uploadedFile);
      }
    } catch (error) {
      // 更新文件状态为错误
      const index = files.value.findIndex(f => f.id === tempFile.id);
      if (index !== -1) {
        files.value[index].status = 'error';
        emit('filesChange', files.value);
        emit('fileError', `Failed to upload file ${file.name}`);
      }
    }
  }
}

function removeFile(fileId: string) {
  files.value = files.value.filter(file => file.id !== fileId);
  emit('filesChange', files.value);
}

// 暴露方法给父组件
defineExpose({
  files,
  removeFile,
  triggerFileInput
});
</script>

<style lang="scss" scoped>
.file-upload {
  .upload-button {
    background: none;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    padding: 8px;
    cursor: pointer;
    color: #666;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      border-color: #1890ff;
      color: #1890ff;
      background-color: rgba(24, 144, 255, 0.05);
    }
  }

  .file-input {
    display: none;
  }

  .file-list {
    margin-top: 8px;

    .file-item {
      display: flex;
      align-items: center;
      padding: 8px;
      border-radius: 6px;
      margin-bottom: 4px;
      background-color: #f5f5f5;
      transition: all 0.3s ease;
      font-size: 13px;

      &.uploading {
        background-color: rgba(24, 144, 255, 0.05);
      }

      &.error {
        background-color: rgba(255, 77, 79, 0.05);
      }

      .file-icon {
        margin-right: 8px;
        color: #666;
      }

      .file-info {
        flex: 1;

        .file-name {
          font-size: 13px;
          margin-bottom: 2px;
        }

        .file-meta {
          font-size: 11px;
          color: #999;

          .file-size {
            margin-right: 8px;
          }

          .file-progress {
            color: #1890ff;
          }

          .file-error {
            color: #ff4d4f;
          }
        }
      }

      .file-actions {
        .remove-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px;
          border-radius: 3px;
          transition: all 0.3s ease;

          &:hover {
            background-color: rgba(255, 77, 79, 0.1);
          }
        }
      }
    }
  }
}
</style>