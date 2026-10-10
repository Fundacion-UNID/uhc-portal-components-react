# Changelog

## 0.2.10 - 2026-10-10

- Keep animal-controller creation focused on identity and contact data: the
  controller channel already owns its unlock credential, so the form no longer
  asks for a second PIN or requires identity-evidence uploads at creation time.
- Let hosts require email and telephone independently, start country selection
  without an implicit jurisdiction and keep optional evidence collection for a
  later, explicit post-creation step.
- Improve the reusable entity editor contrast and distinguish its edit action
  with an accessible icon.

## 0.2.9 - 2026-10-10

- Add one reusable identity entity editor for animal controllers and related
  parties, with a fixed responsible-party relationship for the controller and
  host-governed relationship choices for additional entities.
- Keep identity evidence inside the entity it supports and keep the regional
  identifier control in a stable layout while enabling its region only when
  applicable.

## 0.2.8 - 2026-10-10

- Restore the visual animal-photo picker from the earlier VetChain Expo flow:
  click or drop a PNG/JPG, preview it, remove it in place, and enforce the
  documented 2 MiB maximum and portrait 3:4 minimum of 300 by 400 pixels.
- Extend the opt-in animal identity flow with person/organization ownership,
  country and optional regional jurisdiction, governed identifier choices,
  email-or-telephone contact and OIDC4IDA verification method selection.

## 0.2.7 - 2026-10-09

- Give every V2 animal-onboarding disclosure an accessible group name derived
  from its localized summary.

## 0.2.6 - 2026-10-09

- Add the opt-in `AnimalIdentityOnboardingV2` with responsive animal imagery,
  collapsible identity/controller/evidence blocks and an explicit single legal
  representative or controller confirmation while preserving the V1 payload.

## 0.2.5 - 2026-10-09

- Render the protected organization target on a neutral light/dark panel with
  its logo at the left and its role, legal context and selectable sector badge
  in one readable stack at the right.

## 0.2.4 - 2026-10-09

- Lead the protected-profile card with the unlock task, center the selected
  sector context and place passkey/PIN controls immediately after it without
  repeating a visible "profile to unlock" eyebrow.
- Add host-customizable selected, unlock and alternative action tokens so
  portals can distinguish blue selection, orange unlock and recovery actions
  consistently in light and dark themes.

## 0.2.3 - 2026-10-09

- Keep the section-removal action at the far edge of its section while still
  exposing the same hover and keyboard-focus hint as other icon actions.

## 0.2.2 - 2026-10-09

- Name the exact localized FHIR resource in the V2 editor heading without a
  redundant resource-type subtitle.
- Keep terminology candidates in the existing selection dropdown and report a
  successful zero-result search explicitly, clearing stale results whenever
  the query or governed coding-system selection changes.
- Give the V2 profile-unlock panel an explicit light/dark accent surface and
  support PIN-recovery actions inside the PIN fallback only after a rejected
  PIN, while keeping unrelated profile actions separate.
- Use compact, accessible add/remove section actions with destructive
  confirmation, semantic action colours and matching hover/focus hints.
- Let hosts place downloads, credential generation and update metadata in the
  same responsive document footer as the final submit action.

## 0.2.1 - 2026-10-08

- Add the opt-in `ProfileProtectionGateV2`, which identifies the exact
  host-authorized profile or subject with accessible human-readable metadata
  before passkey or PIN unlock. V1 remains unchanged.
- Route every schema-backed IPS resource through the progressive V2 clinical
  editor, with schema-owned coded dropdowns, terminology-backed concepts,
  date/time controls, optional-field selection and mandatory canonical coding.
- Let hosts attach entry-level credential actions to a staged clinical record;
  creation updates only the local draft and viewing does not cross the final
  document submission boundary.

## 0.2.0 - 2026-10-08

- Promote the opt-in V2 clinical document authoring API to a minor release.
  Existing V1 exports remain available; V2 adds progressive section/resource
  creation, reusable property editors and `ImmunizationArtifactEditorV2`.
- Include the cumulative reusable IPS summary and animal-card presentation
  introduced while validating the V2 flows in VetChain Demo.

## 0.1.50 - 2026-10-08

- Add a reusable printable animal-card presentation whose host supplies the
  canonical card number, DID and QR payload.
- Let animal identity onboarding render a host-governed species dropdown while
  preserving the numeric taxonomy input for existing consumers.

## 0.1.49 - 2026-10-08

- Start new clinical documents without pre-rendered empty sections. Authors add
  a section first, then add resources from that section; a resource-type choice
  appears only when the selected section supports more than one resource.
- Expose each prepared local document Bundle to host-owned download or
  credential actions without crossing the final submission boundary.
- Allow the reusable IPS summary to omit sections that contain no records while
  preserving localized terminology rendering for populated resource cards.

## 0.1.48 - 2026-10-08

- Add an opt-in V2 clinical authoring shell without changing the existing V1
  editor. Its reusable date/time, coded-concept, coded-select, positive-integer,
  document-reference and progressive optional-field properties support
  resource-specific editors.
- Add `ImmunizationArtifactEditorV2` with a minimal initial form, explicit
  terminology search and selection, locked canonical coding, removable
  optional flat claims, dose-series validation and automatic next-dose
  ImmunizationRecommendation staging.

## 0.1.47 - 2026-10-08

- Show the localized FHIR resource type in the shared Bundle selector and in
  the clinical-entry dialog so users always know which resource they are
  adding.
- Keep terminology lookup on the human-readable clinical concept while hiding
  the legacy split code-system and code-value inputs when the canonical coded
  claim is available.
- Render governed coded options, including Observation categories, with their
  localized display and a compact system/code suffix while persisting the full
  canonical token.

## 0.1.46 - 2026-10-08

- Create clinical Bundle entries through explicit section and resource-type
  selectors, followed by one accessible `+ Add entry` action. Keep the staged
  entries grouped in collapsible sections with their existing edit and delete
  actions.
- Let every schema-driven clinical resource form stage several PDF, PNG or
  JPEG documents. Each file becomes an independent claims-first
  `DocumentReference` with SHA-256 content hash and is linked from the parent
  resource through its canonical `contained-reference-list`; files remain
  local until the final Bundle submission.

## 0.1.45 - 2026-10-07

- Present governed terminology sources as a compact dropdown with checkboxes,
  retaining the server default while allowing several systems at once.
- Resolve each terminology default from the exact resource and coded claim;
  no coding system is assumed globally. Render required FHIR R4 code bindings
  from `fhir-data-utils-ts` with localized labels while persisting their
  canonical codes.

## 0.1.44 - 2026-10-07

- Let the shared IPS editor hydrate claims-first resources from an imported
  document Bundle so they remain locally editable before the single final send.
- Expose governed terminology source selection with the server default selected
  and optional multi-source searches for typed or dictated clinical text.

## 0.1.43 - 2026-10-07

- Require the `gdc-common-utils-ts` release that provides the Composition
  attester-list editor used by the shared clinical Bundle draft.

## 0.1.42 - 2026-10-07

- Add a product-neutral, JSON-Schema-driven IPS Bundle draft editor with local
  add/edit/remove staging, shared terminology and speech hooks, and one explicit
  final document submission boundary. Typed ResearchSubject references and
  professional author/attester provenance remain host-controlled.

## 0.1.41 - 2026-10-05

- Add one brand-neutral professional access panel shared by Partner and Test
  Network Google/email-OTP/passkey entry and by an isolated six-digit Demo
  adapter. Demo presentation cannot switch shared GW or DataConv services into
  an in-memory mode through a browser-authored header.
- Hide passkey entry when the host has not supplied a real WebAuthn adapter;
  an informational click is not represented as authentication.
- Add a host-controlled animal controller attestation panel for pending
  owner/caregiver invitations and privacy-safe accepted proof readback. The
  component never replaces a controller, sends a notification or grants
  clinical access on its own.
- Add a shared current-subject registration provider so Personal and
  Professional can render the selected person or animal in the common header
  without duplicating portal state.
- Add a browser speech-recognition adapter whose final transcript remains
  editable and whose injected constructor is testable outside a browser.

## 0.1.40

- Present subject Communications as an accessible bidirectional channel with
  incoming/outgoing bubbles, sender avatars and an optional text/Bundle
  composer, while preserving the existing message, call and emergency filters.

## 0.1.39

- Keep clinical field labels unique to their inputs when speech controls are
  rendered. Microphone buttons now expose only their action as the accessible
  name while retaining the target field in the hover title.

## 0.1.38

- Add a brand-neutral subject communication center that merges messages,
  voice messages, internet calls and appointment notices behind accessible
  All, Messages, Calls and Emergency filters.

- Add a portal-owned clinical speech-input provider. Schema-backed IPS text
  fields now reflect the shared model state, append editable transcripts and
  reuse the existing explicit terminology-candidate selection flow. A shared
  external channel propagates runtime phase changes to editors that are
  already open without importing or duplicating the model in those editors.

- Add a shared progressive animal, owner-or-caregiver and physical-evidence
  onboarding form for veterinarian-assisted identity attestation.
- Add a capability-aware `SubjectIdentityCard` for provider-confirmed animal
  identity and relationship readback.
- Add compact accessible clinical action buttons and a task-first emergency
  hub with host-owned navigation and authorization.
- Let SOSChain hosts compose a task-first overview, keep secondary areas under
  an accessible More menu and select cards without exposing identifiers in URLs.
- Make this repository the single source of truth for the cross-portal
  BloodChain/UHC, VetChain Expo and HospitalApp component recovery inventory.
  Keep consumer ownership and proof requirements beside the reusable React
  component boundary instead of duplicating the matrix in one product portal.

## 0.1.35

- Keep create actions in the clinical section header while edit and delete
  actions belong to the exact resource card they modify.
- Render clinical editors in a top-level modal layer so sticky account menus
  cannot cover them, and make composite date/time and blood-pressure controls
  shrink or stack without escaping the dialog.

## 0.1.34

- Keep clinical-write and association-management capabilities independent in
  `SoschainWorkspace`. An authorized editable health summary no longer carries
  a contradictory read-only badge merely because the actor cannot manage
  Places or devices.

## 0.1.33

- Resolve the root `code-text` terminology input to the canonical `code`
  claim for AllergyIntolerance, Condition and Procedure editors. This restores
  coded create/recreate parity with MedicationStatement and Immunization.

## 0.1.32

- Present every JSON-Schema `date-time` and `fhir-date-time` clinical claim as
  separate calendar-date and local-time controls, including accessible actions
  for the current date and time, while preserving canonical FHIR instants.
- Keep optional status fields genuinely empty until selected so an
  edit/delete/recreate round trip never invents clinical state.
- Consume the canonical clinical subject-reference fix from
  `fhir-data-utils-ts@0.6.12`.

## 0.1.30

- Pin the corrected shared clinical reader so IPS cards prefer each resource's
  clinical event date over the enclosing Composition authoring timestamp.

## 0.1.29

- Bind `ClinicalArtifactEditor` to the shared multichannel JSON Schema. The
  component now creates the claims-first changes Bundle through the reusable
  `BundleEditor` helper and can hydrate the same form from authoritative
  `BundleReader` readback or a native FHIR import.
- Keep one stable draft identifier across retries, expose pending/retryable
  synchronization without reporting local state as saved, and add the same
  retry contract to encounter transfers.
- Derive form input types from that JSON Schema, so textual FHIR fields such
  as a vaccine lot number are not misclassified by their claim name.

## 0.1.28

- Add a reusable emergency-contact directory with provider-owned create,
  update and delete callbacks plus accessible telephone and email actions.
- Keep Goals and Preferences and Clinical Tests inside the unified IPS
  presentation instead of duplicating them as top-level sections.
- Add a locale-aware clinical timeline with inclusive from/to date and time
  filters, OR-within/AND-across multi-select facets, latest-first cards,
  accessible previous/next navigation and an expanded-list alternative.
- Replace free-text vital-sign timestamps with separate calendar date and time
  controls, optional seconds defaulted to `00`, explicit current-date/current-
  time actions and canonical FHIR instant composition in the selected IANA
  time zone.
- Keep long clinical editors scrollable on mobile while their save/cancel
  actions remain visible and clickable.

## 0.1.27

- Add generic `AllClinicalSections<Person|Animal>` organization with stack or
  tab presentation, nested collapsible groups and host-controlled exclusions.
- Keep family health history, care-team members, emergency contacts,
  Encounters and IPS summary as independent navigation concepts while the host
  supplies authorized clinical content.

## 0.1.26

- Add a brand-neutral clinical document and Encounter explorer for an
  authorized care journey.
- Navigate chronologically between supplied Encounters while preserving
  `Encounter.partOf` as hierarchy and rendering only document Bundles whose
  leading Composition references the selected Encounter.
- Reuse the section viewer for IPS and non-IPS documents; the Composition title
  and type provide the document label.

## 0.1.25

- Render every labelled quantity component of a composite FHIR `Observation` in the shared IPS card, including systolic and diastolic blood-pressure values and units.

## 0.1.24

- Reopen an existing vital-sign measurement with its typed values intact, including both systolic and diastolic blood-pressure components.

## 0.1.23

- Add a shared vital-sign editor with an explicit measurement-type selector.
- Capture systolic and diastolic blood pressure as two components of one typed measurement, ready for the canonical flat observation graph and one composite FHIR `Observation` at the projection boundary.
- Keep persistence, authorization and provider readback in the host portal.

## 0.1.22

- Preserve complete FHIR date and dateTime values in the shared clinical editor instead of silently truncating timezone-bearing values through an HTML calendar-date input.

## 0.1.21

- Allow a host with a server-resolved clinical write capability to present the shared SOSChain health workspace as editable instead of showing a contradictory read-only badge.

## 0.1.20

- Add one brand-neutral, schema-driven clinical artifact editor for UHC,
  Vet/Pet and SOSChain Personal and Professional portals.
- Keep human-entered clinical text when a terminology candidate is explicitly
  selected, and place its code and display in the schema-owned companion
  claims without silently coding free text.
- Require host-owned provider persistence to return a fresh Bundle before the
  editor publishes a successful readback. The shared component owns no auth,
  provider URL, write capability or human-versus-animal policy.

## 0.1.19

- Add an accessible Encounter transfer console with patient lookup, a
  horizontally scrollable care journey, explicit return/on-hold versus
  definitive/completed choices, and an in-progress destination.
- Add emergency-contact call, video and message actions plus PDF, FHIR Bundle
  and calendar attachment choices without deriving authorization in the UI.
- Keep plain-language help visible and place FHIR resource names in optional
  technical details.
- Render a host-provided encounter business identifier without replacing the
  FHIR resource identity or deriving identifiers in browser state.

## 0.1.18

- Add shared, read-only Health summary and Care journey areas to the SOSChain
  subject workspace used by Personal and Professional portals.
- Render only host-authorized IPS content and bounded Encounter projections;
  card or tab selection never exposes clinical mutation controls.

## 0.1.17

- Add provider-enabled microchip, tattoo, email and telephone subject locator
  kinds without exposing any locator that the owning BFF has not enabled.
- Carry server-returned identifier evidence as presentation-only metadata and
  add suitable browser input hints for ISO animal microchips and contacts.

## 0.1.16

- Add `IdentityEvidenceDocumentPanel`, a brand-neutral signed-PDF upload and
  verification surface used by PetChain, UHC UNID and SOSChain.
- Keep rendered status provider-owned: selecting or uploading a PDF never
  changes pending evidence to verified in browser state.
- Add `IdentityEvidenceDeclarationForm` for governed legal-name, jurisdiction,
  identifier and relationship options with one high-level preparation
  callback and no session, certificate or gateway fields.

## 0.1.15

- Add an accessible, animated `PortalLoadingSkeleton` that authenticated
  portals render while provider data is pending, before any empty or stale
  business state is eligible to appear.

## 0.1.14

- Add a brand-neutral, three-step identity-evidence workspace that keeps the
  selected subject separate from the controller's reusable identifiers.
- Model self upload, authorized organization-worker upload and professional
  attestation as independent host-confirmed capabilities; uploading evidence
  never marks its signature or identity as verified in browser state.

## 0.1.13

- Render versioned legal Markdown as semantic headings, paragraphs, lists,
  links and inline code instead of exposing source markers.

## 0.1.12

- Add a brand-neutral full-page account settings surface for security actions,
  theme, text size, language and legal links, with a product-extension slot for
  jurisdiction and data-use controls.

## Unreleased

- Add a reusable, accessible Consent permission directory/editor for
  provider-backed create, edit, suspend/reactivate and delete flows. The host
  owns the schema-backed Bundle mutation and must return authoritative
  readback; the component performs no optimistic authorization mutation.

- Add the repository-wide mandatory red-green-refactor contributor contract
  and mark the existing component suites with an explicit TDD contract header.
- Correct the reuse contract: the package currently provides presentation
  primitives, not the full UHC Personal route journeys. Document the extraction
  required before PetChain can reuse login, protected profiles, individuals,
  members/licences, clinical data and permissions without cloning the app.
- Add a brand-neutral protected-index and emergency-copy panel. Hosts supply
  backend-confirmed records; protected storage, individual authorship and
  emergency availability remain separate states, and professional release is
  never inferred by the browser.

## 0.1.10 - 2026-08-03

- Add the reusable organization workforce administration surface with total,
  used and free license counters, active/inactive employee lifecycle actions,
  invitation status history and an optional future device count.
- Add browser-DOM interaction tests proving controlled inputs, disabled invite
  behavior, callbacks and the disable-before-purge rule.

## 0.1.9 - 2026-08-02

- Allow the SOSChain card picker to expose a host-owned card-import action for
  scanning or entering a provider card identifier.

## 0.1.8 - 2026-08-02

- Add the shared subject-first SOSChain card picker and workspace for Places,
  IndividualProducts and emergency/civil-protection communications.
- Keep authorization host-owned: the component receives server-resolved cards
  and capabilities and never treats a browser selection as authority.

## 0.1.7 - 2026-07-30

- Add controlled, actor-neutral invitation-acceptance and subject-access
  request panels. The same scanner/manual locator can be hosted by an
  individual-member or professional facade; authorization remains in the BFF
  and GW.
- Keep requested clinical sections as explicit `system|code` values supplied
  by the host instead of deriving role or permission semantics in React.

## 0.1.6 - 2026-07-30

- Consume Common Utils 2.3.12 so the shared IPS viewer uses the complete
  all-section claims and localized clinical-name contract.
- Keep the official 16-section fixture and every declared IPS resource type as
  the executable rendering contract consumed by portal Playwright flows.

## 0.1.5 - 2026-07-29

- Allow advanced hosts to reuse the shared clinical card body while retaining
  their own expandable section heading, filters and editors.

## 0.1.4 - 2026-07-29

- Add `IpsBundleSummary`, which accepts a complete IPS document Bundle and
  renders every Composition section and its Common Utils card projections.
- Test the official 16-section IPS fixture, every declared IPS resource type
  and locale/terminology propagation.
- State explicitly that browser components render in-memory data and never call
  backend ingestion operations.

## 0.1.3

- Add the brand-neutral `ClinicalSectionSummary` renderer for resolved IPS
  cards. Clinical terminology tokens remain translation keys and are never
  derived into editable or visible names by the component.

## 0.1.2 - 2026-07-29

- Added a framework-neutral branding module for official light/dark surface
  artwork with explicit intrinsic dimensions.
- Replaced synthetic text monograms and forced gradient shapes in the shared
  header and hero with undistorted brand-provided assets.
- Added regression coverage for official asset paths, surface variants and
  intrinsic proportions.

## 0.1.1 - 2026-07-29

- Added publishable shell, entry hero and real-page access chooser modules.
- Added account/profile slots so personal and professional portals share the
  same UI behavior while host runtimes retain authentication and authorization.
- Defined the brand-only reuse contract for UHC and VetChain portal families.
- Ported the corrected UHC Personal light/dark tokens: dark mode changes
  surfaces and text contrast while primary/selected controls retain the exact
  light-mode turquoise-to-blue gradient.

## 0.1.0 - 2026-07-29

- Add a brand-neutral account/preferences header with theme, S/M/L density,
  language, guest and sign-out actions.
- Add a fail-closed protected-profile/PIN gate driven by host-owned
  `ProfileRuntime` state.
- Add theme tokens configurable for UHC and VetChain portal families.
