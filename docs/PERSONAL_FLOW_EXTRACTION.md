# Personal flow extraction contract

The reusable personal product is larger than a visual component library. It
needs two explicit layers.

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
