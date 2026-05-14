import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ExportFormat, ExportQuality } from '@prisma/client';

export class CreateExportDto {
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;

  @IsOptional()
  @IsString()
  resolution?: string;

  @IsOptional()
  @IsEnum(ExportQuality)
  quality?: ExportQuality;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
