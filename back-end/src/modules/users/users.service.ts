import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const { password, ...userData } = createUserDto;
      const passwordHash = await bcrypt.hash(password, 10);

      // 如果没有提供用户名，生成默认用户名
      if (!userData.username) {
        userData.username = await this.generateDefaultUsername();
      }

      const user = this.userRepository.create({
        ...userData,
        passwordHash,
      });

      return await this.userRepository.save(user);
    } catch (error) {
      const errorCode = (error as { code?: string }).code;
      if (errorCode === '23505') {
        throw new ConflictException('Username, email or phone already exists');
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  /**
   * 生成唯一的默认用户名
   * 格式: user_随机8位数字
   */
  private async generateDefaultUsername(): Promise<string> {
    let username: string;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      // 生成 8 位随机数字
      const randomNum = Math.floor(10000000 + Math.random() * 90000000);
      username = `user_${randomNum}`;

      // 检查用户名是否已存在
      const existingUser = await this.userRepository.findOne({
        where: { username },
      });

      if (!existingUser) {
        return username;
      }

      attempts++;
    }

    throw new InternalServerErrorException(
      'Failed to generate unique username',
    );
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, isDeleted: false },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { phone, isDeleted: false },
    });
  }

  async findByEmailOrPhone(identifier: string): Promise<User | null> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('(user.email = :identifier OR user.phone = :identifier)', {
        identifier,
      })
      .getOne();

    return user;
  }

  async findWithPets(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['pets'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    Object.assign(user, updateUserDto);

    try {
      return await this.userRepository.save(user);
    } catch (error) {
      const errorCode = (error as { code?: string }).code;
      if (errorCode === '23505') {
        throw new ConflictException('Username, email or phone already exists');
      }
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.isDeleted = true;
    await this.userRepository.save(user);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }
}
