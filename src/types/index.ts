export type ToolId =
  | 'week-calendar'
  | 'todo-list'
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
  | 'xml-formatter'
  | 'yaml-json'
  | 'cron-parser'
  | 'qr-generator';

export type ToolCategory =
  | 'dashboard'
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
