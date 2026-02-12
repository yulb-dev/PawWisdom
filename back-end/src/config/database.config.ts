import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: configService.get<string>('DATABASE_URL'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  // 关闭自动同步，使用手动迁移脚本管理数据库表结构
  synchronize: true,
  // 只在需要调试 SQL 时启用日志（设置为 'error' 只显示错误）
  logging: false,
  ssl: {
    rejectUnauthorized: false,
  },
});
