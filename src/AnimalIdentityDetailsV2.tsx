// Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0.
import type { ReactNode } from 'react'

export type AnimalIdentityDetailsV2Copy = Readonly<{ animalStep:string; controllerStep:string; animalName:string; species:string; identifierType:string; identifierValue:string; controllerName:string; relationship:string; edit?:string }>
export type AnimalIdentityDetailsV2Value = Readonly<{ animalName:string; species:string; identifierType:string; identifierValue:string; controllerName:string; relationship:string }>

/** Read-only counterpart of AnimalIdentityOnboardingV2 using the same progressive sections. */
export function AnimalIdentityDetailsV2({ copy, value, onEdit, actions }: Readonly<{ copy:AnimalIdentityDetailsV2Copy; value:AnimalIdentityDetailsV2Value; onEdit?:()=>void; actions?:ReactNode }>) {
  return <section className="uhcp-animal-onboarding uhcp-animal-onboarding-v2 uhcp-animal-identity-details-v2">
    <details><summary><StepNumber value={1}/> {copy.animalStep}</summary><dl className="uhcp-animal-identity-readonly-grid"><Fact label={copy.animalName} value={value.animalName}/><Fact label={copy.species} value={value.species}/><Fact label={copy.identifierType} value={value.identifierType}/><Fact label={copy.identifierValue} value={value.identifierValue}/></dl></details>
    <details><summary><StepNumber value={2}/> {copy.controllerStep}</summary><dl className="uhcp-animal-identity-readonly-grid"><Fact label={copy.controllerName} value={value.controllerName}/><Fact label={copy.relationship} value={value.relationship}/></dl></details>
    {onEdit || actions ? <div className="uhcp-animal-onboarding-actions">{actions}{onEdit ? <button type="button" onClick={onEdit} aria-label={copy.edit} title={copy.edit}>{copy.edit}</button> : null}</div> : null}
  </section>
}
function StepNumber({ value }:Readonly<{value:number}>) { return <span className="uhcp-identity-step-number" aria-hidden="true">{value}</span> }
function Fact({ label,value }:Readonly<{label:string;value:string}>) { return <div><dt>{label}</dt><dd>{value}</dd></div> }
