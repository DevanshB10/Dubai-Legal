export type TemplateVersion = {
  id: string;
  version: string;
  description: string;
  fileName: string;
  defaultOutputFileName: string;
};

export type TemplateDefinition = {
  id: string;
  name: string;
  description: string;
  versions: TemplateVersion[];
  defaultVersion: string;
};

// adding an in-memory registry to keep the example self-contained.
// In a real system this could come from a database or CMS.
export const DOCUMENT_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'service-agreement',
    name: 'Service Agreement',
    description: 'Professional services agreement template',
    defaultVersion: 'v2',
    versions: [
      {
        id: 'service-agreement',
        version: 'v1',
        description: 'Service Agreement basic template (v1)',
        fileName: 'service-agreement-v1.hbs',
        defaultOutputFileName: 'service-agreement-v1',
      },
      {
        id: 'service-agreement',
        version: 'v2',
        description: 'Service Agreement updated template (v2)',
        fileName: 'service-agreement-v2.hbs',
        defaultOutputFileName: 'service-agreement-v2',
      },
    ],
  },
  {
    id: 'nda',
    name: 'Non-Disclosure Agreement',
    description: 'Mutual non-disclosure agreement template',
    defaultVersion: 'v1',
    versions: [
      {
        id: 'nda',
        version: 'v1',
        description: 'Mutual NDA (v1)',
        fileName: 'nda-v1.hbs',
        defaultOutputFileName: 'nda-v1',
      },
      {
        id: 'nda',
        version: 'v2',
        description: 'Mutual NDA (extended, v2)',
        fileName: 'nda-v2.hbs',
        defaultOutputFileName: 'nda-v2',
      },
    ],
  },
];
