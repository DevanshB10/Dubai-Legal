import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { TemplatesService } from './templates/templates.service';
import { PdfService } from './pdf/pdf.service';

@Module({
  controllers: [DocumentsController],
  providers: [TemplatesService, PdfService, DocumentsService],
})
export class DocumentsModule {}
