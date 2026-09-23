import type { PayloadHandler } from 'payload';
import { createMissingAmenities, matchAmenities } from '../../lib/brochure-convert/amenityMatching';
import { createDraftProject } from '../../lib/brochure-convert/createDraft';
import { generateUniqueDraftSlug } from '../../lib/brochure-convert/slug';
import { ExtractionValidationError, validateExtractedProject } from '../../lib/brochure-convert/validateProject';
import type { BrochureSourceType } from '../../lib/brochure-convert/types';

/**
 * Persists exactly one draft Project from admin-confirmed extraction data.
 * Never publishes — status is always forced to 'draft' inside
 * createDraftProject, regardless of what the client sends.
 */
export const brochureConvertCreateHandler: PayloadHandler = async (req) => {
  if (!req.user) {
    return Response.json({ message: 'Unauthorized.' }, { status: 401 });
  }

  if (typeof req.json !== 'function') {
    return Response.json({ message: 'Malformed request.' }, { status: 400 });
  }

  const body = (await req.json()) as {
    data?: unknown;
    amenityIds?: unknown;
    slug?: unknown;
    reviewFlags?: unknown;
    source?: { sourceType?: unknown; sourceFilename?: unknown };
  };

  let data;
  try {
    data = validateExtractedProject(body.data);
  } catch (error) {
    if (error instanceof ExtractionValidationError) {
      return Response.json({ message: error.message }, { status: 400 });
    }
    return Response.json({ message: 'Unable to validate the submitted project data.' }, { status: 400 });
  }

  if (!data.name) {
    return Response.json({ message: 'A project name is required before creating a draft.' }, { status: 400 });
  }

  const selectedAmenityIds = Array.isArray(body.amenityIds)
    ? body.amenityIds.filter((id): id is number => typeof id === 'number')
    : [];

  // Re-match against the live Amenities collection at creation time (not just
  // the client's /validate-time snapshot) and auto-create a master-data
  // record for anything still unmatched, so an extracted amenity is never
  // silently dropped just because it hasn't been catalogued yet.
  const amenityMatch = await matchAmenities(req.payload, data.amenities);
  const createdAmenities = await createMissingAmenities(req.payload, amenityMatch.unmatched);
  const amenityIds = Array.from(new Set([...selectedAmenityIds, ...createdAmenities.map((amenity) => amenity.id)]));

  const reviewFlags = Array.isArray(body.reviewFlags)
    ? body.reviewFlags.filter((flag): flag is string => typeof flag === 'string')
    : [];

  const sourceType: BrochureSourceType = body.source?.sourceType === 'pdf' ? 'pdf' : 'pasted-text';
  const sourceFilename =
    typeof body.source?.sourceFilename === 'string' ? body.source.sourceFilename.slice(0, 255) : null;

  const requestedSlug = typeof body.slug === 'string' && body.slug.trim() ? body.slug.trim() : null;

  let slug = requestedSlug;
  if (slug) {
    // Never trust a client-supplied slug blindly — re-check uniqueness server-side.
    const existingWithSlug = await req.payload.find({
      collection: 'projects',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });

    if (existingWithSlug.totalDocs > 0) {
      slug = null;
    }
  }

  if (!slug) {
    slug = await generateUniqueDraftSlug(req.payload, data.name);
  }

  try {
    const created = await createDraftProject(req.payload, {
      data,
      amenityIds,
      slug,
      source: { sourceType, sourceFilename, extractionNotes: reviewFlags },
    });

    return Response.json({ id: created.id, slug: created.slug, projectId: created.projectId });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : 'Unable to create the draft project.' },
      { status: 500 },
    );
  }
};
