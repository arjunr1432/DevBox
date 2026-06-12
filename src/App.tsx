import { useState } from 'react';
import {
  Search,
  Sun,
  Moon,
  Braces,
  Binary,
  Clock,
  Link,
  Key,
  Terminal,
  Fingerprint,
  Palette
} from 'lucide-react';
import type { Tool, ToolId, ToolCategory } from './types';
import { JsonFormatter } from './components/tools/JsonFormatter';
import { Base64Converter } from './components/tools/Base64Converter';
import { EpochConverter } from './components/tools/EpochConverter';
import { JwtDecoder } from './components/tools/JwtDecoder';
import { RegExTester } from './components/tools/RegExTester';
import { HashGenerator } from './components/tools/HashGenerator';
import { ColorTool } from './components/tools/ColorTool';
import { UrlEncoder } from './components/tools/UrlEncoder';

const TOOLS: Tool[] = [
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Beautify, minify and validate JSON',
    category: 'formatters',
    icon: 'Braces'
  },
  {
    id: 'base64-converter',
    name: 'Base64 Converter',
    description: 'Encode and decode texts or files',
    category: 'converters',
    icon: 'Binary'
  },
  {
    id: 'epoch-converter',
    name: 'Epoch Converter',
    description: 'Epoch timestamps to dates and vice versa',
    category: 'converters',
    icon: 'Clock'
  },
  {
    id: 'url-encoder',
    name: 'URL Encoder / Decoder',
    description: 'Encode and decode URI query parameters',
    category: 'converters',
    icon: 'Link'
  },
  {
    id: 'jwt-decoder',
    name: 'JWT Decoder',
    description: 'Decode and inspect JSON Web Tokens',
    category: 'decoders',
    icon: 'Key'
  },
  {
    id: 'regex-tester',
    name: 'RegEx Tester',
    description: 'Test patterns and match groups in real-time',
    category: 'decoders',
    icon: 'Terminal'
  },
  {
    id: 'hash-generator',
    name: 'Hash Generator',
    description: 'MD5, SHA-1, SHA-256 and SHA-512 generator',
    category: 'cryptography',
    icon: 'Fingerprint'
  },
  {
    id: 'color-tool',
    name: 'Color Space & Contrast',
    description: 'HEX/RGB/HSL conversion & WCAG checker',
    category: 'design',
    icon: 'Palette'
  }
];

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  formatters: 'Formatters',
  converters: 'Converters',
  decoders: 'Decoders',
  cryptography: 'Cryptography',
  design: 'Design & UX'
};

function App() {
  const [activeToolId, setActiveToolId] = useState<ToolId>('json-formatter');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const isElectron = navigator.userAgent.toLowerCase().includes('electron');

  // Render proper icon based on string
  const renderIcon = (iconName: string, size = 16) => {
    switch (iconName) {
      case 'Braces': return <Braces size={size} className="menu-icon" />;
      case 'Binary': return <Binary size={size} className="menu-icon" />;
      case 'Clock': return <Clock size={size} className="menu-icon" />;
      case 'Link': return <Link size={size} className="menu-icon" />;
      case 'Key': return <Key size={size} className="menu-icon" />;
      case 'Terminal': return <Terminal size={size} className="menu-icon" />;
      case 'Fingerprint': return <Fingerprint size={size} className="menu-icon" />;
      case 'Palette': return <Palette size={size} className="menu-icon" />;
      default: return <Terminal size={size} className="menu-icon" />;
    }
  };

  // Theme Toggle Effect
  const toggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    if (nextTheme) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  };

  // Find active tool details
  const activeTool = TOOLS.find(t => t.id === activeToolId) || TOOLS[0];

  // Render Tool Component
  const renderActiveToolComponent = () => {
    switch (activeToolId) {
      case 'json-formatter': return <JsonFormatter />;
      case 'base64-converter': return <Base64Converter />;
      case 'epoch-converter': return <EpochConverter />;
      case 'url-encoder': return <UrlEncoder />;
      case 'jwt-decoder': return <JwtDecoder />;
      case 'regex-tester': return <RegExTester />;
      case 'hash-generator': return <HashGenerator />;
      case 'color-tool': return <ColorTool />;
      default: return <JsonFormatter />;
    }
  };

  // Filter tools based on query
  const filteredTools = TOOLS.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group filtered tools by category
  const groupedTools = filteredTools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<ToolCategory, Tool[]>);

  // Categories listed in specific order
  const categories: ToolCategory[] = ['formatters', 'converters', 'decoders', 'cryptography', 'design'];

  return (
    <div className="desktop-wrapper">
      <div className="mac-window">
        {/* Titlebar */}
        <div className="titlebar">
          {isElectron ? (
            <div style={{ width: '70px', flexShrink: 0 }}></div>
          ) : (
            <div className="traffic-lights">
              <span className="traffic-light close" title="Close"></span>
              <span className="traffic-light minimize" title="Minimize"></span>
              <span className="traffic-light maximize" title="Maximize"></span>
            </div>
          )}
          
          <div className="titlebar-center">
            <div className="breadcrumbs">
              <span>Developer Utility Box</span>
              <span className="breadcrumb-separator">/</span>
              <span>{CATEGORY_LABELS[activeTool.category]}</span>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-active">{activeTool.name}</span>
            </div>
          </div>

          <div className="titlebar-actions">
            <button className="theme-toggle" onClick={toggleTheme} title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {/* Window Body */}
        <div className="window-body">
          {/* Sidebar */}
          <div className="sidebar">
            <div className="sidebar-search">
              <Search className="sidebar-search-icon" size={14} />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {categories.map(category => {
              const categoryTools = groupedTools[category];
              if (!categoryTools || categoryTools.length === 0) return null;

              return (
                <div key={category} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="sidebar-section-title">{CATEGORY_LABELS[category]}</div>
                  {categoryTools.map(tool => (
                    <div
                      key={tool.id}
                      className={`sidebar-menu-item ${activeToolId === tool.id ? 'active' : ''}`}
                      onClick={() => setActiveToolId(tool.id)}
                    >
                      {renderIcon(tool.icon)}
                      <span>{tool.name}</span>
                    </div>
                  ))}
                </div>
              );
            })}

            {filteredTools.length === 0 && (
              <div style={{ padding: '20px 8px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                No tools found matching "{searchQuery}"
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="content-area">
            {renderActiveToolComponent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
