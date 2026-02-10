import { api } from '../config/api.config';

export interface EmotionAnalysisResult {
  emotion: string;
  confidence: number;
  description: string;
  moodCardUrl?: string;
  petType?: string;
  breed?: string;
}

export interface AnalyzeEmotionRequest {
  imageUrl: string;
  petId?: string;
}

class AiService {
  /**
   * 分析宠物情绪
   */
  async analyzeEmotion(
    request: AnalyzeEmotionRequest,
  ): Promise<EmotionAnalysisResult> {
    const response = await api.post<EmotionAnalysisResult>(
      '/ai/analyze-emotion',
      request,
    );
    return response.data;
  }
}

export const aiService = new AiService();
