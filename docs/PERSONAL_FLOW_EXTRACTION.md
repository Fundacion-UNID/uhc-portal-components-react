# Personal flow extraction contract

The reusable personal product is larger than a visual component library. It
needs two explicit layers.

## Deployment model

Reuse does not require one deployed personal shell. Personal and professional
hosts may remain independent applications with their own release cadence,
brand and trusted configuration.

They stay synchronized by importing three versioned artifacts instead of
copying their implementations:

1. complete route-level screen modules, not only low-level fields and buttons;
2. one typed BFF client whose operation names, request shapes, response shapes
   and public paths are identical in every host; and
3. one channel-neutral capability manifest consumed by web, mobile, telephone,
   chat and assistant adapters.

The host owns only its brand, localization bundle, enabled capabilities,
trusted subject-domain and jurisdiction profile, and persistence/runtime adapters.
Deploying the same assistant or telephone template for different subject
domains and jurisdictions therefore changes the trusted manifest and adapters;
it does not fork the conversation, validation or operation contract.

The shared client must expose product-neutral subject operations. The target
public BFF path families are `/api/profile`, `/api/subjects`, `/api/cards` and
`/api/notifications`; branded or technology-prefixed paths are temporary host
aliases during migration. A browser, telephone or assistant adapter must
invoke the same typed operation rather than constructing a portal-specific URL.
The BFF still resolves actor authority, sector, jurisdiction, wallet and GW
route from trusted server state. None of those values becomes caller-selected
authority merely because the manifest enables a screen or conversation.

Parity is tested as a contract matrix. Every shared screen/operation fixture
must run against each applicable host adapter, and every channel must produce
the same canonical request before host-specific transport. A release is not
considered synchronized when only the component package compiles; at least one
real host journey must prove persistence and authoritative readback.

## Framework-neutral presentation

- Account access and provider choice.
- Versioned terms acceptance states.
- Protected-profile creation, unlock, relock and recovery presentation.
- Subject-card picker and creation journey.
- Controller/member relationship and licence presentation.
- Profile/card, health data, care, contacts and permissions workspaces.

These modules receive copy, brand assets, animal/person form schemas and
resolved capability state from the host. They never import Firebase, Next.js,
server storage or an SDK runtime.

## Host adapters

Each portal owns Firebase configuration, session verification, encrypted
profile storage, gateway calls, terms records and actor-scoped SDK facades.
UHC Personal supplies human-specific profile schemas; PetChain supplies
animal-specific identity, species, guardian and health-card schemas. Neither
portal imports the other application's credentials, routes or runtime state.

The first complete extraction must cover the existing UHC Personal journey in
this order: account access, terms, profile protection, authorized subjects,
individual creation, member/licence management, profile/card, clinical data,
care, contacts and permissions. A flow is reusable only when both hosts compose
the same module and host-specific differences enter through typed adapters.
