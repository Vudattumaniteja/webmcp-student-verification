import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VaultManager from './VaultManager.tsx';
import { StudentVault } from '../services/vault.ts';

describe('VaultManager Component (Ticket #3 Redesign)', () => {
  let vault: StudentVault;

  beforeEach(() => {
    vault = new StudentVault('STANFORD_VALID');
  });

  it('renders student identity profile card with full metadata and photo avatar initials', () => {
    render(<VaultManager vault={vault} />);

    // Name & avatar initials
    expect(screen.getAllByText('Alex Chen').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('AC')).toBeInTheDocument();

    // Institution and email
    expect(screen.getByText('alex.chen@stanford.edu')).toBeInTheDocument();
    expect(screen.getAllByText(/Stanford University/i).length).toBeGreaterThanOrEqual(1);

    // Graduation year and student ID number
    expect(screen.getByText(/Class of 2026/i)).toBeInTheDocument();
    expect(screen.getByText('SU-2026-9481')).toBeInTheDocument();
    expect(screen.getByText('sch_stanford_002')).toBeInTheDocument();
    expect(screen.getByText('2003-04-15')).toBeInTheDocument();
  });

  it('renders all 4 demo preset switcher cards with persona names, institutions, and scenarios', () => {
    render(<VaultManager vault={vault} />);

    // 1. Alex Chen - Stanford Valid
    expect(screen.getByRole('button', { name: /Stanford Valid/i })).toBeInTheDocument();
    expect(screen.getByText(/Valid Student ID & Schedule/i)).toBeInTheDocument();

    // 2. Maya Patel - Harvard Expired
    expect(screen.getByRole('button', { name: /Harvard Expired/i })).toBeInTheDocument();
    expect(screen.getByText(/Expired ID \+ Valid Tuition Bill/i)).toBeInTheDocument();

    // 3. Jordan Lee - Berkeley Illegible
    expect(screen.getByRole('button', { name: /Berkeley Illegible/i })).toBeInTheDocument();
    expect(screen.getByText(/Blurry Scan \+ Valid Transcript/i)).toBeInTheDocument();

    // 4. Marcus Vance - MIT Instant
    expect(screen.getByRole('button', { name: /MIT Instant/i })).toBeInTheDocument();
    expect(screen.getByText(/Instant Registrar Match/i)).toBeInTheDocument();
  });

  it('switches persona when clicking preset buttons and updates documents and profile', async () => {
    render(<VaultManager vault={vault} />);

    // Switch to Maya Patel (Harvard Expired)
    const harvardBtn = screen.getByRole('button', { name: /Harvard Expired/i });
    fireEvent.click(harvardBtn);

    await waitFor(() => {
      expect(screen.getAllByText('Maya Patel').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('MP')).toBeInTheDocument();
      expect(screen.getByText('maya.patel@harvard.edu')).toBeInTheDocument();
      expect(screen.getByText('HU-2024-3829')).toBeInTheDocument();
      expect(screen.getByText('doc_harv_id_2024')).toBeInTheDocument();
      expect(screen.getByText('doc_harv_tuition_2026')).toBeInTheDocument();
    });

    // Switch to Jordan Lee (Berkeley Illegible)
    const berkeleyBtn = screen.getByRole('button', { name: /Berkeley Illegible/i });
    fireEvent.click(berkeleyBtn);

    await waitFor(() => {
      expect(screen.getAllByText('Jordan Lee').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('JL')).toBeInTheDocument();
      expect(screen.getByText('jordan.lee@berkeley.edu')).toBeInTheDocument();
      expect(screen.getByText('doc_berk_blurry_id')).toBeInTheDocument();
      expect(screen.getByText('Low Resolution')).toBeInTheDocument();
      expect(screen.getByText('doc_berk_transcript_2026')).toBeInTheDocument();
    });

    // Switch to Marcus Vance (MIT Instant)
    const mitBtn = screen.getByRole('button', { name: /MIT Instant/i });
    fireEvent.click(mitBtn);

    await waitFor(() => {
      expect(screen.getAllByText('Marcus Vance').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('MV')).toBeInTheDocument();
      expect(screen.getByText('marcus.vance@mit.edu')).toBeInTheDocument();
      expect(screen.getByText('doc_mit_id_2026')).toBeInTheDocument();
    });
  });

  it('renders stored proof assets table with document handles, validity badges, formats, and sizes', () => {
    render(<VaultManager vault={vault} />);

    expect(screen.getByText('doc_stan_id_2026')).toBeInTheDocument();
    expect(screen.getByText('doc_stan_schedule_2026')).toBeInTheDocument();
    expect(screen.getByText('STUDENT_ID')).toBeInTheDocument();
    expect(screen.getByText('CLASS_SCHEDULE')).toBeInTheDocument();
    expect(screen.getByText('stanford_id_2026.png')).toBeInTheDocument();
    expect(screen.getByText('stanford_schedule_2026.pdf')).toBeInTheDocument();

    // Validity badge
    const validBadges = screen.getAllByText('Valid');
    expect(validBadges.length).toBeGreaterThanOrEqual(1);

    // Formats & sizes
    expect(screen.getByText('PNG')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText(/240 KB/i)).toBeInTheDocument();
    expect(screen.getByText(/180 KB/i)).toBeInTheDocument();
  });

  it('opens document preview modal on preview button click and allows closing it', async () => {
    render(<VaultManager vault={vault} />);

    const previewButtons = screen.getAllByRole('button', { name: /Preview/i });
    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Document Inspector')).toBeInTheDocument();
      expect(screen.getAllByText(/Claim-Check Handle:/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/doc_stan_id_2026/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Valid & Ready for Verification/i)).toBeInTheDocument();
    });

    // Close preview modal
    const closeBtn = screen.getByRole('button', { name: /Close Preview/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Document Inspector')).not.toBeInTheDocument();
    });
  });

  it('renders zero-PII security guarantee card with sandbox explanation', () => {
    render(<VaultManager vault={vault} />);

    expect(screen.getByText(/Zero-PII Claim-Check Architecture/i)).toBeInTheDocument();
    expect(screen.getByText(/Raw binaries remain sandboxed in browser/i)).toBeInTheDocument();
    expect(screen.getByText(/Local Memory Sandbox/i)).toBeInTheDocument();
    expect(screen.getByText(/Claim-Check Handles/i)).toBeInTheDocument();
    expect(screen.getByText(/Direct Pre-Signed Upload/i)).toBeInTheDocument();
  });

  it('allows adding custom documents to the vault through modal', async () => {
    render(<VaultManager vault={vault} />);

    const addDocBtn = screen.getByRole('button', { name: /Add Document/i });
    fireEvent.click(addDocBtn);

    expect(screen.getByText('Add Custom Document')).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText(/e\.g\. Official Fall 2026 Transcript/i);
    const fileNameInput = screen.getByPlaceholderText(/e\.g\. official_transcript\.pdf/i);

    fireEvent.change(titleInput, { target: { value: 'Winter 2026 Grade Report' } });
    fireEvent.change(fileNameInput, { target: { value: 'winter_grades.pdf' } });

    const submitBtn = screen.getByRole('button', { name: /Add to Vault/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Winter 2026 Grade Report')).toBeInTheDocument();
      expect(screen.getByText('winter_grades.pdf')).toBeInTheDocument();
    });
  });

  it('allows removing a document from the vault', async () => {
    render(<VaultManager vault={vault} />);

    expect(screen.getByText('doc_stan_id_2026')).toBeInTheDocument();

    const removeButtons = screen.getAllByTitle(/Remove document from vault/i);
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText('doc_stan_id_2026')).not.toBeInTheDocument();
    });
  });

  it('copies claim-check handle to clipboard when clicked', async () => {
    const writeTextMock = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<VaultManager vault={vault} />);

    const copyButtons = screen.getAllByTitle(/Click to copy claim-check handle ID/i);
    fireEvent.click(copyButtons[0]);

    expect(writeTextMock).toHaveBeenCalledWith('doc_stan_id_2026');
    await waitFor(() => {
      expect(screen.getByText(/Copied!/i)).toBeInTheDocument();
    });
  });
});
