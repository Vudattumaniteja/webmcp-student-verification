# 02: Sandboxed Student Document Vault with Test Presets

**What to build:** A browser-sandboxed Student Document Vault that stores student identity profiles and binary proof assets (student ID cards, class schedules, transcripts, tuition receipts) locally with 4 pre-configured test presets (`STANFORD_VALID`, `HARVARD_EXPIRED`, `BERKELEY_ILLEGIBLE`, `MIT_INSTANT`) and a zero-PII handle-based claim-check discovery API.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Local vault initializes with 4 distinct demo student presets covering valid, expired, illegible, and instant approval scenarios.
- [ ] Claim-check discovery API (`list_vault_documents`) returns sanitized metadata handles under 300 characters without leaking raw binary data.
- [ ] Preset switching tool (`switch_demo_preset`) updates active vault persona and associated documents in real time.
- [ ] Vault manager UI component renders active student details, document previews, and one-click preset switching.
- [ ] Automated tests verify data isolation, binary payload retrieval via handles, and zero PII leakage.
