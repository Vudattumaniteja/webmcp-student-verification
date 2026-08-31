import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VaultManager from './VaultManager.tsx';
import { StudentVault } from '../services/vault.ts';

describe('VaultManager Component (Ticket #3)', () => {
  let vault: StudentVault;

  beforeEach(() => {
    vault = new StudentVault('STANFORD_VALID');
  });

  it('renders student identity profile card', () => {
    render(<VaultManager vault={vault} />);

    expect(screen.getByText(/Alex Chen/i)).toBeInTheDocument();
    expect(screen.getByText(/alex\.chen@stanford\.edu/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Stanford University/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Class of 2026/i)).toBeInTheDocument();
  });

  it('renders all 4 demo preset switcher buttons with scenarios', () => {
    render(<VaultManager vault={vault} />);

    expect(screen.getByRole('button', { name: /Stanford Valid/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Harvard Expired/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Berkeley Illegible/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /MIT Instant/i })).toBeInTheDocument();
  });

  it('switches persona when clicking a preset button', async () => {
    render(<VaultManager vault={vault} />);

    // Click Harvard Expired
    const harvardBtn = screen.getByRole('button', { name: /Harvard Expired/i });
    fireEvent.click(harvardBtn);

    await waitFor(() => {
      expect(screen.getByText('Maya Patel')).toBeInTheDocument();
      expect(screen.getByText('maya.patel@harvard.edu')).toBeInTheDocument();
      expect(screen.getByText('doc_harv_id_2024')).toBeInTheDocument();
      expect(screen.getByText('doc_harv_tuition_2026')).toBeInTheDocument();
    });
  });

  it('renders document handles with claim-check badges and validity status', () => {
    render(<VaultManager vault={vault} />);

    expect(screen.getByText('doc_stan_id_2026')).toBeInTheDocument();
    expect(screen.getByText('doc_stan_schedule_2026')).toBeInTheDocument();
    expect(screen.getAllByText(/STUDENT_ID/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/CLASS_SCHEDULE/i).length).toBeGreaterThan(0);
  });

  it('opens document preview modal on preview button click', async () => {
    render(<VaultManager vault={vault} />);

    const previewButtons = screen.getAllByRole('button', { name: /Preview/i });
    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Document Inspector/i)).toBeInTheDocument();
      expect(screen.getByText(/Claim-Check Handle:/i)).toBeInTheDocument();
    });
  });

  it('renders zero-PII security guarantee banner', () => {
    render(<VaultManager vault={vault} />);

    expect(screen.getByText(/Zero-PII Claim-Check Architecture/i)).toBeInTheDocument();
    expect(screen.getByText(/Raw binaries remain sandboxed in browser/i)).toBeInTheDocument();
  });
});
