import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { User } from './user.entity';
import { Pet } from './pet.entity';
import { Hashtag } from './hashtag.entity';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

@Entity('posts')
@Index(['userId', 'isDeleted'])
@Index(['petId'])
@Index(['createdAt'])
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  petId?: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: MediaType,
    nullable: true,
  })
  mediaType?: MediaType;

  @Column({ type: 'jsonb', nullable: true })
  mediaUrls?: string[];

  @Column({ type: 'jsonb', nullable: true })
  aiAnalysis?: {
    emotion?: string;
    confidence?: number;
    description?: string;
    moodCardUrl?: string;
  };

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @Column({ type: 'int', default: 0 })
  commentCount: number;

  @Column({ type: 'int', default: 0 })
  shareCount: number;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Pet, { eager: false })
  @JoinColumn({ name: 'petId' })
  pet?: Pet;

  @ManyToMany(() => Hashtag, (hashtag) => hashtag.posts)
  @JoinTable({
    name: 'post_hashtags',
    joinColumn: { name: 'postId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'hashtagId', referencedColumnName: 'id' },
  })
  hashtags: Hashtag[];

  @BeforeInsert()
  @BeforeUpdate()
  normalizeData() {
    if (this.content) {
      this.content = this.content.trim();
    }
  }
}
