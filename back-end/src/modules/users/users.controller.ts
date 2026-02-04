import {
  Controller,
  Get,
  Body,
  Patch,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type AuthRequest = ExpressRequest & { user: { userId: string } };

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: AuthRequest) {
    const user = await this.usersService.findWithPets(req.user.userId);
    const { passwordHash, ...result } = user;
    void passwordHash;
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req: AuthRequest,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(req.user.userId, updateUserDto);
    const { passwordHash, ...result } = user;
    void passwordHash;
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('profile')
  async deleteProfile(@Request() req: AuthRequest) {
    await this.usersService.remove(req.user.userId);
    return { success: true };
  }
}
