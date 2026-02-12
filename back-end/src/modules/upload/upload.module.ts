import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  getSupabaseClient,
  SUPABASE_CLIENT,
} from '../../config/supabase.config';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';

@Module({
  controllers: [UploadController],
  providers: [
    UploadService,
    {
      provide: SUPABASE_CLIENT,
      useFactory: getSupabaseClient,
      inject: [ConfigService],
    },
  ],
  exports: [UploadService],
})
export class UploadModule implements OnModuleInit {
  constructor(private uploadService: UploadService) {}

  async onModuleInit() {
    // 确保Supabase bucket存在
    await this.uploadService.ensureBucketExists();
  }
}
