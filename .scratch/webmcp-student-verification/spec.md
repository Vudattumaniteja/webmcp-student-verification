# Spec: WebMCP Student Identity & Verification Suite

## Problem Statement

Digital student verification across online services (streaming platforms, AI tools, cloud providers, educational software) is fragmented, repetitive, and fraught with friction. Every time a student claims an educational perk on a different platform (such as Spotify, YouTube, OpenAI, AWS, or Notion), they must manually search for their university, re-type their personal identity information, and navigate multi-step forms or embedded iframes.

If instant database matching fails, students must manually locate, format, and upload sensitive identity documents (such as student ID cards, tuition bills, or academic transcripts). When an upload is rejected due to an expired term date or an unreadable scan, students are forced into slow asynchronous email loops to restart the process.

Furthermore, traditional AI agent automation approaches risk transmitting sensitive academic records and personally identifiable information (PII) to external cloud AI inference servers, violating student privacy and FERPA/GDPR compliance.

## Solution

A browser-native WebMCP student identity verification platform that enables in-browser AI agents to automate the verification lifecycle across multiple discount providers with zero PII leakage.

The solution provides:
1. **Local Student Vault**: A secure browser sandbox storing student identity profiles and document proof assets with built-in test presets.
2. **Verification Provider Mock Engine**: A high-fidelity in-memory state engine simulating SheerID and UNiDAYS REST v2 step machines (instant match, pre-signed upload lifecycle, asynchronous review, and recoverable error injection).
3. **W3C WebMCP Verification Bridge**: Standardized browser tools registered on `document.modelContext` utilizing a handle-based claim-check pattern that keeps agent prompt payloads under 300 characters while streaming binary files directly to storage endpoints.
4. **Merchant Perks Showcase**: A multi-service discount showcase simulating real-world student discount offers (OpenAI ChatGPT Plus, Spotify Premium, AWS Educate, Notion Education, YouTube Premium) with real-time verification state tracking.
5. **Embedded Verification Agent**: An interactive AI assistant with human-in-the-loop consent checkpoints and autonomous error recovery that guides students through document replacements when errors occur.

---

## User Stories

### Student Persona & Vault Management
1. As a student, I want to store my personal identity information (legal name, date of birth, university email) once in a secure browser vault, so that I never have to re-type it across multiple merchant discount forms.
2. As a student, I want to store my academic proof documents (Student ID card, class schedule, tuition receipt, transcript) in my browser vault, so that they are instantly available when a verification service requires proof.
3. As a student, I want my document binaries to remain strictly inside my local browser sandbox, so that my academic records and sensitive PII are never transmitted to third-party cloud LLM providers.
4. As a student or judge, I want to switch between pre-configured student presets (Stanford Valid, Harvard Expired, Berkeley Illegible, MIT Instant) with a single click, so that I can immediately test various verification and error recovery paths.
5. As a student, I want to upload custom PDF or image documents into my local vault, so that I can test with my own custom files.

### Merchant Showcase & Offer Claiming
6. As a student, I want to browse a catalog of student offers (such as 4 months of free ChatGPT Plus, 50% off Spotify Premium, $100 in AWS Educate credits, free Notion Education Plus, and discounted YouTube Premium), so that I can discover and claim available benefits in one place.
7. As a student, I want to click a single "Claim with WebMCP" button on any merchant card, so that my AI agent can initiate and coordinate the verification process on my behalf.
8. As a student, I want to see real-time verification status badges on each merchant card (e.g. Unverified, Verifying, Approved, Action Needed), so that I always know the current state of my discount applications.
9. As a student, I want to view and copy my approved reward discount promo code directly from the merchant card, so that I can immediately apply it at checkout.

### WebMCP Tool Execution & Handle-Based Privacy
10. As an AI agent, I want to call a `search_school` WebMCP tool, so that I can query accredited universities and obtain official institution IDs.
11. As an AI agent, I want to call a `get_student_vault_profile` WebMCP tool, so that I can read the student's name, email, and university affiliation without exposing raw document binaries.
12. As an AI agent, I want to call a `list_vault_documents` WebMCP tool, so that I can inspect sanitized document metadata (document handle, type, issue date, expiration date) within a minimal token budget (<300 characters).
13. As an AI agent, I want to call a `submit_student_verification` WebMCP tool, so that I can submit the student's details to the verification state machine and determine whether instant approval or document upload is required.
14. As an AI agent, I want to call an `upload_vault_document` WebMCP tool using a document handle ID, so that the browser tool handler streams the binary file directly to the provider's pre-signed upload URL without routing the binary through the LLM context.
15. As an AI agent, I want to call a `check_verification_status` WebMCP tool, so that I can poll the verification status and retrieve approval codes or rejection error reasons.

### Verification Provider State Machine & Error Handling
16. As a verification provider engine, I want to instantly approve eligible students whose records match authoritative databases (such as the MIT preset), so that they receive an immediate reward code without requiring document uploads.
17. As a verification provider engine, I want to transition to a `docUpload` step with pre-signed upload URLs when instant verification is inconclusive, so that students can supply proof documents.
18. As a verification provider engine, I want to evaluate submitted documents and return structured rejection codes (such as `EXPIRED_DOCUMENT` for past-term IDs, `ILLEGIBLE_DOCUMENT` for blurry scans, or `NAME_MISMATCH`), so that clients understand the exact failure cause.
19. As a verification provider engine, I want to allow retry submissions on an active verification session, so that users do not need to restart the entire workflow from scratch.

### Verification Agent Interaction & Autonomous Recovery
20. As a student, I want an embedded chat interface that narrates the agent's progress in plain English, so that I understand what verification step is currently being executed.
21. As a student, I want a human-in-the-loop confirmation modal before any document is dispatched to a verification provider, so that I maintain explicit control over my personal data.
22. As a student, when a document is rejected due to an expired date (`EXPIRED_DOCUMENT`), I want the AI agent to detect the issue, explain the cause, identify an alternative valid document in my vault (e.g. a current tuition receipt), and ask for my confirmation to re-submit.
23. As a student, when a document is rejected due to image quality (`ILLEGIBLE_DOCUMENT`), I want the AI agent to suggest uploading an official PDF transcript from my vault to clear the rejection automatically.
24. As a student, I want the agent to automatically apply the generated reward discount code to my merchant card upon successful verification, so that the workflow is completed seamlessly.

---

## Implementation Decisions

### 1. Verification Provider Engine (SheerID / UNiDAYS State Machine)
- The verification backend is structured as an in-memory, deterministic finite state machine modeling SheerID REST v2.
- Supported steps: `collectStudentPersonalInfo` -> Instant `APPROVED` vs `docUpload` -> S3 pre-signed binary PUT -> `completeDocUpload` -> `PENDING` -> `APPROVED` or `REJECTED`.
- Rejection codes supported: `EXPIRED_DOCUMENT`, `ILLEGIBLE_DOCUMENT`, `NAME_MISMATCH`.
- Rejection remedies supported: allows re-uploading an alternative document handle on the same verification session.

### 2. Local Student Vault & Handle-Based Claim-Check Security
- The vault uses an in-browser hybrid storage model (IndexedDB 3.0 for binary `Blob` persistence, and an in-memory reactive state for fast UI synchronization).
- The agent interaction follows the **Claim-Check Pattern**:
  - The agent inspects sanitized metadata via `list_vault_documents`:
    ```json
    [
      { "documentId": "doc_stan_id_2026", "docType": "STUDENT_ID", "expirationDate": "2026-06-30", "isValid": true }
    ]
    ```
  - When the agent invokes `upload_vault_document`, it passes only `verificationId` and `documentId`.
  - The WebMCP tool handler retrieves the binary `Blob` directly from browser memory/IndexedDB and performs the direct `PUT` to the pre-signed S3 URL.
  - Raw binary data is never converted to Base64 inside LLM prompt contexts, eliminating context window exhaustion and preventing PII leakage.

### 3. WebMCP Tool Suite on `document.modelContext`
- Tools adhere strictly to the W3C WebML CG WebMCP Draft Specification and Chrome WebMCP guidelines:
  - `search_school`: `readOnlyHint: true`, `untrustedContentHint: false`
  - `get_student_vault_profile`: `readOnlyHint: true`, `untrustedContentHint: false`
  - `list_vault_documents`: `readOnlyHint: true`, `untrustedContentHint: false`
  - `submit_student_verification`: `readOnlyHint: false`, `untrustedContentHint: false`
  - `upload_vault_document`: `readOnlyHint: false`, `untrustedContentHint: false`
  - `check_verification_status`: `readOnlyHint: true`, `untrustedContentHint: false`
  - `switch_demo_preset`: `readOnlyHint: false`, `untrustedContentHint: false`
- Tool descriptions are concise (<180 characters) and individual tool outputs are capped under 450 characters.

### 4. Demo Student Presets
- Built-in test personas:
  1. `STANFORD_VALID`: Stanford undergraduate with valid 2025-2026 Student ID card and Fall 2026 class schedule.
  2. `HARVARD_EXPIRED`: Harvard undergraduate with expired 2023-2024 Student ID and valid Fall 2026 tuition bill for testing date recovery.
  3. `BERKELEY_ILLEGIBLE`: UC Berkeley undergraduate with low-res blurry scan and valid official transcript for testing image quality recovery.
  4. `MIT_INSTANT`: MIT graduate student eligible for instant registrar match bypassing document upload.

### 5. Merchant Perks Showcase UI
- Grid of interactive merchant cards: OpenAI ChatGPT Plus (4 months free), Spotify Premium Student ($5.99/mo), AWS Educate ($100 credits), Notion Education Plus (Free), YouTube Premium Student ($7.99/mo).
- Each card maintains an independent verification state: `UNVERIFIED`, `VERIFYING`, `APPROVED` (displaying copyable reward code), or `ERROR`.

### 6. Verification Agent & HITL Chat Interface
- Floating/collapsible agent workspace with real-time step visualization (School Search -> Personal Details -> Document Match -> Provider Upload -> Status Check -> Approved).
- Human-in-the-Loop modal providing a clear preview of document metadata and an explicit "Confirm & Upload" action.
- Interactive recovery flow: upon document rejection, the agent presents a structured remedy card offering one-click selection of alternative vault documents.

---

## Testing Decisions

### Seams for Testing
1. **WebMCP Tool Boundary Seam (Highest Seam)**: Testing tool execution via standard `ModelContextTool.execute(args)` with simulated store and vault contexts.
2. **Verification State Machine Seam**: Direct testing of the SheerID mock engine state transitions, pre-signed URL generation, binary upload acceptance, and rejection triggers.
3. **Student Vault Seam**: Testing document metadata sanitization, handle resolution, preset switching, and binary Blob retrieval.
4. **React UI Component Seam**: Testing merchant card state transitions, preset switcher, and agent chat interactions with React Testing Library.

### Testing Principles
- Test external behavior and outputs, not internal private functions.
- Every state machine transition and error code must have a dedicated automated test.
- Verify that tool responses adhere to the character budget and never include raw binary payloads.

---

## Out of Scope

- Processing real financial transactions or live credit card payments.
- Server-side multi-tenant user authentication and hosted PostgreSQL databases.
- Scraping proprietary university intranet portals.
- Physical mail delivery of student discount cards.

---

## Further Notes

- The architecture is fully compatible with standard WebMCP browser environments (`window.document.modelContext`).
- If running in a browser without native `modelContext`, the application provides a resilient in-memory WebMCP bridge so the entire demo functions seamlessly during evaluation.
