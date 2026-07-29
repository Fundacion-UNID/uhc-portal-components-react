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
organization, logo and CSS variables. Components do not import Firebase,
Next.js or any GDC/UHC SDK runtime.

The package deliberately exposes modules instead of a cloned application:

- `PortalShell`: persistent account/preferences chrome and protected content.
- `PortalEntryHero`: identical product entry composition for every brand.
- `PortalAccessChooser`: real-page navigation for professional access paths.
- `ProfileProtectionGate`: fail-closed PIN unlock presentation.

UHC Personal and VetChain Personal must compose the same personal route
modules. UHC Professional and VetChain Professional must compose the same
professional route modules. A brand adapter may change only tokens, logo,
product names, descriptions and route destinations; it must not fork flow,
profile or authorization behavior.
