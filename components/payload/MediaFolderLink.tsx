'use client'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'

/**
 * Sidebar shortcut from a Property/Project into its own native Payload
 * media folder (see collections/hooks/assignMediaFolder.ts). This component
 * creates nothing and writes nothing — it only reads:
 *  - the existing `mediaFolder` relationship, to build the browse link, and
 *  - the document's own permanent `propertyId`/`projectId`, to display the
 *    folder's identity (the folder's own `name` is always set to that same
 *    RER ID by resolveMediaFolderId(), so this shows the same text without
 *    a second lookup or a duplicated copy of that mapping).
 *
 * Route verified against the Payload 3.88 admin router actually shipped in
 * this repo's node_modules (@payloadcms/next's getRouteData.js) and against
 * Payload's own default `admin.routes` (this project does not override
 * them): `/browse-by-folder/:folderID` mounted under the `/admin` admin
 * route, i.e. `/admin/browse-by-folder/:folderID` — the same URL the
 * built-in "Browse by Folder" nav link and the Media collection's own
 * folder browser already use.
 */
function extractFolderId(value: unknown): number | string | null {
  if (value == null) {
    return null
  }

  if (typeof value === 'object' && 'id' in (value as Record<string, unknown>)) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'number' || typeof id === 'string' ? id : null
  }

  return typeof value === 'number' || typeof value === 'string' ? value : null
}

export function MediaFolderLink() {
  const { propertyId, projectId, mediaFolder } = useFormFields(([fields]) => ({
    mediaFolder: fields['mediaFolder']?.value,
    projectId: fields['projectId']?.value,
    propertyId: fields['propertyId']?.value,
  }))

  const rerId =
    (typeof propertyId === 'string' && propertyId) ||
    (typeof projectId === 'string' && projectId) ||
    null

  const folderId = extractFolderId(mediaFolder)

  const labelStyle: React.CSSProperties = {
    color: 'var(--theme-elevation-500)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.02em',
    marginBottom: 4,
    textTransform: 'uppercase',
  }

  if (!folderId) {
    return (
      <div>
        <p style={labelStyle}>Media Folder</p>
        <p style={{ color: 'var(--theme-elevation-400)', fontSize: 13, margin: 0 }}>
          Not assigned yet{rerId ? ` for ${rerId}` : ''}. It is created automatically the next time this record is
          saved.
        </p>
      </div>
    )
  }

  return (
    <div>
      <p style={labelStyle}>Media Folder</p>
      {rerId ? <p style={{ fontSize: 13, margin: '0 0 6px' }}>{rerId}</p> : null}
      <a
        href={`/admin/browse-by-folder/${folderId}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: 'var(--theme-success-600)',
          display: 'inline-block',
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Browse this folder →
      </a>
    </div>
  )
}

export default MediaFolderLink
