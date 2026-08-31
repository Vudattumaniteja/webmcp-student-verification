# WebMCP Student Identity & Verification Suite

A browser-native WebMCP student identity verification platform that enables in-browser AI agents to automate the verification lifecycle across multiple discount providers with zero PII leakage.

Built on the W3C WebML CG Model Context Protocol (WebMCP) standard, this application implements a client-side **Claim-Check Pattern** that keeps agent prompt payloads under 300 characters while streaming binary academic proofs directly to provider pre-signed upload endpoints.

---

## Key Features

- **Local Student Document Vault**: Browser-local sandbox (IndexedDB + reactive memory cache) storing student identity profiles and academic proof assets (Student ID cards, tuition receipts, transcripts, class schedules).
- **Zero-PII Claim-Check Security**: In-browser AI agents only inspect sanitized metadata handles (e.g. `doc_stan_id_2026`). Binary blobs are never converted to Base64 or routed through LLM prompts.
- **Verification Provider Engine**: Deterministic finite state machine modeling SheerID and UNiDAYS REST v2 lifecycles (instant registrar matching, pre-signed upload URL generation, document evaluation, and structured error rejection codes).
- **Multi-Merchant Perks Catalog**: Real-world student discount offers (OpenAI ChatGPT Plus, Spotify Premium, YouTube Premium, AWS Educate, Notion Education Plus, GitHub, Figma, JetBrains) with independent verification states.
- **Authentic Verification Wizard**: Multi-step student verification modal featuring university autocomplete, one-click auto-fill from vault, pre-signed binary upload simulation, and in-flow error recovery.
- **Autonomous AI Verification Agent**: In-browser assistant workspace providing step timeline tracking, human-in-the-loop (HITL) consent confirmations, automated document replacement recovery, and one-click promo code application.

---

## Demo Student Personas

The suite includes 4 pre-configured student presets covering distinct verification paths:

| Preset | Student Name | Institution | Primary Document | Secondary Document | Verification Path |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `STANFORD_VALID` | Alex Chen | Stanford University | 2025–2026 Student ID | Fall 2026 Class Schedule | Standard Document Upload (`docUpload` &rarr; `APPROVED`) |
| `HARVARD_EXPIRED` | Maya Patel | Harvard University | Expired 2023–2024 Student ID | Fall 2026 Tuition Receipt | Rejection (`EXPIRED_DOCUMENT`) &rarr; Autonomous Date Recovery |
| `BERKELEY_ILLEGIBLE` | Jordan Lee | UC Berkeley | Low-res Blurry Scan | Official PDF Transcript | Rejection (`ILLEGIBLE_DOCUMENT`) &rarr; Autonomous Quality Recovery |
| `MIT_INSTANT` | Marcus Vance | MIT | Graduate Student ID | — | Instant Registrar Database Match (`APPROVED` immediately) |

---

## WebMCP Tool Suite on `document.modelContext`

The application registers 7 standardized WebMCP tools on `document.modelContext` for in-browser AI agents:

| Tool Name | Type | Description |
| :--- | :--- | :--- |
| `search_school` | Read-Only | Queries accredited higher education institutions by name or domain. |
| `get_student_vault_profile` | Read-Only | Returns the active student's profile metadata without exposing document binaries. |
| `list_vault_documents` | Read-Only | Returns sanitized document claim-check handles under 300 characters. |
| `submit_student_verification` | Action | Submits student personal info to initiate verification and returns next steps. |
| `upload_vault_document` | Action | Resolves binary Blob by handle and streams directly to provider pre-signed upload URL. |
| `check_verification_status` | Read-Only | Polls verification session status, reward codes, or structured rejection causes. |
| `switch_demo_preset` | Action | Switches active student demo persona and associated proof documents in real time. |

---

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/Vudattumaniteja/webmcp-student-verification.git

# Navigate into the project directory
cd webmcp-student-verification

# Install dependencies
npm install
```

### Running Locally

```bash
# Start the local development server
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### Running Automated Tests

```bash
# Run full Vitest suite (148 tests across 16 test files)
npm test
```

### Production Build

```bash
# Type check and build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Icons**: Lucide React
- **Testing**: Vitest, React Testing Library, JSDOM
- **Protocol**: W3C WebML CG Model Context Protocol (WebMCP)

---

## License

This project is open source and available under the [MIT License](LICENSE).
