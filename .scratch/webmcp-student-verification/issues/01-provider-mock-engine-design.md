# Issue 01: Provider Mock Engine Design

Type: prototype
Status: open

## Question
How should the high-fidelity SheerID / UNiDAYS verification mock engine be structured in-memory to accurately simulate:
1. Dynamic step transitions (`collectStudentPersonalInfo` -> instant `APPROVED` vs `docUpload`).
2. S3 pre-signed upload lifecycle (`docUpload` metadata submission -> simulated binary store -> `completeDocUpload`).
3. Deterministic error injection (`EXPIRED_DOCUMENT`, `ILLEGIBLE_DOCUMENT`, `NAME_MISMATCH`) based on document metadata or student persona presets?
