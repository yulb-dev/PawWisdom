import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { WechatCodeDto, WechatLoginDto } from './dto/wechat-login.dto';
import { PhoneCodeDto } from './dto/phone-code.dto';
import { PhoneLoginDto } from './dto/phone-login.dto';

type PhoneCodeRecord = {
  code: string;
  expiresAt: number;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private readonly phoneCodeStore = new Map<string, PhoneCodeRecord>();

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);
    const { passwordHash, ...result } = user;
    void passwordHash;

    const token = this.generateToken(user.id);

    return {
      user: result,
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { identifier, password } = loginDto;

    const user = await this.usersService.findByEmailOrPhone(identifier);

    if (!user) {
      throw new UnauthorizedException('账号或密码错误');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      user,
      password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('账号或密码错误');
    }

    const { passwordHash, ...result } = user;
    void passwordHash;
    const token = this.generateToken(user.id);

    return {
      user: result,
      token,
    };
  }

  async wechatLogin(wechatLoginDto: WechatLoginDto) {
    const { openId } = wechatLoginDto;

    let user = await this.usersService.findByWechatOpenId(openId);
    if (!user) {
      const password = this.generateWechatPassword();
      const email = this.buildWechatEmail(openId);
      user = await this.usersService.create({
        email,
        password,
        wechatOpenId: openId,
      });
    }

    const { passwordHash, ...result } = user;
    void passwordHash;
    const token = this.generateToken(user.id);

    return {
      user: result,
      token,
    };
  }

  async wechatCodeLogin(wechatCodeDto: WechatCodeDto) {
    const appId = this.configService.get<string>('WECHAT_APP_ID');
    const appSecret = this.configService.get<string>('WECHAT_APP_SECRET');
    if (!appId || !appSecret) {
      throw new InternalServerErrorException('微信登录配置缺失');
    }

    const { code } = wechatCodeDto;
    const url = new URL('https://api.weixin.qq.com/sns/oauth2/access_token');
    url.searchParams.set('appid', appId);
    url.searchParams.set('secret', appSecret);
    url.searchParams.set('code', code);
    url.searchParams.set('grant_type', 'authorization_code');

    const response = await fetch(url.toString());
    const data = (await response.json()) as {
      access_token?: string;
      openid?: string;
      unionid?: string;
      errcode?: number;
      errmsg?: string;
    };

    if (!response.ok || data.errcode || !data.openid) {
      throw new UnauthorizedException(data.errmsg || '微信授权失败');
    }

    let user = await this.usersService.findByWechatOpenId(data.openid);
    if (!user) {
      const password = this.generateWechatPassword();
      const email = this.buildWechatEmail(data.openid);
      user = await this.usersService.create({
        email,
        password,
        wechatOpenId: data.openid,
      });
    }

    const { passwordHash, ...result } = user;
    void passwordHash;
    const token = this.generateToken(user.id);

    return {
      user: result,
      token,
    };
  }

  async sendPhoneCode(phoneCodeDto: PhoneCodeDto) {
    const { phone } = phoneCodeDto;
    const code = '0000';
    const expiresAt = Date.now() + 5 * 60 * 1000;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.phoneCodeStore.set(phone, { code, expiresAt });
    return { success: true };
  }

  async phoneLogin(phoneLoginDto: PhoneLoginDto) {
    const { phone, code } = phoneLoginDto;
    const record = this.phoneCodeStore.get(phone);
    if (!record || record.code !== code || record.expiresAt < Date.now()) {
      throw new UnauthorizedException('验证码错误或已过期');
    }
    this.phoneCodeStore.delete(phone);

    let user = await this.usersService.findByPhone(phone);
    if (!user) {
      const email = this.buildPhoneEmail(phone);
      const password = this.generateSmsPassword();
      user = await this.usersService.create({
        email,
        password,
        phone,
      });
    }

    const { passwordHash, ...result } = user;
    void passwordHash;
    const token = this.generateToken(user.id);

    return {
      user: result,
      token,
    };
  }

  async validateUser(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    const { passwordHash, ...result } = user;
    void passwordHash;
    return result;
  }

  private generateToken(userId: string): string {
    const payload = { sub: userId };
    return this.jwtService.sign(payload);
  }

  private generateWechatPassword(): string {
    const seed = Math.random().toString(36).slice(2, 8);
    return `WxA1${seed}`;
  }

  private buildWechatEmail(openId: string): string {
    const safeOpenId = openId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
    return `wx_${safeOpenId || Date.now()}@pawwisdom.local`;
  }

  private buildPhoneEmail(phone: string): string {
    return `phone_${phone}@pawwisdom.local`;
  }

  private generateSmsPassword(): string {
    const seed = Math.random().toString(36).slice(2, 8);
    return `SmsA1${seed}`;
  }
}
