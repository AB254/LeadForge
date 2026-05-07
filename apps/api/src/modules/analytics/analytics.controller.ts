import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TrendsQueryDto } from './dto/analytics.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('trends')
  getTrends(@Query() query: TrendsQueryDto) {
    return this.analyticsService.getTrends(query);
  }

  @Get('top-niches')
  getTopNiches(@Query('limit') limit?: string) {
    return this.analyticsService.getTopNiches(
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('top-cities')
  getTopCities(@Query('limit') limit?: string) {
    return this.analyticsService.getTopCities(
      limit ? parseInt(limit, 10) : 10,
    );
  }
}
