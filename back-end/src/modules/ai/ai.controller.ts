import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService, EmotionAnalysisResult } from './ai.service';
import { AnalyzeEmotionDto } from './dto/analyze-emotion.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * 分析宠物情绪
   * POST /api/ai/analyze-emotion
   */
  @Post('analyze-emotion')
  @HttpCode(HttpStatus.OK)
  async analyzeEmotion(
    @Body() analyzeEmotionDto: AnalyzeEmotionDto,
  ): Promise<EmotionAnalysisResult> {
    return this.aiService.analyzePetEmotion({
      imageUrl: analyzeEmotionDto.imageUrl,
      petId: analyzeEmotionDto.petId,
    });
  }
}
