// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EncounterTransferConsole, type EncounterTransferConsoleCopy } from '../src/EncounterTransferConsole.js'

const copy: EncounterTransferConsoleCopy = {
  patientSearchTitle: 'Buscar paciente', scanQr: 'Escanear QR', patientId: 'ID de paciente', search: 'Buscar',
  journeyTitle: 'Historial y traslado de encuentros', sourceTitle: 'Encuentro de origen', destinationTitle: 'Encuentro de destino',
  returning: 'Volverá', returningHint: 'El encuentro anterior queda en espera.', notReturning: 'No volverá', notReturningHint: 'El encuentro anterior se completa.',
  transferTo: 'Trasladar a', reviewChanges: 'Revisar cambios', applyTransfer: 'Aplicar traslado',
  emergencyActions: 'Contactos de emergencia · Acciones', call: 'Llamar', videoCall: 'Videollamada', sendMessage: 'Enviar mensaje',
  text: 'Texto', audio: 'Audio', messageLabel: 'Mensaje para el contacto de emergencia', attach: 'Adjuntar (opcional)', pdf: 'PDF', fhirBundle: 'Bundle FHIR', calendar: 'Cita .ics',
  send: 'Enviar mensaje', resourceSummary: 'Resumen de recursos que se enviarán', sourceUpdate: 'Actualizar el encuentro de origen',
  sourceHistory: 'Registrar el hito del encuentro de origen', destinationUpdate: 'Actualizar el encuentro de destino', destinationHistory: 'Registrar el hito del encuentro de destino',
  indexProjection: 'Comunicar el traslado al índice del paciente', demoWarning: 'Datos de demostración · se eliminan periódicamente',
  helpTitle: '¿Qué ocurre al aplicar el traslado?', helpBody: 'Se conserva el recorrido y se actualiza cada etapa según si la persona volverá.',
  transferReady: 'Traslado preparado en modo demostración.', messageReady: 'Mensaje preparado en modo demostración.', callReady: 'Llamada preparada.', videoReady: 'Videollamada preparada.',
  patientReady: 'Paciente resuelto.', reviewReady: 'Revisión abierta.', attachmentReady: 'Adjunto seleccionado.', technicalDetails: 'Detalles técnicos',
}

const encounters = [
  { identifier: 'Encounter/previous', serviceLabel: 'Radiología', locationLabel: 'Planta baja', arrivedAt: '09:05', status: 'completed' as const },
  { identifier: 'Encounter/source', serviceLabel: 'Urgencias', locationLabel: 'Box 3', arrivedAt: '09:35', status: 'in-progress' as const },
  { identifier: 'Encounter/destination', serviceLabel: 'Cuidados intensivos', locationLabel: 'UCI', arrivedAt: '10:10', status: 'planned' as const },
]

afterEach(cleanup)

describe('EncounterTransferConsole', () => {
  it('makes the patient, source outcome, destination and five-resource review understandable without technical knowledge', async () => {
    const onApplyTransfer = vi.fn()
    render(<EncounterTransferConsole copy={copy} patientDisplay="Nuria Sala" encounters={encounters} sourceEncounterId="Encounter/source" destinationEncounterId="Encounter/destination" contacts={[{ identifier: 'RelatedPerson/marta', name: 'Marta Sala', relationship: 'Hermana', phone: '+34 600 123 456' }]} demo onApplyTransfer={onApplyTransfer}/>)

    expect(screen.getByRole('heading', { name: copy.patientSearchTitle })).toBeTruthy()
    expect(screen.getByRole('region', { name: copy.journeyTitle }).textContent).toContain('Urgencias')
    expect(screen.getByRole('region', { name: copy.journeyTitle }).textContent).toContain('Cuidados intensivos')
    expect(screen.getByText(copy.helpBody)).toBeTruthy()
    expect(screen.getByRole('list', { name: copy.resourceSummary }).children).toHaveLength(5)

    await userEvent.click(screen.getByRole('radio', { name: /^No volverá/ }))
    await userEvent.click(screen.getByRole('button', { name: copy.applyTransfer }))
    expect(onApplyTransfer).toHaveBeenCalledWith('completed')
    expect(screen.getByRole('status').textContent).toContain(copy.transferReady)
  })

  it('offers call, video and message actions while attachments remain DocumentReference-oriented choices', async () => {
    render(<EncounterTransferConsole copy={copy} patientDisplay="Nuria Sala" encounters={encounters} sourceEncounterId="Encounter/source" destinationEncounterId="Encounter/destination" contacts={[{ identifier: 'RelatedPerson/marta', name: 'Marta Sala', relationship: 'Hermana', phone: '+34 600 123 456' }]} demo/>)

    expect(screen.getByRole('button', { name: copy.call })).toBeTruthy()
    expect(screen.getByRole('button', { name: copy.videoCall })).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: copy.sendMessage }))
    expect(screen.getByRole('button', { name: copy.pdf })).toBeTruthy()
    expect(screen.getByRole('button', { name: copy.fhirBundle })).toBeTruthy()
    expect(screen.getByRole('button', { name: copy.calendar })).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: copy.pdf }))
    expect(screen.getByRole('button', { name: copy.pdf }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('status').textContent).toContain(copy.attachmentReady)
  })
})
