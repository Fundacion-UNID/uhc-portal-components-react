// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ClinicalDateTimeFields, ClinicalTimeline, type ClinicalTimelineEntry } from '../src/ClinicalTimeline.js'

const TIMELINE_TEST_DATA = Object.freeze({
  timeZone: 'America/Vancouver',
  now: new Date('2026-10-03T19:00:00.000Z'),
  entries: Object.freeze([
    { id: 'blood-pressure-latest', title: 'Blood pressure 120/80', dateTime: '2026-10-03T18:07:00.000Z', facets: { kind: ['blood-pressure'] } },
    { id: 'blood-pressure-previous', title: 'Blood pressure 125/82', dateTime: '2026-10-02T18:07:00.000Z', facets: { kind: ['blood-pressure'] } },
    { id: 'temperature-latest', title: 'Temperature 37 °C', dateTime: '2026-10-03T17:07:00.000Z', facets: { kind: ['temperature'] } },
  ]) as readonly ClinicalTimelineEntry[],
  facets: Object.freeze([
    { id: 'kind', label: 'Vital sign', options: Object.freeze([
      { id: 'blood-pressure', label: 'Blood pressure' },
      { id: 'temperature', label: 'Temperature' },
    ]) },
  ]),
})

afterEach(cleanup)

describe('ClinicalTimeline', () => {
  it('shows the latest matching item with local date presentation and accessible history navigation', () => {
    render(<ClinicalTimeline
      entries={TIMELINE_TEST_DATA.entries}
      facets={TIMELINE_TEST_DATA.facets}
      locale="en-CA"
      timeZone={TIMELINE_TEST_DATA.timeZone}
      now={TIMELINE_TEST_DATA.now}
      labels={{ from: 'From', to: 'To', date: 'Date', time: 'Time', useToday: 'Use today', useCurrentTime: 'Use current time', previous: 'Previous', next: 'Next', showAll: 'Show all', empty: 'No results' }}
    />)

    expect(screen.getByText('Blood pressure 120/80')).toBeTruthy()
    expect(screen.getByText('Oct 3, 2026, 11:07')).toBeTruthy()
    expect(screen.getByText('1 / 3')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Temperature 37 °C')).toBeTruthy()
  })

  it('combines OR inside a facet with the inclusive date and time range', () => {
    render(<ClinicalTimeline
      entries={TIMELINE_TEST_DATA.entries}
      facets={TIMELINE_TEST_DATA.facets}
      locale="en-CA"
      timeZone={TIMELINE_TEST_DATA.timeZone}
      now={TIMELINE_TEST_DATA.now}
      labels={{ from: 'From', to: 'To', date: 'Date', time: 'Time', useToday: 'Use today', useCurrentTime: 'Use current time', previous: 'Previous', next: 'Next', showAll: 'Show all', empty: 'No results' }}
    />)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Blood pressure' }))
    fireEvent.change(screen.getByLabelText('From Date'), { target: { value: '2026-10-03' } })
    fireEvent.change(screen.getByLabelText('From Time'), { target: { value: '10:00' } })
    expect(screen.getByText('1 / 1')).toBeTruthy()
    expect(screen.queryByText('Temperature 37 °C')).toBeNull()
  })

  it('offers explicit current-date and current-time actions for both range boundaries', () => {
    render(<ClinicalTimeline
      entries={TIMELINE_TEST_DATA.entries}
      locale="en-CA"
      timeZone={TIMELINE_TEST_DATA.timeZone}
      now={TIMELINE_TEST_DATA.now}
      labels={{ from: 'From', to: 'To', date: 'Date', time: 'Time', useToday: 'Use today', useCurrentTime: 'Use current time', previous: 'Previous', next: 'Next', showAll: 'Show all', empty: 'No results' }}
    />)

    fireEvent.click(screen.getByRole('button', { name: 'Use today (From)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Use current time (From)' }))
    expect((screen.getByLabelText('From Date') as HTMLInputElement).value).toBe('2026-10-03')
    expect((screen.getByLabelText('From Time') as HTMLInputElement).value).toBe('12:00:00')
  })
})

describe('ClinicalDateTimeFields', () => {
  it('captures date and time separately, adds default seconds and offers explicit current-value actions', () => {
    const onChange = vi.fn()
    render(<ClinicalDateTimeFields
      value={{ date: '', time: '' }}
      onChange={onChange}
      now={TIMELINE_TEST_DATA.now}
      timeZone={TIMELINE_TEST_DATA.timeZone}
      labels={{ date: 'Date', time: 'Time', useToday: 'Use today', useCurrentTime: 'Use current time' }}
    />)

    fireEvent.click(screen.getByRole('button', { name: 'Use today' }))
    fireEvent.click(screen.getByRole('button', { name: 'Use current time' }))
    expect(onChange).toHaveBeenNthCalledWith(1, { date: '2026-10-03', time: '' })
    expect(onChange).toHaveBeenNthCalledWith(2, { date: '', time: '12:00:00' })
  })
})
