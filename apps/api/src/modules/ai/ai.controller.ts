import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import {
  AnalyzeWebsiteDto,
  ScoreLeadDto,
  GenerateOutreachDto,
  BatchAnalyzeDto,
} from './dto/ai.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze-website')
  analyzeWebsite(@Body() dto: AnalyzeWebsiteDto) {
    return this.aiService.analyzeWebsite(dto);
  }

  @Post('score-lead')
  scoreLead(@Body() dto: ScoreLeadDto) {
    return this.aiService.scoreLead(dto);
  }

  @Post('generate-outreach')
  generateOutreach(@Body() dto: GenerateOutreachDto) {
    return this.aiService.generateOutreach(dto);
  }

  @Post('batch-analyze')
  batchAnalyze(@Body() dto: BatchAnalyzeDto) {
    return this.aiService.batchAnalyze(dto);
  }
}
