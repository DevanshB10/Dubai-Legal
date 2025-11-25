# Legal Document Generation API

>  Nest.js application for generating legal documents from templates with full PDF support, streaming, caching, and comprehensive error handling.

## 🚀 Features

- ✅ **Multiple document templates** with versioning support
- ✅ **Nested placeholder resolution** (e.g., `client.address.city`)
- ✅ **Production-quality PDF generation** using Puppeteer
- ✅ **Streaming support** for efficient memory usage
- ✅ **Template caching** for optimal performance
- ✅ **Comprehensive validation** with clear error messages
- ✅ **Structured logging** and request/response tracking
- ✅ **Global exception handling** with detailed error responses
- ✅ **Health check endpoints** for monitoring
- ✅ **Configuration management** via environment variables
- ✅ **Full test coverage** (unit + e2e)

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Template System](#template-system)
- [Design Decisions](#design-decisions)
- [Testing](#testing)
- [Production Deployment](#production-deployment)

---

## 🏗️ Architecture Overview

### Module Structure

```
src/
├── main.ts                          # Application bootstrap
├── app.module.ts                    # Root module with ConfigModule
├── config/                          # Configuration management
│   ├── app.config.ts
│   └── documents.config.ts
├── common/                          # Shared utilities
│   ├── filters/
│   │   └── http-exception.filter.ts # Global error handling
│   └── interceptors/
│       └── logging.interceptor.ts   # Request/response logging
└── documents/                       # Documents feature module
    ├── documents.module.ts
    ├── documents.controller.ts      # HTTP endpoints
    ├── documents.service.ts         # Business logic
    ├── dto/
    │   └── generate-document.dto.ts # Request validation
    ├── templates/
    │   ├── document-templates.ts    # Template registry
    │   ├── templates.service.ts     # Template resolution & caching
    │   ├── service-agreement-v1.hbs
    │   ├── service-agreement-v2.hbs
    │   └── nda-v1.hbs
    └── pdf/
        └── pdf.service.ts           # PDF generation with Puppeteer
```

### Request Flow

```
1. Client → POST /documents/generate
   ↓
2. ValidationPipe validates DTO
   ↓
3. LoggingInterceptor logs request
   ↓
4. DocumentsController
   ↓
5. DocumentsService
   ├→ TemplatesService (cached lookup)
   ├→ Handlebars rendering
   └→ PdfService (if PDF requested)
   ↓
6. Stream/Buffer response to client
   ↓
7. LoggingInterceptor logs response
```

---

## ⚙️ Setup Instructions

### Prerequisites

- Node.js 18+ or 20+ (recommended)
- npm 8+

### Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Build the project
npm run build
```

### Running the Application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

The API will be available at `http://localhost:3000`

---

## 📚 API Documentation

### Endpoints

#### 1. Generate Document

**`POST /documents/generate`**

Generate a legal document from a template.

**Query Parameters:**
- `stream` (optional, default: `true`) - Enable streaming for large files

**Request Body:**

```json
{
  "templateId": "service-agreement",
  "version": "v2",
  "format": "pdf",
  "data": {
    "client": {
      "name": "Acme Corp",
      "address": {
        "street": "123 Main St",
        "city": "Metropolis",
        "state": "NY",
        "postalCode": "10001",
        "country": "US"
      }
    },
    "provider": {
      "name": "Provider Ltd",
      "entityType": "LLC"
    },
    "services": {
      "description": "Software development services"
    },
    "billing": {
      "rate": 100,
      "currency": "USD",
      "unit": "hour",
      "paymentTerms": 30
    },
    "legal": {
      "governingLaw": "Delaware",
      "disputeResolution": "Binding arbitration"
    },
    "effectiveDate": "2025-01-01"
  }
}
```

**Field Descriptions:**
- `templateId` (required): Template identifier (`service-agreement`, `nda`)
- `version` (optional): Template version (`v1`, `v2`). Uses default if omitted.
- `format` (optional): Output format (`html` or `pdf`). Default: `html`
- `data` (required): Template data with nested structure support

**Response:**
- Content-Type: `text/html` or `application/pdf`
- Content-Disposition: `attachment; filename="<template>.<ext>"`
- Body: Document file (streamed or buffered)

**Example cURL:**

```bash
# Generate HTML (streaming)
curl -X POST http://localhost:3000/documents/generate \
  -H "Content-Type: application/json" \
  -o output.html \
  -d '{
    "templateId": "service-agreement",
    "data": {
      "client": {"name": "Acme Corp"},
      "provider": {"name": "Provider Ltd"},
      "effectiveDate": "2025-01-01"
    }
  }'

# Generate PDF (non-streaming for testing)
curl -X POST "http://localhost:3000/documents/generate?stream=false" \
  -H "Content-Type: application/json" \
  -o output.pdf \
  -d '{
    "templateId": "nda",
    "format": "pdf",
    "data": {
      "partyA": {"name": "Alpha Inc"},
      "partyB": {"name": "Beta LLC"},
      "purpose": "partnership discussion",
      "effectiveDate": "2025-01-01"
    }
  }'
```

#### 2. List Templates

**`GET /documents/templates`**

Get all available templates and their versions.

**Response:**

```json
{
  "templates": [
    {
      "id": "service-agreement",
      "name": "Service Agreement",
      "description": "Professional services agreement template",
      "defaultVersion": "v2",
      "versions": [
        {
          "version": "v1",
          "description": "Basic service agreement"
        },
        {
          "version": "v2",
          "description": "Extended service agreement with additional fields"
        }
      ]
    }
  ]
}
```

#### 3. Health Check

**`GET /documents/health`**

Check service health status.

**Response:**

```json
{
  "status": "ok",
  "service": "documents",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

---

## 📝 Template System

### Template Registry

Templates are defined in `src/documents/templates/document-templates.ts`:

```typescript
export const DOCUMENT_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'service-agreement',
    name: 'Service Agreement',
    description: 'Professional services agreement template',
    defaultVersion: 'v2',
    versions: [
      {
        version: 'v1',
        fileName: 'service-agreement-v1.hbs',
        defaultOutputFileName: 'service-agreement-v1',
        description: 'Basic service agreement',
      },
      {
        version: 'v2',
        fileName: 'service-agreement-v2.hbs',
        defaultOutputFileName: 'service-agreement-v2',
        description: 'Extended service agreement',
      },
    ],
  },
  // ... more templates
];
```

### Versioning Strategy

1. **Explicit version**: Client specifies `version` → uses that version
2. **Default version**: Client omits `version` → uses `defaultVersion`
3. **Unknown version**: Returns `404` with available versions listed

### Adding New Templates

1. Create Handlebars template file (`.hbs`)
2. Add entry to `DOCUMENT_TEMPLATES` registry
3. Restart application (templates are cached on startup)

### Nested Placeholders

Handlebars natively supports nested object paths:

```handlebars
<p>Client: {{client.name}}</p>
<p>City: {{client.address.city}}</p>
<p>Rate: {{billing.rate}} {{billing.currency}}/{{billing.unit}}</p>
```

---

## 🎯 Design Decisions

### 1. PDF Generation: Puppeteer vs Alternatives

**Decision:** Use **Puppeteer** for HTML → PDF rendering

**Rationale:**
- ✅ **High fidelity**: Full HTML/CSS support and pixel-perfect rendering.
- ✅ **Single source of truth**: Same Handlebars HTML is used for both HTML and PDF outputs.
- ✅ **Mature ecosystem**: Widely used and well-documented.
- ✅ **Predictable output**: Chrome’s rendering engine is the de facto standard.

**Trade-offs:**
- Heavier than pure-Node solutions (Chromium + browser process).
- Requires a bit more care around resource usage (we mitigate this by reusing a single browser instance and opening a page per request).

**Alternatives Considered:**
- **html-pdf-node**: Lighter wrapper but still Puppeteer under the hood; less control, more opaque failures.
- **PDFKit / pdf-lib**: Very lightweight but require building layout manually (no direct HTML/CSS support).
- **External services** (e.g., DocRaptor): Offload complexity but add latency, cost, and external dependency.

### 2. Streaming vs Buffering

**Decision:** Support **both** with streaming as default

**Rationale:**
- ✅ **Streaming (default)**: Efficient for large documents, lower memory footprint
- ✅ **Buffering (optional)**: Simpler for small documents, easier to test
- Query parameter `?stream=false` allows switching

Overall preference is still Streaming for better resource usage and lesser load on the server, also better UX since users see live results instantly.


### 3. Template Caching

**Decision:** **Pre-load all templates** on module initialization

**Rationale:**
- ✅ **Performance**: Zero I/O on request path
- ✅ **Validation**: Catch missing templates at startup
- ✅ **Predictability**: Consistent response times
- ⚠️ **Trade-off**: Requires restart for template updates (acceptable for legal docs)

### 4. Configuration Management

**Decision:** Use **@nestjs/config** with environment variables

**Rationale:**
- ✅ **12-factor app**: Environment-based configuration
- ✅ **Type-safe**: Strongly typed config objects
- ✅ **Flexible**: Different configs per environment

### 5. Error Handling

**Decision:** **Global exception filter** with structured responses

**Rationale:**
- ✅ **Consistency**: All errors follow same format
- ✅ **Debugging**: Includes timestamp, path, method
- ✅ **Security**: Sanitizes internal errors in production

**Error Response Format:**

```json
{
  "statusCode": 404,
  "timestamp": "2025-01-01T12:00:00.000Z",
  "path": "/documents/generate",
  "method": "POST",
  "message": "Unknown template id \"xyz\". Available templates: service-agreement, nda",
  "error": "Not Found"
}
```

### 6. Validation Strategy

**Decision:** **class-validator** with global ValidationPipe

**Rationale:**
- ✅ **Nest.js native**: Idiomatic, well-integrated
- ✅ **Declarative**: Clear, self-documenting DTOs
- ✅ **Comprehensive**: Rich set of validators

**Alternatives Considered:**
- **Zod**: More functional, but adds paradigm shift
- **Joi**: Older, less TypeScript-friendly

### 7. Logging

**Decision:** **Custom interceptor** + built-in Logger

**Rationale:**
- ✅ **Request tracking**: Logs all requests/responses with duration
- ✅ **Contextual**: Includes method, URL, status, user agent
- ✅ **Extensible**: Easy to add correlation IDs, metrics

---

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

### Test Structure

**Unit Tests** (`*.spec.ts`):
- Service logic in isolation
- Mocked dependencies
- Fast execution

**E2E Tests** (`test/*.e2e-spec.ts`):
- Full HTTP flow
- Real Puppeteer browser
- Validation scenarios

### Test Coverage

- ✅ HTML generation with nested placeholders
- ✅ PDF generation with Puppeteer
- ✅ Streaming vs buffering modes
- ✅ Template versioning (default + explicit)
- ✅ Validation errors
- ✅ Unknown template/version errors
- ✅ Health check endpoint
- ✅ Template listing endpoint

---

## 🚢 Production Deployment

### Environment Variables

Create `.env` file:

```bash
NODE_ENV=production
PORT=3000
PDF_TIMEOUT_MS=30000
PDF_ENABLE_PUPPETEER=true
TEMPLATE_CACHE_ENABLED=true
LOG_LEVEL=log
ALLOWED_ORIGINS=https://yourdomain.com
```

### Docker Deployment

```dockerfile
FROM node:20-alpine

# Install Chromium for Puppeteer
RUN apk add --no-cache chromium

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

### Performance Considerations

1. **Efficient PDF Generation**: Puppeteer browser is initialized once and reused across requests
2. **Template Caching**: All templates pre-loaded at startup
3. **Streaming**: Large documents streamed to avoid memory spikes
4. **Graceful Shutdown**: Proper cleanup of the Nest app and Puppeteer browser on SIGTERM

### Monitoring

- **Health endpoint**: `/documents/health`
- **Logs**: Structured JSON logs with timestamps
- **Metrics**: Request duration, error rates (via interceptor)

### Scaling

- **Horizontal**: Stateless design, can run multiple instances
- **Vertical**: Lightweight PDF generation allows more concurrent requests per instance
- **Caching**: Consider Redis for distributed template cache
- **Upgrade path**: Can switch to Puppeteer if more complex rendering is needed

---

## 🔧 Development Commands

```bash
# Format code
npm run format

# Lint and fix
npm run lint

# Build
npm run build

# Run in development
npm run start:dev

# Run in production
npm run start:prod
```