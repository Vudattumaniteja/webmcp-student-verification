import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AgentChat from './AgentChat';
import { AgentController } from '../services/agentController';
import { StudentVault } from '../services/vault';
import { VerificationEngine } from '../services/verificationEngine';
import { MerchantStore } from '../services/merchantStore';

describe('AgentChat Component', () => {
  let vault: StudentVault;
  let engine: VerificationEngine;
  let merchantStore: MerchantStore;
  let controller: AgentController;

  beforeEach(() => {
    vault = new StudentVault('STANFORD_VALID');
    engine = new VerificationEngine();
    merchantStore = new MerchantStore();
    controller = new AgentController({ vault, engine, merchantStore });
  });

  it('renders chat header, step badges, and initial greeting', () => {
    render(<AgentChat controller={controller} />);

    expect(screen.getByText(/Autonomous Verification Agent/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Search/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Details/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Vault/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Upload/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Status/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Hello! I am your Autonomous Student Verification Agent/i)).toBeInTheDocument();
  });

  it('renders HITL consent card and handles user confirmation', async () => {
    render(<AgentChat controller={controller} />);

    // Start verification requiring document upload
    await act(async () => {
      await controller.startVerification('spotify_premium');
    });

    // Consent card should be rendered
    expect(screen.getByText(/Document Upload Consent/i)).toBeInTheDocument();
    expect(screen.getAllByText(/stanford_id_2026.png/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/doc_stan_id_2026/i).length).toBeGreaterThan(0);

    const confirmBtn = screen.getByRole('button', { name: /Confirm & Stream Upload/i });
    expect(confirmBtn).toBeInTheDocument();

    // Click confirm upload button
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    // Verification should complete and show approved state
    await waitFor(() => {
      expect(screen.getByText(/Discount Promo Code/i)).toBeInTheDocument();
    });
  });

  it('renders EXPIRED_DOCUMENT recovery card and handles re-submission', async () => {
    vault.switchPreset('HARVARD_EXPIRED');
    render(<AgentChat controller={controller} />);

    // Start verification on Harvard preset
    await act(async () => {
      await controller.startVerification('aws_educate');
    });

    const confirmBtn = screen.getByRole('button', { name: /Confirm & Stream Upload/i });
    expect(confirmBtn).toBeInTheDocument();

    // Confirm initial upload of expired ID
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    // Recovery card should be rendered
    await waitFor(() => {
      expect(screen.getByText(/Autonomous Recovery Remedy/i)).toBeInTheDocument();
    });
    expect(screen.getAllByText(/EXPIRED_DOCUMENT/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/harvard_tuition_2026.pdf/i).length).toBeGreaterThan(0);

    const resubmitBtn = screen.getByRole('button', { name: /Confirm & Re-submit/i });
    expect(resubmitBtn).toBeInTheDocument();

    // Click confirm re-submit button
    await act(async () => {
      fireEvent.click(resubmitBtn);
    });

    // Re-submission should succeed and approve
    await waitFor(() => {
      expect(screen.getByText(/Autonomous recovery successful/i)).toBeInTheDocument();
    });
  });

  it('renders ILLEGIBLE_DOCUMENT recovery card and handles re-submission', async () => {
    vault.switchPreset('BERKELEY_ILLEGIBLE');
    render(<AgentChat controller={controller} />);

    // Start verification on Berkeley preset
    await act(async () => {
      await controller.startVerification('notion_education');
    });

    const confirmBtn = screen.getByRole('button', { name: /Confirm & Stream Upload/i });
    expect(confirmBtn).toBeInTheDocument();

    // Confirm initial upload of blurry ID
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    // Quality recovery card should be rendered
    await waitFor(() => {
      expect(screen.getByText(/Autonomous Recovery Remedy/i)).toBeInTheDocument();
    });
    expect(screen.getAllByText(/ILLEGIBLE_DOCUMENT/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/berkeley_transcript_2026.pdf/i).length).toBeGreaterThan(0);

    const resubmitBtn = screen.getByRole('button', { name: /Confirm & Re-submit/i });
    expect(resubmitBtn).toBeInTheDocument();

    // Click confirm re-submit
    await act(async () => {
      fireEvent.click(resubmitBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/Autonomous recovery successful/i)).toBeInTheDocument();
    });
  });

  it('allows user to send text messages in chat', async () => {
    render(<AgentChat controller={controller} />);

    const input = screen.getByPlaceholderText(/Ask agent or enter message/i);
    fireEvent.change(input, { target: { value: 'How does vault security work?' } });
    const sendBtn = screen.getByRole('button', { name: /Send/i });
    
    await act(async () => {
      fireEvent.click(sendBtn);
    });

    expect(screen.getAllByText('How does vault security work?').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Your document binaries are safely sandboxed locally/i)).toBeInTheDocument();
  });

  it('allows copying promo code from approval card', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    });

    vault.switchPreset('MIT_INSTANT');
    render(<AgentChat controller={controller} />);

    await act(async () => {
      await controller.startVerification('openai_chatgpt_plus');
    });

    const copyBtn = screen.getByRole('button', { name: /Copy Code/i });
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalled();
  });
});
