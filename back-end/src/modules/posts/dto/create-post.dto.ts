import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsArray,
  IsEnum,
  IsObject,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { MediaType } from '../../../entities/post.entity';

export class CreatePostDto {
  @IsUUID()
  @IsOptional()
  petId?: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @IsEnum(MediaType)
  @IsOptional()
  mediaType?: MediaType;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(9)
  @IsOptional()
  mediaUrls?: string[];

  @IsString()
  @MaxLength(500)
  @IsOptional()
  coverImageUrl?: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  petMood?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(20)
  @IsOptional()
  mentionedUserIds?: string[];

  @IsObject()
  @IsOptional()
  aiAnalysis?: {
    emotion?: string;
    confidence?: number;
    description?: string;
    moodCardUrl?: string;
  };

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  hashtags?: string[];

  @IsOptional()
  isDraft?: boolean;
}
