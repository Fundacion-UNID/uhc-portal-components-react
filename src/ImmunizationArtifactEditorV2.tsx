'use client'

import {
  ImmunizationClaim,
  buildImmunizationRecommendationFlatEntry,
  clinicalArtifactCodedOptionsForClaim,
  validateImmunizationDoseSeries,
} from 'fhir-data-utils-ts'
import {
  ClinicalArtifactEditorV2,
  type ClinicalArtifactEditorCopyV2,
  type ClinicalArtifactEditorV2Props,
  type ClinicalArtifactFieldV2,
} from './ClinicalArtifactEditorV2.js'

export const ImmunizationArtifactEditorV2Claim = Object.freeze({
  NextDoseDate: 'Immunization.next-dose-date',
} as const)

export type ImmunizationArtifactEditorCopyV2 = ClinicalArtifactEditorCopyV2 & Readonly<{
  doseSequenceInvalid: string
  seriesDosesInvalid: string
}>

export type ImmunizationArtifactEditorV2Props = Omit<ClinicalArtifactEditorV2Props, 'fields' | 'initialVisibleClaims' | 'initialClaims' | 'validate' | 'buildRelatedEntries' | 'copy'> & Readonly<{
  copy: ImmunizationArtifactEditorCopyV2
}>

/** Demo-first Immunization specialization over the reusable progressive V2 shell. */
export function ImmunizationArtifactEditorV2({ copy, locale = 'en', ...props }: ImmunizationArtifactEditorV2Props) {
  const fields = immunizationFields(locale)
  return <ClinicalArtifactEditorV2
    {...props}
    locale={locale}
    copy={copy}
    fields={fields}
    initialVisibleClaims={[ImmunizationClaim.Status, ImmunizationClaim.VaccineCodeText, ImmunizationClaim.Date]}
    initialClaims={{
      [ImmunizationClaim.Status]: 'completed',
      [ImmunizationClaim.Patient]: props.authoringContext.subjectReference,
      [ImmunizationClaim.Performer]: props.authoringContext.dataAuthorReference,
    }}
    validate={claims => {
      try { validateImmunizationDoseSeries(claims[ImmunizationClaim.DoseSequence], claims[ImmunizationClaim.SeriesDoses]) }
      catch (reason) {
        if (reason instanceof Error && reason.message === 'immunization_dose_sequence_invalid') throw new TypeError(copy.doseSequenceInvalid)
        throw new TypeError(copy.seriesDosesInvalid)
      }
    }}
    buildRelatedEntries={(claims, draftId) => {
      const nextDoseDate = claims[ImmunizationArtifactEditorV2Claim.NextDoseDate]
      const vaccineToken = claims[ImmunizationClaim.VaccineCode]
      if (!nextDoseDate || !vaccineToken) return []
      const separator = vaccineToken.indexOf('|')
      if (separator <= 0 || separator === vaccineToken.length - 1) return []
      const recommendation = buildImmunizationRecommendationFlatEntry({
        entryId: `${draftId}-recommendation`, immunizationEntryId: draftId,
        subjectReference: props.authoringContext.subjectReference,
        recommendationDate: props.authoringContext.createdAt,
        nextDoseDate,
        vaccineCode: { system: vaccineToken.slice(0, separator), code: vaccineToken.slice(separator + 1), display: claims[ImmunizationClaim.VaccineCodeDisplay], text: claims[ImmunizationClaim.VaccineCodeText] },
      })
      return [recommendation]
    }}
  />
}

function immunizationFields(locale: string): readonly ClinicalArtifactFieldV2[] {
  return Object.freeze([
    { claim: ImmunizationClaim.Status, kind: 'coded-select', required: true, options: clinicalArtifactCodedOptionsForClaim(ImmunizationClaim.Status, locale).map(option => ({ value: option.code, label: option.label })) },
    { claim: ImmunizationClaim.VaccineCodeText, textClaim: ImmunizationClaim.VaccineCodeText, codeClaim: ImmunizationClaim.VaccineCode, displayClaim: ImmunizationClaim.VaccineCodeDisplay, kind: 'coded-concept', required: true },
    { claim: ImmunizationClaim.Date, kind: 'date-time', required: true },
    { claim: ImmunizationClaim.TargetDiseaseText, textClaim: ImmunizationClaim.TargetDiseaseText, codeClaim: ImmunizationClaim.TargetDisease, displayClaim: ImmunizationClaim.TargetDiseaseDisplay, kind: 'coded-concept' },
    { claim: ImmunizationClaim.LotNumber, kind: 'text' },
    { claim: ImmunizationClaim.DoseSequence, kind: 'positive-integer' },
    { claim: ImmunizationClaim.SeriesDoses, kind: 'positive-integer' },
    { claim: ImmunizationClaim.Series, kind: 'text' },
    { claim: ImmunizationArtifactEditorV2Claim.NextDoseDate, kind: 'date', transient: true },
    { claim: ImmunizationClaim.Route, codeClaim: ImmunizationClaim.Route, displayClaim: ImmunizationClaim.RouteDisplay, kind: 'coded-concept' },
    { claim: ImmunizationClaim.Site, codeClaim: ImmunizationClaim.Site, displayClaim: ImmunizationClaim.SiteDisplay, kind: 'coded-concept' },
    { claim: ImmunizationClaim.Note, kind: 'text' },
    { claim: '__documents', kind: 'documents', transient: true },
  ] satisfies readonly ClinicalArtifactFieldV2[])
}
