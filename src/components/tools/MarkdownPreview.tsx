import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import { CopyButton } from '../ui/CopyButton';
import { Trash2, Edit3, Eye, Columns } from 'lucide-react';

export const MarkdownPreview: React.FC = () => {
  const [markdown, setMarkdown] = useState('# 📝 Live Markdown Previewer\n\nEdit this markdown on the left to see it rendered instantly on the right.\n\n## Core Features\n- Live compiling\n- HTML copy exports\n- Split pane, full editor, or full preview options\n\n### Code Blocks\n```javascript\nfunction greet(name) {\n  console.log("Hello, " + name + "!");\n}\ngreet("DevBox User");\n```\n\n> "Simplicity is the ultimate sophistication." — Leonardo da Vinci\n\nTo learn more, check out [GitHub Markdown Guide](https://guides.github.com/features/mastering-markdown/).');
  const [html, setHtml] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');

  useEffect(() => {
    try {
      // Configure marked option to handle line breaks nicely
      marked.setOptions({
        breaks: true,
        gfm: true
      });
      const parsed = marked.parse(markdown);
      setHtml(String(parsed));
    } catch (err) {
      console.error(err);
      setHtml('<p style="color:var(--error);">Failed to parse markdown.</p>');
    }
  }, [markdown]);

  const handleClear = () => {
    setMarkdown('');
    setHtml('');
  };

  const handleLoadSample = () => {
    const sample = `# Sample Document\n\n## Checklist\n- [x] Initial design\n- [/] Developing tools\n- [ ] Release production builds\n\n### Formatting Elements\n**Bold Text** and *Italic Text* are supported.\n\n### Table Example\n\n| Item | Description | Price |\n| --- | --- | --- |\n| DevBox App | Premium utilities | Free |\n| Electron | Desktop engine | Open Source |\n`;
    setMarkdown(sample);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="tool-header">
        <h1>Live Markdown Previewer</h1>
        <p>Compose Markdown on the fly and preview the formatted HTML output instantly with standard markup styles.</p>
      </div>

      <div className="tool-card" style={{ gap: '16px' }}>
        {/* Toggle Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${viewMode === 'split' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('split')}
              style={{ padding: '8px 12px' }}
              title="Split View"
            >
              <Columns size={14} />
              <span style={{ marginLeft: '4px' }}>Split</span>
            </button>
            <button
              className={`btn ${viewMode === 'editor' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('editor')}
              style={{ padding: '8px 12px' }}
              title="Editor Only"
            >
              <Edit3 size={14} />
              <span style={{ marginLeft: '4px' }}>Editor</span>
            </button>
            <button
              className={`btn ${viewMode === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('preview')}
              style={{ padding: '8px 12px' }}
              title="Preview Only"
            >
              <Eye size={14} />
              <span style={{ marginLeft: '4px' }}>Preview</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={handleLoadSample}>
              Load Sample
            </button>
            <button className="btn btn-secondary" onClick={handleClear}>
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
            <CopyButton text={html} label="Copy HTML" />
          </div>
        </div>

        {/* Editor Split Area */}
        <div style={{ display: 'flex', flexGrow: 1, minHeight: '350px', gap: '16px', overflow: 'hidden' }}>
          {/* Editor Column */}
          {(viewMode === 'split' || viewMode === 'editor') && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Markdown Editor</label>
              <textarea
                className="textarea-control"
                placeholder="Write Markdown syntax here..."
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                style={{ flexGrow: 1, resize: 'none', height: '100%' }}
              />
            </div>
          )}

          {/* Preview Column */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>HTML Render Preview</label>
              <div
                className="textarea-control"
                style={{
                  flexGrow: 1,
                  overflowY: 'auto',
                  background: 'rgba(14, 11, 22, 0.4)',
                  padding: 0,
                  height: '100%'
                }}
              >
                <div
                  className="markdown-preview-output"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
