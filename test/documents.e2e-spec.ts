import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('/documents (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /documents/generate', () => {
    it('returns HTML document by default (non-streaming)', async () => {
      const payload = {
        templateId: 'service-agreement',
        data: {
          client: {
            name: 'Acme Corp',
            address: {
              street: '123 Main St',
              city: 'Metropolis',
              state: 'NY',
              postalCode: '10001',
              country: 'US',
            },
          },
          provider: { name: 'Provider Ltd', entityType: 'LLC' },
          services: {
            description: 'Software development services',
          },
          effectiveDate: '2025-01-01',
          billing: {
            rate: 100,
            currency: 'USD',
            unit: 'hour',
            paymentTerms: 30,
          },
          legal: {
            governingLaw: 'Delaware',
            disputeResolution: 'Binding arbitration',
          },
        },
      };

      const res = await request(app.getHttpServer())
        .post('/documents/generate?stream=false')
        .send(payload)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/html');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.text).toContain('Service Agreement');
      expect(res.text).toContain('Acme Corp');
    });

    it('returns PDF document when format is specified', async () => {
      const payload = {
        templateId: 'nda',
        version: 'v1',
        format: 'pdf',
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

      const res = await request(app.getHttpServer())
        .post('/documents/generate?stream=false')
        .send(payload)
        .expect(200);

      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('.pdf');
      expect(res.body.length).toBeGreaterThan(0);
    }, 30000); // Increase timeout for PDF generation

    it('returns validation error with clear message for invalid input', async () => {
      const res = await request(app.getHttpServer())
        .post('/documents/generate')
        .send({
          // missing templateId and data
        })
        .expect(400);

      expect(res.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('templateId should not be empty'),
          expect.stringContaining('data should not be empty'),
        ]),
      );
    });

    it('returns 404 for unknown template', async () => {
      const payload = {
        templateId: 'unknown-template',
        data: { test: 'data' },
      };

      const res = await request(app.getHttpServer())
        .post('/documents/generate')
        .send(payload)
        .expect(404);

      expect(res.body.message).toContain('Unknown template id');
    });
  });

  describe('GET /documents/templates', () => {
    it('returns list of available templates', async () => {
      const res = await request(app.getHttpServer())
        .get('/documents/templates')
        .expect(200);

      expect(res.body.templates).toBeDefined();
      expect(Array.isArray(res.body.templates)).toBe(true);
      expect(res.body.templates.length).toBeGreaterThan(0);

      const template = res.body.templates[0];
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('versions');
    });
  });

  describe('GET /documents/health', () => {
    it('returns health status', async () => {
      const res = await request(app.getHttpServer())
        .get('/documents/health')
        .expect(200);

      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('documents');
      expect(res.body.timestamp).toBeDefined();
    });
  });
});
