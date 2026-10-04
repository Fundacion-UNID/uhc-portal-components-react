# Historical portal component recovery matrix

This is the canonical cross-portal inventory for reusable interactions recovered
from BloodChain/UHC web, VetChain Expo and HospitalApp. A similarly named screen
in a newer portal is not recovery proof. Historical code is evidence of
requirements and interaction quality; its local storage, browser authority and
obsolete FHIR models are not accepted implementation contracts.

Status means:

- **Shared and proved**: implemented in a maintained shared package and proved
  through a consuming portal.
- **Portal-local**: implemented, but still duplicated or tied to one portal.
- **Partial**: only part of the original journey is usable.
- **Missing**: no maintained end-to-end replacement exists.
- **Deferred**: intentionally outside the current conference MVP.

## Person and animal identity

| Historical evidence | Interaction worth preserving | Current shared target | Personal responsibility | Professional responsibility | Status |
| --- | --- | --- | --- | --- | --- |
| `vetchain-personal-app-expo/app/subject-view.tsx`, `ProfileHeader` | Animal portrait, name, species, sex, birth date, breed, coat, weight, chip, passport, issuer, QR and clear pencil/delete actions | One capability-aware `SubjectIdentityCard<Person \| Animal>` plus provider adapters | Create/edit when the authenticated member is the confirmed controller; otherwise read only | Read the authorized identity and provenance; never infer identity-write authority from a clinical role | **Shared card available; consumer adapters and full historical detail remain** |
| `subject-add.tsx`, `subject-edit.tsx`, `identity-add.tsx` | Short progressive animal and identity capture | Schema-backed identity editor using shared person/animal contracts | PetChain/VetChain is the primary animal authoring surface; SOSChain Personal may edit an already linked card when controller capability is returned | View only unless an explicit provider capability permits correction | **Shared animal/controller/evidence onboarding available; edit flow remains** |
| `person-view.tsx`, `person-add.tsx`, `person-edit.tsx` | Reusable person card with portrait and explicit edit/delete controls | The person specialization of the same identity card/editor | Create or maintain related people under the correct controller/relationship contract | View only as an authorized RelatedPerson/emergency contact projection | **Missing as one shared flow** |
| `related-person-select.tsx` | Portrait grid, obvious add action and navigation to a related person | Typed relationship directory separating controller, caregiver, owner, family and emergency-contact purposes | Manage relationships only when provider capability permits it | Read the purpose-limited contact choice; private endpoints remain server-side | **Partial**: emergency contacts exist; owner/controller UI parity does not |
| Subject passport-image and QR tabs | Separate identity evidence, card QR and subject facts | Shared identity-evidence workspace plus safe QR presentation | Controller can attach/link evidence through provider readback | Professional can inspect authorized evidence but cannot silently attach it | **Partial**: identity evidence exists; animal profile integration is missing |

## Clinical capture and reading

| Historical evidence | Interaction worth preserving | Current replacement | Status |
| --- | --- | --- | --- |
| VetChain `health-booklet.tsx` and allergy, medication, vaccination and procedure cards/editors | Visual section entry, short forms and icon actions | Shared all-sections IPS reader plus JSON-Schema clinical editors; create belongs to the section, edit/delete to the resource card | **Shared and proved** for primary IPS resources and vital signs in SOSChain Professional Demo; animal consumer parity remains **partial** |
| VetChain `resource-search.tsx`, `SearchBar`, `ResourceList` | Search while authoring and explicit terminology-system filtering | Debounced maintained terminology service returning system, code, international display and local text | **Partial**: schema-backed selection exists in the current professional demo; cross-portal service-backed parity is missing |
| BloodChain `HealthSectionCard`, `Resource`, `ResourceFilters` and `SmartHealthCardData` | Attractive section cards, resource icons, counts, date/type filtering and compact summaries | `AllClinicalSections`, `IpsBundleSummary`, clinical timeline and facets | **Shared and proved**, although visual refinement and animal-specific summary fields remain |
| BloodChain `IPSForm`, `IPSDocumentForm`, `ImmunizationForm`, `MedicationForm`, `DiagnosticReportForm`, `MedicalDeviceForm` | Structured capture and document-level composition | Claims-first Bundle editor/reader and typed clinical schemas | **Partial**: core IPS resources are proved; DiagnosticReport, Device, imaging and complete document authoring need end-to-end coverage |
| BloodChain `DocumentViewer`, `DocumentReferenceForm`, diagnostic viewers | One route from a message/document to readable PDF, FHIR document or result | Governed Communication + DocumentReference viewer in the subject workspace | **Missing end to end** |
| Older UHC Personal DICOM viewer and BloodChain DICOM byte handling | Clinical image viewing next to the report | Authorized DICOMweb/PACS adapter and maintained viewer | **Missing** |

## Authorization, scanning and communication

| Historical evidence | Interaction worth preserving | Current replacement | Status |
| --- | --- | --- | --- |
| BloodChain contacts and permission dialogs | Dedicated contact and permission readers/editors | Shared emergency-contact and Consent directories with exact-subject provider readback | **Partial**: Demo CRUD/readback exists; cross-portal provider enforcement is missing |
| BloodChain/HospitalApp QR screens and Smart Health Card helpers | Camera scan and one manual-input field, then verified preview | Current scanner plus a separate signature-verification/import journey | Card lookup is **proved**; SHC/EU DCC import is **deferred** |
| HospitalApp Professional/Family video and chat | Two-sided call controls, family-oriented language and visible terminal state | Authenticated subject-scoped signalling, STUN/TURN, durable Communication and audit | **Missing end to end**; the broadcast historical socket must not be reused |
| HospitalApp medical information | Calm minimum-emergency summary | Role/country/organization/Consent-gated emergency projection | **Partial** |

## Required delivery order

1. Build the shared person/animal identity card and its capability contract.
2. Bind PetChain/VetChain Personal create/edit, image, chip/passport and
   controller/owner relationships to authoritative provider readback.
3. Consume the same card read-only in SOSChain Professional and capability-
   aware in SOSChain Personal.
4. Run one fixture through create, read, edit, delete and recreate in each
   authorized consumer and retain English/Spanish desktop/mobile evidence.
5. Complete the missing clinical document, DiagnosticReport and DICOM path.
6. Complete cross-portal Consent enforcement and family communication.

Every recovered row requires a contract test, a real portal journey and a flat
Git-ignored screenshot in the owning repository. A visual mock or a historical
local-storage success cannot mark a row complete.
