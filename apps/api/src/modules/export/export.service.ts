import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@leadforge/database';
import { PRISMA_CLIENT } from '../../config/database.provider';
import { ExportFilterDto } from './dto/export.dto';
import * as XLSX from 'xlsx';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
  ) {}

  private buildWhere(filters: ExportFilterDto): Prisma.LeadWhereInput {
    const where: Prisma.LeadWhereInput = {};

    if (filters.priority) where.priority = filters.priority as any;
    if (filters.status) where.status = filters.status as any;

    if (filters.minScore !== undefined || filters.maxScore !== undefined) {
      where.score = {};
      if (filters.minScore !== undefined) where.score.gte = filters.minScore;
      if (filters.maxScore !== undefined) where.score.lte = filters.maxScore;
    }

    if (filters.city || filters.category || filters.search) {
      where.business = {};
      if (filters.city)
        where.business.city = { contains: filters.city, mode: 'insensitive' };
      if (filters.category)
        where.business.category = {
          contains: filters.category,
          mode: 'insensitive',
        };
      if (filters.search) {
        where.business.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { category: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
    }

    return where;
  }

  private async getLeadsForExport(filters: ExportFilterDto) {
    const where = this.buildWhere(filters);

    const leads = await this.prisma.lead.findMany({
      where,
      include: { business: true },
      orderBy: { score: 'desc' },
    });

    return leads.map((lead) => ({
      id: lead.id,
      businessName: lead.business.name,
      category: lead.business.category,
      city: lead.business.city,
      country: lead.business.country,
      phone: lead.business.phone || '',
      email: lead.business.email || '',
      website: lead.business.website || '',
      googleRating: lead.business.googleRating || '',
      reviewCount: lead.business.reviewCount,
      score: lead.score,
      priority: lead.priority,
      status: lead.status,
      hasWebsite: lead.hasWebsite,
      websiteScore: lead.websiteScore || '',
      seoScore: lead.seoScore || '',
      mobileScore: lead.mobileScore || '',
      aiSummary: lead.aiSummary || '',
      needsRedesign: lead.needsRedesign,
      needsSEO: lead.needsSEO,
      needsBranding: lead.needsBranding,
      needsAds: lead.needsAds,
      notes: lead.notes || '',
      createdAt: lead.createdAt.toISOString(),
    }));
  }

  async exportCsv(filters: ExportFilterDto): Promise<string> {
    const data = await this.getLeadsForExport(filters);

    if (data.length === 0) {
      return '';
    }

    const { Parser } = await import('json2csv');
    const fields = filters.fields || Object.keys(data[0]);
    const parser = new Parser({ fields });
    return parser.parse(data);
  }

  async exportXlsx(filters: ExportFilterDto): Promise<Buffer> {
    const data = await this.getLeadsForExport(filters);

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(
        key.length,
        ...data.map((row) => String((row as any)[key] || '').length),
        10,
      ),
    }));
    worksheet['!cols'] = colWidths;

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async exportJson(filters: ExportFilterDto) {
    const data = await this.getLeadsForExport(filters);
    return {
      exportedAt: new Date().toISOString(),
      totalRecords: data.length,
      filters,
      data,
    };
  }
}
