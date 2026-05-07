import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsJSON,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum OutreachType {
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  INSTAGRAM_DM = 'INSTAGRAM_DM',
  LINKEDIN = 'LINKEDIN',
  SMS = 'SMS',
}

export enum OutreachMessageStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  OPENED = 'OPENED',
  REPLIED = 'REPLIED',
}

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsEnum(OutreachType)
  type: OutreachType;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  body: string;

  @IsOptional()
  variables?: any;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(OutreachType)
  type?: OutreachType;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  variables?: any;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class GenerateOutreachDto {
  @IsString()
  leadId: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsEnum(OutreachType)
  type: OutreachType;

  @IsOptional()
  @IsString()
  customInstructions?: string;
}

export class CreateMessageDto {
  @IsString()
  leadId: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsEnum(OutreachType)
  type: OutreachType;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsBoolean()
  sendNow?: boolean;
}

export class ListMessagesDto {
  @IsOptional()
  @IsEnum(OutreachMessageStatus)
  status?: OutreachMessageStatus;

  @IsOptional()
  @IsEnum(OutreachType)
  type?: OutreachType;

  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
