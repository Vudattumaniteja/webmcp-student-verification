# 01: Instant Student Verification & University Search

**What to build:** An end-to-end university search and instant verification flow that allows students and AI agents to query accredited institutions, submit personal identity information, and achieve immediate approval for students matching registrar clearinghouse records (such as the MIT preset) without requiring document uploads.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] University search returns accredited higher education institutions matching user query strings.
- [ ] Submitting student personal information against instant-match institutions returns immediate `APPROVED` status with a reward code.
- [ ] Submitting student personal information against fallback institutions transitions the verification session to `docUpload`.
- [ ] WebMCP tools `search_school` and `submit_student_verification` are registered on `document.modelContext`.
- [ ] Automated tests verify search accuracy and instant-match vs doc-required state transitions.
