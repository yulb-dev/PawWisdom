import { api } from '../config/api.config';

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  mimeType: string;
}

export interface UploadFilesResult {
  files: UploadResult[];
  count: number;
}

class UploadService {
  /**
   * 上传单个文件
   */
  async uploadFile(
    file: {
      uri: string;
      name?: string;
      type?: string;
    },
    folder: 'avatars' | 'posts' | 'pets' = 'posts',
  ): Promise<UploadResult> {
    const formData = new FormData();

    // 创建文件对象
    const fileToUpload: any = {
      uri: file.uri,
      name: file.name || `upload_${Date.now()}.jpg`,
      type: file.type || 'image/jpeg',
    };

    formData.append('file', fileToUpload);

    const response = await api.post<UploadResult>(
      `/upload/file?folder=${folder}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return response.data;
  }

  /**
   * 批量上传文件
   */
  async uploadFiles(
    files: {
      uri: string;
      name?: string;
      type?: string;
    }[],
    folder: 'avatars' | 'posts' | 'pets' = 'posts',
  ): Promise<UploadFilesResult> {
    const formData = new FormData();

    // 添加所有文件
    files.forEach((file, index) => {
      const fileToUpload: any = {
        uri: file.uri,
        name: file.name || `upload_${Date.now()}_${index}.jpg`,
        type: file.type || 'image/jpeg',
      };

      formData.append('files', fileToUpload);
    });

    const response = await api.post<UploadFilesResult>(
      `/upload/files?folder=${folder}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return response.data;
  }
}

export const uploadService = new UploadService();
