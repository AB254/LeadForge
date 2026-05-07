import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScraperController } from './scraper.controller';
import { ScraperService, SCRAPING_QUEUE } from './scraper.service';
import { DatabaseProvider } from '../../config/database.provider';

@Module({
  imports: [
    BullModule.registerQueue({
      name: SCRAPING_QUEUE,
    }),
  ],
  controllers: [ScraperController],
  providers: [ScraperService, DatabaseProvider],
  exports: [ScraperService],
})
export class ScraperModule {}
