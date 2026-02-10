import {
  Controller,
  Get,
  Post as HttpPost,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommentsService, PaginatedCommentsResult } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { QueryCommentsDto } from './dto/query-comments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Comment } from '../../entities/comment.entity';

interface AuthRequest extends Request {
  user: {
    userId: string;
    username: string;
  };
}

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * 创建评论
   * POST /api/comments
   */
  @HttpPost()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCommentDto: CreateCommentDto,
    @Request() req: AuthRequest,
  ): Promise<Comment> {
    const userId = req.user.userId;
    return this.commentsService.create(createCommentDto, userId);
  }

  /**
   * 查询评论列表
   * GET /api/comments
   */
  @Get()
  async findByPost(
    @Query() query: QueryCommentsDto,
  ): Promise<PaginatedCommentsResult> {
    return this.commentsService.findByPost(query);
  }

  /**
   * 查询评论的回复
   * GET /api/comments/:id/replies
   */
  @Get(':id/replies')
  async findReplies(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedCommentsResult> {
    return this.commentsService.findReplies(id, page, limit);
  }

  /**
   * 查询单个评论
   * GET /api/comments/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Comment> {
    return this.commentsService.findOne(id);
  }

  /**
   * 更新评论
   * PATCH /api/comments/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req: AuthRequest,
  ): Promise<Comment> {
    const userId = req.user.userId;
    return this.commentsService.update(id, updateCommentDto, userId);
  }

  /**
   * 删除评论
   * DELETE /api/comments/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Request() req: AuthRequest,
  ): Promise<void> {
    const userId = req.user.userId;
    return this.commentsService.remove(id, userId);
  }

  /**
   * 置顶评论
   * POST /api/comments/:id/pin
   */
  @HttpPost(':id/pin')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async pin(@Param('id') id: string): Promise<Comment> {
    return this.commentsService.pin(id);
  }

  /**
   * 取消置顶
   * DELETE /api/comments/:id/pin
   */
  @Delete(':id/pin')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unpin(@Param('id') id: string): Promise<Comment> {
    return this.commentsService.unpin(id);
  }

  /**
   * 点赞评论
   * POST /api/comments/:id/like
   */
  @HttpPost(':id/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async like(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.commentsService.incrementLikeCount(id);
    return { success: true };
  }

  /**
   * 取消点赞
   * DELETE /api/comments/:id/like
   */
  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unlike(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.commentsService.decrementLikeCount(id);
    return { success: true };
  }
}
