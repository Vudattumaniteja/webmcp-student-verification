# Issue 02: Student Vault & Zero-PII Security Model

Type: research
Status: open

## Question
How should the local Student Vault store identity records and binary documents in the browser (IndexedDB / state store) while ensuring:
1. The AI agent only inspects sanitized document metadata (type, issue date, institution name) during tool selection.
2. The raw document binary is transferred directly to the verification endpoint without passing through external LLM prompt contexts.
3. Pre-configured demo student profiles are provided for instant testing.
