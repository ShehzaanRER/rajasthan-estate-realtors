'use client'

import { Button, toast, useForm, useFormFields } from '@payloadcms/ui'
import React from 'react'
import { buildPropertySlug } from '../../lib/properties/slug'
import type { Property } from '../../payload-types'

/**
 * "Slug Update" — rebuilds a property's slug from the form's current values.
 *
 * Registered as `admin.components.afterInput` on the `slug` field
 * (collections/Properties.ts), so it renders inside the field's own wrapper,
 * immediately after the input. §12 of `app/(payload)/custom.scss` turns that
 * wrapper into a two-column grid so the button sits *beside* the input rather
 * than under it.
 *
 * ## Why this exists
 *
 * `collections/hooks/assignPropertySlug.ts` only ever fills the slug on
 * `create`, and deliberately so — a published URL is a promise, and no edit to
 * the title, locality or BHK is allowed to silently rewrite it. That leaves two
 * cases with no way out other than retyping the slug by hand:
 *
 * 1. **Duplication.** A duplicate inherits the original's descriptive tokens,
 *    so its generated slug can end up describing the source listing rather than
 *    the unit the duplicate was edited into.
 * 2. **Correction.** A locality or BHK typo fixed after creation leaves the
 *    slug quoting the wrong value forever.
 *
 * This button is the explicit, staff-initiated escape hatch for both. It is a
 * deliberate action on a deliberate click — never automatic.
 *
 * ## No server round trip
 *
 * The slug is a pure function of four values (`lib/properties/slug.ts`), all of
 * which are in the live form state, so this computes it client-side from the
 * *same* function the create hook uses. There is exactly one slug format in the
 * codebase and no endpoint to keep in step with it.
 *
 * Uniqueness needs no pre-flight check either: every generated slug ends in the
 * property's own permanent RER ID, so it cannot collide with another property.
 *
 * ## Form state only
 *
 * The new value is dispatched into the form and the document is marked
 * modified — nothing is written until the editor presses Save, so navigating
 * away discards it. `dispatchFields({ type: 'UPDATE' })` is used in preference
 * to `useField`'s `setValue`: the reducer's UPDATE case merges only the keys it
 * is handed, which leaves the slug field's own `validate` function registered.
 * Mounting a second `useField({ path: 'slug' })` here would re-register the
 * field without that validator.
 */

const SLUG_PATH = 'slug'

function toOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function toOptionalInteger(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : null
}

export function RegenerateSlugButton() {
  const { dispatchFields, setModified } = useForm()

  const { slug, propertyId, propertyType, locality, bedrooms } = useFormFields(([fields]) => ({
    slug: fields[SLUG_PATH]?.value,
    propertyId: fields.propertyId?.value,
    propertyType: fields.propertyType?.value,
    locality: fields['location.locality']?.value,
    bedrooms: fields['details.bedrooms']?.value,
  }))

  const currentSlug = toOptionalString(slug)

  // The RER ID is allocated server-side by assignPropertyId, so an unsaved
  // property has none — and without it there is no unique tail to build on.
  const rerId = toOptionalString(propertyId)

  const nextSlug = React.useMemo(() => {
    if (!rerId) {
      return null
    }

    return buildPropertySlug({
      propertyId: rerId,
      // `propertyType` is required to save, so it is always present once a
      // Property ID exists. `other` is the schema's own fallback value.
      propertyType: (toOptionalString(propertyType) ?? 'other') as Property['propertyType'],
      locality: toOptionalString(locality),
      bedrooms: toOptionalInteger(bedrooms),
    })
  }, [rerId, propertyType, locality, bedrooms])

  const onClick = () => {
    if (!nextSlug) {
      toast.error('Save this property first — its slug is built from the Property ID assigned on save.')
      return
    }

    if (nextSlug === currentSlug) {
      toast.info('The slug already matches this property. Nothing changed.')
      return
    }

    dispatchFields({ type: 'UPDATE', path: SLUG_PATH, value: nextSlug })
    setModified(true)

    toast.success(`Slug updated to "${nextSlug}". Save the property to apply the new URL.`)
  }

  return (
    <div className="rer-slug-update">
      <Button
        buttonStyle="secondary"
        disabled={!nextSlug}
        margin={false}
        onClick={onClick}
        size="small"
        tooltip={
          nextSlug
            ? 'Rebuild the slug from this property’s BHK, type, locality and RER ID'
            : 'Available once the property has been saved and has a Property ID'
        }
        type="button"
      >
        Slug Update
      </Button>
    </div>
  )
}
