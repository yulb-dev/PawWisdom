import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService, UploadResult } from './upload.service';

interface AuthRequest extends Request {
  user: {
    userId: string;
    username: string;
  };
}

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * 上传单个文件
   * POST /api/upload/file?folder=posts
   */
  @Post('file')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthRequest,
    @Query('folder') folder?: 'avatars' | 'posts' | 'pets',
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('未提供文件');
    }

    const userId = req.user.userId;
    const uploadFolder = folder || 'posts';

    return this.uploadService.uploadFile(file, userId, uploadFolder);
  }

  /**
   * 批量上传文件（最多9个）
   * POST /api/upload/files?folder=posts
   */
  @Post('files')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('files', 9))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: AuthRequest,
    @Query('folder') folder?: 'avatars' | 'posts' | 'pets',
  ): Promise<{ files: UploadResult[]; count: number }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('未提供文件');
    }

    const userId = req.user.userId;
    const uploadFolder = folder || 'posts';

    const uploadedFiles = await this.uploadService.uploadFiles(
      files,
      userId,
      uploadFolder,
    );

    return {
      files: uploadedFiles,
      count: uploadedFiles.length,
    };
  }
}
