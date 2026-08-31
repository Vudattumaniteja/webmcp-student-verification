import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HeroBanner from './HeroBanner.tsx';

describe('HeroBanner Component', () => {
  it('renders large serif editorial headline with Student Perks accent', () => {
    render(<HeroBanner />);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/The/i)).toBeInTheDocument();
    expect(screen.getByText(/Student Perks/i)).toBeInTheDocument();
    expect(screen.getByText(/Directory\./i)).toBeInTheDocument();
  });

  it('renders subtitle matching reference design', () => {
    render(<HeroBanner />);

    expect(
      screen.getByText(/Browse verified student discounts agents and students can claim\./i),
    ).toBeInTheDocument();
  });

  it('renders stats box with offer count and university count', () => {
    render(<HeroBanner offerCount={12} universityCount="4,200+" />);

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText(/VERIFIED OFFERS/i)).toBeInTheDocument();
    expect(screen.getByText('4,200+')).toBeInTheDocument();
    expect(screen.getByText(/ACCREDITED UNIVERSITIES/i)).toBeInTheDocument();
  });

  it('renders tool mix bar with percentage breakdown and legend', () => {
    render(<HeroBanner />);

    expect(screen.getByText(/TOOL MIX/i)).toBeInTheDocument();
    expect(screen.getByText(/Answer 46%/i)).toBeInTheDocument();
    expect(screen.getByText(/Action 49%/i)).toBeInTheDocument();
    expect(screen.getByText(/Sensitive Action 5%/i)).toBeInTheDocument();
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

    const registrarBtn = screen.getByRole('button', { name: /Instant Registrar Match/i });
    fireEvent.click(registrarBtn);
    expect(handleRegistrarMatch).toHaveBeenCalledTimes(1);
  });
});
