# 03: Document Upload Fallback & Pre-Signed Direct Transfer

**What to build:** An end-to-end document upload fallback and direct browser-to-storage transfer mechanism that enables an AI agent to handle SheerID `docUpload` requests using local vault document handles, completing the pre-signed URL upload lifecycle without exposing binary payloads to external LLM prompts.

**Blocked by:** 01 (Instant Student Verification & University Search), 02 (Sandboxed Student Document Vault with Test Presets)

**Status:** ready-for-agent

- [ ] Provider engine generates pre-signed upload URLs and dynamic submission endpoints upon `docUpload` initialization.
- [ ] WebMCP tool `upload_vault_document` resolves binary Blobs from local storage by handle and executes direct browser-to-storage stream.
- [ ] Provider transitions session to `PENDING` state after `completeDocUpload` handshake.
- [ ] WebMCP tool `check_verification_status` polls status and reports final approvals or structured rejection codes.
- [ ] Automated tests verify the complete pre-signed upload lifecycle and ensure no binary data is returned in tool outputs.
