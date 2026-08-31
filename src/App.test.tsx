import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from './App.tsx';
import { globalAgentController } from './services/agentController.ts';
import { globalMerchantStore } from './services/merchantStore.ts';
import { globalVault } from './services/vault.ts';
import { globalVerificationEngine } from './services/verificationEngine.ts';

describe('WebMCP Student Verification App', () => {
  beforeEach(() => {
    globalAgentController.reset();
    globalMerchantStore.reset();
    globalVault.switchPreset('STANFORD_VALID');
    globalVerificationEngine.reset();
  });

  it('renders application header and editorial navigation links', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('WEBMCP.COM')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '/directory' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '/vault' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '/agent' })).toBeInTheDocument();
    });
  });

  it('detects and displays WebMCP native badge', async () => {
    render(<App />);
    await waitFor(() => {
      const elements = screen.getAllByText(/WebMCP/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('renders perks directory by default matching editorial aesthetic', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/The WebMCP Directory/i);
      expect(screen.getByText(/spotify\.com/i)).toBeInTheDocument();
      expect(screen.getByText(/openai\.com/i)).toBeInTheDocument();
    });
  });

  it('switches to student vault tab and renders vault presets and documents', async () => {
    render(<App />);
    const vaultNavBtn = screen.getByRole('button', { name: '/vault' });
    fireEvent.click(vaultNavBtn);

    await waitFor(() => {
      expect(screen.getByText(/Student Identity Vault/i)).toBeInTheDocument();
      expect(screen.getByText(/Zero-PII Claim-Check Architecture/i)).toBeInTheDocument();
    });
  });

  it('switches to verification agent tab and renders agent workspace', async () => {
    render(<App />);
    const agentNavBtn = screen.getByRole('button', { name: '/agent' });
    fireEvent.click(agentNavBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Autonomous Verification Agent/i).length).toBeGreaterThan(0);
    });
  });

  it('opens authentic verification wizard when "Verify & Claim" is clicked', async () => {
    render(<App />);

    const claimButtons = screen.getAllByRole('button', { name: /Verify & Claim/i });
    expect(claimButtons.length).toBeGreaterThan(0);
    fireEvent.click(claimButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Select Your Higher Education Institution/i)).toBeInTheDocument();
    });
  });

  it('does not render ugly developer debug panels in the main user-facing directory UI', () => {
    render(<App />);
    expect(screen.queryByText(/Exposed Agent Tools/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Test In-App Runner/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Real-Time Activity Feed/i)).not.toBeInTheDocument();
  });
});
