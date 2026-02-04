import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('SUPABASE_DB_HOST'),
  port: configService.get<number>('SUPABASE_DB_PORT', 5432),
  username: configService.get<string>('SUPABASE_DB_USER'),
  password: configService.get<string>('SUPABASE_DB_PASSWORD'),
  database: configService.get<string>('SUPABASE_DB_NAME'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  // 关闭自动同步，使用手动迁移脚本管理数据库表结构
  synchronize: false,
  // 只在需要调试 SQL 时启用日志（设置为 'error' 只显示错误）
  logging: false,
  ssl: {
    rejectUnauthorized: false,
  },
});
