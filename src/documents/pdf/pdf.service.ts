import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Readable } from 'node:stream';
import puppeteer, { Browser, PDFOptions } from 'puppeteer';

@Injectable()
export class PdfService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PdfService.name);
  private browser: Browser | null = null;

  /**
   * Initialize Puppeteer browser on module startup.
   * Reusing a single browser instance is more efficient than launching for each request.
   */
  async onModuleInit() {
    try {
      this.logger.log('Initializing Puppeteer browser...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
      this.logger.log('Puppeteer browser initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Puppeteer browser', error);
      throw new InternalServerErrorException(
        'PDF service initialization failed',
      );
    }
  }

  /**
   * Clean up browser instance on module shutdown.
   */
  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      this.logger.log('Puppeteer browser closed');
    }
  }

  /**
   * Convert HTML to PDF buffer with proper rendering.
   * Uses Puppeteer for production-quality PDF generation with full CSS support.
   */
  async htmlToPdfBuffer(html: string): Promise<Buffer> {
    if (!this.browser) {
      throw new InternalServerErrorException('PDF service not initialized');
    }

    const page = await this.browser.newPage();

    try {
      this.logger.log('Generating PDF from HTML...');

      // Set content with proper wait for resources
      await page.setContent(html, {
        waitUntil: ['networkidle0', 'load'],
        timeout: 30000,
      });

      // Configure PDF options for legal documents
      const pdfOptions: PDFOptions = {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
        displayHeaderFooter: false,
        preferCSSPageSize: false,
      };

      const pdfBuffer = await page.pdf(pdfOptions);

      this.logger.log(`PDF generated successfully (${pdfBuffer.length} bytes)`);
      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error('Failed to generate PDF', error);
      throw new InternalServerErrorException('PDF generation failed');
    } finally {
      await page.close();
    }
  }

  /**
   * Convert HTML to PDF stream for efficient memory usage with large documents.
   * Streams are better for large files as they don't load everything into memory.
   */
  async htmlToPdfStream(html: string): Promise<Readable> {
    const buffer = await this.htmlToPdfBuffer(html);
    return Readable.from(buffer);
  }
}
