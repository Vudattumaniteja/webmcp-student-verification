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

  it('renders application header and branding', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('WebMCP Student Verification')).toBeInTheDocument();
      expect(screen.getByText(/Student Identity Vault, Multi-Merchant Perks & Autonomous Verification Suite/i)).toBeInTheDocument();
    });
  });

  it('detects and displays WebMCP status badge', async () => {
    render(<App />);
    await waitFor(() => {
      const elements = screen.getAllByText(/WebMCP/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('renders student document vault tab by default', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Zero-PII Claim-Check Architecture/i)).toBeInTheDocument();
      expect(screen.getByText(/Interactive Demo Student Presets/i)).toBeInTheDocument();
    });
  });

  it('switches to perks showcase tab and renders merchant perk cards', async () => {
    render(<App />);
    const perksTab = screen.getByRole('button', { name: /Perks Showcase/i });
    fireEvent.click(perksTab);

    await waitFor(() => {
      expect(screen.getByText(/Multi-Merchant Student Perks Hub/i)).toBeInTheDocument();
      expect(screen.getByText(/OpenAI ChatGPT Plus/i)).toBeInTheDocument();
      expect(screen.getByText(/Spotify Premium Student/i)).toBeInTheDocument();
      expect(screen.getByText(/AWS Educate/i)).toBeInTheDocument();
    });
  });

  it('switches to verification agent tab and renders agent workspace', async () => {
    render(<App />);
    const agentTab = screen.getByRole('button', { name: /Verification Agent/i });
    fireEvent.click(agentTab);

    await waitFor(() => {
      expect(screen.getAllByText(/Autonomous Verification Agent/i).length).toBeGreaterThan(0);
    });
  });

  it('connects Claim with WebMCP button on merchant card to autonomous agent', async () => {
    render(<App />);
    const perksTab = screen.getByRole('button', { name: /Perks Showcase/i });
    fireEvent.click(perksTab);

    await waitFor(() => {
      expect(screen.getByText(/Multi-Merchant Student Perks Hub/i)).toBeInTheDocument();
    });

    const claimButtons = screen.getAllByRole('button', { name: /Claim with WebMCP/i });
    expect(claimButtons.length).toBeGreaterThan(0);
    fireEvent.click(claimButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByText(/Starting automated student verification/i).length).toBeGreaterThan(0);
    });
  });

  it('renders registered tools list including verification and vault tools', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Exposed Agent Tools/i)).toBeInTheDocument();
      expect(screen.getAllByText('search_school').length).toBeGreaterThan(0);
      expect(screen.getAllByText('submit_student_verification').length).toBeGreaterThan(0);
      expect(screen.getAllByText('upload_vault_document').length).toBeGreaterThan(0);
      expect(screen.getAllByText('check_verification_status').length).toBeGreaterThan(0);
      expect(screen.getAllByText('get_student_vault_profile').length).toBeGreaterThan(0);
      expect(screen.getAllByText('list_vault_documents').length).toBeGreaterThan(0);
      expect(screen.getAllByText('switch_demo_preset').length).toBeGreaterThan(0);
    });
  });

  it('executes tool in test runner and logs to activity feed', async () => {
    render(<App />);
    const executeBtn = screen.getByRole('button', { name: /Execute Tool/i });
    fireEvent.click(executeBtn);

    await waitFor(() => {
      expect(screen.getByText(/Real-Time Activity Feed/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Executing tool test/i).length).toBeGreaterThan(0);
    });
  });
});
