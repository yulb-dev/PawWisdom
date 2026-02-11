import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Comment } from './comment.entity';

@Entity('comment_likes')
@Unique(['commentId', 'userId'])
@Index(['commentId'])
@Index(['userId'])
export class CommentLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  commentId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Comment, { eager: false })
  @JoinColumn({ name: 'commentId' })
  comment: Comment;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;
}
