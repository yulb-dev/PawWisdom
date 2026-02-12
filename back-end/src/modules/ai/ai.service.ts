import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmotionAnalysisResult {
  emotion: string;
  confidence: number;
  description: string;
  moodCardUrl?: string;
  petType?: string;
  breed?: string;
}

export interface EmotionAnalysisOptions {
  imageUrl: string;
  petId?: string;
}

@Injectable()
export class AiService {
  private readonly aiProvider: string;
  private readonly baiduApiKey: string;
  private readonly baiduSecretKey: string;

  constructor(private configService: ConfigService) {
    this.aiProvider = this.configService.get<string>('AI_PROVIDER', 'baidu');
    this.baiduApiKey = this.configService.get<string>('BAIDU_AI_API_KEY', '');
    this.baiduSecretKey = this.configService.get<string>(
      'BAIDU_AI_SECRET_KEY',
      '',
    );
  }

  /**
   * 分析宠物情绪
   */
  async analyzePetEmotion(
    options: EmotionAnalysisOptions,
  ): Promise<EmotionAnalysisResult> {
    if (this.aiProvider === 'baidu') {
      return this.analyzePetEmotionWithBaidu(options);
    }

    // 默认使用模拟数据
    return this.getMockEmotionAnalysis();
  }

  /**
   * 使用百度AI分析宠物情绪
   */
  private async analyzePetEmotionWithBaidu(
    options: EmotionAnalysisOptions,
  ): Promise<EmotionAnalysisResult> {
    try {
      // 检查配置
      if (!this.baiduApiKey || !this.baiduSecretKey) {
        console.warn('百度AI配置未设置，使用模拟数据');
        return this.getMockEmotionAnalysis();
      }

      // 1. 获取access_token
      const accessToken = await this.getBaiduAccessToken();

      // 2. 调用图像识别API
      const imageData = await this.getImageBase64(options.imageUrl);

      // 使用百度通用物体识别API
      const apiUrl = `https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general?access_token=${accessToken}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `image=${encodeURIComponent(imageData)}`,
      });

      if (!response.ok) {
        throw new Error('百度AI API调用失败');
      }

      const result = (await response.json()) as {
        result?: Array<{ keyword: string; score: number }>;
      };

      // 3. 解析结果并生成情绪分析
      return this.parseBaiduResult(result);
    } catch (error) {
      console.error('百度AI调用错误:', error);
      // 失败时返回模拟数据
      return this.getMockEmotionAnalysis();
    }
  }

  /**
   * 获取百度AI access_token
   */
  private async getBaiduAccessToken(): Promise<string> {
    try {
      const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.baiduApiKey}&client_secret=${this.baiduSecretKey}`;

      const response = await fetch(tokenUrl);
      const data = (await response.json()) as { access_token?: string };

      if (data.access_token) {
        return data.access_token;
      }

      throw new Error('获取access_token失败');
    } catch {
      throw new InternalServerErrorException('百度AI认证失败');
    }
  }

  /**
   * 获取图片的base64编码
   */
  private async getImageBase64(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer).toString('base64');
    } catch {
      throw new BadRequestException('无法获取图片');
    }
  }

  /**
   * 解析百度API结果
   */
  private parseBaiduResult(result: {
    result?: Array<{ keyword: string; score: number }>;
  }): EmotionAnalysisResult {
    if (!result.result || result.result.length === 0) {
      return this.getMockEmotionAnalysis();
    }

    const topResult = result.result[0];

    // 根据识别结果推断情绪
    const emotions = [
      { name: '开心', keywords: ['笑', 'happy', '玩', '跑', '活泼'] },
      { name: '好奇', keywords: ['看', '观察', '探索', '闻'] },
      { name: '放松', keywords: ['躺', '睡', '休息', '舒适'] },
      { name: '警惕', keywords: ['盯', '站立', '耳朵', '注意'] },
      { name: '撒娇', keywords: ['蹭', '靠近', '依偎'] },
    ];

    let detectedEmotion = '愉快';
    let maxScore = 0;

    for (const emotion of emotions) {
      const score = emotion.keywords.reduce((acc, keyword) => {
        return (
          acc + (topResult.keyword.toLowerCase().includes(keyword) ? 1 : 0)
        );
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        detectedEmotion = emotion.name;
      }
    }

    return {
      emotion: detectedEmotion,
      confidence: topResult.score || 0.85,
      description: this.getEmotionDescription(detectedEmotion),
      petType: this.detectPetType(topResult.keyword),
    };
  }

  /**
   * 检测宠物类型
   */
  private detectPetType(keyword: string): string {
    const lowerKeyword = keyword.toLowerCase();
    if (lowerKeyword.includes('cat') || lowerKeyword.includes('猫')) {
      return 'cat';
    }
    if (lowerKeyword.includes('dog') || lowerKeyword.includes('狗')) {
      return 'dog';
    }
    return 'unknown';
  }

  /**
   * 获取情绪描述
   */
  private getEmotionDescription(emotion: string): string {
    const descriptions: Record<string, string> = {
      开心: '你的宠物看起来很开心！它可能正在享受快乐的时光。',
      好奇: '你的宠物对周围的事物充满好奇，这表明它精神状态很好。',
      放松: '你的宠物看起来很放松，这是健康和满足的标志。',
      警惕: '你的宠物处于警觉状态，可能注意到了什么有趣的事物。',
      撒娇: '你的宠物正在向你表达爱意，快去回应它吧！',
      愉快: '你的宠物状态看起来不错，继续保持！',
    };

    return descriptions[emotion] || descriptions['愉快'];
  }

  /**
   * 获取模拟数据（用于开发测试或AI服务不可用时）
   */
  private getMockEmotionAnalysis(): EmotionAnalysisResult {
    const emotions = [
      {
        emotion: '开心',
        description: '你的宠物看起来很开心！它可能正在享受快乐的时光。',
      },
      {
        emotion: '好奇',
        description: '你的宠物对周围的事物充满好奇，这表明它精神状态很好。',
      },
      {
        emotion: '放松',
        description: '你的宠物看起来很放松，这是健康和满足的标志。',
      },
      {
        emotion: '撒娇',
        description: '你的宠物正在向你表达爱意，快去回应它吧！',
      },
      {
        emotion: '警惕',
        description: '你的宠物处于警觉状态，可能注意到了什么有趣的事物。',
      },
    ];

    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];

    return {
      emotion: randomEmotion.emotion,
      confidence: 0.75 + Math.random() * 0.2, // 0.75-0.95之间
      description: randomEmotion.description,
      petType: Math.random() > 0.5 ? 'dog' : 'cat',
    };
  }

  /**
   * 生成心情卡片（可以使用AI生成或模板生成）
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generateMoodCard(_emotion: string, _petName: string): Promise<string> {
    // TODO: 实现心情卡片生成
    // 可以使用canvas在后端生成，或者返回前端生成的参数
    return Promise.resolve('');
  }
}
