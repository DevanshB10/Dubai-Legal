import { Test } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { TemplatesService } from './templates/templates.service';
import { PdfService } from './pdf/pdf.service';
import {
  DocumentOutputFormat,
  GenerateDocumentDto,
} from './dto/generate-document.dto';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let templatesService: TemplatesService;
  let pdfService: PdfService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [DocumentsService, TemplatesService, PdfService],
    }).compile();

    service = moduleRef.get(DocumentsService);
    templatesService = moduleRef.get(TemplatesService);
    pdfService = moduleRef.get(PdfService);

    // Initialize templates cache and PDF service (Puppeteer browser)
    await templatesService.onModuleInit();
    await pdfService.onModuleInit();
  });

  afterAll(async () => {
    // Ensure Puppeteer browser is closed after tests
    await pdfService.onModuleDestroy();
  });

  it('generates HTML document with nested placeholders', async () => {
    const dto: GenerateDocumentDto = {
      templateId: 'service-agreement',
      version: 'v1',
      format: DocumentOutputFormat.HTML,
      data: {
        client: {
          name: 'Acme Corp',
          address: {
            street: '123 Main St',
            city: 'Metropolis',
            country: 'US',
          },
        },
        provider: { name: 'Provider Ltd' },
        effectiveDate: '2025-01-01',
        billing: {
          rate: 100,
          currency: 'USD',
          unit: 'hour',
        },
        legal: {
          governingLaw: 'Delaware',
        },
      },
    };

    const result = await service.generate(dto);

    expect(result.mimeType).toContain('text/html');
    const html = result.buffer.toString('utf8');
    expect(html).toContain('Acme Corp');
    expect(html).toContain('Metropolis');
    expect(html).toContain('Delaware');
  });

  it('generates PDF document when requested', async () => {
    const dto: GenerateDocumentDto = {
      templateId: 'nda',
      version: 'v1',
      format: DocumentOutputFormat.PDF,
      data: {
        partyA: {
          name: 'Alpha Inc',
          address: { city: 'Gotham', country: 'US' },
        },
        partyB: {
          name: 'Beta LLC',
          address: { city: 'Star City', country: 'US' },
        },
        purpose: 'discussing potential partnership',
        effectiveDate: '2025-01-01',
        term: { years: 3 },
        legal: { governingLaw: 'California' },
      },
    };

    const result = await service.generate(dto);

    expect(result.mimeType).toBe('application/pdf');
    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.fileName.endsWith('.pdf')).toBe(true);
  }, 30000); // Increase timeout for PDF generation

  it('generates document stream for efficient memory usage', async () => {
    const dto: GenerateDocumentDto = {
      templateId: 'service-agreement',
      version: 'v2',
      format: DocumentOutputFormat.HTML,
      data: {
        client: {
          name: 'Test Corp',
          address: {
            street: '456 Test Ave',
            city: 'TestCity',
            state: 'TS',
            postalCode: '12345',
            country: 'US',
          },
        },
        provider: {
          name: 'Provider Inc',
          entityType: 'Corporation',
        },
        services: {
          description: 'Software development services',
        },
        billing: {
          rate: 150,
          currency: 'USD',
          unit: 'hour',
          paymentTerms: 30,
        },
        legal: {
          governingLaw: 'New York',
          disputeResolution: 'Arbitration',
        },
        effectiveDate: '2025-01-15',
      },
    };

    const result = await service.generateStream(dto);

    expect(result.stream).toBeDefined();
    expect(result.mimeType).toContain('text/html');
    expect(result.fileName).toContain('.html');
  });
});
