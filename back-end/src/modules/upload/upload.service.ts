import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  mimeType: string;
}

@Injectable()
export class UploadService {
  private supabase: SupabaseClient;
  private readonly bucketName = 'pet-media';
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
  ];

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey) as SupabaseClient;
  }

  /**
   * 上传单个文件到Supabase Storage
   */
  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    folder: 'avatars' | 'posts' | 'pets' = 'posts',
  ): Promise<UploadResult> {
    // 验证文件
    this.validateFile(file);

    // 生成唯一文件名
    const fileExt = this.getFileExtension(file.originalname);
    const fileName = `${folder}/${userId}/${Date.now()}-${randomUUID()}${fileExt}`;

    try {
      // 确保文件buffer存在
      if (!file.buffer) {
        throw new BadRequestException('文件数据不完整');
      }

      // 上传到Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        throw new InternalServerErrorException(
          `文件上传失败: ${error.message}`,
        );
      }

      // 获取公共URL
      const {
        data: { publicUrl },
      } = this.supabase.storage.from(this.bucketName).getPublicUrl(data.path);

      return {
        url: publicUrl,
        path: data.path,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (err) {
      if (err instanceof InternalServerErrorException) {
        throw err;
      }
      throw new InternalServerErrorException('文件上传失败');
    }
  }

  /**
   * 批量上传文件
   */
  async uploadFiles(
    files: Express.Multer.File[],
    userId: string,
    folder: 'avatars' | 'posts' | 'pets' = 'posts',
  ): Promise<UploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('未提供文件');
    }

    if (files.length > 9) {
      throw new BadRequestException('一次最多上传9个文件');
    }

    const uploadPromises = files.map((file) =>
      this.uploadFile(file, userId, folder),
    );

    try {
      return await Promise.all(uploadPromises);
    } catch {
      throw new InternalServerErrorException('批量上传失败');
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        throw new InternalServerErrorException(
          `文件删除失败: ${error.message}`,
        );
      }
    } catch (err) {
      if (err instanceof InternalServerErrorException) {
        throw err;
      }
      throw new InternalServerErrorException('文件删除失败');
    }
  }

  /**
   * 批量删除文件
   */
  async deleteFiles(filePaths: string[]): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove(filePaths);

      if (error) {
        throw new InternalServerErrorException(
          `文件删除失败: ${error.message}`,
        );
      }
    } catch {
      throw new InternalServerErrorException('批量删除失败');
    }
  }

  /**
   * 验证文件
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('未提供文件');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `文件大小超过限制（最大${this.maxFileSize / 1024 / 1024}MB）`,
      );
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        '不支持的文件类型，仅支持图片（JPEG, PNG, GIF, WEBP）和视频（MP4, MOV）',
      );
    }
  }

  /**
   * 获取文件扩展名
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? `.${parts.pop()}` : '';
  }

  /**
   * 确保bucket存在
   */
  async ensureBucketExists(): Promise<void> {
    try {
      const { data: buckets } = await this.supabase.storage.listBuckets();
      const bucketExists = buckets?.some(
        (bucket) => bucket.name === this.bucketName,
      );

      if (!bucketExists) {
        await this.supabase.storage.createBucket(this.bucketName, {
          public: true,
          fileSizeLimit: this.maxFileSize,
        });
      }
    } catch (error) {
      console.error('Bucket setup error:', error);
    }
  }
}
