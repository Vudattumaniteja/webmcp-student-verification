# Map: WebMCP Student Identity & Verification Showcase

## Destination
A complete interactive web application showcasing simulated student discount merchants (AI tools, streaming services, cloud platforms), an in-browser Student Document Vault, a high-fidelity SheerID / UNiDAYS mock state engine (supporting instant verification, pre-signed document upload, and recoverable error codes), registered WebMCP browser tools (`document.modelContext`), and an embedded AI verification agent that automates identity claims and error recovery without leaking student documents to cloud LLMs.

## Notes
- Domain: Student identity verification, SheerID REST v2 state machine, WebMCP browser protocol (`document.modelContext`), client-side security sandbox.
- Consult skills: `codebase-design`, `tdd`, `unslop`, `domain-modeling`.
- Standing preferences: Fully functional client-side interactive demo with preset student profiles (instant approval, doc required, expired document retry) and zero external API dependencies required for judging.

## Decisions so far
<!-- the index: one line per closed ticket, enough to judge relevance, then zoom the link for the detail the ticket holds -->

## Not yet specified
<!-- in-scope fog that will graduate as the frontier advances -->
- UNiDAYS / Apple Student verification specific quirks (e.g. institution portal redirect vs direct document upload).
- Live SheerID API token proxy mode integration for production deployment.
- Mobile browser layout and touch-friendly camera upload simulation.

## Out of scope
- Real credit card transaction processing for merchant subscriptions.
- Production multi-tenant user authentication and server database persistence.
