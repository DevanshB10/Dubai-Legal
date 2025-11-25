import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { DocumentsService } from './documents.service';
import {
  DocumentOutputFormat,
  GenerateDocumentDto,
} from './dto/generate-document.dto';
import { TemplatesService } from './templates/templates.service';

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly templatesService: TemplatesService,
  ) {}

  /**
   * Generate a document and return as attachment.
   * Supports both HTML and PDF formats with proper streaming for large files.
   *
   * @param body - Document generation parameters
   * @param useStream - Query parameter to enable streaming (default: true for production)
   * @param res - Express response object for setting headers
   */
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generate(
    @Body() body: GenerateDocumentDto,
    @Query('stream') useStream: string = 'true',
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    const shouldStream = useStream === 'true';

    if (shouldStream) {
      // Production-ready: Use streaming for efficient memory usage
      const result = await this.documentsService.generateStream(body);

      res.setHeader('Content-Type', result.mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${result.fileName}"`,
      );

      // Set cache headers for better performance
      res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');

      // Stream the document to the client
      result.stream.pipe(res);
    } else {
      // Legacy mode: Return entire buffer (useful for small documents or testing)
      const result = await this.documentsService.generate(body);

      res.setHeader('Content-Type', result.mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${result.fileName}"`,
      );
      res.setHeader('Content-Length', result.buffer.length.toString());
      res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');

      if (body.format === DocumentOutputFormat.PDF) {
        res.end(result.buffer);
      } else {
        res.send(result.buffer.toString('utf8'));
      }
    }
  }

  /**
   * Get list of available templates and their versions.
   * Useful for API documentation or building a template selection UI.
   */
  @Get('templates')
  @HttpCode(HttpStatus.OK)
  listTemplates() {
    const templates = this.templatesService.getAllTemplates();
    return {
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        defaultVersion: t.defaultVersion,
        versions: t.versions.map((v) => ({
          version: v.version,
          description: v.description,
        })),
      })),
    };
  }

  /**
   * Health check endpoint for monitoring.
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  health() {
    return {
      status: 'ok',
      service: 'documents',
      timestamp: new Date().toISOString(),
    };
  }
}
