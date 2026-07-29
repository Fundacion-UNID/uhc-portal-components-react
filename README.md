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
  cards for personal and professional portals.
- `IpsBundleSummary`: receives one in-memory IPS document Bundle, obtains all
  `Composition.section` entries through Common Utils and renders every
  section's cards. It performs no ingestion or GW call.

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

UHC Personal and VetChain Personal must compose the same personal route
modules. UHC Professional and VetChain Professional must compose the same
professional route modules. A brand adapter may change only tokens, logo,
product names, descriptions and route destinations; it must not fork flow,
profile or authorization behavior.
