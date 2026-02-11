import { api } from '../config/api.config';

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
}

export const followService = new FollowService();
