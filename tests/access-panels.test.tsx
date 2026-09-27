// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { InvitationAcceptancePanel } from '../src/InvitationAcceptancePanel.js'
import { SubjectAccessRequestPanel } from '../src/SubjectAccessRequestPanel.js'

describe('shared access-flow panels', () => {
  it('renders invitation acceptance without assuming a product or actor kind', () => {
    const html = renderToStaticMarkup(
      <InvitationAcceptancePanel
        copy={{
          title: 'Accept invitation',
          description: 'Enter the code sent by the controller.',
          codeLabel: 'Invitation code',
          submit: 'Accept',
          submitting: 'Accepting…',
          accepted: 'Invitation accepted.',
        }}
        code="invite-code"
        status="idle"
        onCodeChange={() => undefined}
        onAccept={() => undefined}
      />,
    )
    expect(html).toContain('Invitation code')
    expect(html).not.toMatch(/professional|patient|VetChain|SOSChain/i)
    expect(html).not.toContain('>UHC<')
  })

  it('renders the same scanner/request surface for any authenticated actor facade', () => {
    const html = renderToStaticMarkup(
      <SubjectAccessRequestPanel
        copy={{
          title: 'Connect to a subject',
          description: 'Resolve a card and request access.',
          locatorKindLabel: 'Locator type',
          locatorKinds: {
            qr: 'QR',
            'numeric-code': 'Numeric code',
            'did-web': 'DID',
          },
          locatorLabel: 'Card locator',
          resolve: 'Resolve',
          resolving: 'Resolving…',
          sectionsLabel: 'Requested sections',
          request: 'Request access',
          requesting: 'Requesting…',
          requested: 'Request pending.',
          granted: 'Access granted.',
        }}
        locatorKind="did-web"
        locator="did:web:subject.example"
        status="resolved"
        target={{ subjectId: 'did:web:subject.example', display: 'Selected subject' }}
        sections={[{ code: 'LOINC|48765-2', label: 'Allergies', selected: true }]}
        onLocatorKindChange={() => undefined}
        onLocatorChange={() => undefined}
        onResolve={() => undefined}
        onToggleSection={() => undefined}
        onRequest={() => undefined}
      />,
    )
    expect(html).toContain('LOINC|48765-2')
    expect(html).toContain('Request access')
    expect(html).not.toMatch(/member|professional/i)
  })

  it('renders only provider-enabled governed identifier locators', () => {
    const html = renderToStaticMarkup(
      <SubjectAccessRequestPanel
        copy={{
          title: 'Resolve a subject',
          description: 'Use one attested identifier.',
          locatorKindLabel: 'Identifier type',
          locatorKinds: {
            microchip: 'ISO animal microchip',
            tattoo: 'Attested tattoo',
          },
          locatorLabel: 'Identifier',
          resolve: 'Resolve',
          resolving: 'Resolving…',
          sectionsLabel: 'Requested sections',
          request: 'Request access',
          requesting: 'Requesting…',
          requested: 'Request pending.',
          granted: 'Access granted.',
        }}
        locatorKind="microchip"
        locator="981020000123456"
        status="resolved"
        target={{
          subjectId: 'did:web:subject.example',
          display: 'Selected subject',
          identifiers: [{
            kind: 'microchip',
            system: 'http://terminology.hl7.org/CodeSystem/v2-0203|MCN',
            value: '981020000123456',
            attested: true,
          }],
        }}
        sections={[]}
        onLocatorKindChange={() => undefined}
        onLocatorChange={() => undefined}
        onResolve={() => undefined}
        onToggleSection={() => undefined}
        onRequest={() => undefined}
      />,
    )
    expect(html).toContain('ISO animal microchip')
    expect(html).toContain('Attested tattoo')
    expect(html).toContain('inputMode="numeric"')
    expect(html).toContain('pattern="[0-9 -]{15,21}"')
    expect(html).not.toMatch(/email|phone/i)
  })
})
