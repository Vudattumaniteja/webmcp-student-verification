# Issue 02: Student Vault & Zero-PII Security Model

Type: research
Status: resolved

## Question
How should the local Student Vault store identity records and binary documents in the browser (IndexedDB / state store) while ensuring:
1. The AI agent only inspects sanitized document metadata (type, issue date, institution name) during tool selection.
2. The raw document binary is transferred directly to the verification endpoint without passing through external LLM prompt contexts.
3. Pre-configured demo student profiles are provided for instant testing.

## Answer
We use a **Claim-Check / Handle-Based Architecture** backed by an in-browser hybrid **IndexedDB 3.0 + In-Memory Store**:

1. **Handle-Based Privacy (Zero-PII Leakage)**: The AI agent only ever receives compact, sanitized JSON metadata via `list_vault_documents` (e.g. `documentId`, `docType`, `expirationDate`, `isValid`), keeping tool outputs strictly under 300 characters.
2. **Direct Browser-to-S3 Transfer**: When `upload_vault_document` is invoked, the WebMCP execution handler runs directly in the user's browser, retrieves the binary `Blob` locally from IndexedDB, and streams it directly to the provider's pre-signed upload URL. Raw document binaries never enter LLM prompt contexts.
3. **Four Demo Student Presets**:
   - `STANFORD_VALID`: Standard valid undergraduate student ID and class schedule.
   - `HARVARD_EXPIRED`: Expired student ID (`EXPIRED_DOCUMENT`) + valid 2026 tuition receipt for automated error recovery.
   - `BERKELEY_ILLEGIBLE`: Blurry low-res scan (`ILLEGIBLE_DOCUMENT`) + valid official transcript for quality recovery.
   - `MIT_INSTANT`: Instant database match bypassing `docUpload`.
