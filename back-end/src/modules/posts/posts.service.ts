import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { Post, MediaType } from '../../entities/post.entity';
import { Hashtag } from '../../entities/hashtag.entity';
import { PostLike } from '../../entities/post-like.entity';
import { PostFavorite } from '../../entities/post-favorite.entity';
import { UserFollow } from '../../entities/user-follow.entity';
import { Pet } from '../../entities/pet.entity';
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
    @InjectRepository(PostLike)
    private postLikeRepository: Repository<PostLike>,
    @InjectRepository(PostFavorite)
    private postFavoriteRepository: Repository<PostFavorite>,
    @InjectRepository(UserFollow)
    private userFollowRepository: Repository<UserFollow>,
    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,
  ) {}

  /**
   * 创建动态
   */
  async create(createPostDto: CreatePostDto, userId: string): Promise<Post> {
    // 提取hashtags，避免传递给create
    const { hashtags: hashtagNames, ...postData } = createPostDto;

    this.validateMediaPayload(postData.mediaType, postData.mediaUrls);
    await this.ensurePetOwnership(postData.petId, userId);

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
    const followingRelations = await this.userFollowRepository.find({
      where: { followerId: userId },
      select: ['followingId'],
    });

    const followingUserIds = followingRelations.map((item) => item.followingId);
    if (followingUserIds.length === 0) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const [data, total] = await this.postRepository.findAndCount({
      where: {
        userId: In(followingUserIds),
        isDeleted: false,
        isDraft: false,
      },
      relations: ['user', 'pet', 'hashtags'],
      order: {
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
    await this.ensurePostExists(postId);
    await this.postRepository.increment({ id: postId }, 'shareCount', 1);
  }

  /**
   * 获取用户草稿列表
   */
  async getDrafts(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedPostsResult> {
    const [data, total] = await this.postRepository.findAndCount({
      where: {
        userId,
        isDraft: true,
        isDeleted: false,
      },
      relations: ['pet', 'hashtags'],
      order: {
        updatedAt: 'DESC',
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
   * 点赞动态（创建点赞记录）
   */
  async likePost(postId: string, userId: string): Promise<void> {
    await this.ensurePostExists(postId);

    // 检查是否已点赞
    const existingLike = await this.postLikeRepository.findOne({
      where: { postId, userId },
    });

    if (existingLike) {
      throw new ConflictException('您已经点赞过此动态');
    }

    // 创建点赞记录
    const like = this.postLikeRepository.create({ postId, userId });
    await this.postLikeRepository.save(like);
    await this.incrementLikeCount(postId);
  }

  /**
   * 取消点赞
   */
  async unlikePost(postId: string, userId: string): Promise<void> {
    await this.ensurePostExists(postId);

    const like = await this.postLikeRepository.findOne({
      where: { postId, userId },
    });

    if (!like) {
      throw new NotFoundException('点赞记录不存在');
    }

    await this.postLikeRepository.remove(like);
    await this.decrementLikeCount(postId);
  }

  /**
   * 检查用户是否点赞了动态
   */
  async isPostLikedByUser(postId: string, userId: string): Promise<boolean> {
    const like = await this.postLikeRepository.findOne({
      where: { postId, userId },
    });
    return !!like;
  }

  /**
   * 收藏动态
   */
  async favoritePost(postId: string, userId: string): Promise<void> {
    await this.ensurePostExists(postId);

    // 检查是否已收藏
    const existingFavorite = await this.postFavoriteRepository.findOne({
      where: { postId, userId },
    });

    if (existingFavorite) {
      throw new ConflictException('您已经收藏过此动态');
    }

    // 创建收藏记录
    const favorite = this.postFavoriteRepository.create({ postId, userId });
    await this.postFavoriteRepository.save(favorite);
    await this.postRepository.increment({ id: postId }, 'favoriteCount', 1);
  }

  /**
   * 取消收藏
   */
  async unfavoritePost(postId: string, userId: string): Promise<void> {
    await this.ensurePostExists(postId);

    const favorite = await this.postFavoriteRepository.findOne({
      where: { postId, userId },
    });

    if (!favorite) {
      throw new NotFoundException('收藏记录不存在');
    }

    await this.postFavoriteRepository.remove(favorite);
    await this.postRepository.decrement({ id: postId }, 'favoriteCount', 1);
  }

  /**
   * 检查用户是否收藏了动态
   */
  async isPostFavoritedByUser(
    postId: string,
    userId: string,
  ): Promise<boolean> {
    const favorite = await this.postFavoriteRepository.findOne({
      where: { postId, userId },
    });
    return !!favorite;
  }

  /**
   * 获取用户点赞的动态列表
   */
  async getLikedPosts(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedPostsResult> {
    const [likes, total] = await this.postLikeRepository.findAndCount({
      where: { userId },
      relations: ['post', 'post.user', 'post.pet', 'post.hashtags'],
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data = likes
      .map((like) => like.post)
      .filter((post) => post && !post.isDeleted);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取用户收藏的动态列表
   */
  async getFavoritedPosts(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedPostsResult> {
    const [favorites, total] = await this.postFavoriteRepository.findAndCount({
      where: { userId },
      relations: ['post', 'post.user', 'post.pet', 'post.hashtags'],
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data = favorites
      .map((favorite) => favorite.post)
      .filter((post) => post && !post.isDeleted);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取用户的动态列表（包括草稿）
   */
  async getUserPosts(
    userId: string,
    includeDrafts: boolean = false,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedPostsResult> {
    const whereCondition: FindOptionsWhere<Post> = {
      userId,
      isDeleted: false,
    };

    if (!includeDrafts) {
      whereCondition.isDraft = false;
    }

    const [data, total] = await this.postRepository.findAndCount({
      where: whereCondition,
      relations: ['pet', 'hashtags'],
      order: {
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

  async getPostInteractionStatus(
    postId: string,
    userId: string,
  ): Promise<{
    isLiked: boolean;
    isFavorited: boolean;
    isFollowingAuthor: boolean;
  }> {
    const post = await this.findOne(postId);

    const [isLiked, isFavorited, isFollowingAuthor] = await Promise.all([
      this.isPostLikedByUser(postId, userId),
      this.isPostFavoritedByUser(postId, userId),
      post.userId === userId
        ? Promise.resolve(false)
        : this.userFollowRepository
            .findOne({
              where: {
                followerId: userId,
                followingId: post.userId,
              },
            })
            .then((relation) => !!relation),
    ]);

    return { isLiked, isFavorited, isFollowingAuthor };
  }

  private async ensurePostExists(postId: string): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { id: postId, isDeleted: false },
      select: ['id'],
    });
    if (!post) {
      throw new NotFoundException('动态不存在');
    }
  }

  private async ensurePetOwnership(
    petId: string | undefined,
    userId: string,
  ): Promise<void> {
    if (!petId) return;

    const pet = await this.petRepository.findOne({
      where: { id: petId },
      select: ['id', 'ownerId'],
    });

    if (!pet) {
      throw new NotFoundException('关联宠物不存在');
    }
    if (pet.ownerId !== userId) {
      throw new ForbiddenException('只能关联自己的宠物档案');
    }
  }

  private validateMediaPayload(
    mediaType: Post['mediaType'],
    mediaUrls?: string[],
  ): void {
    if (!mediaType) return;

    const mediaCount = mediaUrls?.length ?? 0;
    if (mediaCount === 0) {
      throw new BadRequestException('存在媒体类型时必须提供媒体资源');
    }

    if (mediaType === MediaType.IMAGE && mediaCount > 6) {
      throw new BadRequestException('图片最多上传6张');
    }
    if (mediaType === MediaType.VIDEO && mediaCount !== 1) {
      throw new BadRequestException('视频仅支持上传1个');
    }
  }
}
