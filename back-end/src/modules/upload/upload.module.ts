import { Module, OnModuleInit } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';

@Module({
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule implements OnModuleInit {
  constructor(private uploadService: UploadService) {}

  async onModuleInit() {
    // 确保Supabase bucket存在
    await this.uploadService.ensureBucketExists();
  }
}
