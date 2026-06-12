export type ToolId =
  | 'json-formatter'
  | 'base64-converter'
  | 'epoch-converter'
  | 'jwt-decoder'
  | 'regex-tester'
  | 'hash-generator'
  | 'color-tool'
  | 'url-encoder'
  | 'text-diff'
  | 'uuid-generator'
  | 'case-converter'
  | 'sql-formatter'
  | 'html-encoder'
  | 'markdown-preview'
  | 'xml-formatter';

export type ToolCategory =
  | 'formatters'
  | 'converters'
  | 'decoders'
  | 'cryptography'
  | 'design'
  | 'text'
  | 'dev-helpers';

export interface Tool {
  id: ToolId;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
}
