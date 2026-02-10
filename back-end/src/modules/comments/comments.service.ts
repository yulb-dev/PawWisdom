import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Comment } from '../../entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { QueryCommentsDto } from './dto/query-comments.dto';

export interface PaginatedCommentsResult {
  data: Comment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  /**
   * 创建评论
   */
  async create(
    createCommentDto: CreateCommentDto,
    userId: string,
  ): Promise<Comment> {
    const comment = this.commentRepository.create({
      ...createCommentDto,
      userId,
    });
    return this.commentRepository.save(comment);
  }

  /**
   * 查询评论列表
   */
  async findByPost(query: QueryCommentsDto): Promise<PaginatedCommentsResult> {
    const { postId, page = 1, limit = 20 } = query;

    const [data, total] = await this.commentRepository.findAndCount({
      where: {
        postId,
        isDeleted: false,
        parentId: IsNull(), // 只查询顶级评论
      },
      relations: ['user', 'replyToUser'],
      order: {
        isPinned: 'DESC',
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 查询评论的回复
   */
  async findReplies(
    commentId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedCommentsResult> {
    const [data, total] = await this.commentRepository.findAndCount({
      where: {
        parentId: commentId,
        isDeleted: false,
      },
      relations: ['user', 'replyToUser'],
      order: {
        createdAt: 'ASC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 查询单个评论
   */
  async findOne(id: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['user', 'replyToUser'],
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    return comment;
  }

  /**
   * 更新评论
   */
  async update(
    id: string,
    updateCommentDto: UpdateCommentDto,
    userId: string,
  ): Promise<Comment> {
    const comment = await this.findOne(id);

    if (comment.userId !== userId) {
      throw new ForbiddenException('无权修改此评论');
    }

    Object.assign(comment, updateCommentDto);
    return this.commentRepository.save(comment);
  }

  /**
   * 删除评论（软删除）
   */
  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.findOne(id);

    if (comment.userId !== userId) {
      throw new ForbiddenException('无权删除此评论');
    }

    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await this.commentRepository.save(comment);
  }

  /**
   * 置顶评论
   */
  async pin(id: string): Promise<Comment> {
    const comment = await this.findOne(id);
    comment.isPinned = true;
    return this.commentRepository.save(comment);
  }

  /**
   * 取消置顶
   */
  async unpin(id: string): Promise<Comment> {
    const comment = await this.findOne(id);
    comment.isPinned = false;
    return this.commentRepository.save(comment);
  }

  /**
   * 点赞评论
   */
  async incrementLikeCount(id: string): Promise<void> {
    await this.commentRepository.increment({ id }, 'likeCount', 1);
  }

  /**
   * 取消点赞
   */
  async decrementLikeCount(id: string): Promise<void> {
    await this.commentRepository.decrement({ id }, 'likeCount', 1);
  }
}
