# Legacy frontend recovery inventory

This inventory belongs to the shared React component repository because it
tracks product-neutral interaction patterns that can be reused by SOSChain,
UHC, PetChain and VetChain. Product policy, routes and authorization stay in
each portal. Historical code is evidence, not an authority or a drop-in
dependency.

## Reuse now

| Capability | Historical anchors | Shared target |
| --- | --- | --- |
| IPS section cards, resource viewers and compact actions | `web-bloodchain/src/components/HealthSectionCard`, `Resource`, `IPSForm`; `uhc-components-react/src/components/UHCIconButton` | `IpsBundleSummary`, `ClinicalSectionSummary`, `ClinicalActionButton` |
| Clinical create and edit forms | `web-bloodchain/src/components/ImmunizationForm`, `MedicationForm`, `DiagnosticReportForm`, `DocumentReferenceForm`, `MedicalDeviceForm` | `ClinicalArtifactEditor`, `VitalSignArtifactEditor` and governed shared schemas |
| Search-as-you-type terminology | `uhc-components-react/src/components/UHCAutocompleteInput`; `vetchain-personal-app-expo/modules/terminology` | `ClinicalArtifactEditor` terminology adapter |
| Human or animal identity card with image | `vetchain-personal-app-expo/components/ProfileHeader`, `app/subject-view.tsx`, `app/person-view.tsx` | `SubjectIdentityCard` |
| Animal creation and editing with image, species, breed, birth data and guardian relationship | `vetchain-personal-app-expo/app/subject-add.tsx`, `subject-edit.tsx`, `related-person-select.tsx`, `identity-add.tsx` | `AnimalIdentityOnboarding`; portal-owned persistence and evidence adapters |
| QR capture and manual identifier entry | `web-bloodchain/src/views/ReadPatientQR`; `HospitalAppPro/src/screens/ScanQR`; `HospitalAppFamily/src/screens/ScanQR` | Portal scanner plus a shared selection contract; backend resolves authority |
| Emergency contact and permission editing | `web-bloodchain/src/components/ContactsTable`, `AddUserContactDialog`, `AddUserPermissionDialog`, `EditUserPermissionDialog` | `EmergencyContactDirectory`, `ConsentPermissionDirectory` |
| Patient journey and current care location | `HospitalAppFamily/src/screens/PatientInfo`, `PatientFullData`, `MedicalInfo`; `HospitalAppPro/src/screens/DoctorPatient`, `NursePatient`, `PatientFullDoctorData`, `PatientFullNurseData` | `ClinicalDocumentEncounterExplorer`, `EncounterTransferConsole` |
| Audio/video call entry and call identifier dialog | `HospitalAppFamily/src/screens/VideoCall`, `CalliDModal`; `HospitalAppPro/src/screens/VideoCall`, `CalliDModal` | Shared call-state presentation after the protected server creates a session |
| Clinical documents, attachments and messaging | `web-bloodchain/src/components/DocumentViewer`, `FileUploader`, `SendMessageDialog`; HospitalApp Pro chat and send-info screens | Shared document/message presentation; portal and service own transport |
| DICOM media parsing and study metadata | `uhc-fhir-utils-typescript/src/managers/Dicom.ts` and `src/models/DicomModels.ts`; React Native UHC `UserUploadImage.tsx` accepted `application/dicom` | Future `DicomStudyPicker` and `DicomStudyViewer` behind portal-owned authorization and storage adapters |

## Recover later, but keep explicit

- SMART Health Card capture, verification and projection from
  `web-bloodchain/src/views/SmartHealthCardData` and the historical manager
  packages.
- EU Digital COVID Certificate attachment conversion and provenance.
- Maintained DICOM image rendering and upload. The historical shared manager
  parses `DICOMDIR`, study/series/instance metadata and pixels, but the located
  BloodChain web route creates an attachment with a PDF MIME type and its
  viewer uses `react-pdf`; it is not evidence of a complete web DICOM viewer.
  Recover the parser behavior with typed tests, validate/de-identify fixtures,
  render through a maintained viewer and persist through an authorized
  DICOMweb/PACS or protected-object adapter. Native DICOM bytes do not belong
  in a clinical Bundle or ledger.
- Offline and Bluetooth exchange after the online authorization and
  synchronization contracts are complete.
- HospitalApp media-call UX details after validating them against the current
  WebRTC privacy and signaling boundary.

## Recovery gate

For every recovered capability: add a failing shared contract first, port the
smallest product-neutral behavior, connect it through a portal-owned adapter,
and prove create/read/update/delete or the complete interaction in local
Playwright. Never copy historical storage, authentication or authorization
assumptions.
