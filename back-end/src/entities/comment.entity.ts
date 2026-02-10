import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { User } from './user.entity';
import { Post } from './post.entity';

@Entity('comments')
@Index(['postId', 'isDeleted'])
@Index(['userId'])
@Index(['parentId'])
@Index(['createdAt'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  postId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  parentId?: string;

  @Column({ type: 'uuid', nullable: true })
  replyToUserId?: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  images?: string[];

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @Column({ type: 'boolean', default: false })
  isPinned: boolean;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Post, { eager: false })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Comment, { eager: false, nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent?: Comment;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'replyToUserId' })
  replyToUser?: User;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeData() {
    if (this.content) {
      this.content = this.content.trim();
    }
  }
}
