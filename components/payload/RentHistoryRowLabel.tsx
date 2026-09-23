'use client'

import { useFormFields, useRowLabel } from '@payloadcms/ui'
import React from 'react'

/**
 * Row header for the Properties `rentHistory` array — collapsed by default
 * (see `admin.initCollapsed` on the field), expanding to the full tenancy
 * fields on click.
 *
 * Shows "<term> — <licensee name>", e.g. "11 Months — Mudassar Khan", with
 * " (Current)" appended to whichever row is LAST in the array. There is no
 * separate "current" flag on the data (by design — see the field's own
 * admin.description): the current tenancy is always whichever entry sits at
 * the bottom, and dragging a row there (the array is `isSortable`) is how
 * staff correct or reassign it.
 *
 * `useRowLabel` gives this row's own sibling data and its index, but not the
 * total row count needed to know whether it's last — so the live row count
 * comes from `useFormFields` reading the parent array field's own form-state
 * entry (`fields[<arrayPath>].rows`), the same hook already used the same
 * way in MediaFolderLink.tsx.
 */

type RentHistoryRowData = {
  agreementTerm?: string
  agreementTermMonths?: number
  licenseeName?: string
}

export function RentHistoryRowLabel() {
  const { data, path, rowNumber } = useRowLabel<RentHistoryRowData>()

  // `path` is this row's own path, e.g. "rentHistory.2" — rentHistory is a
  // top-level array field (not nested in a group/tab with its own name), so
  // the parent array's own path is everything before the last dot.
  const parentPath = path.slice(0, path.lastIndexOf('.'))

  const rowCount = useFormFields(([fields]) => {
    const arrayField = fields[parentPath] as { rows?: unknown[] } | undefined
    return arrayField?.rows?.length ?? 0
  })

  const isCurrent = rowCount > 0 && rowNumber === rowCount - 1

  const term = data?.agreementTerm?.trim()
    ? data.agreementTerm.trim()
    : data?.agreementTermMonths
      ? `${data.agreementTermMonths} months`
      : ''

  const name = data?.licenseeName?.trim() || 'New Tenancy'
  const label = term ? `${term} — ${name}` : name

  return (
    <span>
      {label}
      {isCurrent ? ' (Current)' : ''}
    </span>
  )
}

export default RentHistoryRowLabel
