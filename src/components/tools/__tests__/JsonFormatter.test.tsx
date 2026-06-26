import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { JsonFormatter } from '../JsonFormatter';

describe('JsonFormatter Component', () => {
  beforeEach(() => {
    render(<JsonFormatter />);
  });

  it('renders the header correctly', () => {
    expect(screen.getByText('JSON Formatter & Validator')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste raw JSON here...')).toBeInTheDocument();
  });

  it('loads sample JSON when clicking Sample button', () => {
    const sampleBtn = screen.getByRole('button', { name: /sample/i });
    fireEvent.click(sampleBtn);

    const inputArea = screen.getByPlaceholderText('Paste raw JSON here...');
    expect(inputArea.textContent).toContain('Developer Utility Box');
  });

  it('validates and formats valid JSON on Beautify', () => {
    const inputArea = screen.getByPlaceholderText('Paste raw JSON here...');
    fireEvent.change(inputArea, { target: { value: '{"name":"DevBox","active":true}' } });

    const beautifyBtn = screen.getByRole('button', { name: /beautify/i });
    fireEvent.click(beautifyBtn);

    const outputArea = screen.getByPlaceholderText('Output will appear here...');
    expect(outputArea.textContent).toBe('{\n  "name": "DevBox",\n  "active": true\n}');

    expect(screen.getByText('Valid JSON structure parsed successfully.')).toBeInTheDocument();
  });

  it('minifies JSON on Minify button click', () => {
    const inputArea = screen.getByPlaceholderText('Paste raw JSON here...');
    fireEvent.change(inputArea, { target: { value: '{\n  "name": "DevBox",\n  "active": true\n}' } });

    const minifyBtn = screen.getByRole('button', { name: /minify/i });
    fireEvent.click(minifyBtn);

    const outputArea = screen.getByPlaceholderText('Output will appear here...');
    expect(outputArea.textContent).toBe('{"name":"DevBox","active":true}');
  });

  it('shows error banner for invalid JSON input', () => {
    const inputArea = screen.getByPlaceholderText('Paste raw JSON here...');
    fireEvent.change(inputArea, { target: { value: '{"invalid_json": ' } });

    const beautifyBtn = screen.getByRole('button', { name: /beautify/i });
    fireEvent.click(beautifyBtn);

    expect(screen.getByText(/validation error/i)).toBeInTheDocument();
  });

  it('clears all text when clicking Clear button', () => {
    const inputArea = screen.getByPlaceholderText('Paste raw JSON here...');
    fireEvent.change(inputArea, { target: { value: '{"name":"DevBox"}' } });

    const beautifyBtn = screen.getByRole('button', { name: /beautify/i });
    fireEvent.click(beautifyBtn);

    const clearBtn = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearBtn);

    expect(screen.getByPlaceholderText('Paste raw JSON here...')).toHaveValue('');
    expect(screen.getByPlaceholderText('Output will appear here...')).toHaveValue('');
  });
});
