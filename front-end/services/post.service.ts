import { api } from '../config/api.config';

export interface Post {
  id: string;
  userId: string;
  petId?: string;
  title?: string;
  content: string;
  mediaType?: 'image' | 'video';
  mediaUrls?: string[];
  coverImageUrl?: string;
  petMood?: string;
  mentionedUserIds?: string[];
  aiAnalysis?: {
    emotion?: string;
    confidence?: number;
    description?: string;
    moodCardUrl?: string;
  };
  likeCount: number;
  commentCount: number;
  shareCount: number;
  favoriteCount: number;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    nickname?: string;
    avatarUrl?: string;
  };
  pet?: {
    id: string;
    name: string;
    species: string;
    avatarUrl?: string;
  };
  hashtags?: {
    id: string;
    name: string;
  }[];
  isLiked?: boolean;
  isFavorited?: boolean;
  isFollowingAuthor?: boolean;
}

export interface CreatePostRequest {
  petId?: string;
  title?: string;
  content: string;
  mediaType?: 'image' | 'video';
  mediaUrls?: string[];
  coverImageUrl?: string;
  petMood?: string;
  mentionedUserIds?: string[];
  aiAnalysis?: {
    emotion?: string;
    confidence?: number;
    description?: string;
    moodCardUrl?: string;
  };
  hashtags?: string[];
  isDraft?: boolean;
}

export interface UpdatePostRequest {
  content?: string;
  hashtags?: string[];
}

export interface QueryPostsParams {
  page?: number;
  limit?: number;
  sortBy?: 'latest' | 'popular' | 'hot';
  userId?: string;
  petId?: string;
  hashtag?: string;
}

export interface PaginatedPostsResult {
  data: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class PostService {
  /**
   * 创建动态
   */
  async createPost(data: CreatePostRequest): Promise<Post> {
    const response = await api.post<Post>('/posts', data);
    return response.data;
  }

  /**
   * 查询动态列表
   */
  async getPosts(params: QueryPostsParams): Promise<PaginatedPostsResult> {
    const response = await api.get<PaginatedPostsResult>('/posts', { params });
    return response.data;
  }

  /**
   * 获取推荐动态流
   */
  async getRecommendedFeed(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedPostsResult> {
    const response = await api.get<PaginatedPostsResult>(
      '/posts/feed/recommended',
      {
        params: { page, limit },
      },
    );
    return response.data;
  }

  /**
   * 获取关注用户的动态流
   */
  async getFollowingFeed(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedPostsResult> {
    const response = await api.get<PaginatedPostsResult>(
      '/posts/feed/following',
      {
        params: { page, limit },
      },
    );
    return response.data;
  }

  /**
   * 获取单个动态详情
   */
  async getPost(id: string): Promise<Post> {
    const response = await api.get<Post>(`/posts/${id}`);
    return response.data;
  }

  /**
   * 更新动态
   */
  async updatePost(id: string, data: UpdatePostRequest): Promise<Post> {
    const response = await api.patch<Post>(`/posts/${id}`, data);
    return response.data;
  }

  /**
   * 删除动态
   */
  async deletePost(id: string): Promise<void> {
    await api.delete(`/posts/${id}`);
  }

  /**
   * 点赞动态
   */
  async likePost(id: string): Promise<void> {
    await api.post(`/posts/${id}/like`);
  }

  /**
   * 取消点赞
   */
  async unlikePost(id: string): Promise<void> {
    await api.delete(`/posts/${id}/like`);
  }

  /**
   * 分享动态
   */
  async sharePost(id: string): Promise<void> {
    await api.post(`/posts/${id}/share`);
  }

  /**
   * 获取草稿列表
   */
  async getDrafts(page: number = 1, limit: number = 20): Promise<PaginatedPostsResult> {
    const response = await api.get<PaginatedPostsResult>('/posts/me/drafts', {
      params: { page, limit },
    });
    return response.data;
  }

  /**
   * 获取用户点赞的动态
   */
  async getLikedPosts(page: number = 1, limit: number = 20): Promise<PaginatedPostsResult> {
    const response = await api.get<PaginatedPostsResult>('/posts/me/liked', {
      params: { page, limit },
    });
    return response.data;
  }

  /**
   * 获取用户收藏的动态
   */
  async getFavoritedPosts(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedPostsResult> {
    const response = await api.get<PaginatedPostsResult>('/posts/me/favorited', {
      params: { page, limit },
    });
    return response.data;
  }

  /**
   * 获取用户的动态列表
   */
  async getUserPosts(
    includeDrafts: boolean = false,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedPostsResult> {
    const response = await api.get<PaginatedPostsResult>('/posts/me/posts', {
      params: { includeDrafts, page, limit },
    });
    return response.data;
  }

  /**
   * 收藏动态
   */
  async favoritePost(id: string): Promise<void> {
    await api.post(`/posts/${id}/favorite`);
  }

  /**
   * 取消收藏
   */
  async unfavoritePost(id: string): Promise<void> {
    await api.delete(`/posts/${id}/favorite`);
  }

  /**
   * 检查点赞状态
   */
  async checkLikeStatus(id: string): Promise<boolean> {
    const response = await api.get<{ isLiked: boolean }>(`/posts/${id}/like/status`);
    return response.data.isLiked;
  }

  /**
   * 检查收藏状态
   */
  async checkFavoriteStatus(id: string): Promise<boolean> {
    const response = await api.get<{ isFavorited: boolean }>(
      `/posts/${id}/favorite/status`,
    );
    return response.data.isFavorited;
  }

  /**
   * 获取动态交互状态（点赞/收藏/关注作者）
   */
  async getInteractionStatus(id: string): Promise<{
    isLiked: boolean;
    isFavorited: boolean;
    isFollowingAuthor: boolean;
  }> {
    const response = await api.get<{
      isLiked: boolean;
      isFavorited: boolean;
      isFollowingAuthor: boolean;
    }>(`/posts/${id}/interactions`);
    return response.data;
  }
}

export const postService = new PostService();
