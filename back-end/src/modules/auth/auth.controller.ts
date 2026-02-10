import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { WechatCodeDto, WechatLoginDto } from './dto/wechat-login.dto';
import { PhoneCodeDto } from './dto/phone-code.dto';
import { PhoneLoginDto } from './dto/phone-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

type AuthRequest = ExpressRequest & { user: { userId: string } };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('wechat')
  async wechatLogin(@Body() wechatLoginDto: WechatLoginDto) {
    return this.authService.wechatLogin(wechatLoginDto);
  }

  @Post('wechat/code')
  async wechatCodeLogin(@Body() wechatCodeDto: WechatCodeDto) {
    return this.authService.wechatCodeLogin(wechatCodeDto);
  }

  @Post('phone/code')
  async sendPhoneCode(@Body() phoneCodeDto: PhoneCodeDto) {
    return this.authService.sendPhoneCode(phoneCodeDto);
  }

  @Post('phone/login')
  async phoneLogin(@Body() phoneLoginDto: PhoneLoginDto) {
    return this.authService.phoneLogin(phoneLoginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: AuthRequest) {
    return this.authService.validateUser(req.user.userId);
  }
}
