import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App.tsx';

describe('WebMCP Architecture Studio App', () => {
  it('renders application header and branding', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('WebMCP Architecture Studio')).toBeInTheDocument();
    });
  });

  it('detects and displays WebMCP status badge', async () => {
    render(<App />);
    await waitFor(() => {
      const elements = screen.getAllByText(/WebMCP/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('renders quick action buttons', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Security Audit')).toBeInTheDocument();
      expect(screen.getByText('Terraform')).toBeInTheDocument();
    });
  });

  it('renders registered tools list', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Exposed Agent Tools/i)).toBeInTheDocument();
    });
  });
});
