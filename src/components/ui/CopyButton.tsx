import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  className?: string;
  label?: string;
  style?: React.CSSProperties;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ text, className = '', label, style = {} }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`btn btn-secondary ${className}`}
      disabled={!text}
      title="Copy to clipboard"
      style={{ padding: '8px 12px', minWidth: label ? 'auto' : '40px', ...style }}
    >
      {copied ? (
        <Check size={16} className="text-success" style={{ color: 'var(--success)' }} />
      ) : (
        <Copy size={16} />
      )}
      {label && <span style={{ marginLeft: '6px' }}>{copied ? 'Copied' : label}</span>}
    </button>
  );
};
