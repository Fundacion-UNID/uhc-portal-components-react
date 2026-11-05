// Flow contract: ClinicalBundleDraftEditorV2 is the single canonical authoring surface; legacy standalone and specialized editor exports remain source-compatible but are explicitly deprecated.
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const alternatives = [
  ['ClinicalArtifactEditor.tsx', 'ClinicalArtifactEditor'],
  ['ClinicalArtifactEditorV2.tsx', 'ClinicalArtifactEditorV2'],
  ['ClinicalBundleDraftEditor.tsx', 'ClinicalBundleDraftEditor'],
  ['SchemaClinicalArtifactEditorV2.tsx', 'SchemaClinicalArtifactEditorV2'],
  ['ImmunizationArtifactEditorV2.tsx', 'ImmunizationArtifactEditorV2'],
  ['VitalSignArtifactEditor.tsx', 'VitalSignArtifactEditor'],
] as const

describe('clinical editor public API deprecations', () => {
  it.each(alternatives)('marks %s / %s as deprecated in favour of the document editor', async (file, component) => {
    const source = await readFile(new URL(`../src/${file}`, import.meta.url), 'utf8')
    const declaration = source.indexOf(`export function ${component}`)
    expect(declaration).toBeGreaterThan(0)
    expect(source.slice(Math.max(0, declaration - 350), declaration)).toContain('@deprecated Use ClinicalBundleDraftEditorV2')
  })

  it('keeps ClinicalBundleDraftEditorV2 canonical', async () => {
    const source = await readFile(new URL('../src/ClinicalBundleDraftEditor.tsx', import.meta.url), 'utf8')
    const declaration = source.indexOf('export function ClinicalBundleDraftEditorV2')
    expect(source.slice(Math.max(0, declaration - 250), declaration)).not.toContain('@deprecated')
  })
})
