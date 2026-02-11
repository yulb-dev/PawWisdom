import {
  Controller,
  Post as HttpPost,
  Delete,
  Get,
  Param,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FollowsService } from './follows.service';

type AuthRequest = ExpressRequest & { user: { userId: string } };

@Controller('follows')
@UseGuards(JwtAuthGuard)
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @HttpPost(':targetUserId')
  @HttpCode(HttpStatus.OK)
  async follow(
    @Param('targetUserId') targetUserId: string,
    @Request() req: AuthRequest,
  ): Promise<{ success: boolean }> {
    await this.followsService.followUser(req.user.userId, targetUserId);
    return { success: true };
  }

  @Delete(':targetUserId')
  @HttpCode(HttpStatus.OK)
  async unfollow(
    @Param('targetUserId') targetUserId: string,
    @Request() req: AuthRequest,
  ): Promise<{ success: boolean }> {
    await this.followsService.unfollowUser(req.user.userId, targetUserId);
    return { success: true };
  }

  @Get(':targetUserId/status')
  async getFollowStatus(
    @Param('targetUserId') targetUserId: string,
    @Request() req: AuthRequest,
  ): Promise<{ isFollowing: boolean }> {
    const isFollowing = await this.followsService.isFollowing(
      req.user.userId,
      targetUserId,
    );
    return { isFollowing };
  }

  @Get('me/stats')
  async getMyStats(@Request() req: AuthRequest): Promise<{
    followerCount: number;
    followingCount: number;
  }> {
    return this.followsService.getFollowStats(req.user.userId);
  }
}
