// Flow contract: the UHC compatibility renderer consumes the same reviewed SOS and FHIR dependency versions as its tested runtime; exact older pins must not reinstall a hidden delegated renderer.
import {readFileSync, existsSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {createRequire} from 'node:module'
import {expect, it} from 'vitest'

const manifest = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'))
const expected = {'sos-portal-components-react': '0.3.4', 'sos-data-utils-ts': '0.6.35', 'fhir-data-utils-ts': '0.6.24'} as const

it.each(Object.entries(expected))('declares the reviewed %s dependency version', (name, version) => {
  expect(manifest.dependencies[name]).toBe(version)
})

it('resolves its active SOS and FHIR dependencies to the reviewed runtime versions', () => {
  const resolve = createRequire(join(process.cwd(), 'package.json'))
  for (const [name, version] of Object.entries(expected)) {
    let directory = dirname(resolve.resolve(name))
    while (!existsSync(join(directory, 'package.json'))) directory = dirname(directory)
    const active = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'))
    expect({name: active.name, version: active.version}).toEqual({name, version})
  }
})
