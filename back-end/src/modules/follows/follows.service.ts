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

  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isDeleted: false },
      select: ['id'],
    });

    if (!user) {
      throw new NotFoundException('目标用户不存在');
    }
  }
}
