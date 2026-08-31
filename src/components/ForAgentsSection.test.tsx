import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ForAgentsSection from './ForAgentsSection.tsx';

describe('ForAgentsSection Component', () => {
  it('renders section title and API for agents header', () => {
    render(<ForAgentsSection />);

    expect(screen.getByRole('heading', { name: /For Agents/i })).toBeInTheDocument();
    expect(screen.getByText(/API FOR AGENTS/i)).toBeInTheDocument();
    expect(screen.getByText(/Full API docs/i)).toBeInTheDocument();
  });

  it('renders API description text', () => {
    render(<ForAgentsSection />);

    expect(
      screen.getByText(/Query the directory programmatically/i),
    ).toBeInTheDocument();
  });

  it('renders standard WebMCP REST API endpoints', () => {
    render(<ForAgentsSection />);

    expect(screen.getByText('/api/v1/lookup?url=...')).toBeInTheDocument();
    expect(screen.getByText('Does this URL expose WebMCP?')).toBeInTheDocument();

    expect(screen.getByText('/api/v1/sites?type=live')).toBeInTheDocument();
    expect(screen.getByText('List live WebMCP sites')).toBeInTheDocument();

    expect(screen.getByText('/api/v1/sites/{host}')).toBeInTheDocument();
    expect(screen.getByText("One site's full capabilities")).toBeInTheDocument();

    expect(screen.getByText('/api/v1/stats')).toBeInTheDocument();
    expect(screen.getByText('Directory-wide counts + top sites')).toBeInTheDocument();
  });

  it('renders OpenAPI spec reference line', () => {
    render(<ForAgentsSection />);

    expect(screen.getByText(/OpenAPI 3\.1 spec at/i)).toBeInTheDocument();
    expect(screen.getByText(/\/api\/openapi\.json/i)).toBeInTheDocument();
    expect(screen.getByText(/\/api-docs/i)).toBeInTheDocument();
  });

  it('renders WebMCP in-browser tool invocation snippet and schema inspector', () => {
    render(<ForAgentsSection />);

    expect(screen.getAllByText(/Browser WebMCP Tool Invocation/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/document\.modelContext/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/submit_student_verification/i)).toBeInTheDocument();
  });

  it('supports copying JavaScript code snippet to clipboard', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<ForAgentsSection />);

    const copyBtn = screen.getByRole('button', { name: /Copy Code/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(writeTextMock).toHaveBeenCalled();
  });
});
