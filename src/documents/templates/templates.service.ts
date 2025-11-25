import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  DOCUMENT_TEMPLATES,
  TemplateDefinition,
  TemplateVersion,
} from './document-templates';

export type ResolvedTemplate = {
  definition: TemplateDefinition;
  version: TemplateVersion;
  content: string;
};

@Injectable()
export class TemplatesService implements OnModuleInit {
  private readonly logger = new Logger(TemplatesService.name);
  private readonly templatesById: Map<string, TemplateDefinition>;
  private readonly templateCache: Map<string, string> = new Map();

  constructor() {
    this.templatesById = new Map(DOCUMENT_TEMPLATES.map((t) => [t.id, t]));
  }

  /**
   * Pre-load all templates into cache on module initialization.
   * This improves response time and validates templates at startup.
   */
  async onModuleInit() {
    this.logger.log('Pre-loading templates into cache...');
    const loadPromises: Promise<void>[] = [];

    for (const template of DOCUMENT_TEMPLATES) {
      for (const version of template.versions) {
        loadPromises.push(this.preloadTemplate(template.id, version.version));
      }
    }

    await Promise.all(loadPromises);
    this.logger.log(
      `Successfully loaded ${this.templateCache.size} template(s) into cache`,
    );
  }

  /**
   * Resolve and return a template with its content.
   * Uses cache for performance in production.
   */
  async resolveTemplate(
    templateId: string,
    version?: string,
  ): Promise<ResolvedTemplate> {
    const definition = this.templatesById.get(templateId);
    if (!definition) {
      const availableIds = Array.from(this.templatesById.keys()).join(', ');
      throw new NotFoundException(
        `Unknown template id "${templateId}". Available templates: ${availableIds}`,
      );
    }

    const resolvedVersionId = version ?? definition.defaultVersion;
    const versionDef = definition.versions.find(
      (v) => v.version === resolvedVersionId,
    );

    if (!versionDef) {
      const available = definition.versions.map((v) => v.version).join(', ');
      throw new NotFoundException(
        `Unknown version "${resolvedVersionId}" for template "${templateId}". Available versions: ${available}`,
      );
    }

    const cacheKey = this.getCacheKey(templateId, resolvedVersionId);
    let content = this.templateCache.get(cacheKey);

    if (!content) {
      // Cache miss - load from disk (shouldn't happen after onModuleInit)
      this.logger.warn(
        `Cache miss for template ${templateId}:${resolvedVersionId}, loading from disk`,
      );
      content = await this.loadTemplateFromDisk(versionDef.fileName);
      this.templateCache.set(cacheKey, content);
    }

    return {
      definition,
      version: versionDef,
      content,
    };
  }

  /**
   * Get all available templates with their versions.
   * Useful for API documentation or template selection UI.
   */
  getAllTemplates(): TemplateDefinition[] {
    return Array.from(this.templatesById.values());
  }

  /**
   * Clear template cache (useful for hot-reloading in development).
   */
  clearCache(): void {
    this.templateCache.clear();
    this.logger.log('Template cache cleared');
  }

  private async preloadTemplate(
    templateId: string,
    version: string,
  ): Promise<void> {
    try {
      const definition = this.templatesById.get(templateId);
      if (!definition) return;

      const versionDef = definition.versions.find((v) => v.version === version);
      if (!versionDef) return;

      const content = await this.loadTemplateFromDisk(versionDef.fileName);
      const cacheKey = this.getCacheKey(templateId, version);
      this.templateCache.set(cacheKey, content);

      this.logger.debug(`Loaded template: ${templateId}:${version}`);
    } catch (error) {
      this.logger.error(
        `Failed to preload template ${templateId}:${version}`,
        error,
      );
      throw error;
    }
  }

  private async loadTemplateFromDisk(fileName: string): Promise<string> {
    const templatePath = join(__dirname, fileName);
    return await readFile(templatePath, 'utf8');
  }

  private getCacheKey(templateId: string, version: string): string {
    return `${templateId}:${version}`;
  }
}
