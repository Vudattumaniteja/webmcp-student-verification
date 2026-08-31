import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from './Header.tsx';

describe('Header Component', () => {
  it('renders branding with graduation cap and WebMCP Student Perks logo', () => {
    render(<Header activeTab="directory" onSelectTab={() => {}} />);
    
    expect(screen.getByText(/WebMCP/i)).toBeInTheDocument();
    expect(screen.getByText(/Student Perks/i)).toBeInTheDocument();
    expect(screen.getByTestId('blue-dot-indicator')).toBeInTheDocument();
  });

  it('renders top navigation tabs', () => {
    render(<Header activeTab="directory" onSelectTab={() => {}} />);

    expect(screen.getByRole('button', { name: /Perks Directory/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Student Vault/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /AI Agent Workspace/i })).toBeInTheDocument();
  });

  it('calls onSelectTab when clicking a navigation tab', () => {
    const handleSelect = vi.fn();
    render(<Header activeTab="directory" onSelectTab={handleSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /Student Vault/i }));
    expect(handleSelect).toHaveBeenCalledWith('vault');

    fireEvent.click(screen.getByRole('button', { name: /AI Agent Workspace/i }));
    expect(handleSelect).toHaveBeenCalledWith('agent');
  });

  it('highlights the active navigation tab', () => {
    render(<Header activeTab="agent" onSelectTab={() => {}} />);

    const activeLink = screen.getByRole('button', { name: /AI Agent Workspace/i });
    expect(activeLink).toHaveAttribute('data-active', 'true');
  });

  it('renders active student persona badge with quick vault navigation', () => {
    const handleSelect = vi.fn();
    render(
      <Header
        activeTab="directory"
        onSelectTab={handleSelect}
        activePersona={{
          name: 'Alex Chen',
          university: 'Stanford University',
          avatarInitials: 'AC',
        }}
      />,
    );

    expect(screen.getByText('Alex Chen')).toBeInTheDocument();
    expect(screen.getByText('Stanford University')).toBeInTheDocument();

    const personaBtn = screen.getByTitle(/Current Active Student Persona/i);
    fireEvent.click(personaBtn);
    expect(handleSelect).toHaveBeenCalledWith('vault');
  });

  it('displays WebMCP status badge if provided', () => {
    const { rerender } = render(<Header activeTab="directory" onSelectTab={() => {}} hasWebMCP={true} />);
    expect(screen.getAllByText(/WebMCP Active|Active/i).length).toBeGreaterThan(0);

    rerender(<Header activeTab="directory" onSelectTab={() => {}} hasWebMCP={false} />);
    expect(screen.getAllByText(/WebMCP Offline|Offline/i).length).toBeGreaterThan(0);
  });
});

