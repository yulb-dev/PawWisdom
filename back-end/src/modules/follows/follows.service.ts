import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFollow } from '../../entities/user-follow.entity';
import { User } from '../../entities/user.entity';

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

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(UserFollow)
    private readonly followRepository: Repository<UserFollow>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new BadRequestException('不能关注自己');
    }

    await this.ensureUserExists(followingId);

    const existing = await this.followRepository.findOne({
      where: { followerId, followingId },
    });
    if (existing) {
      throw new ConflictException('您已关注该用户');
    }

    const relation = this.followRepository.create({ followerId, followingId });
    await this.followRepository.save(relation);
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const existing = await this.followRepository.findOne({
      where: { followerId, followingId },
    });

    if (!existing) {
      throw new NotFoundException('关注关系不存在');
    }

    await this.followRepository.remove(existing);
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const relation = await this.followRepository.findOne({
      where: { followerId, followingId },
    });
    return !!relation;
  }

  async getFollowingUserIds(followerId: string): Promise<string[]> {
    const relations = await this.followRepository.find({
      where: { followerId },
      select: ['followingId'],
    });
    return relations.map((item) => item.followingId);
  }

  async getFollowStats(userId: string): Promise<{
    followerCount: number;
    followingCount: number;
  }> {
    const [followerCount, followingCount] = await Promise.all([
      this.followRepository.count({ where: { followingId: userId } }),
      this.followRepository.count({ where: { followerId: userId } }),
    ]);

    return {
      followerCount,
      followingCount,
    };
  }

  async getFollowers(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedFollowUsersResult> {
    const { normalizedPage, normalizedLimit } = this.normalizePageLimit(
      page,
      limit,
    );

    const [relations, total] = await this.followRepository
      .createQueryBuilder('follow')
      .innerJoinAndSelect(
        'follow.follower',
        'user',
        'user.isDeleted = :isDeleted',
        { isDeleted: false },
      )
      .where('follow.followingId = :userId', { userId })
      .orderBy('follow.createdAt', 'DESC')
      .skip((normalizedPage - 1) * normalizedLimit)
      .take(normalizedLimit)
      .getManyAndCount();

    const users = relations.map((item) => ({
      id: item.follower.id,
      username: item.follower.username,
      nickname: item.follower.nickname,
      avatarUrl: item.follower.avatarUrl,
      signature: item.follower.signature,
      followedAt: item.createdAt.toISOString(),
    }));

    return {
      users,
      total,
      page: normalizedPage,
      limit: normalizedLimit,
      totalPages: Math.ceil(total / normalizedLimit),
    };
  }

  async getFollowing(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedFollowUsersResult> {
    const { normalizedPage, normalizedLimit } = this.normalizePageLimit(
      page,
      limit,
    );

    const [relations, total] = await this.followRepository
      .createQueryBuilder('follow')
      .innerJoinAndSelect(
        'follow.following',
        'user',
        'user.isDeleted = :isDeleted',
        { isDeleted: false },
      )
      .where('follow.followerId = :userId', { userId })
      .orderBy('follow.createdAt', 'DESC')
      .skip((normalizedPage - 1) * normalizedLimit)
      .take(normalizedLimit)
      .getManyAndCount();

    const users = relations.map((item) => ({
      id: item.following.id,
      username: item.following.username,
      nickname: item.following.nickname,
      avatarUrl: item.following.avatarUrl,
      signature: item.following.signature,
      followedAt: item.createdAt.toISOString(),
    }));

    return {
      users,
      total,
      page: normalizedPage,
      limit: normalizedLimit,
      totalPages: Math.ceil(total / normalizedLimit),
    };
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isDeleted: false },
      select: ['id'],
    });

    if (!user) {
      throw new NotFoundException('目标用户不存在');
    }
  }

  private normalizePageLimit(page: number, limit: number) {
    return {
      normalizedPage: page > 0 ? page : 1,
      normalizedLimit: limit > 0 && limit <= 100 ? limit : 20,
    };
  }
}
