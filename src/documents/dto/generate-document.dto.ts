import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export enum DocumentOutputFormat {
  HTML = 'html',
  PDF = 'pdf',
}

export class GenerateDocumentDto {
  @IsString()
  @IsNotEmpty()
  templateId!: string;

  @IsString()
  @IsOptional()
  version?: string;

  @IsEnum(DocumentOutputFormat)
  @IsOptional()
  format?: DocumentOutputFormat = DocumentOutputFormat.HTML;

  // Accept arbitrary structured JSON for template data
  @IsObject()
  @IsNotEmpty()
  data!: Record<string, unknown>;
}
