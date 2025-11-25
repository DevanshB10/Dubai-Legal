## Template System and File Format

- **Template engine & format**
  - We use **Handlebars** as the template engine.
  - Templates are stored as **`.hbs` HTML files** under `src/documents/templates/`.
  - Each template is a full HTML fragment with Handlebars placeholders (e.g. `{{client.name}}`, `{{client.address.city}}`).

- **Template registry (`document-templates.ts`)**
  - All templates and their versions are declared in a central in-memory registry:
    - `id`: logical template identifier (`service-agreement`, `nda`).
    - `name`, `description`: human-friendly metadata.
    - `defaultVersion`: which version to use when the client omits `version`.
    - `versions[]`: each with `version`, `fileName`, `defaultOutputFileName`, `description`.
  - This makes it easy to add new templates/versions without changing business logic.

- **Template resolution (`TemplatesService`)**
  - On startup (`onModuleInit`), we:
    - Build a `Map<templateId, TemplateDefinition>`.
    - **Preload all `.hbs` files** into an in-memory cache (`Map<templateId:version, content>`).
  - At runtime:
    - `resolveTemplate(templateId, version?)`:
      - Validates `templateId` exists (else `404`).
      - Picks requested `version` or falls back to `defaultVersion`.
      - Reads content from cache (or disk on cache miss).
      - Returns `{ definition, version, content }`.

- **Applying data to templates**
  - `DocumentsService` compiles the template content with Handlebars:
    - `Handlebars.compile(content, { strict: true })`.
    - Calls the compiled function with the `data` object from the request.
  - Handlebars' dot-notation supports **nested placeholders** directly:
    - `{{client.address.city}}` → `data.client.address.city`.
  - The rendered HTML is:
    - Returned directly as an HTML document (for `format = html`), or
    - Passed to `PdfService` to generate a PDF (for `format = pdf`).

- **Why HTML + Handlebars**
  - Legal templates are primarily **text and structure**, which maps well to HTML.
  - HTML is easy to design, preview, and iterate on.
  - The same rendered HTML can be:
    - Served as-is to clients, or
    - Converted to PDF via Puppeteer with full CSS support.


