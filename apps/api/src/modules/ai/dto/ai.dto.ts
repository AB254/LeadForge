import { IsString, IsUrl, IsArray, IsEnum, IsOptional } from 'class-validator';

export enum OutreachType {
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  INSTAGRAM_DM = 'INSTAGRAM_DM',
  LINKEDIN = 'LINKEDIN',
  SMS = 'SMS',
}

export class AnalyzeWebsiteDto {
  @IsUrl()
  url: string;
}

export class ScoreLeadDto {
  @IsString()
  businessId: string;
}

export class GenerateOutreachDto {
  @IsString()
  leadId: string;

  @IsEnum(OutreachType)
  type: OutreachType;

  @IsOptional()
  @IsString()
  tone?: string;

  @IsOptional()
  @IsString()
  customInstructions?: string;
}

export class BatchAnalyzeDto {
  @IsArray()
  @IsString({ each: true })
  businessIds: string[];
}
