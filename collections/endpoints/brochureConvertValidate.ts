import type { PayloadHandler } from 'payload';
import { matchAmenities } from '../../lib/brochure-convert/amenityMatching';
import { findDuplicateProjects } from '../../lib/brochure-convert/duplicateDetection';
import { buildReviewFlags } from '../../lib/brochure-convert/normalizeProject';
import { generateUniqueDraftSlug } from '../../lib/brochure-convert/slug';
import { ExtractionValidationError, findSchemaWarnings, validateExtractedProject } from '../../lib/brochure-convert/validateProject';

/**
 * Accepts JSON pasted from the RER Claude Skill (run outside this app — no
 * AI call happens here, no external network request of any kind) and
 * validates it against the existing ExtractedProjectData contract in
 * validateProject.ts. Runs the same deterministic pipeline as before
 * (amenity matching, duplicate detection, slug preview, review flags) and
 * never writes to the database — /brochure-convert/create does that only
 * after the admin reviews this response.
 *
 * validateExtractedProject only ever reads the specific fields it knows
 * about (see lib/brochure-convert/validateProject.ts); it silently discards
 * anything else in the pasted JSON. That means a pasted "projectId" or
 * "status" key has no effect — those are never part of ExtractedProjectData
 * and can't reach createDraftProject, which always forces status: 'draft'
 * and never sets projectId (assignProjectId's hook does that, exclusively).
 * findSchemaWarnings reports exactly what got ignored (unknown keys, wrong
 * types, invalid enum values, server-controlled fields) so none of that
 * disappears silently — it's surfaced to the admin as a review flag.
 */
export const brochureConvertValidateHandler: PayloadHandler = async (req) => {
  if (!req.user) {
    return Response.json({ message: 'Unauthorized.' }, { status: 401 });
  }

  if (typeof req.json !== 'function') {
    return Response.json({ message: 'Malformed request.' }, { status: 400 });
  }

  const body = (await req.json()) as { json?: unknown };

  if (typeof body.json !== 'string' || !body.json.trim()) {
    return Response.json({ message: 'Paste the project JSON first.' }, { status: 400 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body.json);
  } catch {
    return Response.json(
      { message: 'That is not valid JSON. Check for a missing bracket, quote, or comma.' },
      { status: 400 },
    );
  }

  let data;
  try {
    data = validateExtractedProject(parsed);
  } catch (error) {
    if (error instanceof ExtractionValidationError) {
      return Response.json({ message: error.message }, { status: 400 });
    }
    return Response.json({ message: 'Unable to validate the submitted project data.' }, { status: 400 });
  }

  const [amenityMatch, duplicates, suggestedSlug] = await Promise.all([
    matchAmenities(req.payload, data.amenities),
    findDuplicateProjects(req.payload, {
      name: data.name,
      developer: data.developer,
      locality: data.location.locality,
    }),
    generateUniqueDraftSlug(req.payload, data.name || 'untitled-project'),
  ]);

  const reviewFlags = [
    ...buildReviewFlags(data, { truncated: false, unmatchedAmenities: amenityMatch.unmatched }),
    ...findSchemaWarnings(parsed),
  ];

  return Response.json({
    data,
    reviewFlags,
    amenityMatch,
    duplicates,
    suggestedSlug,
    source: { sourceType: 'pasted-text' as const, sourceFilename: null },
  });
};
