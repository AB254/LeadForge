import {
  Injectable,
  Inject,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { PrismaClient } from '@leadforge/database';
import { PRISMA_CLIENT } from '../../config/database.provider';
import {
  CreateScrapingJobDto,
  ListScrapingJobsDto,
} from './dto/scraper.dto';

export const SCRAPING_QUEUE = 'scraping';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    @InjectQueue(SCRAPING_QUEUE) private readonly scrapingQueue: Queue,
  ) {}

  async createJob(dto: CreateScrapingJobDto) {
    const job = await this.prisma.scrapingJob.create({
      data: {
        query: dto.query,
        city: dto.city,
        country: dto.country,
        radius: dto.radius,
        status: 'PENDING',
      },
    });

    await this.scrapingQueue.add('scrape', {
      jobId: job.id,
      query: dto.query,
      city: dto.city,
      country: dto.country,
      radius: dto.radius,
    });

    this.logger.log(`Scraping job created: ${job.id}`);
    return job;
  }

  async findAll(query: ListScrapingJobsDto) {
    const { status, page = 1, limit = 20 } = query;

    const where: any = {};
    if (status) where.status = status;

    const [jobs, total] = await Promise.all([
      this.prisma.scrapingJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.scrapingJob.count({ where }),
    ]);

    return {
      jobs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const job = await this.prisma.scrapingJob.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException(`Scraping job with ID "${id}" not found`);
    }

    // Get queue job for live progress
    const queueJob = await this.scrapingQueue.getJob(id);
    const progress = queueJob ? await queueJob.progress : null;

    return { ...job, queueProgress: progress };
  }

  async cancelJob(id: string) {
    const job = await this.findOne(id);

    if (job.status === 'COMPLETED' || job.status === 'FAILED') {
      throw new NotFoundException(
        `Job "${id}" is already ${job.status.toLowerCase()} and cannot be cancelled`,
      );
    }

    const queueJob = await this.scrapingQueue.getJob(id);
    if (queueJob) {
      await queueJob.remove();
    }

    return this.prisma.scrapingJob.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async getJobBusinesses(id: string, page = 1, limit = 20) {
    await this.findOne(id);

    // Businesses are linked through the scraping job's query+city context
    // In a real implementation, there would be a join table. Here we query
    // businesses matching the job's city and category.
    const job = await this.prisma.scrapingJob.findUnique({ where: { id } });

    const where: any = {
      city: { contains: job!.city, mode: 'insensitive' },
    };

    const [businesses, total] = await Promise.all([
      this.prisma.business.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.business.count({ where }),
    ]);

    return {
      businesses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
