import { IsString, IsEnum, IsUUID } from 'class-validator';
import { AssetType } from '@prisma/client';

export class GetPresignedUrlDto {
  @IsUUID()
  projectId!: string;

  @IsEnum(AssetType)
  type!: AssetType;

  @IsString()
  filename!: string;

  @IsString()
  contentType!: string;
}

export class ConfirmUploadDto {
  @IsUUID()
  projectId!: string;

  @IsEnum(AssetType)
  type!: AssetType;

  @IsString()
  originalUrl!: string;

  @IsString()
  filename!: string;
}