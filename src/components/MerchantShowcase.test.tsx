import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MerchantShowcase from './MerchantShowcase';
import { MerchantStore } from '../services/merchantStore';

describe('MerchantShowcase Component', () => {
  let store: MerchantStore;

  beforeEach(() => {
    store = new MerchantStore();
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders editorial directory header, stats card, and merchant directory rows', () => {
    render(<MerchantShowcase store={store} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/The WebMCP Directory/i);
    expect(screen.getByText(/Browse verified student perks & websites agents can use\./i)).toBeInTheDocument();

    // Verify key merchant names and domains from the requirements
    expect(screen.getByText(/spotify\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/openai\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/youtube\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/aws\.amazon\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/notion\.so/i)).toBeInTheDocument();
    expect(screen.getByText(/github\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/figma\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/jetbrains\.com/i)).toBeInTheDocument();

    // Verify pricing comparisons
    expect(screen.getAllByText(/\$20\/mo/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/4 months free/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$11.99\/mo/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$5.99\/mo/i).length).toBeGreaterThan(0);
  });

  it('renders initial UNVERIFIED state with "Verify & Claim" buttons', () => {
    render(<MerchantShowcase store={store} />);

    const claimButtons = screen.getAllByRole('button', { name: /Verify & Claim/i });
    expect(claimButtons.length).toBeGreaterThanOrEqual(5);
  });

  it('triggers verification modal when "Verify & Claim" button is clicked', async () => {
    const onClaimMock = vi.fn();
    render(<MerchantShowcase store={store} onClaim={onClaimMock} />);

    const claimButtons = screen.getAllByRole('button', { name: /Verify & Claim/i });
    fireEvent.click(claimButtons[0]);

    // Modal opens
    await waitFor(() => {
      expect(screen.getByText(/Select Your Higher Education Institution/i)).toBeInTheDocument();
    });

    expect(onClaimMock).toHaveBeenCalled();
  });

  it('filters merchant directory by category count pills', () => {
    render(<MerchantShowcase store={store} />);

    // Click CLOUD & INFRA filter
    const cloudFilter = screen.getByRole('button', { name: /CLOUD & INFRA/i });
    fireEvent.click(cloudFilter);

    expect(screen.getByText(/aws\.amazon\.com/i)).toBeInTheDocument();
    expect(screen.queryByText(/spotify\.com/i)).not.toBeInTheDocument();

    // Click MUSIC & STREAMING filter
    const musicFilter = screen.getByRole('button', { name: /MUSIC & STREAMING/i });
    fireEvent.click(musicFilter);

    expect(screen.getByText(/spotify\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/youtube\.com/i)).toBeInTheDocument();
    expect(screen.queryByText(/aws\.amazon\.com/i)).not.toBeInTheDocument();
  });

  it('filters merchant directory using the search input', () => {
    render(<MerchantShowcase store={store} />);

    const searchInput = screen.getByPlaceholderText(/Search sites, tools, or categories/i);
    fireEvent.change(searchInput, { target: { value: 'figma' } });

    expect(screen.getByText(/figma\.com/i)).toBeInTheDocument();
    expect(screen.queryByText(/spotify\.com/i)).not.toBeInTheDocument();
  });

  it('displays APPROVED status with unlocked reward code, discount badge, and one-click copy', async () => {
    store.updateMerchantStatus('spotify_premium', 'APPROVED', 'EDU-SPOTIFY-8X29K');

    render(<MerchantShowcase store={store} />);

    expect(screen.getByText('EDU-SPOTIFY-8X29K')).toBeInTheDocument();
    expect(screen.getAllByText(/APPROVED/i).length).toBeGreaterThan(0);

    // Test copy to clipboard
    const copyButton = screen.getByRole('button', { name: /Copy Code/i });
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('EDU-SPOTIFY-8X29K');

    await waitFor(() => {
      expect(screen.getByText(/Copied!/i)).toBeInTheDocument();
    });
  });

  it('displays ACTION NEEDED status with retry button', () => {
    store.updateMerchantStatus(
      'aws_educate',
      'ERROR',
      undefined,
      'Expired student ID detected. Please update vault document.',
    );

    render(<MerchantShowcase store={store} />);

    expect(screen.getByText(/ACTION NEEDED/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry Verification/i })).toBeInTheDocument();
  });

  it('renders FAQ and API For Agents sections matching editorial spec', () => {
    render(<MerchantShowcase store={store} />);

    expect(screen.getByText(/— FREQUENTLY ASKED/i)).toBeInTheDocument();
    expect(screen.getByText(/What is WebMCP Student Verification\?/i)).toBeInTheDocument();
    expect(screen.getByText(/— API FOR AGENTS/i)).toBeInTheDocument();
    expect(screen.getByText(/GET \/api\/v1\/lookup\?url=\.\.\./i)).toBeInTheDocument();

    // Test expanding FAQ accordion
    const faqBtn = screen.getByRole('button', { name: /What is WebMCP Student Verification\?/i });
    fireEvent.click(faqBtn);

    expect(screen.getByText(/zero-PII student discount protocol/i)).toBeInTheDocument();
  });
});
