'use client'

import { Banner, Button, toast, useDocumentInfo, useForm, useFormFields } from '@payloadcms/ui'
import React from 'react'
import { CATEGORY_LABELS } from '../../lib/nearby-locations/categories'
import { connectionKey } from '../../lib/nearby-locations/duplicates'
import type { ConnectionCategory, NearbySuggestion } from '../../lib/nearby-locations/types'

const CONNECTIONS_PATH = 'nearbyConnectivity.connections'
const CONNECTIONS_SCHEMA_PATH = 'properties.nearbyConnectivity.connections'

function hasCoordinate(value: unknown): boolean {
  if (value === null || value === undefined || value === '') {
    return false
  }

  return Number.isFinite(Number(value))
}

function formatDistance(suggestion: Pick<NearbySuggestion, 'distance' | 'distanceUnit'>): string {
  if (suggestion.distanceUnit === 'm') {
    return `${suggestion.distance} m`
  }

  return `${suggestion.distance} km`
}

function fieldValueToRowMap(
  fields: Record<string, { value?: unknown } | undefined>,
): { name: string; category: string }[] {
  const byIndex: Record<string, { name?: string; category?: string }> = {}

  for (const [path, field] of Object.entries(fields)) {
    const match = path.match(/^nearbyConnectivity\.connections\.(\d+)\.(name|category)$/)
    if (!match || !field) {
      continue
    }

    const [, index, key] = match
    byIndex[index] ??= {}
    byIndex[index][key as 'name' | 'category'] = String(field.value ?? '')
  }

  return Object.values(byIndex).filter((row) => row.name && row.category) as {
    name: string
    category: string
  }[]
}

function toFieldState(value: boolean | number | string) {
  return {
    initialValue: value,
    passesCondition: true,
    value,
    valid: true,
  }
}

export function GenerateNearbyLocations() {
  const { id } = useDocumentInfo()
  const { addFieldRow } = useForm()
  const { latitude, longitude, connectionFields } = useFormFields(([fields]) => ({
    latitude: fields['location.latitude']?.value,
    longitude: fields['location.longitude']?.value,
    connectionFields: fields,
  }))

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [warnings, setWarnings] = React.useState<string[]>([])
  const [suggestions, setSuggestions] = React.useState<NearbySuggestion[] | null>(null)
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set())

  const formConnectionKeys = React.useMemo(() => {
    return new Set(
      fieldValueToRowMap(connectionFields).map((row) => connectionKey(row.name, row.category)),
    )
  }, [connectionFields])

  const visibleSuggestions = suggestions ?? []

  const onGenerate = async () => {
    if (!id) {
      setError('Please save this property and add latitude and longitude before generating nearby locations.')
      toast.error('Please save this property and add latitude and longitude before generating nearby locations.')
      return
    }

    if (!hasCoordinate(latitude) || !hasCoordinate(longitude)) {
      setError('Please save this property and add latitude and longitude before generating nearby locations.')
      toast.error('Please save this property and add latitude and longitude before generating nearby locations.')
      return
    }

    setLoading(true)
    setError(null)
    setWarnings([])
    setSuggestions(null)
    setSelectedKeys(new Set())

    try {
      const response = await fetch(`/api/properties/${id}/generate-nearby-locations`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string
        suggestions?: NearbySuggestion[]
        warnings?: string[]
      }

      if (!response.ok) {
        const message = payload.message || 'Unable to generate nearby locations.'
        setError(message)
        toast.error(message)
        return
      }

      const nextSuggestions = Array.isArray(payload.suggestions) ? payload.suggestions : []
      setSuggestions(nextSuggestions)
      setWarnings(Array.isArray(payload.warnings) ? payload.warnings : [])

      if (nextSuggestions.length === 0) {
        toast.info('No nearby location suggestions were returned for the saved coordinates.')
      }
    } catch {
      const message = 'Unable to generate nearby locations.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const toggleSuggestion = (suggestion: NearbySuggestion, disabled: boolean) => {
    if (disabled) {
      return
    }

    const key = connectionKey(suggestion.name, suggestion.category)
    setSelectedKeys((current) => {
      const next = new Set(current)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const onCancel = () => {
    setSuggestions(null)
    setSelectedKeys(new Set())
    setWarnings([])
  }

  const onAddSelected = () => {
    if (!suggestions?.length) {
      return
    }

    const existing = new Set(formConnectionKeys)
    let added = 0
    let skipped = 0

    for (const suggestion of suggestions) {
      const key = connectionKey(suggestion.name, suggestion.category)

      if (!selectedKeys.has(key)) {
        continue
      }

      if (existing.has(key) || suggestion.alreadyExists) {
        skipped += 1
        continue
      }

      addFieldRow({
        path: CONNECTIONS_PATH,
        schemaPath: CONNECTIONS_SCHEMA_PATH,
        subFieldState: {
          name: toFieldState(suggestion.name),
          category: toFieldState(suggestion.category),
          distance: toFieldState(suggestion.distance),
          distanceUnit: toFieldState(suggestion.distanceUnit),
          displayOnWebsite: toFieldState(true),
        },
      })

      existing.add(key)
      added += 1
    }

    if (added === 0) {
      toast.info(
        skipped
          ? 'Selected places already exist on this property. Nothing was added.'
          : 'Select at least one suggestion to add.',
      )
      return
    }

    toast.success(
      added === 1
        ? 'Added 1 nearby location. Save the property to persist it.'
        : `Added ${added} nearby locations. Save the property to persist them.`,
    )
    onCancel()
  }

  return (
    <div>
      <Banner type="info">
        Generation uses the saved Property ID and saved latitude/longitude, not unsaved form coordinates. Choose
        which suggestions to add. Travel times are left blank unless you enter them manually.
      </Banner>

      {error ? <Banner type="error">{error}</Banner> : null}

      {warnings.map((warning) => (
        <Banner key={warning} type="info">
          {warning}
        </Banner>
      ))}

      <Button buttonStyle="secondary" disabled={loading} margin type="button" onClick={onGenerate}>
        {loading ? 'Generating nearby locations...' : 'Generate Nearby Locations'}
      </Button>

      {suggestions ? (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ marginBottom: 8 }}>Nearby Location Suggestions</h4>
          {visibleSuggestions.length === 0 ? (
            <p>No suggestions were returned.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {visibleSuggestions.map((suggestion) => {
                const key = connectionKey(suggestion.name, suggestion.category)
                const alreadyExists = Boolean(suggestion.alreadyExists) || formConnectionKeys.has(key)
                const checked = alreadyExists || selectedKeys.has(key)
                const categoryLabel =
                  CATEGORY_LABELS[suggestion.category as ConnectionCategory] || suggestion.category

                return (
                  <li key={key} style={{ marginBottom: 8 }}>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <input
                        checked={checked}
                        disabled={alreadyExists}
                        onChange={() => toggleSuggestion(suggestion, alreadyExists)}
                        type="checkbox"
                      />
                      <span>
                        {suggestion.name} — {categoryLabel} — {formatDistance(suggestion)}
                        {alreadyExists ? ' (already added)' : ''}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Button buttonStyle="primary" type="button" onClick={onAddSelected}>
              Add Selected
            </Button>
            <Button buttonStyle="secondary" type="button" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
