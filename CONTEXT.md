# Domain Context: WebMCP Student Identity & Verification

## Core Glossary

### Student Vault
A secure, browser-local data store holding the student's personal identity profile (legal name, date of birth, .edu email), accredited institution details, and binary proof assets (Student ID card, class schedule, tuition receipt, transcript). The vault remains client-side to prevent leaking sensitive academic PII to cloud LLMs.

### Verification Provider (Mock & Live Engine)
An identity verification authority (such as SheerID, UNiDAYS, or Apple Student Verification) that validates academic enrollment. In this project, a high-fidelity engine simulates the provider's step-based finite state machine:
1. `searchSchool`
2. `collectStudentPersonalInfo`
3. `docUpload` (issuing pre-signed upload URLs)
4. `completeDocUpload` (status transition to pending review)
5. `approval` or `rejection` (with specific recovery codes such as `EXPIRED_DOCUMENT`, `ILLEGIBLE_DOCUMENT`, or `NAME_MISMATCH`)

### Merchant Showcase
Simulated consumer and developer platforms (e.g., AI tools, music streaming, cloud compute) that offer student pricing. Each merchant presents an offer and triggers verification either directly or via WebMCP tools.

### WebMCP Verification Bridge
A set of browser-level tools registered on `document.modelContext` adhering to the W3C WebML CG Model Context Protocol specification. These tools allow in-browser AI agents to search institutions, submit verification payloads, upload documents, and poll verification status.

### Verification Agent
An in-browser AI agent running within the user's secure browser session. The agent interacts with the student vault and calls WebMCP tools to complete verifications, handle document uploads, and guide the student through error recovery.
