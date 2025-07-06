import { z } from "zod";

// Plugin manifest schema
export const pluginManifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  author: z.string(),
  category: z.enum(['language', 'theme', 'utility', 'debugger', 'formatter', 'linter', 'debugging', 'productivity', 'game-dev', 'database']),
  icon: z.string().optional(),
  main: z.string(),
  activationEvents: z.array(z.string()),
  contributes: z.object({
    languages: z.array(z.object({
      id: z.string(),
      aliases: z.array(z.string()),
      extensions: z.array(z.string()),
      configuration: z.string().optional(),
      grammar: z.string().optional()
    })).optional(),
    themes: z.array(z.object({
      id: z.string(),
      label: z.string(),
      uiTheme: z.enum(['vs', 'vs-dark', 'hc-black']),
      path: z.string()
    })).optional(),
    commands: z.array(z.object({
      command: z.string(),
      title: z.string(),
      category: z.string().optional()
    })).optional(),
    keybindings: z.array(z.object({
      command: z.string(),
      key: z.string(),
      when: z.string().optional()
    })).optional(),
    menus: z.record(z.array(z.object({
      command: z.string(),
      when: z.string().optional(),
      group: z.string().optional()
    }))).optional(),
    configuration: z.object({
      title: z.string(),
      properties: z.record(z.any())
    }).optional()
  }).optional(),
  engines: z.object({
    deepblue: z.string()
  }),
  dependencies: z.record(z.string()).optional(),
  devDependencies: z.record(z.string()).optional()
});

export type PluginManifest = z.infer<typeof pluginManifestSchema>;

// Plugin runtime interface
export interface IPlugin {
  id: string;
  manifest: PluginManifest;
  activate(context: PluginContext): void | Promise<void>;
  deactivate?(): void | Promise<void>;
}

// Plugin context provided to plugins
export interface PluginContext {
  subscriptions: { dispose: () => void }[];
  globalState: PluginStorage;
  workspaceState: PluginStorage;
  extensionPath: string;
  commands: CommandRegistry;
  languages: LanguageRegistry;
  window: WindowRegistry;
}

export interface PluginStorage {
  get<T>(key: string, defaultValue?: T): T | undefined;
  update(key: string, value: any): Promise<void>;
}

export interface CommandRegistry {
  registerCommand(command: string, callback: (...args: any[]) => any): { dispose: () => void };
  executeCommand(command: string, ...args: any[]): Promise<any>;
}

export interface LanguageRegistry {
  registerLanguage(languageConfig: LanguageConfiguration): { dispose: () => void };
  setLanguageConfiguration(languageId: string, configuration: LanguageConfiguration): { dispose: () => void };
}

export interface WindowRegistry {
  showInformationMessage(message: string, ...items: string[]): Promise<string | undefined>;
  showWarningMessage(message: string, ...items: string[]): Promise<string | undefined>;
  showErrorMessage(message: string, ...items: string[]): Promise<string | undefined>;
  showInputBox(options?: InputBoxOptions): Promise<string | undefined>;
}

export interface LanguageConfiguration {
  id: string;
  aliases: string[];
  extensions: string[];
  compiler?: CompilerConfiguration;
  syntax?: SyntaxConfiguration;
}

export interface CompilerConfiguration {
  command: string;
  args: string[];
  outputExtension: string;
  workingDirectory?: string;
  environment?: Record<string, string>;
}

export interface SyntaxConfiguration {
  keywords: string[];
  operators: string[];
  brackets: Array<[string, string]>;
  comments: {
    lineComment?: string;
    blockComment?: [string, string];
  };
}

export interface InputBoxOptions {
  value?: string;
  valueSelection?: [number, number];
  prompt?: string;
  placeHolder?: string;
  password?: boolean;
  ignoreFocusOut?: boolean;
  validateInput?(value: string): string | undefined | null | Promise<string | undefined | null>;
}

// Built-in language configurations
export const BUILTIN_LANGUAGES: LanguageConfiguration[] = [
  {
    id: 'javascript',
    aliases: ['JavaScript', 'js'],
    extensions: ['.js', '.jsx', '.mjs'],
    compiler: {
      command: 'node',
      args: ['${file}'],
      outputExtension: ''
    },
    syntax: {
      keywords: ['const', 'let', 'var', 'function', 'class', 'if', 'else', 'for', 'while', 'return'],
      operators: ['+', '-', '*', '/', '=', '==', '===', '!=', '!==', '<', '>', '<=', '>='],
      brackets: [['(', ')'], ['[', ']'], ['{', '}']],
      comments: {
        lineComment: '//',
        blockComment: ['/*', '*/']
      }
    }
  },
  {
    id: 'typescript',
    aliases: ['TypeScript', 'ts'],
    extensions: ['.ts', '.tsx'],
    compiler: {
      command: 'npx',
      args: ['tsx', '${file}'],
      outputExtension: ''
    },
    syntax: {
      keywords: ['const', 'let', 'var', 'function', 'class', 'interface', 'type', 'if', 'else', 'for', 'while', 'return'],
      operators: ['+', '-', '*', '/', '=', '==', '===', '!=', '!==', '<', '>', '<=', '>='],
      brackets: [['(', ')'], ['[', ']'], ['{', '}']],
      comments: {
        lineComment: '//',
        blockComment: ['/*', '*/']
      }
    }
  },
  {
    id: 'python',
    aliases: ['Python', 'py'],
    extensions: ['.py', '.pyw'],
    compiler: {
      command: 'python3',
      args: ['${file}'],
      outputExtension: ''
    },
    syntax: {
      keywords: ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return', 'import', 'from', 'as'],
      operators: ['+', '-', '*', '/', '=', '==', '!=', '<', '>', '<=', '>='],
      brackets: [['(', ')'], ['[', ']'], ['{', '}']],
      comments: {
        lineComment: '#',
        blockComment: ['"""', '"""']
      }
    }
  },
  {
    id: 'cpp',
    aliases: ['C++', 'cpp', 'cxx'],
    extensions: ['.cpp', '.cxx', '.cc', '.c++'],
    compiler: {
      command: 'g++',
      args: ['${file}', '-o', '${fileBasenameNoExtension}', '&&', './${fileBasenameNoExtension}'],
      outputExtension: ''
    },
    syntax: {
      keywords: ['int', 'char', 'float', 'double', 'void', 'class', 'struct', 'if', 'else', 'for', 'while', 'return', 'include'],
      operators: ['+', '-', '*', '/', '=', '==', '!=', '<', '>', '<=', '>=', '&&', '||'],
      brackets: [['(', ')'], ['[', ']'], ['{', '}']],
      comments: {
        lineComment: '//',
        blockComment: ['/*', '*/']
      }
    }
  },
  {
    id: 'java',
    aliases: ['Java'],
    extensions: ['.java'],
    compiler: {
      command: 'javac',
      args: ['${file}', '&&', 'java', '${fileBasenameNoExtension}'],
      outputExtension: '.class'
    },
    syntax: {
      keywords: ['public', 'private', 'protected', 'class', 'interface', 'if', 'else', 'for', 'while', 'return', 'import', 'package'],
      operators: ['+', '-', '*', '/', '=', '==', '!=', '<', '>', '<=', '>=', '&&', '||'],
      brackets: [['(', ')'], ['[', ']'], ['{', '}']],
      comments: {
        lineComment: '//',
        blockComment: ['/*', '*/']
      }
    }
  },
  {
    id: 'go',
    aliases: ['Go', 'golang'],
    extensions: ['.go'],
    compiler: {
      command: 'go',
      args: ['run', '${file}'],
      outputExtension: ''
    },
    syntax: {
      keywords: ['package', 'import', 'func', 'var', 'const', 'type', 'struct', 'interface', 'if', 'else', 'for', 'return'],
      operators: ['+', '-', '*', '/', '=', '==', '!=', '<', '>', '<=', '>=', '&&', '||'],
      brackets: [['(', ')'], ['[', ']'], ['{', '}']],
      comments: {
        lineComment: '//',
        blockComment: ['/*', '*/']
      }
    }
  },
  {
    id: 'rust',
    aliases: ['Rust', 'rs'],
    extensions: ['.rs'],
    compiler: {
      command: 'rustc',
      args: ['${file}', '&&', './${fileBasenameNoExtension}'],
      outputExtension: ''
    },
    syntax: {
      keywords: ['fn', 'let', 'mut', 'const', 'struct', 'enum', 'impl', 'trait', 'if', 'else', 'for', 'while', 'return'],
      operators: ['+', '-', '*', '/', '=', '==', '!=', '<', '>', '<=', '>=', '&&', '||'],
      brackets: [['(', ')'], ['[', ']'], ['{', '}']],
      comments: {
        lineComment: '//',
        blockComment: ['/*', '*/']
      }
    }
  },
  {
    id: 'c',
    aliases: ['C'],
    extensions: ['.c', '.h'],
    compiler: {
      command: 'gcc',
      args: ['${file}', '-o', '${fileBasenameNoExtension}', '&&', './${fileBasenameNoExtension}'],
      outputExtension: ''
    },
    syntax: {
      keywords: ['int', 'char', 'float', 'double', 'void', 'struct', 'if', 'else', 'for', 'while', 'return', 'include'],
      operators: ['+', '-', '*', '/', '=', '==', '!=', '<', '>', '<=', '>=', '&&', '||'],
      brackets: [['(', ')'], ['[', ']'], ['{', '}']],
      comments: {
        lineComment: '//',
        blockComment: ['/*', '*/']
      }
    }
  }
];