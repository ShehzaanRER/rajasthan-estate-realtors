import type { CollectionAfterChangeHook, Payload, PayloadRequest } from 'payload';

/**
 * Finds the native Payload folder (collection `payload-folders`, from the
 * `folders` feature enabled on Media) already created for a given permanent
 * RER ID, or creates it if none exists yet. Only ever holds `media`
 * documents (`folderType: ['media']`) — Properties and Projects themselves
 * are not folder-enabled collections, so nothing but Media can be filed
 * into it.
 *
 * Find-then-create rather than create-and-catch-conflict: safe to call
 * repeatedly — e.g. a retry after a prior run created the folder but failed
 * before linking it back to the property/project — without ever producing
 * a second folder for the same RER ID.
 */
export async function resolveMediaFolderId({
  payload,
  req,
  rerId,
}: {
  payload: Payload;
  req?: PayloadRequest;
  rerId: string;
}): Promise<number | string> {
  const existing = await payload.find({
    collection: 'payload-folders',
    where: { name: { equals: rerId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  });

  if (existing.docs[0]) {
    return existing.docs[0].id;
  }

  const created = await payload.create({
    collection: 'payload-folders',
    data: {
      name: rerId,
      folderType: ['media'],
    },
    overrideAccess: true,
    req,
  });

  return created.id;
}

/**
 * Auto-creates (or reuses) this document's permanent media folder and
 * links it via `mediaFolder`, immediately after the RER ID itself is
 * assigned (`assignPropertyId`/`assignProjectId` run `beforeChange`,
 * earlier in the same request). Runs `afterChange` because:
 *  - the folder name needs the RER ID's final value, and
 *  - linking it back needs this document's own `id`, which only exists
 *    once the insert has completed.
 *
 * Idempotent: once `mediaFolder` is set on a document it is never touched
 * again (also enforced by the field's own `access.update: () => false`),
 * so re-saving a property/project never creates or re-links a folder.
 */
export function createAssignMediaFolderHook({
  collectionSlug,
  rerIdField,
}: {
  collectionSlug: 'properties' | 'projects';
  rerIdField: 'propertyId' | 'projectId';
}): CollectionAfterChangeHook {
  return async ({ doc, req }) => {
    if (doc.mediaFolder) {
      return doc;
    }

    const rerId = doc[rerIdField] as string | undefined;
    if (!rerId) {
      return doc;
    }

    const folderId = await resolveMediaFolderId({ payload: req.payload, req, rerId });

    await req.payload.update({
      collection: collectionSlug,
      id: doc.id,
      data: { mediaFolder: folderId },
      overrideAccess: true,
      depth: 0,
      req,
    });

    return { ...doc, mediaFolder: folderId };
  };
}

/**
 * Scopes an upload/relationship field's selectable Media to only the
 * documents filed under the current Property/Project's own `mediaFolder`.
 * Used on every media field (featuredImage, gallery, floor plans, etc.) so
 * one property's media can never be picked while editing another.
 *
 * If `mediaFolder` isn't set yet (only possible for a brand-new, unsaved
 * document, since `createAssignMediaFolderHook` assigns it immediately on
 * create) this deliberately matches nothing — `{ id: { exists: false } }`
 * — rather than falling back to showing the entire media library.
 */
export function filterMediaByFolder({ data }: { data?: { mediaFolder?: unknown } }) {
  const rawFolder = data?.mediaFolder;
  const folderId =
    rawFolder && typeof rawFolder === 'object'
      ? (rawFolder as { id?: number | string }).id
      : (rawFolder as number | string | undefined | null);

  if (!folderId) {
    return { id: { exists: false } };
  }

  return { folder: { equals: folderId } };
}
