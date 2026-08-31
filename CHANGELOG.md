# Changelog

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
