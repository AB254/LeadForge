import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { ScraperService } from './scraper.service';
import {
  CreateScrapingJobDto,
  ListScrapingJobsDto,
} from './dto/scraper.dto';

@Controller('scraper/jobs')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post()
  createJob(@Body() dto: CreateScrapingJobDto) {
    return this.scraperService.createJob(dto);
  }

  @Get()
  findAll(@Query() query: ListScrapingJobsDto) {
    return this.scraperService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scraperService.findOne(id);
  }

  @Delete(':id')
  cancelJob(@Param('id') id: string) {
    return this.scraperService.cancelJob(id);
  }

  @Get(':id/businesses')
  getJobBusinesses(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.scraperService.getJobBusinesses(id, page || 1, limit || 20);
  }
}
