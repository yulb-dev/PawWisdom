import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class AnalyzeEmotionDto {
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsOptional()
  @IsUUID()
  petId?: string;
}
