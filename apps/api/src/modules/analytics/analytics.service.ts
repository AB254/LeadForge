import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaClient } from '@leadforge/database';
import { PRISMA_CLIENT } from '../../config/database.provider';
import { TrendsQueryDto, TrendPeriod } from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
  ) {}

  async getOverview() {
    const [
      totalLeads,
      totalJobs,
      totalBusinesses,
      byPriority,
      byStatus,
      byCity,
      byCategory,
    ] = await Promise.all([
      this.prisma.lead.count(),
      this.prisma.scrapingJob.count(),
      this.prisma.business.count(),
      this.prisma.lead.groupBy({
        by: ['priority'],
        _count: { id: true },
      }),
      this.prisma.lead.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.business.groupBy({
        by: ['city'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      this.prisma.business.groupBy({
        by: ['category'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    const convertedCount = byStatus.find((s) => s.status === 'CONVERTED')?._count.id ?? 0;
    const contactedCount = byStatus.find((s) => s.status === 'CONTACTED')?._count.id ?? 0;
    const respondedCount = byStatus.find((s) => s.status === 'RESPONDED')?._count.id ?? 0;

    const conversionRate =
      totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(2) : '0';
    const responseRate =
      contactedCount > 0
        ? (((respondedCount + convertedCount) / contactedCount) * 100).toFixed(2)
        : '0';

    return {
      totalLeads,
      totalJobs,
      totalBusinesses,
      byPriority: byPriority.reduce(
        (acc, p) => ({ ...acc, [p.priority]: p._count.id }),
        {} as Record<string, number>,
      ),
      byStatus: byStatus.reduce(
        (acc, s) => ({ ...acc, [s.status]: s._count.id }),
        {} as Record<string, number>,
      ),
      byCity: byCity.map((c) => ({ city: c.city, count: c._count.id })),
      byCategory: byCategory.map((c) => ({
        category: c.category,
        count: c._count.id,
      })),
      conversionRate: parseFloat(conversionRate),
      responseRate: parseFloat(responseRate),
    };
  }

  async getTrends(query: TrendsQueryDto) {
    const { period = TrendPeriod.DAILY, startDate, endDate } = query;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    if (!startDate && !endDate) {
      // Default to last 30 days
      dateFilter.gte = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const leads = await this.prisma.lead.findMany({
      where: { createdAt: dateFilter },
      select: { createdAt: true, priority: true, score: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by period
    const grouped = new Map<string, { count: number; avgScore: number; scores: number[] }>();

    for (const lead of leads) {
      const key = this.getDateKey(lead.createdAt, period);
      const existing = grouped.get(key) || { count: 0, avgScore: 0, scores: [] };
      existing.count += 1;
      existing.scores.push(lead.score);
      grouped.set(key, existing);
    }

    const trends = Array.from(grouped.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      avgScore:
        data.scores.length > 0
          ? Math.round(
              data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
            )
          : 0,
    }));

    return { period, trends };
  }

  private getDateKey(date: Date, period: TrendPeriod): string {
    const d = new Date(date);
    switch (period) {
      case TrendPeriod.DAILY:
        return d.toISOString().split('T')[0];
      case TrendPeriod.WEEKLY: {
        const day = d.getDay();
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - day);
        return weekStart.toISOString().split('T')[0];
      }
      case TrendPeriod.MONTHLY:
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      default:
        return d.toISOString().split('T')[0];
    }
  }

  async getTopNiches(limit = 10) {
    const niches = await this.prisma.business.groupBy({
      by: ['category'],
      _count: { id: true },
      _avg: { googleRating: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    // Enrich with lead stats per category
    const enriched = await Promise.all(
      niches.map(async (niche) => {
        const leadStats = await this.prisma.lead.aggregate({
          where: { business: { category: niche.category } },
          _avg: { score: true },
          _count: { id: true },
        });

        const hotLeads = await this.prisma.lead.count({
          where: {
            business: { category: niche.category },
            priority: 'HOT',
          },
        });

        return {
          category: niche.category,
          businessCount: niche._count.id,
          avgGoogleRating: niche._avg.googleRating
            ? parseFloat(niche._avg.googleRating.toFixed(2))
            : null,
          leadCount: leadStats._count.id,
          avgLeadScore: leadStats._avg.score
            ? Math.round(leadStats._avg.score)
            : 0,
          hotLeadCount: hotLeads,
        };
      }),
    );

    return enriched;
  }

  async getTopCities(limit = 10) {
    const cities = await this.prisma.business.groupBy({
      by: ['city', 'country'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const enriched = await Promise.all(
      cities.map(async (cityGroup) => {
        const leadStats = await this.prisma.lead.aggregate({
          where: { business: { city: cityGroup.city } },
          _avg: { score: true },
          _count: { id: true },
        });

        const hotLeads = await this.prisma.lead.count({
          where: {
            business: { city: cityGroup.city },
            priority: 'HOT',
          },
        });

        return {
          city: cityGroup.city,
          country: cityGroup.country,
          businessCount: cityGroup._count.id,
          leadCount: leadStats._count.id,
          avgLeadScore: leadStats._avg.score
            ? Math.round(leadStats._avg.score)
            : 0,
          hotLeadCount: hotLeads,
        };
      }),
    );

    return enriched;
  }
}
