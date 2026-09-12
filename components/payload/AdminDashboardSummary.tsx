import Link from 'next/link'
import { getPayloadClient } from '../../lib/payload'
import { PUBLIC_STATUSES } from '../../lib/properties/publicScope'

/**
 * "Active/current" has no single existing Project status the way Properties'
 * PUBLIC_STATUSES already means "still on the market" — so this dashboard
 * defines it explicitly, from the real schema, as every non-draft status
 * that isn't yet concluded: upcoming, under-construction, ready-to-move.
 * 'completed' and 'sold-out' are deliberately excluded, mirroring how
 * Properties' 'sold'/'rented' aren't counted as active either. This is a
 * dashboard-only grouping — no new status is added to the Projects schema.
 */
const PROJECT_ACTIVE_STATUSES = ['upcoming', 'under-construction', 'ready-to-move'] as const

type CollectionSlug = 'projects' | 'properties'

type RecentItem = {
  collection: CollectionSlug
  id: number
  label: string
  rerId: string
  status: string
  updatedAt: string
}

type AttentionItem = {
  collection: CollectionSlug
  id: number
  label: string
  rerId: string
}

function editHref(collection: CollectionSlug, id: number): string {
  return `/admin/collections/${collection}/${id}`
}

function formatUpdatedAt(value: string): string {
  try {
    return new Date(value).toLocaleString('en-IN', {
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      month: 'short',
    })
  } catch {
    return value
  }
}

const sectionLabelStyle: React.CSSProperties = {
  color: 'var(--theme-elevation-500)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  marginBottom: 10,
  textTransform: 'uppercase',
}

const rowStyle: React.CSSProperties = {
  alignItems: 'center',
  borderTop: '1px solid var(--theme-elevation-100)',
  display: 'flex',
  fontSize: 13,
  gap: 10,
  justifyContent: 'space-between',
  padding: '8px 0',
}

const rerIdStyle: React.CSSProperties = {
  color: 'var(--theme-elevation-500)',
  fontVariantNumeric: 'tabular-nums',
  minWidth: 84,
}

const emptyStateStyle: React.CSSProperties = {
  color: 'var(--theme-elevation-400)',
  fontSize: 13,
  padding: '8px 0',
}

const countStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 600,
}

/**
 * Additive dashboard summary, registered via admin.components.afterDashboard
 * (renders after Payload's own collection-overview dashboard, never replaces
 * it). Answers one question — "what needs attention right now" — using only
 * small count()/find() queries against the existing schema. Writes nothing,
 * adds no fields, and reuses PUBLIC_STATUSES rather than redefining what
 * "active" means for Properties.
 */
export async function AdminDashboardSummary() {
  const payload = await getPayloadClient()

  const [
    propertiesActive,
    propertiesDraft,
    projectsActive,
    projectsDraft,
    newInquiries,
    recentProperties,
    recentProjects,
    propertiesMissingImage,
    projectsMissingImage,
  ] = await Promise.all([
    payload.count({ collection: 'properties', where: { status: { in: [...PUBLIC_STATUSES] } } }),
    payload.count({ collection: 'properties', where: { status: { equals: 'draft' } } }),
    payload.count({ collection: 'projects', where: { status: { in: [...PROJECT_ACTIVE_STATUSES] } } }),
    payload.count({ collection: 'projects', where: { status: { equals: 'draft' } } }),
    payload.count({ collection: 'contact-inquiries', where: { status: { equals: 'new' } } }),
    payload.find({
      collection: 'properties',
      depth: 0,
      limit: 5,
      select: { propertyId: true, status: true, title: true, updatedAt: true },
      sort: '-updatedAt',
    }),
    payload.find({
      collection: 'projects',
      depth: 0,
      limit: 5,
      select: { name: true, projectId: true, status: true, updatedAt: true },
      sort: '-updatedAt',
    }),
    payload.find({
      collection: 'properties',
      depth: 0,
      limit: 5,
      select: { propertyId: true, title: true },
      sort: '-updatedAt',
      where: { 'media.featuredImage': { exists: false } },
    }),
    payload.find({
      collection: 'projects',
      depth: 0,
      limit: 5,
      select: { name: true, projectId: true },
      sort: '-updatedAt',
      where: { 'media.featuredImage': { exists: false } },
    }),
  ])

  const recent: RecentItem[] = [
    ...recentProperties.docs.map(
      (doc): RecentItem => ({
        collection: 'properties',
        id: doc.id,
        label: doc.title || '(untitled)',
        rerId: doc.propertyId || '—',
        status: doc.status || '—',
        updatedAt: doc.updatedAt,
      }),
    ),
    ...recentProjects.docs.map(
      (doc): RecentItem => ({
        collection: 'projects',
        id: doc.id,
        label: doc.name || '(untitled)',
        rerId: doc.projectId || '—',
        status: doc.status || '—',
        updatedAt: doc.updatedAt,
      }),
    ),
  ]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  const attention: AttentionItem[] = [
    ...propertiesMissingImage.docs.map(
      (doc): AttentionItem => ({
        collection: 'properties',
        id: doc.id,
        label: doc.title || '(untitled)',
        rerId: doc.propertyId || '—',
      }),
    ),
    ...projectsMissingImage.docs.map(
      (doc): AttentionItem => ({
        collection: 'projects',
        id: doc.id,
        label: doc.name || '(untitled)',
        rerId: doc.projectId || '—',
      }),
    ),
  ]

  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-100)',
        borderRadius: 4,
        marginBottom: 'var(--base)',
        padding: '20px 24px',
      }}
    >
      <h3
        style={{
          borderBottom: '2px solid var(--rer-gold, #b8862f)',
          display: 'inline-block',
          fontSize: 16,
          fontWeight: 600,
          margin: '0 0 18px',
          paddingBottom: 6,
        }}
      >
        Operations Summary
      </h3>

      <div
        style={{
          display: 'grid',
          gap: 24,
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          marginBottom: 24,
        }}
      >
        <div>
          <p style={sectionLabelStyle}>Properties</p>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div style={countStyle}>{propertiesActive.totalDocs}</div>
              <div style={{ color: 'var(--theme-elevation-500)', fontSize: 12 }}>Active</div>
            </div>
            <div>
              <div style={countStyle}>{propertiesDraft.totalDocs}</div>
              <div style={{ color: 'var(--theme-elevation-500)', fontSize: 12 }}>Draft</div>
            </div>
          </div>
        </div>

        <div>
          <p style={sectionLabelStyle}>Projects</p>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div style={countStyle}>{projectsActive.totalDocs}</div>
              <div style={{ color: 'var(--theme-elevation-500)', fontSize: 12 }}>Active</div>
            </div>
            <div>
              <div style={countStyle}>{projectsDraft.totalDocs}</div>
              <div style={{ color: 'var(--theme-elevation-500)', fontSize: 12 }}>Draft</div>
            </div>
          </div>
        </div>

        <div>
          <p style={sectionLabelStyle}>Contact Inquiries</p>
          <Link href="/admin/collections/contact-inquiries" style={{ color: 'inherit', textDecoration: 'none' }}>
            <div style={countStyle}>{newInquiries.totalDocs}</div>
            <div style={{ color: 'var(--theme-elevation-500)', fontSize: 12 }}>New</div>
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div>
          <p style={sectionLabelStyle}>Recently Updated</p>
          {recent.length === 0 ? (
            <p style={emptyStateStyle}>No recent activity.</p>
          ) : (
            recent.map((item) => (
              <Link
                href={editHref(item.collection, item.id)}
                key={`${item.collection}-${item.id}`}
                style={{ color: 'inherit', display: 'block', textDecoration: 'none' }}
              >
                <div style={rowStyle}>
                  <span style={rerIdStyle}>{item.rerId}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                  <span style={{ color: 'var(--theme-elevation-500)', whiteSpace: 'nowrap' }}>
                    {formatUpdatedAt(item.updatedAt)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

        <div>
          <p style={sectionLabelStyle}>Needs Attention · Missing Featured Image</p>
          {attention.length === 0 ? (
            <p style={emptyStateStyle}>Every listing has a featured image.</p>
          ) : (
            attention.map((item) => (
              <Link
                href={editHref(item.collection, item.id)}
                key={`${item.collection}-${item.id}`}
                style={{ color: 'inherit', display: 'block', textDecoration: 'none' }}
              >
                <div style={rowStyle}>
                  <span style={rerIdStyle}>{item.rerId}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                  <span style={{ color: 'var(--theme-warning-800)', fontSize: 12 }}>{item.collection}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardSummary
