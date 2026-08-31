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

  it('renders all 5 merchant perk cards with branding, prices, and tags', () => {
    render(<MerchantShowcase store={store} />);

    expect(screen.getByText(/OpenAI ChatGPT Plus/i)).toBeInTheDocument();
    expect(screen.getByText(/Spotify Premium Student/i)).toBeInTheDocument();
    expect(screen.getByText(/AWS Educate/i)).toBeInTheDocument();
    expect(screen.getByText(/Notion Education Plus/i)).toBeInTheDocument();
    expect(screen.getByText(/YouTube Premium Student/i)).toBeInTheDocument();

    // Verify pricing comparisons are visible
    expect(screen.getByText(/\$20\/mo/i)).toBeInTheDocument();
    expect(screen.getAllByText(/4 months free/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/\$11.99\/mo/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\$5.99\/mo/i).length).toBeGreaterThan(0);
  });

  it('renders initial UNVERIFIED state with "Claim with WebMCP" buttons', () => {
    render(<MerchantShowcase store={store} />);

    const claimButtons = screen.getAllByRole('button', { name: /Claim with WebMCP/i });
    expect(claimButtons).toHaveLength(5);
  });

  it('triggers onClaim callback or updates store status when Claim button is clicked', async () => {
    const onClaimMock = vi.fn();
    render(<MerchantShowcase store={store} onClaim={onClaimMock} />);

    const claimButtons = screen.getAllByRole('button', { name: /Claim with WebMCP/i });
    fireEvent.click(claimButtons[0]);

    expect(onClaimMock).toHaveBeenCalledWith('openai_chatgpt_plus');
  });

  it('displays VERIFYING status with active spinner / step indicator', () => {
    store.updateMerchantStatus('spotify_premium', 'VERIFYING');

    render(<MerchantShowcase store={store} />);

    const verifyingElements = screen.getAllByText(/Verifying with WebMCP/i);
    expect(verifyingElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/Vault Handshake/i)).toBeInTheDocument();
  });

  it('displays APPROVED status with unlocked reward code, discount badge, and one-click copy', async () => {
    store.updateMerchantStatus('spotify_premium', 'APPROVED', 'EDU-SPOTIFY-8X29K');

    render(<MerchantShowcase store={store} />);

    expect(screen.getByText('EDU-SPOTIFY-8X29K')).toBeInTheDocument();
    expect(screen.getAllByText(/Approved/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Discount Applied/i)).toBeInTheDocument();

    // Test copy to clipboard
    const copyButton = screen.getByRole('button', { name: /Copy Code/i });
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('EDU-SPOTIFY-8X29K');

    await waitFor(() => {
      expect(screen.getByText(/Copied!/i)).toBeInTheDocument();
    });
  });

  it('displays ERROR / ACTION_NEEDED status with error message and retry button', () => {
    const onRetryMock = vi.fn();
    store.updateMerchantStatus(
      'aws_educate',
      'ERROR',
      undefined,
      'Expired student ID detected. Please update vault document.',
    );

    render(<MerchantShowcase store={store} onRetry={onRetryMock} />);

    expect(screen.getByText(/Expired student ID detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Action Needed/i)).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /Retry Verification/i });
    fireEvent.click(retryButton);

    expect(onRetryMock).toHaveBeenCalledWith('aws_educate');
  });

  it('renders independent verification statuses simultaneously across multiple cards', () => {
    store.updateMerchantStatus('openai_chatgpt_plus', 'VERIFYING');
    store.updateMerchantStatus('spotify_premium', 'APPROVED', 'EDU-SPOTIFY-8X29K');
    store.updateMerchantStatus('aws_educate', 'ERROR', undefined, 'Illegible image');
    // notion and youtube remain UNVERIFIED

    render(<MerchantShowcase store={store} />);

    expect(screen.getAllByText(/Verifying with WebMCP/i).length).toBeGreaterThan(0);
    expect(screen.getByText('EDU-SPOTIFY-8X29K')).toBeInTheDocument();
    expect(screen.getByText(/Illegible image/i)).toBeInTheDocument();

    const claimButtons = screen.getAllByRole('button', { name: /Claim with WebMCP/i });
    expect(claimButtons).toHaveLength(2); // for notion and youtube
  });

  it('allows filtering by category', () => {
    render(<MerchantShowcase store={store} />);

    const filterButton = screen.getByRole('button', { name: 'Cloud & DevOps' });
    fireEvent.click(filterButton);

    expect(screen.getByText(/AWS Educate/i)).toBeInTheDocument();
    expect(screen.queryByText(/Spotify Premium/i)).not.toBeInTheDocument();
  });
});
