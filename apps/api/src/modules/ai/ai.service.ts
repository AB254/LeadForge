import {
  Injectable,
  Inject,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@leadforge/database';
import { PRISMA_CLIENT } from '../../config/database.provider';
import {
  AnalyzeWebsiteDto,
  ScoreLeadDto,
  GenerateOutreachDto,
  BatchAnalyzeDto,
  OutreachType,
} from './dto/ai.dto';

// ─── Prompt Templates ────────────────────────────────────────────────

const WEBSITE_ANALYSIS_PROMPT = `You are an expert website analyst for a B2B lead generation platform.
Analyze the following website and provide scores on a 0-100 scale for each category.

Website URL: {{url}}

Evaluate:
1. Overall Quality (design, UX, professionalism)
2. Mobile Responsiveness
3. SEO Performance (meta tags, structure, content)
4. Branding Quality (consistency, logo, colors)
5. Conversion Optimization (CTAs, forms, booking systems)
6. Load Speed & Performance
7. Content Quality

Provide a JSON response with scores and a detailed analysis summary.`;

const LEAD_SCORING_PROMPT = `You are an AI lead qualification specialist.
Score the following business as a potential client for web design / digital marketing services.

Business Details:
- Name: {{name}}
- Category: {{category}}
- City: {{city}}
- Has Website: {{hasWebsite}}
- Website URL: {{website}}
- Google Rating: {{googleRating}}
- Review Count: {{reviewCount}}
- Claimed on Google: {{claimedOnGoogle}}

Provide:
1. Overall lead score (0-100)
2. Priority classification (HOT / WARM / COLD)
3. Pain points identified
4. Recommended services
5. Brief summary of why this is a good/bad lead`;

const OUTREACH_EMAIL_PROMPT = `You are an expert cold outreach copywriter for a digital agency.
Write a personalized {{type}} message to the following business.

Business: {{businessName}}
Category: {{category}}
City: {{city}}
Pain Points: {{painPoints}}
Recommended Services: {{services}}
Tone: {{tone}}

{{customInstructions}}

Write a compelling, personalized message that:
- References something specific about their business
- Identifies a clear problem they have
- Offers a specific solution
- Has a clear CTA
- Is concise and professional`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
  ) {}

  async analyzeWebsite(dto: AnalyzeWebsiteDto) {
    this.logger.log(`Analyzing website: ${dto.url}`);

    // Placeholder implementation returning realistic mock data
    // In production, this calls OpenAI/Anthropic APIs with WEBSITE_ANALYSIS_PROMPT
    const analysis = {
      url: dto.url,
      overallScore: Math.floor(Math.random() * 40) + 30,
      scores: {
        design: Math.floor(Math.random() * 40) + 25,
        mobile: Math.floor(Math.random() * 50) + 20,
        seo: Math.floor(Math.random() * 45) + 15,
        branding: Math.floor(Math.random() * 40) + 30,
        conversion: Math.floor(Math.random() * 35) + 10,
        performance: Math.floor(Math.random() * 50) + 30,
        content: Math.floor(Math.random() * 40) + 25,
      },
      issues: [
        { severity: 'high', category: 'mobile', description: 'Site is not fully responsive on mobile devices' },
        { severity: 'high', category: 'seo', description: 'Missing meta descriptions on key pages' },
        { severity: 'medium', category: 'performance', description: 'Large unoptimized images detected' },
        { severity: 'medium', category: 'conversion', description: 'No clear call-to-action above the fold' },
        { severity: 'low', category: 'branding', description: 'Inconsistent font usage across pages' },
      ],
      technologies: ['WordPress', 'jQuery', 'Google Analytics'],
      hasSsl: dto.url.startsWith('https'),
      hasAnalytics: true,
      hasCta: false,
      hasBookingSystem: false,
      mobileResponsive: false,
      loadTime: parseFloat((Math.random() * 5 + 1.5).toFixed(2)),
      aiSummary: `The website at ${dto.url} shows significant room for improvement. The design appears outdated with poor mobile responsiveness. SEO fundamentals are lacking including missing meta tags and poor heading structure. There are no clear conversion paths or booking systems. The site would benefit from a complete redesign with focus on mobile-first design, SEO optimization, and conversion rate optimization.`,
      promptUsed: WEBSITE_ANALYSIS_PROMPT,
    };

    return analysis;
  }

  async scoreLead(dto: ScoreLeadDto) {
    const business = await this.prisma.business.findUnique({
      where: { id: dto.businessId },
      include: {
        leads: true,
        websiteAnalyses: { orderBy: { analyzedAt: 'desc' }, take: 1 },
      },
    });

    if (!business) {
      throw new NotFoundException(`Business "${dto.businessId}" not found`);
    }

    this.logger.log(`Scoring lead for business: ${business.name}`);

    // Placeholder implementation with realistic scoring logic
    const hasWebsite = !!business.website;
    const websiteScore = business.websiteAnalyses[0]?.overallScore ?? 0;
    const lowRating = (business.googleRating ?? 5) < 4;
    const fewReviews = business.reviewCount < 20;

    let score = 50;
    if (!hasWebsite) score += 25;
    else if (websiteScore < 50) score += 15;
    if (lowRating) score += 5;
    if (fewReviews) score += 5;
    if (!business.claimedOnGoogle) score += 10;
    score = Math.min(100, Math.max(0, score));

    const priority =
      score >= 75 ? 'HOT' : score >= 50 ? 'WARM' : ('COLD' as const);

    const painPoints: string[] = [];
    const services: string[] = [];

    if (!hasWebsite) {
      painPoints.push('No website presence');
      services.push('Website Design & Development');
    } else if (websiteScore < 50) {
      painPoints.push('Poor website quality');
      services.push('Website Redesign');
    }
    if (lowRating) {
      painPoints.push('Below average Google rating');
      services.push('Reputation Management');
    }
    if (fewReviews) {
      painPoints.push('Low review count on Google');
      services.push('Review Generation Campaign');
    }
    if (!business.claimedOnGoogle) {
      painPoints.push('Unclaimed Google Business Profile');
      services.push('Google Business Profile Optimization');
    }

    const result = {
      businessId: business.id,
      businessName: business.name,
      score,
      priority,
      painPoints,
      recommendedServices: services,
      summary: `${business.name} is a ${priority} lead with a score of ${score}/100. ${painPoints.length > 0 ? `Key issues: ${painPoints.join(', ')}.` : 'No major issues identified.'}`,
      promptUsed: LEAD_SCORING_PROMPT,
    };

    // Upsert lead record
    await this.prisma.lead.upsert({
      where: {
        id: business.leads[0]?.id ?? 'non-existent',
      },
      create: {
        businessId: business.id,
        score,
        priority,
        hasWebsite,
        websiteScore: websiteScore || null,
        aiSummary: result.summary,
        aiRecommendations: services,
        needsRedesign: !hasWebsite || websiteScore < 50,
        needsSEO: websiteScore < 40,
        needsBranding: websiteScore < 45,
      },
      update: {
        score,
        priority,
        hasWebsite,
        websiteScore: websiteScore || null,
        aiSummary: result.summary,
        aiRecommendations: services,
        needsRedesign: !hasWebsite || websiteScore < 50,
        needsSEO: websiteScore < 40,
        needsBranding: websiteScore < 45,
      },
    });

    return result;
  }

  async generateOutreach(dto: GenerateOutreachDto) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: dto.leadId },
      include: { business: true },
    });

    if (!lead) {
      throw new NotFoundException(`Lead "${dto.leadId}" not found`);
    }

    this.logger.log(
      `Generating ${dto.type} outreach for lead: ${lead.business.name}`,
    );

    const businessName = lead.business.name;
    const category = lead.business.category;
    const city = lead.business.city;

    // Placeholder outreach generation with type-specific templates
    const messages: Record<string, { subject?: string; body: string }> = {
      EMAIL: {
        subject: `Quick question about ${businessName}'s online presence`,
        body: `Hi there,\n\nI came across ${businessName} while researching ${category.toLowerCase()} businesses in ${city}, and I noticed a few opportunities that could help you attract more customers.\n\nSpecifically, I noticed:\n- ${lead.aiSummary || 'Your online presence could be stronger'}\n\nWe specialize in helping ${category.toLowerCase()} businesses like yours improve their digital presence and attract more local customers.\n\nWould you be open to a quick 15-minute call this week to discuss how we could help?\n\nBest regards,\nThe LeadForge Team`,
      },
      WHATSAPP: {
        body: `Hi! I found ${businessName} on Google and was impressed by your ${category.toLowerCase()} business in ${city}. I noticed a few ways we could help you get more customers online. Would you be interested in a quick chat? No pressure at all!`,
      },
      INSTAGRAM_DM: {
        body: `Hey ${businessName}! Love what you're doing in ${city}'s ${category.toLowerCase()} scene. We help local businesses like yours grow their online presence and get more customers. Interested in hearing how? Drop us a reply!`,
      },
      LINKEDIN: {
        body: `Hi,\n\nI came across ${businessName} and was impressed by your work in the ${category.toLowerCase()} space in ${city}.\n\nWe help businesses like yours strengthen their online presence to attract more clients. I'd love to share a few quick ideas specific to your business.\n\nWould you be open to connecting?\n\nBest,\nThe LeadForge Team`,
      },
      SMS: {
        body: `Hi from LeadForge! We noticed ${businessName} could benefit from a stronger online presence. We help ${city} businesses get more customers. Reply YES if you'd like to learn more!`,
      },
    };

    const generated = messages[dto.type] || messages.EMAIL;

    return {
      leadId: dto.leadId,
      businessName,
      type: dto.type,
      subject: generated.subject || null,
      body: generated.body,
      promptUsed: OUTREACH_EMAIL_PROMPT,
    };
  }

  async batchAnalyze(dto: BatchAnalyzeDto) {
    const results = [];

    for (const businessId of dto.businessIds) {
      try {
        const result = await this.scoreLead({ businessId });
        results.push({ businessId, success: true, result });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        results.push({ businessId, success: false, error: message });
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      total: dto.businessIds.length,
      successful,
      failed,
      results,
    };
  }
}
