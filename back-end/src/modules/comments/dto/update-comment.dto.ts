import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  content?: string;
}
