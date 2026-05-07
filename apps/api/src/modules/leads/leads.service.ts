import {
  Injectable,
  Inject,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@leadforge/database';
import { PRISMA_CLIENT } from '../../config/database.provider';
import { ListLeadsDto, UpdateLeadDto } from './dto/lead.dto';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
  ) {}

  async findAll(query: ListLeadsDto) {
    const {
      priority,
      status,
      hasWebsite,
      minScore,
      maxScore,
      city,
      category,
      search,
      page = 1,
      limit = 20,
      sortBy = 'score',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.LeadWhereInput = {};

    if (priority) where.priority = priority;
    if (status) where.status = status;
    if (hasWebsite !== undefined) where.hasWebsite = hasWebsite;
    if (minScore !== undefined || maxScore !== undefined) {
      where.score = {};
      if (minScore !== undefined) where.score.gte = minScore;
      if (maxScore !== undefined) where.score.lte = maxScore;
    }

    if (city || category || search) {
      where.business = {};
      if (city) where.business.city = { contains: city, mode: 'insensitive' };
      if (category)
        where.business.category = { contains: category, mode: 'insensitive' };
      if (search) {
        where.business.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }
    }

    const allowedSortFields = [
      'score',
      'priority',
      'status',
      'createdAt',
      'updatedAt',
    ];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'score';

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: {
          business: true,
        },
        orderBy: { [orderField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        business: {
          include: {
            websiteAnalyses: {
              orderBy: { analyzedAt: 'desc' },
              take: 1,
            },
          },
        },
        outreachMessages: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    return lead;
  }

  async update(id: string, dto: UpdateLeadDto) {
    await this.findOne(id);

    return this.prisma.lead.update({
      where: { id },
      data: dto,
      include: { business: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.lead.delete({ where: { id } });
    return { deleted: true };
  }

  async getStats() {
    const [
      total,
      byPriority,
      byStatus,
      avgScoreResult,
    ] = await Promise.all([
      this.prisma.lead.count(),
      this.prisma.lead.groupBy({
        by: ['priority'],
        _count: { id: true },
      }),
      this.prisma.lead.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.lead.aggregate({
        _avg: { score: true },
        _max: { score: true },
        _min: { score: true },
      }),
    ]);

    const priorityMap: Record<string, number> = {};
    for (const p of byPriority) {
      priorityMap[p.priority] = p._count.id;
    }

    const statusMap: Record<string, number> = {};
    for (const s of byStatus) {
      statusMap[s.status] = s._count.id;
    }

    return {
      total,
      byPriority: priorityMap,
      byStatus: statusMap,
      averageScore: avgScoreResult._avg.score ?? 0,
      maxScore: avgScoreResult._max.score ?? 0,
      minScore: avgScoreResult._min.score ?? 0,
    };
  }
}
