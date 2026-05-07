import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum TrendPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export class TrendsQueryDto {
  @IsOptional()
  @IsEnum(TrendPeriod)
  period?: TrendPeriod = TrendPeriod.DAILY;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class TopNichesQueryDto {
  @IsOptional()
  @IsString()
  limit?: string;
}

export class TopCitiesQueryDto {
  @IsOptional()
  @IsString()
  limit?: string;
}
