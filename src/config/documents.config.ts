import { registerAs } from '@nestjs/config';

export default registerAs('documents', () => ({
  pdf: {
    timeoutMs: parseInt(process.env.PDF_TIMEOUT_MS || '30000', 10),
  },
  templates: {
    cacheEnabled: process.env.TEMPLATE_CACHE_ENABLED !== 'false',
  },
}));

