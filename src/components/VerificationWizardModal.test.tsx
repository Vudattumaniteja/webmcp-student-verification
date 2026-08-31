import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VerificationWizardModal from './VerificationWizardModal';
import { MerchantStore } from '../services/merchantStore';
import { StudentVault } from '../services/vault';
import { VerificationEngine } from '../services/verificationEngine';
import { MerchantPerk } from '../types/merchants';

describe('VerificationWizardModal Component', () => {
  let store: MerchantStore;
  let vault: StudentVault;
  let engine: VerificationEngine;
  let testMerchant: MerchantPerk;

  beforeEach(() => {
    store = new MerchantStore();
    vault = new StudentVault('STANFORD_VALID');
    engine = new VerificationEngine();
    testMerchant = store.getMerchant('spotify_premium')!;

    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders modal with merchant info and step 1 university selection', () => {
    render(
      <VerificationWizardModal
        merchant={testMerchant}
        isOpen={true}
        onClose={vi.fn()}
        store={store}
        vault={vault}
        engine={engine}
      />,
    );

    expect(screen.getByText(/Spotify Premium Student/i)).toBeInTheDocument();
    expect(screen.getByText(/Select Your Higher Education Institution/i)).toBeInTheDocument();
    expect(screen.getByText(/SheerID & WebMCP/i)).toBeInTheDocument();
  });

  it('autocompletes universities (Stanford, Harvard, UC Berkeley, MIT) and shows MIT Instant Match badge', () => {
    render(
      <VerificationWizardModal
        merchant={testMerchant}
        isOpen={true}
        onClose={vi.fn()}
        store={store}
        vault={vault}
        engine={engine}
      />,
    );

    // Check quick pick buttons
    expect(screen.getByRole('button', { name: /MIT/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Stanford/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Harvard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /UC Berkeley/i })).toBeInTheDocument();

    // Verify search autocomplete
    const searchInput = screen.getByPlaceholderText(/Type university name/i);
    fireEvent.change(searchInput, { target: { value: 'MIT' } });

    expect(screen.getByText(/Massachusetts Institute of Technology/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Instant Match Eligible/i).length).toBeGreaterThan(0);
  });

  it('navigates to step 2 and supports Auto-fill from Vault', async () => {
    render(
      <VerificationWizardModal
        merchant={testMerchant}
        isOpen={true}
        onClose={vi.fn()}
        store={store}
        vault={vault}
        engine={engine}
      />,
    );

    // Proceed to Step 2
    const continueBtn = screen.getByRole('button', { name: /Continue to Student Info/i });
    fireEvent.click(continueBtn);

    expect(screen.getByText(/Verify Your Student Identity/i)).toBeInTheDocument();

    // Click Auto-fill from Vault
    const autofillButtons = screen.getAllByRole('button', { name: /Auto-fill from Vault/i });
    fireEvent.click(autofillButtons[0]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Alex')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Chen')).toBeInTheDocument();
      expect(screen.getByDisplayValue('alex.chen@stanford.edu')).toBeInTheDocument();
    });
  });

  it('performs MIT Instant Match directly to Step 4 Unlocked Reward screen', async () => {
    vault.switchPreset('MIT_INSTANT');

    render(
      <VerificationWizardModal
        merchant={testMerchant}
        isOpen={true}
        onClose={vi.fn()}
        store={store}
        vault={vault}
        engine={engine}
      />,
    );

    // Step 1: Select MIT
    const mitBtn = screen.getByRole('button', { name: /MIT/i });
    fireEvent.click(mitBtn);

    const continueBtn = screen.getByRole('button', { name: /Continue to Student Info/i });
    fireEvent.click(continueBtn);

    // Step 2: Auto-fill from MIT vault persona
    const autofillBtn = screen.getAllByRole('button', { name: /Auto-fill from Vault/i })[0];
    fireEvent.click(autofillBtn);

    // Submit details
    const submitBtn = screen.getByRole('button', { name: /Submit & Verify/i });
    fireEvent.click(submitBtn);

    // Should immediately transition to Step 4 without document upload
    await waitFor(() => {
      expect(screen.getByText(/Your Student Perk is Unlocked!/i)).toBeInTheDocument();
      expect(screen.getByText(/Student Verification Approved/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Copy Code/i })).toBeInTheDocument();
    });

    // Check store updated to APPROVED
    expect(store.getMerchant('spotify_premium')?.status).toBe('APPROVED');
  });

  it('allows document selection from vault and uploads proof for standard flow', async () => {
    vault.switchPreset('STANFORD_VALID');

    render(
      <VerificationWizardModal
        merchant={testMerchant}
        isOpen={true}
        onClose={vi.fn()}
        store={store}
        vault={vault}
        engine={engine}
      />,
    );

    // Proceed to Step 2
    const continueBtn = screen.getByRole('button', { name: /Continue to Student Info/i });
    fireEvent.click(continueBtn);

    // Submit details -> goes to Step 3 Document Proof
    const submitBtn = screen.getByRole('button', { name: /Submit & Verify/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Upload Proof of Enrollment/i)).toBeInTheDocument();
      expect(screen.getByText(/Stanford Student ID Card/i)).toBeInTheDocument();
    });

    // Submit valid document
    const submitDocBtn = screen.getByRole('button', { name: /Submit Proof Document/i });
    fireEvent.click(submitDocBtn);

    // Verify approval and reward code screen
    await waitFor(
      () => {
        expect(screen.getByText(/Your Student Perk is Unlocked!/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('handles EXPIRED_DOCUMENT with recovery alert and 1-click tuition receipt re-verification', async () => {
    vault.switchPreset('HARVARD_EXPIRED');

    render(
      <VerificationWizardModal
        merchant={testMerchant}
        isOpen={true}
        onClose={vi.fn()}
        store={store}
        vault={vault}
        engine={engine}
      />,
    );

    // Step 1: Select Harvard
    const harvardBtn = screen.getByRole('button', { name: /Harvard/i });
    fireEvent.click(harvardBtn);

    const continueBtn = screen.getByRole('button', { name: /Continue to Student Info/i });
    fireEvent.click(continueBtn);

    // Step 2: Auto-fill and submit
    const autofillBtn = screen.getAllByRole('button', { name: /Auto-fill from Vault/i })[0];
    fireEvent.click(autofillBtn);

    const submitBtn = screen.getByRole('button', { name: /Submit & Verify/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Upload Proof of Enrollment/i)).toBeInTheDocument();
      expect(screen.getByText(/Harvard Student ID \(Expired 2023-2024\)/i)).toBeInTheDocument();
    });

    // Upload the expired ID
    const submitDocBtn = screen.getByRole('button', { name: /Submit Proof Document/i });
    fireEvent.click(submitDocBtn);

    // Expect EXPIRED_DOCUMENT rejection alert with recovery button
    await waitFor(
      () => {
        expect(screen.getByText(/Verification Issue: EXPIRED_DOCUMENT/i)).toBeInTheDocument();
        expect(screen.getByText(/Your student ID is expired/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Re-verify with Tuition Receipt/i })).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // 1-Click Recovery: Click Re-verify with Tuition Receipt
    const recoveryBtn = screen.getByRole('button', { name: /Re-verify with Tuition Receipt/i });
    fireEvent.click(recoveryBtn);

    // Should succeed and unlock reward
    await waitFor(
      () => {
        expect(screen.getByText(/Your Student Perk is Unlocked!/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('handles ILLEGIBLE_DOCUMENT with recovery alert and 1-click transcript re-verification', async () => {
    vault.switchPreset('BERKELEY_ILLEGIBLE');

    render(
      <VerificationWizardModal
        merchant={testMerchant}
        isOpen={true}
        onClose={vi.fn()}
        store={store}
        vault={vault}
        engine={engine}
      />,
    );

    // Step 1: Select UC Berkeley
    const berkeleyBtn = screen.getByRole('button', { name: /UC Berkeley/i });
    fireEvent.click(berkeleyBtn);

    const continueBtn = screen.getByRole('button', { name: /Continue to Student Info/i });
    fireEvent.click(continueBtn);

    // Step 2: Auto-fill and submit
    const autofillBtn = screen.getAllByRole('button', { name: /Auto-fill from Vault/i })[0];
    fireEvent.click(autofillBtn);

    const submitBtn = screen.getByRole('button', { name: /Submit & Verify/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Upload Proof of Enrollment/i)).toBeInTheDocument();
      expect(screen.getByText(/Cal 1 Card \(Low-Res Blurry Photo\)/i)).toBeInTheDocument();
    });

    // Upload blurry ID
    const submitDocBtn = screen.getByRole('button', { name: /Submit Proof Document/i });
    fireEvent.click(submitDocBtn);

    // Expect ILLEGIBLE_DOCUMENT rejection alert with recovery button
    await waitFor(
      () => {
        expect(screen.getByText(/Verification Issue: ILLEGIBLE_DOCUMENT/i)).toBeInTheDocument();
        expect(screen.getByText(/Image resolution too low/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Re-verify with Transcript/i })).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // 1-Click Recovery: Click Re-verify with Transcript
    const recoveryBtn = screen.getByRole('button', { name: /Re-verify with Transcript/i });
    fireEvent.click(recoveryBtn);

    // Should succeed and unlock reward
    await waitFor(
      () => {
        expect(screen.getByText(/Your Student Perk is Unlocked!/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('allows copying promo code and linking to checkout in Step 4', async () => {
    store.updateMerchantStatus('spotify_premium', 'APPROVED', 'EDU-SPOTIFY-8X29K');
    const approvedMerchant = store.getMerchant('spotify_premium')!;

    render(
      <VerificationWizardModal
        merchant={approvedMerchant}
        isOpen={true}
        onClose={vi.fn()}
        store={store}
        vault={vault}
        engine={engine}
      />,
    );

    expect(screen.getByText('EDU-SPOTIFY-8X29K')).toBeInTheDocument();

    const copyBtn = screen.getByRole('button', { name: /Copy Code/i });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('EDU-SPOTIFY-8X29K');
    await waitFor(() => {
      expect(screen.getByText(/Copied!/i)).toBeInTheDocument();
    });

    const checkoutLink = screen.getByRole('link', { name: /Apply at Checkout/i });
    expect(checkoutLink).toHaveAttribute('href', expect.stringContaining('spotify.com'));
  });
});
