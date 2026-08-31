# 05: Autonomous Verification Agent & Error Recovery Chat

**What to build:** An embedded AI verification agent with interactive chat interface, live execution step timeline, human-in-the-loop document consent modal, and autonomous recovery flows that handle `EXPIRED_DOCUMENT` and `ILLEGIBLE_DOCUMENT` rejections by suggesting and uploading valid replacement documents from the vault.

**Blocked by:** 03 (Document Upload Fallback & Pre-Signed Direct Transfer), 04 (Multi-Merchant Perks Showcase & State Tracking)

**Status:** ready-for-agent

- [ ] Embedded chat interface narrates verification progress with live step badges (Search -> Details -> Vault Match -> Upload -> Status).
- [ ] Human-in-the-loop modal displays preview of selected document metadata with explicit user confirmation before dispatch.
- [ ] Autonomous error recovery detects `EXPIRED_DOCUMENT` (Harvard preset) and prompts student to submit valid tuition receipt.
- [ ] Autonomous quality recovery detects `ILLEGIBLE_DOCUMENT` (Berkeley preset) and prompts student to submit official transcript.
- [ ] Automated and component tests verify the full end-to-end recovery loop.
