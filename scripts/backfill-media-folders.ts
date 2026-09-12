import { resolveMediaFolderId } from '../collections/hooks/assignMediaFolder';
import { getPayloadClient } from '../lib/payload';

/**
 * One-off, idempotent migration for the native Media-folder system
 * (see collections/hooks/assignMediaFolder.ts).
 *
 * For every existing Property/Project:
 *   1. Ensures its `mediaFolder` is linked (creating the folder if this
 *      record predates the feature — `createAssignMediaFolderHook` only
 *      runs on save, so pre-existing records never got one).
 *   2. Leaves already-linked records untouched.
 *
 * For every existing Media document already referenced from a
 * Property/Project's media fields (featuredImage/gallery/floorPlans/
 * masterPlan/locationMapImage):
 *   3. Sets its `folder` to that owner's `mediaFolder`, but only if the
 *      Media doc doesn't already have a folder, and only if it is
 *      referenced by exactly one property/project — a Media doc shared by
 *      more than one is left unassigned and logged for manual review
 *      rather than guessed at.
 *
 * Never deletes or overwrites anything. Safe to re-run: every write here
 * only ever fills a currently-empty `mediaFolder`/`folder` field.
 */

type OwnerCollection = 'properties' | 'projects';

type OwnerRef = {
  collection: OwnerCollection;
  id: number;
  rerId: string;
  mediaFolderId: number;
};

const RER_ID_FIELD: Record<OwnerCollection, 'propertyId' | 'projectId'> = {
  properties: 'propertyId',
  projects: 'projectId',
};

const MEDIA_FIELD_PATHS: Record<OwnerCollection, string[]> = {
  properties: ['media.featuredImage', 'media.gallery'],
  projects: ['media.featuredImage', 'media.gallery', 'media.floorPlans', 'media.masterPlan', 'media.locationMapImage'],
};

function getAtPath(doc: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== 'object') {
      return undefined;
    }
    return (acc as Record<string, unknown>)[key];
  }, doc);
}

function toIdList(value: unknown): (number | string)[] {
  if (value === null || value === undefined) {
    return [];
  }

  const items = Array.isArray(value) ? value : [value];

  return items
    .map((item) => (item && typeof item === 'object' ? (item as { id?: number | string }).id : item))
    .filter((id): id is number | string => typeof id === 'number' || typeof id === 'string');
}

async function main() {
  const payload = await getPayloadClient();

  // Step 1: ensure every Property/Project has a linked mediaFolder.
  const owners: OwnerRef[] = [];

  for (const collection of ['properties', 'projects'] as const) {
    const rerIdField = RER_ID_FIELD[collection];
    let page = 1;

    for (;;) {
      const result = await payload.find({
        collection,
        depth: 0,
        limit: 200,
        page,
        overrideAccess: true,
      });

      for (const doc of result.docs as unknown as Record<string, unknown>[]) {
        const rerId = doc[rerIdField] as string | undefined;
        if (!rerId) {
          console.warn(`Skipping ${collection} id=${doc.id}: no ${rerIdField} assigned yet.`);
          continue;
        }

        let mediaFolderId = doc.mediaFolder as number | null | undefined;

        if (!mediaFolderId) {
          mediaFolderId = await resolveMediaFolderId({ payload, rerId });

          await payload.update({
            collection,
            id: doc.id as number,
            data: { mediaFolder: mediaFolderId },
            overrideAccess: true,
            depth: 0,
          });

          console.log(`Linked ${collection} ${rerId} (id=${doc.id}) -> folder ${mediaFolderId}`);
        }

        owners.push({ collection, id: doc.id as number, rerId, mediaFolderId });
      }

      if (!result.hasNextPage) {
        break;
      }
      page += 1;
    }
  }

  // Step 2: find which Media docs each owner currently references.
  const mediaOwners = new Map<string, OwnerRef[]>();

  for (const owner of owners) {
    const doc = await payload.findByID({
      collection: owner.collection,
      id: owner.id,
      depth: 0,
      overrideAccess: true,
    });

    for (const path of MEDIA_FIELD_PATHS[owner.collection]) {
      for (const mediaId of toIdList(getAtPath(doc, path))) {
        const key = String(mediaId);
        const existing = mediaOwners.get(key) ?? [];
        existing.push(owner);
        mediaOwners.set(key, existing);
      }
    }
  }

  // Step 3: backfill Media.folder, skipping anything already set or shared.
  let assigned = 0;
  let alreadySet = 0;
  let skippedConflicts = 0;

  for (const [mediaId, referencingOwners] of mediaOwners) {
    const uniqueOwnerKeys = new Set(referencingOwners.map((o) => `${o.collection}:${o.id}`));

    const mediaDoc = (await payload.findByID({
      collection: 'media',
      id: mediaId,
      depth: 0,
      overrideAccess: true,
    })) as unknown as Record<string, unknown>;

    if (mediaDoc.folder) {
      alreadySet += 1;
      continue;
    }

    if (uniqueOwnerKeys.size > 1) {
      console.warn(
        `Media id=${mediaId} is referenced by multiple properties/projects (${[...uniqueOwnerKeys].join(
          ', ',
        )}) — leaving unassigned for manual review.`,
      );
      skippedConflicts += 1;
      continue;
    }

    const owner = referencingOwners[0];
    await payload.update({
      collection: 'media',
      id: mediaId,
      data: { folder: owner.mediaFolderId },
      overrideAccess: true,
      depth: 0,
    });
    assigned += 1;
  }

  console.log(`\nDone. ${owners.length} properties/projects checked/linked.`);
  console.log(
    `Media: ${assigned} backfilled, ${alreadySet} already assigned, ${skippedConflicts} left for manual review (shared between multiple properties/projects).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
