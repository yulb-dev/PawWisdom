import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../../entities/post.entity';
import { Hashtag } from '../../entities/hashtag.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostsDto, PostSortBy } from './dto/query-posts.dto';

export interface PaginatedPostsResult {
  data: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Hashtag)
    private hashtagRepository: Repository<Hashtag>,
  ) {}

  /**
   * 创建动态
   */
  async create(createPostDto: CreatePostDto, userId: string): Promise<Post> {
    // 提取hashtags，避免传递给create
    const { hashtags: hashtagNames, ...postData } = createPostDto;

    // 创建动态实体
    const post = this.postRepository.create({
      ...postData,
      userId,
    });

    // 处理话题标签
    if (hashtagNames && hashtagNames.length > 0) {
      const hashtags = await this.processHashtags(hashtagNames);
      post.hashtags = hashtags;
    }

    // 保存动态
    const savedPost = await this.postRepository.save(post);

    // 返回包含关联数据的完整动态
    return this.findOne(savedPost.id);
  }

  /**
   * 查询动态列表
   */
  async findAll(query: QueryPostsDto): Promise<PaginatedPostsResult> {
    const { page = 1, limit = 20, sortBy, userId, petId, hashtag } = query;

    // 第一步：查询符合条件的 post IDs（不加载关联，避免 DISTINCT 问题）
    const idsQueryBuilder = this.postRepository
      .createQueryBuilder('post')
      .select('post.id')
      .where('post.isDeleted = :isDeleted', { isDeleted: false });

    // 筛选条件
    if (userId) {
      idsQueryBuilder.andWhere('post.userId = :userId', { userId });
    }

    if (petId) {
      idsQueryBuilder.andWhere('post.petId = :petId', { petId });
    }

    if (hashtag) {
      idsQueryBuilder
        .leftJoin('post.hashtags', 'hashtags')
        .andWhere('hashtags.name = :hashtag', {
          hashtag: hashtag.toLowerCase(),
        });
    }

    // 排序
    switch (sortBy) {
      case PostSortBy.POPULAR:
        idsQueryBuilder.orderBy('post.likeCount', 'DESC');
        break;
      case PostSortBy.HOT:
        // 计算热度分数：点赞*2 + 评论*3 + 分享*5
        idsQueryBuilder.orderBy(
          '(post.likeCount * 2 + post.commentCount * 3 + post.shareCount * 5)',
          'DESC',
        );
        break;
      case PostSortBy.LATEST:
      default:
        idsQueryBuilder.orderBy('post.createdAt', 'DESC');
        break;
    }

    // 分页
    const skip = (page - 1) * limit;
    idsQueryBuilder.skip(skip).take(limit);

    // 获取总数和 IDs
    const [postIds, total] = await Promise.all([
      idsQueryBuilder.getMany(),
      idsQueryBuilder.getCount(),
    ]);

    // 如果没有数据，直接返回
    if (postIds.length === 0) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    // 第二步：根据 IDs 加载完整数据（包含关联）
    const ids = postIds.map((p) => p.id);
    const posts = await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.pet', 'pet')
      .leftJoinAndSelect('post.hashtags', 'hashtags')
      .where('post.id IN (:...ids)', { ids })
      .getMany();

    // 按原始顺序排序
    const orderedPosts = ids
      .map((id) => posts.find((p) => p.id === id))
      .filter((p) => p !== undefined);

    return {
      data: orderedPosts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 查询单个动态
   */
  async findOne(id: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['user', 'pet', 'hashtags'],
    });

    if (!post) {
      throw new NotFoundException(`动态 ${id} 不存在`);
    }

    return post;
  }

  /**
   * 更新动态
   */
  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    userId: string,
  ): Promise<Post> {
    const post = await this.findOne(id);

    // 验证权限
    if (post.userId !== userId) {
      throw new ForbiddenException('您没有权限编辑此动态');
    }

    // 更新话题标签
    if (updatePostDto.hashtags) {
      const hashtags = await this.processHashtags(updatePostDto.hashtags);
      post.hashtags = hashtags;
    }

    // 更新其他字段
    Object.assign(post, updatePostDto);

    return this.postRepository.save(post);
  }

  /**
   * 删除动态（软删除）
   */
  async remove(id: string, userId: string): Promise<void> {
    const post = await this.findOne(id);

    // 验证权限
    if (post.userId !== userId) {
      throw new ForbiddenException('您没有权限删除此动态');
    }

    await this.postRepository.update(id, {
      isDeleted: true,
      deletedAt: new Date(),
    });
  }

  /**
   * 处理话题标签
   */
  private async processHashtags(hashtagNames: string[]): Promise<Hashtag[]> {
    const hashtags: Hashtag[] = [];

    for (const name of hashtagNames) {
      const normalizedName = name.trim().toLowerCase();
      if (!normalizedName) continue;

      // 查找或创建话题标签
      let hashtag = await this.hashtagRepository.findOne({
        where: { name: normalizedName },
      });

      if (!hashtag) {
        hashtag = this.hashtagRepository.create({ name: normalizedName });
        hashtag = await this.hashtagRepository.save(hashtag);
      }

      hashtags.push(hashtag);
    }

    return hashtags;
  }

  /**
   * 获取推荐动态流
   */
  async getRecommendedFeed(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedPostsResult> {
    // 简单推荐算法：最新 + 热门混合
    return this.findAll({
      page,
      limit,
      sortBy: PostSortBy.HOT,
    });
  }

  /**
   * 获取关注用户的动态流
   */
  async getFollowingFeed(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedPostsResult> {
    // TODO: 实现关注功能后，这里需要查询关注用户的动态
    // 目前返回所有最新动态
    return this.findAll({
      page,
      limit,
      sortBy: PostSortBy.LATEST,
    });
  }

  /**
   * 增加点赞数
   */
  async incrementLikeCount(postId: string): Promise<void> {
    await this.postRepository.increment({ id: postId }, 'likeCount', 1);
  }

  /**
   * 减少点赞数
   */
  async decrementLikeCount(postId: string): Promise<void> {
    await this.postRepository.decrement({ id: postId }, 'likeCount', 1);
  }

  /**
   * 增加评论数
   */
  async incrementCommentCount(postId: string): Promise<void> {
    await this.postRepository.increment({ id: postId }, 'commentCount', 1);
  }

  /**
   * 减少评论数
   */
  async decrementCommentCount(postId: string): Promise<void> {
    await this.postRepository.decrement({ id: postId }, 'commentCount', 1);
  }

  /**
   * 增加分享数
   */
  async incrementShareCount(postId: string): Promise<void> {
    await this.postRepository.increment({ id: postId }, 'shareCount', 1);
  }
}
