import type { Payload } from 'payload';
import type { Project } from '../../payload-types';
import { EXTRACTION_VERSION, type BrochureSourceType, type ExtractedProjectData } from './types';

/**
 * Builds a minimal but valid Lexical editor state from plain text so the
 * extracted description can populate the richText field. Matches the shape
 * mapProject.ts already checks for (root.type / root.children).
 */
function plainTextToLexicalState(text: string) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const source = paragraphs.length > 0 ? paragraphs : [text];

  return {
    root: {
      type: 'root',
      version: 1,
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      children: source.map((paragraph) => ({
        type: 'paragraph',
        version: 1,
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        children: [
          {
            type: 'text',
            version: 1,
            text: paragraph,
            format: 0,
            detail: 0,
            mode: 'normal' as const,
            style: '',
          },
        ],
      })),
    },
  };
}

export type CreateDraftProjectParams = {
  data: ExtractedProjectData;
  amenityIds: number[];
  slug: string;
  source: {
    sourceType: BrochureSourceType;
    sourceFilename: string | null;
    extractionNotes: string[];
  };
};

export async function createDraftProject(payload: Payload, params: CreateDraftProjectParams): Promise<Project> {
  const { data, amenityIds, slug, source } = params;

  if (!data.name) {
    throw new Error('Cannot create a draft project without a project name.');
  }

  const created = await payload.create({
    collection: 'projects',
    overrideAccess: true,
    data: {
      name: data.name,
      slug,
      developer: data.developer || 'Unknown — verify manually',
      status: 'draft',
      description: data.description ? plainTextToLexicalState(data.description) : undefined,
      highlights: data.highlights.map((text) => ({ text })),
      legal: {
        reraNumber: data.legal.reraNumber ?? undefined,
        reraInfo: data.legal.reraInfo ?? undefined,
      },
      location: {
        address: data.location.address ?? undefined,
        locality: data.location.locality || 'Unknown — verify manually',
        area: data.location.area ?? undefined,
        city: data.location.city || 'Mumbai',
        state: data.location.state || 'Maharashtra',
        pincode: data.location.pincode ?? undefined,
      },
      configurations: data.configurations.map((configuration) => ({
        name: configuration.name || 'Unnamed configuration — verify manually',
        carpetArea: configuration.carpetArea ?? undefined,
        minArea: configuration.minArea ?? undefined,
        maxArea: configuration.maxArea ?? undefined,
        areaUnit: configuration.areaUnit ?? undefined,
        startingPrice: configuration.startingPrice ?? undefined,
        maxPrice: configuration.maxPrice ?? undefined,
        priceLabel: configuration.priceLabel ?? undefined,
        notes: configuration.notes ?? undefined,
        availability: configuration.availability ?? undefined,
      })),
      projectDetails: {
        projectType: data.projectDetails.projectType ?? undefined,
        propertyType: data.projectDetails.propertyType ?? undefined,
        possessionStatus: data.projectDetails.possessionStatus ?? undefined,
        constructionStatus: data.projectDetails.constructionStatus ?? undefined,
        numberOfTowers: data.projectDetails.numberOfTowers ?? undefined,
        numberOfFloors: data.projectDetails.numberOfFloors ?? undefined,
        totalUnits: data.projectDetails.totalUnits ?? undefined,
        parkingInfo: data.projectDetails.parkingInfo ?? undefined,
        developerDescription: data.projectDetails.developerDescription ?? undefined,
      },
      amenities: amenityIds,
      specifications: data.specifications,
      nearbyConnectivity: {
        connections: data.nearbyConnectivity.connections.map((connection) => ({
          name: connection.name || 'Unnamed location — verify manually',
          category: connection.category ?? 'other',
          travelTimeMinutes: connection.travelTimeMinutes ?? undefined,
          distance: connection.distance ?? undefined,
          distanceUnit: connection.distanceUnit ?? undefined,
          // Draft-only creation means this never reaches the public site until
          // a human reviews and publishes — the same review gate that already
          // covers every other field, so defaulting to the field's own
          // schema default (true) here is safe.
          displayOnWebsite: true,
        })),
      },
      source: {
        sourceType: source.sourceType,
        sourceFilename: source.sourceFilename ?? undefined,
        processedAt: new Date().toISOString(),
        extractionVersion: EXTRACTION_VERSION,
        extractionNotes: source.extractionNotes.join('\n'),
      },
    },
  });

  return created;
}
