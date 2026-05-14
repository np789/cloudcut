import {
  IsString, IsNumber, IsOptional, IsBoolean,
  IsEnum, IsUUID, IsObject, Min,
} from 'class-validator';
import { TrackType } from '@prisma/client';

export class CreateTrackDto {
  @IsEnum(TrackType)
  type!: TrackType;

  @IsString()
  label!: string;

  @IsNumber()
  orderIndex!: number;

  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateTrackDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsNumber()
  orderIndex?: number;

  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @IsOptional()
  @IsBoolean()
  isMuted?: boolean;

  @IsOptional()
  @IsString()
  color?: string;
}

export class CreateClipDto {
  @IsUUID()
  trackId!: string;

  @IsUUID()
  assetId!: string;

  @IsNumber()
  @Min(0)
  trackPositionMs!: number;

  @IsNumber()
  @Min(0)
  inPointMs!: number;

  @IsNumber()
  @Min(0)
  outPointMs!: number;

  @IsOptional()
  @IsObject()
  transform?: object;
}

export class UpdateClipDto {
  @IsOptional()
  @IsUUID()
  trackId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  trackPositionMs?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  inPointMs?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  outPointMs?: number;

  @IsOptional()
  @IsObject()
  transform?: object;
}

export class SplitClipDto {
  @IsNumber()
  @Min(0)
  atTimeMs!: number;
}

export class BatchClipOperationDto {
  @IsString()
  operation!: 'move' | 'delete';

  @IsUUID('4', { each: true })
  clipIds!: string[];

  @IsOptional()
  @IsNumber()
  offsetMs?: number;

  @IsOptional()
  @IsUUID()
  targetTrackId?: string;
}

export class CreateEffectDto {
  @IsString()
  type!: string;

  @IsNumber()
  orderIndex!: number;

  @IsOptional()
  @IsObject()
  params?: object;
}

export class UpdateEffectDto {
  @IsOptional()
  @IsObject()
  params?: object;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}