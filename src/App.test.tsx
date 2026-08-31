import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from './App.tsx';

describe('WebMCP Student Identity & Architecture Studio App', () => {
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

  it('renders student document vault tab by default', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Zero-PII Claim-Check Architecture/i)).toBeInTheDocument();
      expect(screen.getByText(/Interactive Demo Student Presets/i)).toBeInTheDocument();
    });
  });

  it('switches to architecture canvas tab and renders quick actions', async () => {
    render(<App />);
    const canvasTab = screen.getByRole('button', { name: /Architecture Canvas/i });
    fireEvent.click(canvasTab);

    await waitFor(() => {
      expect(screen.getByText('Security Audit')).toBeInTheDocument();
      expect(screen.getByText('Terraform')).toBeInTheDocument();
    });
  });

  it('renders registered tools list including verification and vault tools', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Exposed Agent Tools/i)).toBeInTheDocument();
      expect(screen.getByText('search_school')).toBeInTheDocument();
      expect(screen.getByText('submit_student_verification')).toBeInTheDocument();
      expect(screen.getByText('upload_vault_document')).toBeInTheDocument();
      expect(screen.getByText('check_verification_status')).toBeInTheDocument();
      expect(screen.getByText('get_student_vault_profile')).toBeInTheDocument();
      expect(screen.getAllByText('list_vault_documents').length).toBeGreaterThan(0);
      expect(screen.getByText('switch_demo_preset')).toBeInTheDocument();
    });
  });
});
