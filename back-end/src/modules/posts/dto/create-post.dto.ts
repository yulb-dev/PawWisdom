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
}
