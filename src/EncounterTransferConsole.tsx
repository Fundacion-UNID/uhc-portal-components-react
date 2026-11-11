import {EncounterTransferConsole as SharedEncounterTransferConsole,type EncounterTransferConsoleProps} from 'sos-portal-components-react/encounter-transfer-console'
export type {EncounterTransferConsoleProps,EncounterTransferConsoleCopy,EncounterTransferStatus,EncounterSourceOutcome,EncounterTransferStage,EmergencyContactAction,EncounterTransferApplyOutcome} from 'sos-portal-components-react/encounter-transfer-console'
/** @deprecated Import EncounterTransferConsole from sos-portal-components-react/encounter-transfer-console. Compatibility wrapper only; rendering and transfer state live in SOS. */
export function EncounterTransferConsole(props:EncounterTransferConsoleProps){
  return <SharedEncounterTransferConsole {...props} legacyTools={props.legacyTools??props.demo??false}/>
}
