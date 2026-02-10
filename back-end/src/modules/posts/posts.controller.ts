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
import { PostsService, PaginatedPostsResult } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Post } from '../../entities/post.entity';

interface AuthRequest extends Request {
  user: {
    userId: string;
    username: string;
  };
}

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /**
   * 创建动态
   * POST /api/posts
   */
  @HttpPost()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createPostDto: CreatePostDto,
    @Request() req: AuthRequest,
  ): Promise<Post> {
    const userId = req.user.userId;
    return this.postsService.create(createPostDto, userId);
  }

  /**
   * 查询动态列表
   * GET /api/posts
   */
  @Get()
  async findAll(@Query() query: QueryPostsDto): Promise<PaginatedPostsResult> {
    return this.postsService.findAll(query);
  }

  /**
   * 获取推荐动态流
   * GET /api/posts/feed/recommended
   */
  @Get('feed/recommended')
  async getRecommendedFeed(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedPostsResult> {
    return this.postsService.getRecommendedFeed('', page, limit);
  }

  /**
   * 获取关注用户的动态流
   * GET /api/posts/feed/following
   */
  @Get('feed/following')
  @UseGuards(JwtAuthGuard)
  async getFollowingFeed(
    @Request() req: AuthRequest,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedPostsResult> {
    const userId = req.user.userId;
    return this.postsService.getFollowingFeed(userId, page, limit);
  }

  /**
   * 查询单个动态
   * GET /api/posts/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Post> {
    return this.postsService.findOne(id);
  }

  /**
   * 更新动态
   * PATCH /api/posts/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req: AuthRequest,
  ): Promise<Post> {
    const userId = req.user.userId;
    return this.postsService.update(id, updatePostDto, userId);
  }

  /**
   * 删除动态
   * DELETE /api/posts/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Request() req: AuthRequest,
  ): Promise<void> {
    const userId = req.user.userId;
    return this.postsService.remove(id, userId);
  }

  /**
   * 点赞动态
   * POST /api/posts/:id/like
   */
  @HttpPost(':id/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async like(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.postsService.incrementLikeCount(id);
    return { success: true };
  }

  /**
   * 取消点赞
   * DELETE /api/posts/:id/like
   */
  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unlike(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.postsService.decrementLikeCount(id);
    return { success: true };
  }

  /**
   * 分享动态
   * POST /api/posts/:id/share
   */
  @HttpPost(':id/share')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async share(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.postsService.incrementShareCount(id);
    return { success: true };
  }
}
