import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import Handlebars from 'handlebars';
import { Readable } from 'node:stream';
import {
  DocumentOutputFormat,
  GenerateDocumentDto,
} from './dto/generate-document.dto';
import { PdfService } from './pdf/pdf.service';
import { TemplatesService } from './templates/templates.service';

export type GeneratedDocument = {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
};

export type GeneratedDocumentStream = {
  stream: Readable;
  mimeType: string;
  fileName: string;
  size?: number;
};

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly templatesService: TemplatesService,
    private readonly pdfService: PdfService,
  ) {}

  /**
   * Generate a document and return as buffer.
   * Suitable for small to medium-sized documents.
   */
  async generate(dto: GenerateDocumentDto): Promise<GeneratedDocument> {
    try {
      this.logger.log(
        `Generating document: ${dto.templateId} (${dto.version ?? 'default'}) as ${dto.format ?? 'html'}`,
      );

      const resolved = await this.templatesService.resolveTemplate(
        dto.templateId,
        dto.version,
      );

      const html = this.renderTemplate(resolved.content, dto.data);
      const baseFileName = resolved.version.defaultOutputFileName;

      if (dto.format === DocumentOutputFormat.PDF) {
        const buffer = await this.pdfService.htmlToPdfBuffer(html);
        this.logger.log(
          `PDF generated successfully: ${baseFileName}.pdf (${buffer.length} bytes)`,
        );
        return {
          buffer,
          mimeType: 'application/pdf',
          fileName: `${baseFileName}.pdf`,
        };
      }

      // Default: HTML
      const buffer = Buffer.from(html, 'utf8');
      this.logger.log(
        `HTML generated successfully: ${baseFileName}.html (${buffer.length} bytes)`,
      );
      return {
        buffer,
        mimeType: 'text/html; charset=utf-8',
        fileName: `${baseFileName}.html`,
      };
    } catch (error) {
      this.logger.error('Document generation failed', error);
      if (
        error instanceof Error &&
        (error.name === 'NotFoundException' ||
          error.message.includes('Unknown'))
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Document generation failed');
    }
  }

  /**
   * Generate a document and return as stream.
   * More efficient for large documents as it doesn't load everything into memory.
   */
  async generateStream(
    dto: GenerateDocumentDto,
  ): Promise<GeneratedDocumentStream> {
    try {
      this.logger.log(
        `Generating document stream: ${dto.templateId} (${dto.version ?? 'default'}) as ${dto.format ?? 'html'}`,
      );

      const resolved = await this.templatesService.resolveTemplate(
        dto.templateId,
        dto.version,
      );

      const html = this.renderTemplate(resolved.content, dto.data);
      const baseFileName = resolved.version.defaultOutputFileName;

      if (dto.format === DocumentOutputFormat.PDF) {
        const stream = await this.pdfService.htmlToPdfStream(html);
        return {
          stream,
          mimeType: 'application/pdf',
          fileName: `${baseFileName}.pdf`,
        };
      }

      // Default: HTML stream
      const stream = Readable.from(html);
      return {
        stream,
        mimeType: 'text/html; charset=utf-8',
        fileName: `${baseFileName}.html`,
      };
    } catch (error) {
      this.logger.error('Document stream generation failed', error);
      if (
        error instanceof Error &&
        (error.name === 'NotFoundException' ||
          error.message.includes('Unknown'))
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Document stream generation failed',
      );
    }
  }

  /**
   * Render Handlebars template with data.
   * Handlebars natively supports nested paths like client.address.city.
   */
  private renderTemplate(templateContent: string, data: any): string {
    try {
      const compiled = Handlebars.compile(templateContent, {
        strict: true,
        noEscape: false,
      });
      return compiled(data);
    } catch (error) {
      this.logger.error('Template rendering failed', error);
      throw new InternalServerErrorException('Template rendering failed');
    }
  }
}
