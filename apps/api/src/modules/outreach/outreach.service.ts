import {
  Injectable,
  Inject,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@leadforge/database';
import { PRISMA_CLIENT } from '../../config/database.provider';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  GenerateOutreachDto,
  CreateMessageDto,
  ListMessagesDto,
} from './dto/outreach.dto';

@Injectable()
export class OutreachService {
  private readonly logger = new Logger(OutreachService.name);

  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
  ) {}

  // ─── Templates ───────────────────────────────────────────────────────

  async listTemplates() {
    return this.prisma.outreachTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTemplate(dto: CreateTemplateDto) {
    // If setting as default, unset other defaults of same type
    if (dto.isDefault) {
      await this.prisma.outreachTemplate.updateMany({
        where: { type: dto.type as any, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.outreachTemplate.create({
      data: {
        name: dto.name,
        type: dto.type as any,
        subject: dto.subject,
        body: dto.body,
        variables: dto.variables,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto) {
    const template = await this.prisma.outreachTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Template "${id}" not found`);
    }

    if (dto.isDefault) {
      const type = dto.type || template.type;
      await this.prisma.outreachTemplate.updateMany({
        where: { type, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.outreachTemplate.update({
      where: { id },
      data: dto as any,
    });
  }

  async deleteTemplate(id: string) {
    const template = await this.prisma.outreachTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Template "${id}" not found`);
    }

    await this.prisma.outreachTemplate.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── Generation ──────────────────────────────────────────────────────

  async generateOutreach(dto: GenerateOutreachDto) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: dto.leadId },
      include: { business: true },
    });

    if (!lead) {
      throw new NotFoundException(`Lead "${dto.leadId}" not found`);
    }

    let templateBody: string | null = null;
    if (dto.templateId) {
      const template = await this.prisma.outreachTemplate.findUnique({
        where: { id: dto.templateId },
      });
      if (template) {
        templateBody = template.body;
      }
    }

    // Placeholder: In production, would call AI service
    const businessName = lead.business.name;
    const category = lead.business.category;
    const city = lead.business.city;

    const body = templateBody
      ? templateBody
          .replace(/\{\{businessName\}\}/g, businessName)
          .replace(/\{\{category\}\}/g, category)
          .replace(/\{\{city\}\}/g, city)
      : `Hi,\n\nI noticed ${businessName} while researching ${category.toLowerCase()} businesses in ${city}. I'd love to discuss how we can help improve your digital presence.\n\nBest regards`;

    return {
      leadId: dto.leadId,
      type: dto.type,
      subject:
        dto.type === 'EMAIL'
          ? `Helping ${businessName} grow online`
          : undefined,
      body,
      businessName,
    };
  }

  // ─── Messages ────────────────────────────────────────────────────────

  async listMessages(query: ListMessagesDto) {
    const { status, type, leadId, page = 1, limit = 20 } = query;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (leadId) where.leadId = leadId;

    const [messages, total] = await Promise.all([
      this.prisma.outreachMessage.findMany({
        where,
        include: {
          lead: { include: { business: true } },
          template: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.outreachMessage.count({ where }),
    ]);

    return {
      messages,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createMessage(dto: CreateMessageDto) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: dto.leadId },
    });

    if (!lead) {
      throw new NotFoundException(`Lead "${dto.leadId}" not found`);
    }

    const message = await this.prisma.outreachMessage.create({
      data: {
        leadId: dto.leadId,
        templateId: dto.templateId,
        type: dto.type as any,
        subject: dto.subject,
        body: dto.body,
        status: dto.sendNow ? 'SENT' : 'DRAFT',
        sentAt: dto.sendNow ? new Date() : null,
      },
      include: {
        lead: { include: { business: true } },
      },
    });

    // If sending now, update lead status
    if (dto.sendNow && lead.status === 'NEW') {
      await this.prisma.lead.update({
        where: { id: dto.leadId },
        data: { status: 'CONTACTED' },
      });
    }

    this.logger.log(
      `Outreach message ${dto.sendNow ? 'sent' : 'drafted'} for lead ${dto.leadId}`,
    );

    return message;
  }
}
