import { api } from '../config/api.config';

export interface Post {
  id: string;
  userId: string;
  petId?: string;
  content: string;
  mediaType?: 'image' | 'video';
  mediaUrls?: string[];
  aiAnalysis?: {
    emotion?: string;
    confidence?: number;
    description?: string;
    moodCardUrl?: string;
  };
  likeCount: number;
  commentCount: number;
  shareCount: number;
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
}

export interface CreatePostRequest {
  petId?: string;
  content: string;
  mediaType?: 'image' | 'video';
  mediaUrls?: string[];
  aiAnalysis?: {
    emotion?: string;
    confidence?: number;
    description?: string;
    moodCardUrl?: string;
  };
  hashtags?: string[];
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
}

export const postService = new PostService();
