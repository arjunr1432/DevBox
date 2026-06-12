export type ToolId =
  | 'json-formatter'
  | 'base64-converter'
  | 'epoch-converter'
  | 'jwt-decoder'
  | 'regex-tester'
  | 'hash-generator'
  | 'color-tool'
  | 'url-encoder';

export type ToolCategory = 'formatters' | 'converters' | 'decoders' | 'cryptography' | 'design';

export interface Tool {
  id: ToolId;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
}
