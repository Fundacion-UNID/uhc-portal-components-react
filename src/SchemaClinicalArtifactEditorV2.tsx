'use client'

import { clinicalArtifactCodedOptionsForClaim } from 'fhir-data-utils-ts'
import {
  ClinicalArtifactEditorV2,
  type ClinicalArtifactEditorV2Props,
  type ClinicalArtifactFieldV2,
} from './ClinicalArtifactEditorV2.js'
import type { ClinicalArtifactSchema } from './ClinicalArtifactEditor.js'

export type SchemaClinicalArtifactEditorV2Props = Omit<ClinicalArtifactEditorV2Props, 'fields' | 'initialVisibleClaims' | 'initialClaims'> & Readonly<{
  schema: ClinicalArtifactSchema
}>

/** Adapts every schema-backed IPS resource to the same progressive V2 editor. */
export function SchemaClinicalArtifactEditorV2({ schema, locale = 'en', ...props }: SchemaClinicalArtifactEditorV2Props) {
  return <ClinicalArtifactEditorV2
    {...props}
    locale={locale}
    fields={clinicalArtifactFieldsV2FromSchema(schema, locale)}
    initialVisibleClaims={schema.requiredClaims}
    initialClaims={schema.initialClaims}
  />
}

/** Keeps form control selection deterministic and owned by the canonical schema/catalog. */
export function clinicalArtifactFieldsV2FromSchema(schema: ClinicalArtifactSchema, locale = 'en'): readonly ClinicalArtifactFieldV2[] {
  const required = new Set(schema.requiredClaims)
  const terminologyText = new Set(schema.terminologyTextClaims ?? [])
  const pairedClaims = new Set<string>()
  const fields: ClinicalArtifactFieldV2[] = []

  for (const textClaim of terminologyText) {
    const pair = codedClaimPair(textClaim)
    pairedClaims.add(pair.codeClaim)
    pairedClaims.add(pair.displayClaim)
  }

  for (const claim of [...schema.requiredClaims, ...schema.optionalClaims]) {
    if (pairedClaims.has(claim)) continue
    const options = clinicalArtifactCodedOptionsForClaim(claim, locale)
    if (terminologyText.has(claim)) {
      const pair = codedClaimPair(claim)
      fields.push({ claim, textClaim: claim, codeClaim: pair.codeClaim, displayClaim: pair.displayClaim, kind: 'coded-concept', required: required.has(claim) })
    } else if (options.length) {
      fields.push({ claim, kind: 'coded-select', required: required.has(claim), options: options.map(option => ({ value: option.code, label: option.label })) })
    } else if (isDateTimeClaim(claim)) {
      fields.push({ claim, kind: 'date-time', required: required.has(claim) })
    } else if (isPositiveIntegerClaim(claim)) {
      fields.push({ claim, kind: 'positive-integer', required: required.has(claim) })
    } else {
      fields.push({ claim, kind: 'text', required: required.has(claim) })
    }
  }
  fields.push({ claim: '__documents', kind: 'documents', transient: true })
  return Object.freeze(fields)
}

function codedClaimPair(textClaim: string): Readonly<{ codeClaim: string; displayClaim: string }> {
  if (textClaim.endsWith('-text')) {
    const base = textClaim.slice(0, -'-text'.length)
    return { codeClaim: base, displayClaim: `${base}-display` }
  }
  if (textClaim.endsWith('.code-text')) {
    const base = textClaim.slice(0, -'-text'.length)
    return { codeClaim: base, displayClaim: `${base}-display` }
  }
  return { codeClaim: `${textClaim}-code`, displayClaim: `${textClaim}-display` }
}

function isDateTimeClaim(claim: string): boolean {
  return /(?:^|[-.])(date|datetime|effective|onset)(?:$|[-.])/.test(claim)
}

function isPositiveIntegerClaim(claim: string): boolean {
  return /(?:dose-sequence|series-doses|timing-frequency)$/.test(claim)
}
