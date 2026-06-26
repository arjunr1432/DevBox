import '@testing-library/jest-dom';
import { vi } from 'vitest';
import crypto from 'node:crypto';

// Polyfill window.crypto for jsdom environments (needed by UUID generator & Web Crypto API in PasswordManager)
if (typeof window !== 'undefined' && !window.crypto) {
  Object.defineProperty(window, 'crypto', {
    value: globalThis.crypto || (crypto as any),
    writable: true,
  });
}

// Polyfill navigator.clipboard for jsdom environments
if (typeof navigator !== 'undefined' && !navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockImplementation(() => Promise.resolve()),
    },
    writable: true,
  });
}
