import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

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
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      user,
      password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
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
      throw new UnauthorizedException('User not found');
    }
    const { passwordHash, ...result } = user;
    void passwordHash;
    return result;
  }

  private generateToken(userId: string): string {
    const payload = { sub: userId };
    return this.jwtService.sign(payload);
  }
}
