# Changelog

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
