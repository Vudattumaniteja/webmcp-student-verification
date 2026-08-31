# Issue 03: WebMCP Verification Tool Schemas

Type: prototype
Status: open
Blocked by: 01, 02

## Question
What exact JSON Schema and TypeScript implementations should be registered on `document.modelContext` for the verification suite:
1. `searchSchool` (resolving institution IDs)
2. `submitStudentDetails` (starting verification with student profile)
3. `uploadVerificationDocument` (submitting metadata, direct PUT, and completeDocUpload)
4. `checkVerificationStatus` (polling status and rejection codes)
5. `retryWithNewDocument` (submitting corrected document for recoverable errors)?
