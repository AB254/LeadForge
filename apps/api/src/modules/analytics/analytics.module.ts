import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { DatabaseProvider } from '../../config/database.provider';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, DatabaseProvider],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
