import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FAQSection from './FAQSection.tsx';

describe('FAQSection Component', () => {
  it('renders section title and frequently asked label', () => {
    render(<FAQSection />);

    expect(screen.getByText(/FREQUENTLY ASKED/i)).toBeInTheDocument();
  });

  it('renders all four required questions', () => {
    render(<FAQSection />);

    expect(screen.getByText('What is WebMCP?')).toBeInTheDocument();
    expect(screen.getByText('How does zero-PII verification work?')).toBeInTheDocument();
    expect(screen.getByText('How do pre-signed S3 uploads work?')).toBeInTheDocument();
    expect(screen.getByText('Can AI agents automate verification?')).toBeInTheDocument();
  });

  it('expands and collapses FAQ answer when clicked', () => {
    render(<FAQSection />);

    const questionBtn = screen.getByRole('button', { name: /What is WebMCP\?/i });
    
    // Initially content might be collapsed or hidden
    fireEvent.click(questionBtn);
    expect(
      screen.getByText(/Web Model Context Protocol \(WebMCP\) allows web applications to register structured tools/i),
    ).toBeInTheDocument();

    // Clicking again collapses
    fireEvent.click(questionBtn);
    expect(
      screen.queryByText(/Web Model Context Protocol \(WebMCP\) allows web applications to register structured tools/i),
    ).not.toBeInTheDocument();
  });

  it('toggles zero-PII verification answer', () => {
    render(<FAQSection />);

    const questionBtn = screen.getByRole('button', { name: /How does zero-PII verification work\?/i });
    fireEvent.click(questionBtn);

    expect(
      screen.getByText(/The Student Vault stores sensitive academic documents locally in your browser sandbox/i),
    ).toBeInTheDocument();
  });

  it('toggles pre-signed S3 upload and automation answers', () => {
    render(<FAQSection />);

    const s3Btn = screen.getByRole('button', { name: /How do pre-signed S3 uploads work\?/i });
    fireEvent.click(s3Btn);
    expect(screen.getByText(/pre-signed S3 upload URL/i)).toBeInTheDocument();

    const agentBtn = screen.getByRole('button', { name: /Can AI agents automate verification\?/i });
    fireEvent.click(agentBtn);
    expect(screen.getByText(/Autonomous browser agents query registered WebMCP tools/i)).toBeInTheDocument();
  });
});
