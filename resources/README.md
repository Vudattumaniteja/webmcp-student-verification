# WebMCP Documentation & Hackathon Resources

This directory contains the essential documentation, API references, security guidelines, and hackathon requirements for the **WebMCP Challenge** (August 25 - September 3, 2026).

---

## Resource Index

| File | Topic | Description |
| --- | --- | --- |
| [01-webmcp-specification.md](file:///C:/Users/Manit/projects/web-mcp-challange/web-mcp/resources/01-webmcp-specification.md) | **W3C Specification & WebIDL** | Full interface definitions for `document.modelContext`, `registerTool`, `getTools`, `executeTool`, and types. |
| [02-imperative-api.md](file:///C:/Users/Manit/projects/web-mcp-challange/web-mcp/resources/02-imperative-api.md) | **Imperative API Guide** | Single-page app patterns, React hooks, JSON schema definitions, cancellation via `AbortSignal`, and cross-origin access. |
| [03-declarative-api.md](file:///C:/Users/Manit/projects/web-mcp-challange/web-mcp/resources/03-declarative-api.md) | **Declarative API Guide** | HTML `<form>` tool attributes (`toolname`, `tooldescription`, `toolautosubmit`), `agentInvoked`, `e.respondWith()`, and CSS pseudo-classes. |
| [04-hackathon-rules-and-submission.md](file:///C:/Users/Manit/projects/web-mcp-challange/web-mcp/resources/04-hackathon-rules-and-submission.md) | **Rules & Deliverables** | 4 mandatory deliverables (Live URL, Public OSS Repo, Video, Written Description), judging criteria, prizes, and deadlines. |
| [05-security-and-best-practices.md](file:///C:/Users/Manit/projects/web-mcp-challange/web-mcp/resources/05-security-and-best-practices.md) | **Security & Best Practices** | Indirect prompt injection defense, `readOnlyHint`, `untrustedContentHint`, character budgets, and resilient error reporting. |
| [06-ecosystem-and-starter-templates.md](file:///C:/Users/Manit/projects/web-mcp-challange/web-mcp/resources/06-ecosystem-and-starter-templates.md) | **Ecosystem & Credits** | Chrome testing flags, Model Context Tool Inspector extension, starter templates (Cloudflare, Vercel, Netlify), and hosting credits. |

---

## Quick Testing Commands

* **Chrome testing flag:** `chrome://flags/#enable-webmcp-testing`
* **TypeScript types:** `npm install -D webmcp-types`
* **React hook:** `npm install use-webmcp-tool`
* **Inspector Extension ID:** `gbpdfapgefenggkahomfgkhfehlcenpd`
