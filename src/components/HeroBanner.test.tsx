import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HeroBanner from './HeroBanner.tsx';

describe('HeroBanner Component', () => {
  it('renders large serif editorial headline with Student Perks and Instantly Verified accent', () => {
    render(<HeroBanner />);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Every Student Perk,/i)).toBeInTheDocument();
    expect(screen.getByText(/Instantly Verified\./i)).toBeInTheDocument();
  });

  it('renders subtitle explaining zero-PII student perks verification', () => {
    render(<HeroBanner />);

    expect(
      screen.getByText(/Browse and claim educational discounts across AI tools, streaming, and cloud services/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Your academic identity stays securely sandboxed in your browser/i),
    ).toBeInTheDocument();
  });

  it('renders stats badges for offers, university presets, and zero-PII architecture', () => {
    render(<HeroBanner offerCount={8} />);

    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText(/Student Offers Available/i)).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText(/University Presets \(Stanford, Harvard, Berkeley, MIT\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Zero-PII Claim-Check Architecture/i)).toBeInTheDocument();
    expect(screen.getByText(/Instant Registrar Match Enabled/i)).toBeInTheDocument();
  });

  it('triggers CTA callbacks when buttons are clicked', () => {
    const handleOpenVault = vi.fn();
    const handleRegistrarMatch = vi.fn();

    render(
      <HeroBanner
        onOpenVault={handleOpenVault}
        onRegistrarMatch={handleRegistrarMatch}
      />,
    );

    const vaultBtn = screen.getByRole('button', { name: /Open Student Vault/i });
    fireEvent.click(vaultBtn);
    expect(handleOpenVault).toHaveBeenCalledTimes(1);

    const registrarBtn = screen.getByRole('button', { name: /Instant Registrar Match Enabled/i });
    fireEvent.click(registrarBtn);
    expect(handleRegistrarMatch).toHaveBeenCalledTimes(1);
  });
});

