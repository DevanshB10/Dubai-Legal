## Input Validation Strategy

- **Library choice**  
  - Uses `class-validator` + `class-transformer`, integrated with Nest's `ValidationPipe`.

- **Global validation setup** (`main.ts`)  
  - `app.useGlobalPipes(new ValidationPipe({ ... }))`  
  - Options:  
    - `whitelist: true` – strips properties without decorators.  
    - `forbidNonWhitelisted: true` – rejects requests with unexpected fields.  
    - `transform: true` – converts payloads into DTO instances.  
    - `enableImplicitConversion: true` – basic type coercion (e.g. strings to numbers).

- **DTOs as contracts**  
  - `GenerateDocumentDto` defines the request body for `/documents/generate`:  
    - `templateId: string` – required, non-empty.  
    - `version?: string` – optional.  
    - `format?: 'html' | 'pdf'` – optional enum, defaults to `html`.  
    - `data: Record<string, unknown>` – required object for template data.
  - Each field is decorated with `@IsString()`, `@IsNotEmpty()`, `@IsEnum()`, `@IsObject()`, etc.

- **Error handling**  
  - Invalid input → Nest throws `BadRequestException` with a `400` status.  
  - Our global `AllExceptionsFilter` formats errors into a consistent JSON shape:  
    - `{ statusCode, timestamp, path, method, message, error }`.
  - Messages are human-readable (e.g. `"templateId should not be empty"`).

- **Benefits**  
  - Centralized validation logic, no manual checks in controllers.  
  - Strong typing and clear API contracts via DTO classes.  
  - Safe by default: unknown/extra fields are rejected, not silently ignored.


