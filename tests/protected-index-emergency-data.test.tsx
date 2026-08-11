/**
 * Flow contract: the host supplies confirmed protected-index records; secure
 * storage and emergency availability remain two visible, independent states.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ProtectedIndexEmergencyData, type ProtectedIndexEmergencyCopy } from '../src/ProtectedIndexEmergencyData.js'

const copy: ProtectedIndexEmergencyCopy = {
  title: 'Emergency copies', body: 'Only authorized professionals receive the minimum data.',
  securePinTitle: 'Stored safely', securePinBody: 'Encrypted in the index.',
  emergencyPinTitle: 'Available in an emergency', emergencyPinBody: 'Released only after policy checks.',
  emergencyOnly: 'Available to authorized responders', protectedOnly: 'Stored, not shared for emergencies',
  empty: 'No confirmed copies.', sourcePrefix: 'Source', creatorPrefix: 'Added by',
}

describe('ProtectedIndexEmergencyData', () => {
  it('does not infer the emergency pin from protected storage or authorship', () => {
    const html = renderToStaticMarkup(<ProtectedIndexEmergencyData copy={copy} items={[{
      identifier: 'record-1', title: 'Care note', categoryLabel: 'Personal note',
      creatorLabel: 'Controller', emergencyAvailable: false,
    }]} />)
    expect(html).toContain('Care note')
    expect(html.match(/aria-label="Stored safely"/g)).toHaveLength(2)
    expect(html.match(/aria-label="Available in an emergency"/g)).toHaveLength(1)
    expect(html).toContain('Stored, not shared for emergencies')
  })

  it('shows both pins only for backend-confirmed emergency availability', () => {
    const html = renderToStaticMarkup(<ProtectedIndexEmergencyData copy={copy} items={[{
      identifier: 'record-2', title: 'Allergy', categoryLabel: 'Health', sourceLabel: 'External clinic',
      emergencyAvailable: true,
    }]} />)
    expect(html.match(/aria-label="Available in an emergency"/g)).toHaveLength(2)
    expect(html).toContain('Available to authorized responders')
  })
})
