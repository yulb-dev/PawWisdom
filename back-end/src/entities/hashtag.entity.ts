import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Post } from './post.entity';

@Entity('hashtags')
@Index(['name'], { unique: true })
export class Hashtag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ type: 'int', default: 0 })
  postCount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToMany(() => Post, (post) => post.hashtags)
  posts: Post[];

  @BeforeInsert()
  @BeforeUpdate()
  normalizeData() {
    if (this.name) {
      this.name = this.name.trim().toLowerCase();
      // 移除 # 前缀（如果存在）
      if (this.name.startsWith('#')) {
        this.name = this.name.substring(1);
      }
    }
  }
}
