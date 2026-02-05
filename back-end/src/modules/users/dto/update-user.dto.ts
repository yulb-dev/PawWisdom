import {
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  backgroundUrl?: string;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsDateString()
  birthday?: string;

  @IsOptional()
  @IsIn(['male', 'female', 'secret'])
  gender?: 'male' | 'female' | 'secret';

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsString()
  occupation?: string;
}
