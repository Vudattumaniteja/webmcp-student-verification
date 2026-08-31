import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from './Header.tsx';

describe('Header Component', () => {
  it('renders branding with blue dot and WEBMCP.STUDENT logo', () => {
    render(<Header activeTab="directory" onSelectTab={() => {}} />);
    
    expect(screen.getByText(/WEBMCP\.STUDENT/i)).toBeInTheDocument();
    expect(screen.getByTestId('blue-dot-indicator')).toBeInTheDocument();
  });

  it('renders top navigation links with slashes', () => {
    render(<Header activeTab="directory" onSelectTab={() => {}} />);

    expect(screen.getByRole('button', { name: /\/directory/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\/vault/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\/agent/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\/faq/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\/for-agents/i })).toBeInTheDocument();
  });

  it('calls onSelectTab when clicking a navigation link', () => {
    const handleSelect = vi.fn();
    render(<Header activeTab="directory" onSelectTab={handleSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /\/vault/i }));
    expect(handleSelect).toHaveBeenCalledWith('vault');

    fireEvent.click(screen.getByRole('button', { name: /\/faq/i }));
    expect(handleSelect).toHaveBeenCalledWith('faq');
  });

  it('highlights the active navigation tab', () => {
    render(<Header activeTab="agent" onSelectTab={() => {}} />);

    const activeLink = screen.getByRole('button', { name: /\/agent/i });
    expect(activeLink).toHaveAttribute('data-active', 'true');
  });

  it('displays WebMCP status badge if provided', () => {
    const { rerender } = render(<Header activeTab="directory" onSelectTab={() => {}} hasWebMCP={true} />);
    expect(screen.getByText(/WebMCP Active/i)).toBeInTheDocument();

    rerender(<Header activeTab="directory" onSelectTab={() => {}} hasWebMCP={false} />);
    expect(screen.getByText(/WebMCP Offline/i)).toBeInTheDocument();
  });
});
