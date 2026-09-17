# AGENTS.md

## Mandatory TDD

Use red-green-refactor TDD for every behavior or flow change. Write and run the
smallest executable component/contract test first; it must fail for the
intended reason before implementation begins. Then implement the minimum
change and make focused, integration and affected Playwright tests green.
Begin every new or modified test suite with a flow-contract comment and every
Playwright file with the complete numbered journey. Mocks never replace real
portal boundary proof. Never accept an incomplete terminal state as success.
