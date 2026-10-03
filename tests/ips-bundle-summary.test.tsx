// TDD contract: write this test red first; make it green only with the complete real behavior.
/**
 * Flow contract:
 * 1. The host gives the component one already-loaded IPS document Bundle.
 * 2. Common Utils resolves every Composition section and referenced resource.
 * 3. The component renders one section container and its UI-ready cards.
 * 4. No browser ingestion or GW operation occurs in this rendering flow.
 */
import fs from 'node:fs'
import path from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  HealthcareIpsSectionResourceProfiles,
  HealthcareIpsSharedResourceTypes,
} from 'gdc-common-utils-ts/constants/healthcare'
import {
  FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS,
  FhirIpsClinicalArtifactTypes,
  buildVitalSignObservation,
  projectVitalSignObservationR4,
} from 'fhir-data-utils-ts'
import { ResourceTypesFhirR4 } from 'gdc-common-utils-ts/constants/fhir-resource-types'
import type { ClinicalResourceLike } from 'gdc-common-utils-ts/utils/clinical-resource-view'
import { IpsBundleSummary } from '../src/IpsBundleSummary.js'

const fixturePath = path.resolve(
  process.cwd(),
  'node_modules/gdc-common-utils-ts/fixtures/fhir-ips-bundle-all-sections.json',
)

function concept(resourceType: string) {
  return {
    text: `Texto local ${resourceType}`,
    coding: [{
      system: 'http://snomed.info/sct',
      code: '123456',
      display: `International ${resourceType}`,
    }],
  }
}

function resourceFor(resourceType: string): ClinicalResourceLike {
  const common = { resourceType, id: `component-${resourceType}`, language: 'es' }
  const coded = concept(resourceType)
  switch (resourceType) {
    case ResourceTypesFhirR4.MedicationStatement:
    case ResourceTypesFhirR4.MedicationRequest:
      return { ...common, medicationCodeableConcept: coded }
    case ResourceTypesFhirR4.Medication:
      return { ...common, code: coded }
    case ResourceTypesFhirR4.Immunization:
      return { ...common, vaccineCode: coded }
    case ResourceTypesFhirR4.Specimen:
    case ResourceTypesFhirR4.Device:
    case ResourceTypesFhirR4.DocumentReference:
      return { ...common, type: coded }
    case ResourceTypesFhirR4.ImagingStudy:
      return { ...common, procedureCode: [coded] }
    case ResourceTypesFhirR4.DeviceUseStatement:
      return { ...common, device: { display: `International ${resourceType}` } }
    case ResourceTypesFhirR4.ClinicalImpression:
      return { ...common, summary: `Texto local ${resourceType}` }
    case ResourceTypesFhirR4.ImmunizationRecommendation:
      return { ...common, recommendation: [{ vaccineCode: [coded] }] }
    case ResourceTypesFhirR4.Consent:
    case ResourceTypesFhirR4.CarePlan:
      return { ...common, category: [coded] }
    case ResourceTypesFhirR4.Organization:
      return { ...common, name: `International ${resourceType}` }
    case ResourceTypesFhirR4.Practitioner:
      return { ...common, name: [{ given: ['Ada'], family: 'Lovelace' }] }
    case ResourceTypesFhirR4.PractitionerRole:
      return { ...common, code: [coded] }
    default:
      return { ...common, code: coded }
  }
}

describe('IpsBundleSummary', () => {
  it('renders all 16 sections from the official IPS fixture', () => {
    const bundle = JSON.parse(fs.readFileSync(fixturePath, 'utf8'))
    const html = renderToStaticMarkup(
      <IpsBundleSummary bundle={bundle} locale="en" emptyLabel="No records" />,
    )

    expect(html.match(/data-ips-section=/g)).toHaveLength(16)
    const cardTitles = [...html.matchAll(/class="uhcp-clinical-title"[^>]*><bdi>(.*?)<\/bdi>/g)]
      .map((match) => match[1])
    expect(cardTitles.length).toBeGreaterThan(0)
    expect(cardTitles.every((title) => !/^https?:\/\/[^|]+\|/.test(title))).toBe(true)
  })

  it('renders every resource type declared by the IPS section profiles', () => {
    const resourceTypes = [...new Set([
      ...Object.values(HealthcareIpsSectionResourceProfiles)
        .flatMap((profile) => [...profile.expectedResourceTypes]),
      ...HealthcareIpsSharedResourceTypes,
    ])]
    const entries = resourceTypes.map((resourceType) => ({
      fullUrl: `${resourceType}/component-${resourceType}`,
      resource: resourceFor(resourceType),
    }))
    const bundle = {
      resourceType: 'Bundle',
      type: 'document',
      entry: [{
        resource: {
          resourceType: ResourceTypesFhirR4.Composition,
          section: [{
            title: 'All declared resource types',
            code: { coding: [{ system: 'http://loinc.org', code: '60591-5' }] },
            entry: entries.map((entry) => ({ reference: entry.fullUrl })),
          }],
        },
      }, ...entries],
    }

    const html = renderToStaticMarkup(
      <IpsBundleSummary bundle={bundle} locale="es" emptyLabel="Sin registros" />,
    )

    expect(html.match(/data-resource-type=/g)).toHaveLength(resourceTypes.length)
    for (const resourceType of resourceTypes) {
      expect(html).toContain(`data-resource-type="${resourceType}"`)
    }
  })

  it('propagates locale and terminology translation to section cards', () => {
    const bundle = {
      resourceType: 'Bundle',
      type: 'document',
      entry: [{
        resource: {
          resourceType: ResourceTypesFhirR4.Composition,
          section: [{
            title: 'Problems',
            entry: [{ reference: 'Condition/component-Condition' }],
          }],
        },
      }, {
        fullUrl: 'Condition/component-Condition',
        resource: resourceFor(ResourceTypesFhirR4.Condition),
      }],
    }

    const html = renderToStaticMarkup(
      <IpsBundleSummary
        bundle={bundle}
        locale="fr"
        translateCode={({ token }) => token === 'http://snomed.info/sct|123456'
          ? 'Condition traduite'
          : undefined}
        emptyLabel="Aucun dossier"
      />,
    )

    expect(html).toContain('Condition traduite')
    expect(html).not.toContain('>http://snomed.info/sct|123456<')
  })

  it('renders every component value of a composite Observation', () => {
    const systolic = 120
    const diastolic = 80
    const graph = buildVitalSignObservation({
      entryId: 'blood-pressure-id',
      subjectReference: 'Patient/demo',
      kind: 'blood-pressure',
      measuredAt: '2026-10-03T09:30:00Z',
      status: 'final',
      systolic,
      diastolic,
    })
    const observation = projectVitalSignObservationR4(graph)
    const bundle = {
      resourceType: 'Bundle',
      type: 'document',
      entry: [{
        resource: {
          resourceType: ResourceTypesFhirR4.Composition,
          section: [{
            title: 'Vital signs',
            code: { coding: [{ system: 'http://loinc.org', code: FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS[FhirIpsClinicalArtifactTypes.Observation].sectionCode }] },
            entry: [{ reference: graph.primary.reference }],
          }],
        },
      }, { fullUrl: graph.primary.reference, resource: observation }],
    }

    const html = renderToStaticMarkup(<IpsBundleSummary
      bundle={bundle}
      locale="en-CA"
      timeZone="America/Vancouver"
      emptyLabel="No records"
      timeline={{
        labels: { from: 'From', to: 'To', date: 'Date', time: 'Time', previous: 'Previous', next: 'Next', showAll: 'Show all', empty: 'No dated results' },
        sectionFacetLabel: 'Section',
        resourceTypeFacetLabel: 'Resource type',
      }}
    />)

    for (const component of observation.component ?? []) {
      expect(html).toContain(component.code.coding[0].display)
      expect(html).toContain(`>${component.valueQuantity.value} ${component.valueQuantity.unit}<`)
    }
    expect(html).toContain('Oct 3, 2026, 02:30')
    expect(html).not.toContain('2026-10-03T09:30:00Z')
    expect(html).toContain('1 / 1')
    expect(html).toContain('<legend>Section</legend>')
  })
})
