import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { PasswordManager } from '../PasswordManager';

describe('PasswordManager Component', () => {
  beforeEach(() => {
    render(<PasswordManager />);
  });

  it('renders the generator header and output', () => {
    expect(screen.getByText('Password Generator')).toBeInTheDocument();
    expect(screen.getByLabelText(/length/i)).toBeInTheDocument();
  });

  it('updates the password length when the slider is adjusted', () => {
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '24' } });

    // The length text should display 24
    expect(screen.getByText('24')).toBeInTheDocument();
  });

  it('toggles character sets and regenerates password', () => {
    const numbersCheckbox = screen.getByRole('checkbox', { name: /numbers/i });
    const symbolsCheckbox = screen.getByRole('checkbox', { name: /symbols/i });

    // Toggle both off
    fireEvent.click(numbersCheckbox);
    fireEvent.click(symbolsCheckbox);

    // Click regenerate
    const regenerateBtn = screen.getByTitle('Regenerate');
    fireEvent.click(regenerateBtn);

    const passwordInput = screen.getByRole('textbox', { name: /generated password/i }) as HTMLInputElement;
    expect(passwordInput.value).not.toBe('');
  });

  it('evaluates and displays password strength', () => {
    const passwordInput = screen.getByRole('textbox', { name: /generated password/i }) as HTMLInputElement;
    expect(passwordInput.value).not.toBe('');

    // Check strength text is shown (Weak, Moderate, or Strong depending on seed)
    expect(screen.getByText(/security strength/i)).toBeInTheDocument();
  });

  it('opens the Encrypted Vault setup modal when vault header is clicked', () => {
    const vaultHeader = screen.getByText('Encrypted Vault');
    fireEvent.click(vaultHeader);

    // Since vault is not set up, it should prompt to setup or unlock
    expect(screen.getByText(/AES-256 encrypted/i)).toBeInTheDocument();
  });
});
