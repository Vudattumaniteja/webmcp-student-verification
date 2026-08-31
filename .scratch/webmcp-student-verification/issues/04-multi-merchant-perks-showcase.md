# 04: Multi-Merchant Perks Showcase & State Tracking

**What to build:** An interactive perks hub showcasing real-world student discount offers (OpenAI ChatGPT Plus, Spotify Premium, AWS Educate, Notion Education, YouTube Premium) with live per-merchant verification state badges, "Claim with WebMCP" trigger buttons, and copyable reward code displays.

**Blocked by:** 01 (Instant Student Verification & University Search), 03 (Document Upload Fallback & Pre-Signed Direct Transfer)

**Status:** ready-for-agent

- [ ] Showcase displays 5 simulated merchant perk cards with distinct student offers and visual branding.
- [ ] Each merchant card tracks real-time verification status (`UNVERIFIED`, `VERIFYING`, `APPROVED`, `ERROR`).
- [ ] Clicking "Claim with WebMCP" on any card initiates the agent verification workflow for that specific offer.
- [ ] Approved offers display unlocked reward promo codes with one-click copy to clipboard.
- [ ] Automated tests verify state transitions across merchant cards independently.
