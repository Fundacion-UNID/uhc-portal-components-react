# Assisted subject and controller onboarding

This shared flow is used when a provider creates the individual record during
a consultation instead of the controller creating it first. The UI may be
shared, but the owning product and server authorization remain explicit.

- VetChain/PetChain owns assisted animal creation and the proposed owner or
  caregiver relationship.
- UHC Personal/Professional owns assisted human creation. An adult normally
  controls their own record unless another controller is explicitly
  authorized; a minor uses an authorized parent, guardian or other controller.
- The professional records only the evidence they actually checked. A proposal
  is not a verified relationship until the owning product completes its
  acceptance or authoritative verification step.
- SOSChain does not run this onboarding. It consumes a verified relationship
  for emergency contacts, Encounters, Communications or proof verification.
- An unidentified emergency may use a provisional incident subject, but that
  subject must never silently become a canonical UHC/VetChain identity.

`AnimalControllerAttestationPanel` is a presentation component for the owning
VetChain workflow and for read-only projections elsewhere. It grants no
authority by itself; capabilities and authoritative readback come from the
owning BFF/GW.
