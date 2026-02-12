import { api } from '../config/api.config';

export interface FollowUserListItem {
  id: string;
  username: string;
  nickname?: string;
  avatarUrl?: string;
  signature?: string;
  followedAt: string;
}

export interface PaginatedFollowUsersResult {
  users: FollowUserListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class FollowService {
  async followUser(targetUserId: string): Promise<void> {
    await api.post(`/follows/${targetUserId}`);
  }

  async unfollowUser(targetUserId: string): Promise<void> {
    await api.delete(`/follows/${targetUserId}`);
  }

  async getFollowStatus(targetUserId: string): Promise<boolean> {
    const response = await api.get<{ isFollowing: boolean }>(
      `/follows/${targetUserId}/status`,
    );
    return response.data.isFollowing;
  }

  async getMyFollowStats(): Promise<{
    followerCount: number;
    followingCount: number;
  }> {
    const response = await api.get<{
      followerCount: number;
      followingCount: number;
    }>('/follows/me/stats');
    return response.data;
  }

  async getMyFollowers(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedFollowUsersResult> {
    const response = await api.get<PaginatedFollowUsersResult>(
      '/follows/me/followers',
      { params: { page, limit } },
    );
    return response.data;
  }

  async getMyFollowing(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedFollowUsersResult> {
    const response = await api.get<PaginatedFollowUsersResult>(
      '/follows/me/following',
      { params: { page, limit } },
    );
    return response.data;
  }
}

export const followService = new FollowService();
