// Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0.
import type { ReactNode } from 'react'

export type AnimalIdentityDetailsV2Copy = Readonly<{
  animalStep:string; controllerStep:string; animalName:string; species:string; identifierType:string; identifierValue:string; controllerName:string; relationship:string; edit?:string
  jurisdiction?:string; legalIdentifier?:string; officialAddress?:string; telephone?:string; email?:string; source?:string
}>
export type AnimalIdentityDetailsV2Value = Readonly<{
  animalName:string; species:string; identifierType:string; identifierValue:string; animalPhotoUrl?:string; animalPhotoAlt?:string
  controllerName:string; relationship:string; controllerKind?:'person'|'organization'; controllerJurisdiction?:string; controllerIdentifier?:string
  controllerOfficialAddress?:string; controllerTelephone?:string; controllerEmail?:string; controllerSource?:string
}>

/** Read-only counterpart of AnimalIdentityOnboardingV2 using the same progressive sections. */
export function AnimalIdentityDetailsV2({ copy, value, onEdit, actions }: Readonly<{ copy:AnimalIdentityDetailsV2Copy; value:AnimalIdentityDetailsV2Value; onEdit?:()=>void; actions?:ReactNode }>) {
  return <section className="uhcp-animal-onboarding uhcp-animal-onboarding-v2 uhcp-animal-identity-details-v2">
    <details><summary><StepNumber value={1}/> {copy.animalStep}</summary><div className="uhcp-animal-identity-readonly"><>{value.animalPhotoUrl ? <img className="uhcp-animal-identity-photo" src={value.animalPhotoUrl} alt={value.animalPhotoAlt ?? value.animalName}/> : null}</><dl className="uhcp-animal-identity-readonly-grid"><Fact label={copy.animalName} value={value.animalName}/><Fact label={copy.species} value={value.species}/><Fact label={copy.identifierType} value={value.identifierType}/><Fact label={copy.identifierValue} value={value.identifierValue}/></dl></div></details>
    <details><summary><StepNumber value={2}/> {copy.controllerStep}</summary><dl className="uhcp-animal-identity-readonly-grid"><Fact label={copy.controllerName} value={value.controllerName}/><Fact label={copy.relationship} value={value.relationship}/><OptionalFact label={copy.jurisdiction} value={value.controllerJurisdiction}/><OptionalFact label={copy.legalIdentifier} value={value.controllerIdentifier}/><OptionalFact label={copy.officialAddress} value={value.controllerOfficialAddress}/><OptionalFact label={copy.telephone} value={value.controllerTelephone}/><OptionalFact label={copy.email} value={value.controllerEmail}/><OptionalFact label={copy.source} value={value.controllerSource}/></dl></details>
    {onEdit || actions ? <div className="uhcp-animal-onboarding-actions">{actions}{onEdit ? <button type="button" onClick={onEdit} aria-label={copy.edit} title={copy.edit}>{copy.edit}</button> : null}</div> : null}
  </section>
}
function StepNumber({ value }:Readonly<{value:number}>) { return <span className="uhcp-identity-step-number" aria-hidden="true">{value}</span> }
function Fact({ label,value }:Readonly<{label:string;value:string}>) { return <div><dt>{label}</dt><dd>{value}</dd></div> }
function OptionalFact({ label,value }:Readonly<{label?:string;value?:string}>) { return label && value ? <Fact label={label} value={value}/> : null }
