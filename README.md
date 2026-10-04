# UHC Portal Components React

Publishable, brand-neutral React components shared by:

- UHC Personal
- UHC Professional
- VetChain Personal
- VetChain Professional

The package owns visual shell behavior only. Authentication, protected-profile
storage, PIN verification and actor authorization remain in the host portal
through `ProfileRuntime`, `LoadedProfileWorkspace` and actor-scoped SDK facades.

```tsx
import {
  PortalShell,
  PortalHeader,
  PortalEntryHero,
  PortalAccessChooser,
  ProfileProtectionGate,
} from 'uhc-portal-components-react'
import 'uhc-portal-components-react/styles.css'
```

Brand differences are supplied through `PortalBrand`: product name,
organization, official artwork and CSS variables. Artwork declares its
light/dark-surface files and intrinsic dimensions; the shell preserves those
proportions and never synthesizes a text monogram. Components do not import
Firebase, Next.js or any GDC/UHC SDK runtime.

```tsx
const brand = {
  family: 'professional',
  productName: 'UNID Professional',
  organizationName: 'Fundación UNID',
  homeHref: '/es',
  mark: {
    lightSurface: { src: '/logos/uhc-logo.svg', alt: 'UHC', width: 100, height: 100 },
    darkSurface: { src: '/logos/uhc-logo.svg', alt: 'UHC', width: 100, height: 100 },
  },
} satisfies PortalBrand
```

The package deliberately exposes modules instead of a cloned application:

- `PortalShell`: persistent account/preferences chrome and protected content.
- `PortalEntryHero`: identical product entry composition for every brand.
- `PortalAccessChooser`: real-page navigation for professional access paths.
- `ProfileProtectionGate`: fail-closed PIN unlock presentation.
- `ClinicalSectionSummary`: brand-neutral rendering of already-resolved IPS
  cards for personal and professional portals. Advanced viewers can set
  `showHeader={false}` when they retain their own expandable heading.
- `IpsBundleSummary`: receives one in-memory IPS document Bundle, obtains all
  `Composition.section` entries through Common Utils and renders every
  section's cards. It performs no ingestion or GW call.
- `ClinicalDocumentEncounterExplorer`: receives host-authorized Encounter
  resources and Composition-first document Bundles, provides backward/forward
  journey navigation and renders either IPS or non-IPS sections with the same
  viewer. It never treats an Encounter as the clinical subject or performs
  authorization, fetching or persistence in the browser.
- `AllClinicalSections<Person|Animal>`: lets each portal compose the same
  authorized section views as a stack or tabs, nest collapsible subsections and
  exclude inapplicable areas. Family history, care-team members and emergency
  contacts remain independent; the organizer never follows another subject's
  card or documents automatically.
- `ClinicalTimeline` and `ClinicalDateTimeFields`: render longitudinal entries
  with localized dates, inclusive date/time ranges, multi-select clinical
  facets and accessible latest-first navigation. Editors capture calendar date
  and time separately; ISO/FHIR instants remain wire values, not UI labels.
- `EmergencyContactDirectory`: renders already-authorized `RelatedPerson`
  contacts and delegates create, update, delete and fresh provider readback to
  the host portal. Browser editing never grants contact access.
- `ClinicalArtifactEditor`: renders the same schema-driven clinical form for
  human and animal subjects. For writes, the host supplies the shared
  `MULTICHANNEL_OPERATION_SCHEMAS` contract and provenance context. The
  component turns validated form values into the canonical claims-first batch
  with `buildMultichannelOperationBundle`; it does not ask each portal to map
  its own claims. Existing claims-first records can be reopened from an
  authoritative Bundle with `BundleReader`, while native FHIR imports use the
  shared FHIR converter before selecting the same schema-owned fields. The host
  also supplies its IPS section descriptor, terminology-search adapter and
  authorized persistence callback. Selecting a
  terminology candidate preserves source text and adds only the confirmed
  `system|code` and display. Success requires a fresh provider readback Bundle;
  local form state is never presented as a persisted write.
- `InvitationAcceptancePanel`: controlled invitation-code UI for a related
  individual member; the host refreshes the authorized-subject list after its
  BFF accepts the invitation.
- `SubjectAccessRequestPanel`: controlled provider-enabled QR, numeric-code,
  `did:web`, microchip, tattoo, email or telephone locator. Resolution and
  returned identifier evidence never grant subject access.
  resolver plus section selector. It deliberately has no scanner role: the
  same component is reusable by an individual member or a professional.
- `SoschainWorkspace`: subject-card picker and four-area workspace for Places,
  devices/vehicles and read-only emergency communications. The host supplies
  already-authorized cards and capabilities.
- `EncounterTransferConsole`: visual patient-transfer workspace. The host
  resolves the authorized subject, contacts and write capability; the component
  only reports the chosen source outcome (`on-hold` when returning or
  `completed` when leaving definitively) and never treats browser state as
  clinical authority. `EncounterTransferStage.identifier` remains the FHIR
  resource identity; an optional `displayIdentifier` is a provider-assigned
  human-readable business identifier. The component never generates it or
  resolves same-second concurrency.
- `OrganizationWorkforceAdministration`: controlled license-capacity,
  employee lifecycle and invitation-status UI. Invitations remain host-owned
  application records; the component does not reserve licenses or create GW
  employees.
- `IdentityEvidenceWorkspace`: plain-language subject, controller-identifier
  and evidence steps. The host supplies authorized subjects, identifiers and
  exact capabilities for self upload, organization-worker upload or
  professional attestation; ICA or another trusted backend verifies the
  signature after upload.
- `IdentityEvidenceDocumentPanel`: selects and uploads one signed PDF for the
  chosen identity, requests trusted verification and renders only the status
  returned by the provider facade. It contains no certificate or gateway
  plumbing.
- `IdentityEvidenceDeclarationForm`: collects the business fields used to
  prepare a declaration. Hosts supply governed options and one high-level
  callback; the form never authors claims or handles certificates.
- `AnimalIdentityOnboarding`: one progressive animal, owner-or-caregiver and
  physical-evidence journey recovered from the VetChain Expo flow. The host
  creates the subject and returns the veterinarian-attested result.
- `SubjectIdentityCard`: capability-aware person or animal identity readback.
  Facts, relationship status and edit authority are always provider supplied.

Clinical label semantics stay in `gdc-common-utils-ts` / the SDK reader. Hosts
pass human titles to `ClinicalSectionSummary`: local `CodeableConcept.text`
when the UI matches the resource language, English `Coding.display` for
English, or a terminology translation keyed by `system|code` for another
locale. The terminology token is never a visible or editable title.

```tsx
<IpsBundleSummary
  bundle={bundleInMemory}
  locale={currentLocale}
  translateCode={terminology.translate}
  emptyLabel={t('emptySection')}
/>
```

The browser may render an optimistic in-memory Bundle while its authenticated
BFF persists the command. Only backend code calls
`ingestCommunicationAndUpdateIndex(...)`; the component never does.

Access panels likewise contain no consent or SMART-token logic. A host first
resolves the card locator, then asks its authenticated BFF to record the access
request. If consent is already present, the BFF may obtain a narrowed SMART
token immediately; otherwise it records a `Communication` request for the
individual controller to review. The GW remains authoritative for the exact
intersection of requested and consented sections.

UHC Personal and PetChain Personal must ultimately compose the same reusable
personal flow modules. UHC Professional and VetChain Professional must do the
same for professional flows. This package does **not yet expose those complete
route modules**: login, versioned terms, profile protection, individual/member
management, licences, clinical data, care and permissions still live in the
UHC host application and must be extracted behind host-owned adapters. A brand
adapter may change tokens, logo, product vocabulary, animal-specific forms and
route destinations; it must not fork shared flow or authorization behavior.

See [`docs/PERSONAL_FLOW_EXTRACTION.md`](docs/PERSONAL_FLOW_EXTRACTION.md) and
the canonical cross-portal
[`docs/HISTORICAL_PORTAL_COMPONENT_RECOVERY_MATRIX.md`](docs/HISTORICAL_PORTAL_COMPONENT_RECOVERY_MATRIX.md).
