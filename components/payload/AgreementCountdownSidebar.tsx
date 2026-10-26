'use client'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'
import { describeAgreementCountdown, type CountdownTier } from '../../lib/properties/agreementCountdown'

const TIER_COLORS: Record<CountdownTier, string> = {
  expired: 'var(--theme-error-600)',
  urgent: 'var(--theme-warning-800)',
  comfortable: 'var(--theme-elevation-600)',
}

/**
 * Sidebar-only display, right under Status — reads the current form's own
 * `isTenanted` and `currentAgreementEndDate` values (no separate data field: a
 * document field can only live at one path, and it already lives in the
 * Rent Details tab). Tenanted-only, since that's the only state a current
 * tenancy applies to — `isTenanted` rather than `status` because a property can
 * be for sale and let at once; days-remaining math lives in
 * lib/properties/agreementCountdown.ts, shared with the list-view Cell.
 */
export function AgreementCountdownSidebar() {
  const { isTenanted, currentAgreementEndDate } = useFormFields(([fields]) => ({
    isTenanted: fields['isTenanted']?.value,
    currentAgreementEndDate: fields['currentAgreementEndDate']?.value,
  }))

  if (isTenanted !== true) {
    return null
  }

  const labelStyle: React.CSSProperties = {
    color: 'var(--theme-elevation-500)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.02em',
    marginBottom: 4,
    textTransform: 'uppercase',
  }

  const countdown = describeAgreementCountdown(
    typeof currentAgreementEndDate === 'string' ? currentAgreementEndDate : null,
  )

  return (
    <div>
      <p style={labelStyle}>Agreement Ends In</p>
      {countdown ? (
        <p style={{ color: TIER_COLORS[countdown.tier], fontSize: 13, fontWeight: 600, margin: 0 }}>
          {countdown.label}
        </p>
      ) : (
        <p style={{ color: 'var(--theme-elevation-400)', fontSize: 13, margin: 0 }}>
          No Tenancy History recorded yet.
        </p>
      )}
    </div>
  )
}

export default AgreementCountdownSidebar
