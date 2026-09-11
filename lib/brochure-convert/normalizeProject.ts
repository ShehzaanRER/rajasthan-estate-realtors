import type { ExtractedProjectData } from './types';

/**
 * Simple, human-readable review flags — a plain string array, not a scored
 * ML confidence system. Each flag tells the reviewing admin exactly what to
 * double-check in the Payload editor before publishing.
 */

export function buildReviewFlags(
  data: ExtractedProjectData,
  context: { truncated: boolean; unmatchedAmenities: string[] },
): string[] {
  const flags: string[] = [];

  if (!data.name) {
    flags.push('Project name could not be extracted — enter it manually before saving.');
  }

  if (!data.developer) {
    flags.push('Developer / builder name could not be extracted — enter it manually.');
  }

  if (!data.location.locality) {
    flags.push('Locality could not be extracted — location fields need manual review.');
  }

  if (!data.location.city) {
    flags.push("City could not be extracted — defaulted to 'Mumbai', please verify.");
  }

  if (!data.legal.reraNumber) {
    flags.push('RERA Registration Number not found in the source — verify and add manually before publishing.');
  }

  if (data.configurations.length === 0) {
    flags.push('No unit configurations were detected — add them manually if applicable.');
  }

  for (const configuration of data.configurations) {
    if (configuration.priceLabel && configuration.startingPrice === null) {
      const label = configuration.name ? `'${configuration.name}'` : 'a configuration';
      flags.push(
        `Price for ${label} was ambiguous or non-numeric in the source ("${configuration.priceLabel}") — verify manually.`,
      );
    }
  }

  if (data.projectDetails.possessionDate) {
    flags.push(
      `Possession date mentioned in source: "${data.projectDetails.possessionDate}" — set the Possession Date field manually (not auto-filled, since it needs an exact month/year).`,
    );
  }

  if (context.unmatchedAmenities.length > 0) {
    flags.push(
      `These amenities from the source could not be matched to existing Amenities records and were NOT added: ${context.unmatchedAmenities.join(', ')}. Add them manually, or create the matching Amenity records first and re-run.`,
    );
  }

  if (!data.description) {
    flags.push('Description was not extracted — consider adding one manually.');
  }

  if (context.truncated) {
    flags.push(
      'The source text was longer than the extraction limit and was truncated before processing — later sections of the brochure may not have been reviewed.',
    );
  }

  return flags;
}
