/**
 * DeepBlue:Octopus IDE v2.1.0 Alpha - Application Configuration
 * Centralized configuration management for all system components
 */

export interface AppConfig {
  // Application Information
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    domain: string;
    description: string;
    author: string;
    email: string;
    github: string;
  };

  // Server Configuration
  server: {
    port: number;
    host: string;
    cors: {
      origin: string[];
      credentials: boolean;
    };
    session: {
      secret: string;
      maxAge: number;
      secure: boolean;
    };
    rateLimit: {
      windowMs: number;
      max: number;
    };
  };

  // Database Configuration
  database: {
    url: string;
    maxConnections: number;
    connectionTimeout: number;
    queryTimeout: number;
    ssl: boolean;
  };

  // Security Configuration
  security: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    };
    authentication: {
      maxFailedAttempts: number;
      lockoutDuration: number;
      tokenExpiry: number;
    };
    codeValidation: {
      enabled: boolean;
      strictMode: boolean;
      blockingThreshold: number;
      timeoutMs: number;
    };
    encryption: {
      algorithm: string;
      keyLength: number;
    };
  };

  // Feature Flags
  features: {
    aiAssistant: boolean;
    codeExecution: boolean;
    collaboration: boolean;
    gameEngine: boolean;
    mobileFramework: boolean;
    versionControl: boolean;
    cloudStorage: boolean;
    realTimePreview: boolean;
    advancedDebugging: boolean;
    multiLanguageSupport: boolean;
    betaAccess: boolean;
    adminPanel: boolean;
  };

  // Subscription Tiers
  subscriptions: {
    free: {
      name: string;
      price: number;
      maxProjects: number;
      maxStorage: string;
      aiRequestsPerDay: number;
      languageSupport: number;
      features: string[];
    };
    gold: {
      name: string;
      price: number;
      maxProjects: number;
      maxStorage: string;
      aiRequestsPerDay: number;
      languageSupport: number;
      features: string[];
    };
    platinum: {
      name: string;
      price: number;
      maxProjects: number;
      maxStorage: string;
      aiRequestsPerDay: number;
      languageSupport: number;
      features: string[];
    };
  };

  // AI Configuration
  ai: {
    openai: {
      model: string;
      maxTokens: number;
      temperature: number;
      timeout: number;
    };
    agents: {
      codeCraft: { enabled: boolean; maxRequests: number };
      refactorPro: { enabled: boolean; maxRequests: number };
      bugSeeker: { enabled: boolean; maxRequests: number };
      docMaster: { enabled: boolean; maxRequests: number };
      architectAI: { enabled: boolean; maxRequests: number };
      speedBoost: { enabled: boolean; maxRequests: number };
      testCraft: { enabled: boolean; maxRequests: number };
    };
  };

  // Language Support
  languages: {
    supported: string[];
    compilation: {
      timeout: number;
      memoryLimit: string;
      outputLimit: string;
    };
    execution: {
      sandboxed: boolean;
      timeout: number;
      networkAccess: boolean;
    };
  };

  // File System
  fileSystem: {
    maxFileSize: string;
    allowedExtensions: string[];
    compressionFormats: string[];
    autoSave: {
      enabled: boolean;
      interval: number;
    };
    preview: {
      supportedFormats: string[];
      maxPreviewSize: string;
    };
  };

  // UI/UX Configuration
  ui: {
    theme: {
      default: string;
      available: string[];
    };
    editor: {
      defaultFont: string;
      fontSize: number;
      tabSize: number;
      wordWrap: boolean;
      lineNumbers: boolean;
      minimap: boolean;
    };
    animations: {
      enabled: boolean;
      duration: number;
      easing: string;
    };
    notifications: {
      position: string;
      duration: number;
      maxVisible: number;
    };
  };

  // Beta System
  beta: {
    enabled: boolean;
    autoApproval: boolean;
    requiresVerification: boolean;
    maxBetaUsers: number;
    features: string[];
    tokenExpiry: number;
  };

  // Monitoring & Analytics
  monitoring: {
    errorTracking: boolean;
    performanceMonitoring: boolean;
    userAnalytics: boolean;
    systemMetrics: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };

  // External Services
  external: {
    stripe: {
      enabled: boolean;
      webhookSecret?: string;
    };
    github: {
      enabled: boolean;
      apiUrl: string;
    };
    cloudProviders: {
      aws: { enabled: boolean };
      googleDrive: { enabled: boolean };
      oneDrive: { enabled: boolean };
      dropbox: { enabled: boolean };
    };
  };
}

// Default configuration
export const defaultConfig: AppConfig = {
  app: {
    name: 'DeepBlue:Octopus IDE',
    version: '2.1.0 Alpha',
    environment: 'development',
    domain: 'https://deepblueide.dev',
    description: 'Cross-Platform Game Development Environment',
    author: 'Stephen Deline Jr.',
    email: 'stephend8846@gmail.com',
    github: 'apocalypsecode0'
  },
  server: {
    port: 5000,
    host: '0.0.0.0',
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:5000',
        'https://deepblueide.dev',
        'https://*.replit.app',
        'https://*.replit.dev'
      ],
      credentials: true
    },
    session: {
      secret: process.env.SESSION_SECRET || 'deepblue-octopus-session-secret',
      maxAge: 86400000, // 24 hours
      secure: false
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000 // limit each IP to 1000 requests per windowMs
    }
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/deepblue_ide',
    maxConnections: 20,
    connectionTimeout: 30000,
    queryTimeout: 10000,
    ssl: false
  },
  security: {
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false
    },
    authentication: {
      maxFailedAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      tokenExpiry: 60 * 60 * 1000 // 1 hour
    },
    codeValidation: {
      enabled: true,
      strictMode: true,
      blockingThreshold: 50,
      timeoutMs: 5000
    },
    encryption: {
      algorithm: 'aes-256-gcm',
      keyLength: 32
    }
  },
  features: {
    aiAssistant: true,
    codeExecution: true,
    collaboration: true,
    gameEngine: true,
    mobileFramework: true,
    versionControl: true,
    cloudStorage: true,
    realTimePreview: true,
    advancedDebugging: true,
    multiLanguageSupport: true,
    betaAccess: true,
    adminPanel: true
  },
  subscriptions: {
    free: {
      name: 'Free Tier',
      price: 0,
      maxProjects: 5,
      maxStorage: '100MB',
      aiRequestsPerDay: 50,
      languageSupport: 10,
      features: ['Basic IDE', 'Code Editor', 'File Manager', 'Terminal']
    },
    gold: {
      name: 'Gold Tier',
      price: 19.99,
      maxProjects: 50,
      maxStorage: '1GB',
      aiRequestsPerDay: 500,
      languageSupport: 25,
      features: ['All Free Features', 'AI Assistant', 'Advanced Debugging', 'Cloud Storage', 'Collaboration']
    },
    platinum: {
      name: 'Platinum Tier',
      price: 49.99,
      maxProjects: -1, // unlimited
      maxStorage: '10GB',
      aiRequestsPerDay: -1, // unlimited
      languageSupport: 25,
      features: ['All Gold Features', 'Game Engine', 'Mobile Framework', 'Priority Support', 'Advanced Analytics']
    }
  },
  ai: {
    openai: {
      model: 'gpt-4o',
      maxTokens: 4000,
      temperature: 0.7,
      timeout: 30000
    },
    agents: {
      codeCraft: { enabled: true, maxRequests: 100 },
      refactorPro: { enabled: true, maxRequests: 100 },
      bugSeeker: { enabled: true, maxRequests: 100 },
      docMaster: { enabled: true, maxRequests: 100 },
      architectAI: { enabled: true, maxRequests: 100 },
      speedBoost: { enabled: true, maxRequests: 100 },
      testCraft: { enabled: true, maxRequests: 100 }
    }
  },
  languages: {
    supported: [
      'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'rust',
      'go', 'php', 'ruby', 'swift', 'kotlin', 'dart', 'lua', 'scala',
      'haskell', 'elixir', 'crystal', 'nim', 'zig', 'deno', 'bun',
      'csharp', 'fsharp', 'vb'
    ],
    compilation: {
      timeout: 30000,
      memoryLimit: '512MB',
      outputLimit: '10MB'
    },
    execution: {
      sandboxed: true,
      timeout: 10000,
      networkAccess: false
    }
  },
  fileSystem: {
    maxFileSize: '50MB',
    allowedExtensions: [
      '.js', '.ts', '.py', '.java', '.cpp', '.c', '.rs', '.go', '.php',
      '.rb', '.swift', '.kt', '.dart', '.lua', '.scala', '.hs', '.ex',
      '.cr', '.nim', '.zig', '.cs', '.fs', '.vb', '.html', '.css',
      '.json', '.xml', '.yaml', '.yml', '.md', '.txt', '.png', '.jpg',
      '.jpeg', '.gif', '.svg', '.mp4', '.mp3', '.wav', '.pdf'
    ],
    compressionFormats: ['zip', 'tar', 'tar.gz', 'tar.bz2'],
    autoSave: {
      enabled: true,
      interval: 30000
    },
    preview: {
      supportedFormats: ['image', 'video', 'audio', 'text', 'pdf'],
      maxPreviewSize: '10MB'
    }
  },
  ui: {
    theme: {
      default: 'deepblue-dark',
      available: ['deepblue-dark', 'deepblue-light', 'dracula', 'monokai', 'solarized']
    },
    editor: {
      defaultFont: 'JetBrains Mono',
      fontSize: 14,
      tabSize: 2,
      wordWrap: true,
      lineNumbers: true,
      minimap: true
    },
    animations: {
      enabled: true,
      duration: 300,
      easing: 'ease-in-out'
    },
    notifications: {
      position: 'bottom-right',
      duration: 5000,
      maxVisible: 5
    }
  },
  beta: {
    enabled: true,
    autoApproval: false,
    requiresVerification: true,
    maxBetaUsers: 1000,
    features: ['AI Assistant', 'Game Engine', 'Mobile Framework', 'Advanced Debugging'],
    tokenExpiry: 30 * 24 * 60 * 60 * 1000 // 30 days
  },
  monitoring: {
    errorTracking: true,
    performanceMonitoring: true,
    userAnalytics: true,
    systemMetrics: true,
    logLevel: 'debug'
  },
  external: {
    stripe: {
      enabled: !!process.env.STRIPE_SECRET_KEY
    },
    github: {
      enabled: true,
      apiUrl: 'https://api.github.com'
    },
    cloudProviders: {
      aws: { enabled: false },
      googleDrive: { enabled: true },
      oneDrive: { enabled: true },
      dropbox: { enabled: true }
    }
  }
};

// Configuration validation
export function validateConfig(config: Partial<AppConfig>): string[] {
  const errors: string[] = [];

  // Required fields validation
  if (!config.app?.name) {
    errors.push("App name is required");
  }

  if (!config.server?.port || config.server.port < 1 || config.server.port > 65535) {
    errors.push("Valid server port is required (1-65535)");
  }

  // Security validation
  if (config.security?.codeValidation?.blockingThreshold !== undefined) {
    if (config.security.codeValidation.blockingThreshold < 0 || config.security.codeValidation.blockingThreshold > 100) {
      errors.push("Security blocking threshold must be between 0-100");
    }
  }

  return errors;
}

// Get configuration instance
export function getConfig(): AppConfig {
  const config = { ...defaultConfig };
  
  // Apply environment overrides
  if (process.env.NODE_ENV === 'production') {
    config.app.environment = 'production';
    config.server.session.secure = true;
    config.monitoring.logLevel = 'error';
    config.ui.animations.enabled = false;
    config.security.codeValidation.strictMode = true;
  }

  if (process.env.NODE_ENV === 'staging') {
    config.app.environment = 'staging';
    config.monitoring.logLevel = 'warn';
  }

  // Apply environment variable overrides
  if (process.env.PORT) {
    config.server.port = parseInt(process.env.PORT);
  }

  if (process.env.HOST) {
    config.server.host = process.env.HOST;
  }

  if (process.env.DATABASE_URL) {
    config.database.url = process.env.DATABASE_URL;
  }

  return config;
}

export const config = getConfig();

// Configuration utilities
export const isDevelopment = () => config.app.environment === 'development';
export const isProduction = () => config.app.environment === 'production';
export const isFeatureEnabled = (feature: keyof AppConfig['features']) => config.features[feature];
export const getSubscriptionLimit = (tier: keyof AppConfig['subscriptions'], limit: string) => {
  const subscription = config.subscriptions[tier];
  return (subscription as any)[limit];
};