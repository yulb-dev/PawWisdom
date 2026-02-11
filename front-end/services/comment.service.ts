import { api } from '../config/api.config';

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  parentId?: string;
  replyToUserId?: string;
  content: string;
  images?: string[];
  likeCount: number;
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    nickname?: string;
    avatarUrl?: string;
  };
  replyToUser?: {
    id: string;
    username: string;
    nickname?: string;
  };
  isLiked?: boolean;
}

export interface CreateCommentRequest {
  postId: string;
  content: string;
  images?: string[];
  parentId?: string;
  replyToUserId?: string;
}

export interface PaginatedCommentsResult {
  data: Comment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class CommentService {
  /**
   * 创建评论
   */
  async createComment(data: CreateCommentRequest): Promise<Comment> {
    const response = await api.post<Comment>('/comments', data);
    return response.data;
  }

  /**
   * 获取动态的评论列表
   */
  async getCommentsByPost(
    postId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedCommentsResult> {
    const response = await api.get<PaginatedCommentsResult>('/comments', {
      params: { postId, page, limit },
    });
    return response.data;
  }

  /**
   * 获取评论的回复列表
   */
  async getReplies(
    commentId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedCommentsResult> {
    const response = await api.get<PaginatedCommentsResult>(
      `/comments/${commentId}/replies`,
      {
        params: { page, limit },
      },
    );
    return response.data;
  }

  /**
   * 更新评论
   */
  async updateComment(id: string, content: string): Promise<Comment> {
    const response = await api.patch<Comment>(`/comments/${id}`, { content });
    return response.data;
  }

  /**
   * 删除评论
   */
  async deleteComment(id: string): Promise<void> {
    await api.delete(`/comments/${id}`);
  }

  /**
   * 点赞评论
   */
  async likeComment(id: string): Promise<void> {
    await api.post(`/comments/${id}/like`);
  }

  /**
   * 取消点赞
   */
  async unlikeComment(id: string): Promise<void> {
    await api.delete(`/comments/${id}/like`);
  }

  /**
   * 检查评论点赞状态
   */
  async checkLikeStatus(id: string): Promise<boolean> {
    const response = await api.get<{ isLiked: boolean }>(
      `/comments/${id}/like/status`,
    );
    return response.data.isLiked;
  }

  /**
   * 置顶评论
   */
  async pinComment(id: string): Promise<Comment> {
    const response = await api.post<Comment>(`/comments/${id}/pin`);
    return response.data;
  }

  /**
   * 取消置顶
   */
  async unpinComment(id: string): Promise<Comment> {
    const response = await api.delete<Comment>(`/comments/${id}/pin`);
    return response.data;
  }
}

export const commentService = new CommentService();
