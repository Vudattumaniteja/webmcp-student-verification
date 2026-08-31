import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App.tsx';

describe('WebMCP Studio App Component', () => {
  it('renders app header and title', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('WebMCP Studio')).toBeInTheDocument();
    });
  });

  it('detects and displays WebMCP active state when polyfilled or enabled', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('WebMCP Active')).toBeInTheDocument();
    });
  });

  it('displays activity log section', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Activity Log')).toBeInTheDocument();
    });
  });
});
