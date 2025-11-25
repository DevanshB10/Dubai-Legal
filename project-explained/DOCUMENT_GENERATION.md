## Document Generation Approach

- **High-level flow**
  1. Client calls `POST /documents/generate` with:
     - `templateId` (+ optional `version`)
     - `format` (`html` or `pdf`, default `html`)
     - Structured `data` object.
  2. `ValidationPipe` validates the body against `GenerateDocumentDto`.
  3. `DocumentsController` delegates to `DocumentsService`:
     - `generate()` for buffered responses (`?stream=false`)
     - `generateStream()` for streaming (default).

- **Template resolution & rendering**
  - `DocumentsService` asks `TemplatesService.resolveTemplate(templateId, version?)`:
    - Picks the correct template version (or default).
    - Retrieves the cached Handlebars template content.
  - `DocumentsService.renderTemplate()`:
    - Compiles the template with Handlebars (`strict: true`).
    - Applies the `data` object, supporting nested paths (e.g. `client.address.city`).
    - Produces final **HTML**.

- **HTML output**
  - For `format = html`:
    - Buffered path: wraps HTML in a `Buffer` and returns it with `text/html; charset=utf-8`.
    - Streaming path: creates a `Readable` via `Readable.from(html)` and pipes it to the HTTP response.

- **PDF output**
  - For `format = pdf`:
    - `DocumentsService` sends the rendered HTML to `PdfService`.
    - `PdfService` uses **Puppeteer**:
      - Reuses a single headless browser instance.
      - Creates a new page per request, sets the HTML content, waits for load.
      - Calls `page.pdf()` with A4 size, margins, and `printBackground: true`.
      - Returns the generated PDF as a `Buffer` or `Readable` stream.
  - Controller sets:
    - `Content-Type: application/pdf`
    - `Content-Disposition: attachment; filename="<template-version>.pdf"`.

- **Streaming vs buffering**
  - **Streaming** (default, `stream=true`):
    - Uses `Readable` streams and `stream.pipe(res)`.
    - More memory-efficient and better for large documents.
  - **Buffering** (`stream=false`):
    - Generates the full buffer in memory, sets `Content-Length`, then sends it.
    - Simpler for small documents and testing/debugging.


