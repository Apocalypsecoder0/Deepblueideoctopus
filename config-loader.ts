/**
 * Configuration Loader for DeepBlue:Octopus IDE
 * Handles loading and merging configuration files based on environment
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export interface ConfigLoader {
  loadConfig(): any;
  getEnvironment(): string;
  mergeConfigs(base: any, override: any): any;
}

class AppConfigLoader implements ConfigLoader {
  private configDir: string;
  private environment: string;

  constructor() {
    this.configDir = join(process.cwd(), 'config');
    this.environment = process.env.NODE_ENV || 'development';
  }

  getEnvironment(): string {
    return this.environment;
  }

  loadConfig(): any {
    try {
      // Load default configuration
      const defaultConfigPath = join(this.configDir, 'default.json');
      const defaultConfig = JSON.parse(readFileSync(defaultConfigPath, 'utf8'));

      // Load environment-specific configuration if it exists
      const envConfigPath = join(this.configDir, `${this.environment}.json`);
      let envConfig = {};
      
      try {
        envConfig = JSON.parse(readFileSync(envConfigPath, 'utf8'));
      } catch (error) {
        console.log(`No environment-specific config found for ${this.environment}`);
      }

      // Merge configurations
      const mergedConfig = this.mergeConfigs(defaultConfig, envConfig);

      // Override with environment variables
      const finalConfig = this.applyEnvironmentVariables(mergedConfig);

      console.log(`📁 Configuration loaded for environment: ${this.environment}`);
      return finalConfig;

    } catch (error) {
      console.error('❌ Failed to load configuration:', error);
      throw new Error(`Configuration loading failed: ${error}`);
    }
  }

  mergeConfigs(base: any, override: any): any {
    const result = { ...base };

    for (const key in override) {
      if (override.hasOwnProperty(key)) {
        if (typeof override[key] === 'object' && !Array.isArray(override[key]) && override[key] !== null) {
          result[key] = this.mergeConfigs(result[key] || {}, override[key]);
        } else {
          result[key] = override[key];
        }
      }
    }

    return result;
  }

  private applyEnvironmentVariables(config: any): any {
    const result = { ...config };

    // Apply environment variable overrides
    if (process.env.PORT) {
      result.server.port = parseInt(process.env.PORT);
    }

    if (process.env.HOST) {
      result.server.host = process.env.HOST;
    }

    if (process.env.DATABASE_URL) {
      result.database = result.database || {};
      result.database.url = process.env.DATABASE_URL;
    }

    if (process.env.SESSION_SECRET) {
      result.server.session.secret = process.env.SESSION_SECRET;
    }

    if (process.env.STRIPE_SECRET_KEY) {
      result.external.stripe.enabled = true;
    }

    if (process.env.OPENAI_API_KEY) {
      result.ai.openai.apiKey = process.env.OPENAI_API_KEY;
    }

    // Security overrides
    if (process.env.SECURITY_STRICT_MODE === 'true') {
      result.security.codeValidation.strictMode = true;
    }

    if (process.env.SECURITY_BLOCKING_THRESHOLD) {
      result.security.codeValidation.blockingThreshold = parseInt(process.env.SECURITY_BLOCKING_THRESHOLD);
    }

    // Feature flags from environment
    if (process.env.DISABLE_AI_ASSISTANT === 'true') {
      result.features.aiAssistant = false;
    }

    if (process.env.DISABLE_CODE_EXECUTION === 'true') {
      result.features.codeExecution = false;
    }

    if (process.env.ENABLE_BETA_ACCESS === 'false') {
      result.features.betaAccess = false;
    }

    return result;
  }

  // Validate configuration
  validateConfig(config: any): string[] {
    const errors: string[] = [];

    // Required fields validation
    if (!config.app?.name) {
      errors.push("App name is required");
    }

    if (!config.server?.port || config.server.port < 1 || config.server.port > 65535) {
      errors.push("Valid server port is required (1-65535)");
    }

    if (!config.server?.session?.secret) {
      errors.push("Session secret is required");
    }

    // Security validation
    if (config.security?.codeValidation?.blockingThreshold < 0 || config.security?.codeValidation?.blockingThreshold > 100) {
      errors.push("Security blocking threshold must be between 0-100");
    }

    // Subscription validation
    if (config.subscriptions?.free?.price < 0) {
      errors.push("Free tier price cannot be negative");
    }

    if (config.subscriptions?.gold?.price <= config.subscriptions?.free?.price) {
      errors.push("Gold tier price must be higher than free tier");
    }

    if (config.subscriptions?.platinum?.price <= config.subscriptions?.gold?.price) {
      errors.push("Platinum tier price must be higher than gold tier");
    }

    return errors;
  }

  // Get specific configuration sections
  getAppConfig(config: any) {
    return config.app || {};
  }

  getServerConfig(config: any) {
    return config.server || {};
  }

  getSecurityConfig(config: any) {
    return config.security || {};
  }

  getDatabaseConfig(config: any) {
    return config.database || {};
  }

  getFeatureFlags(config: any) {
    return config.features || {};
  }

  getSubscriptionConfig(config: any) {
    return config.subscriptions || {};
  }

  getAIConfig(config: any) {
    return config.ai || {};
  }

  // Configuration utilities
  isFeatureEnabled(config: any, feature: string): boolean {
    return config.features?.[feature] === true;
  }

  getSubscriptionTier(config: any, tier: string) {
    return config.subscriptions?.[tier] || null;
  }

  isDevelopment(config: any): boolean {
    return this.environment === 'development';
  }

  isProduction(config: any): boolean {
    return this.environment === 'production';
  }

  // Hot reload configuration in development
  enableHotReload(): void {
    if (this.isDevelopment) {
      const chokidar = require('chokidar');
      const watcher = chokidar.watch(this.configDir);

      watcher.on('change', (path: string) => {
        console.log(`📁 Configuration file changed: ${path}`);
        console.log('🔄 Reloading configuration...');
        // In a real application, you might want to reload the config
        // and notify other parts of the application
      });
    }
  }
}

// Export singleton instance
export const configLoader = new AppConfigLoader();

// Export loaded configuration
export const appConfig = configLoader.loadConfig();

// Validate configuration on startup
const configErrors = configLoader.validateConfig(appConfig);
if (configErrors.length > 0) {
  console.error('❌ Configuration validation errors:');
  configErrors.forEach(error => console.error(`  - ${error}`));
  throw new Error(`Invalid configuration: ${configErrors.join(', ')}`);
}

console.log('✅ Configuration validation passed');

// Export configuration helpers
export const getConfig = () => appConfig;
export const isFeatureEnabled = (feature: string) => configLoader.isFeatureEnabled(appConfig, feature);
export const getSubscriptionTier = (tier: string) => configLoader.getSubscriptionTier(appConfig, tier);
export const isDevelopment = () => configLoader.isDevelopment(appConfig);
export const isProduction = () => configLoader.isProduction(appConfig);

// Export specific configuration sections
export const serverConfig = configLoader.getServerConfig(appConfig);
export const securityConfig = configLoader.getSecurityConfig(appConfig);
export const databaseConfig = configLoader.getDatabaseConfig(appConfig);
export const featureFlags = configLoader.getFeatureFlags(appConfig);
export const subscriptionConfig = configLoader.getSubscriptionConfig(appConfig);
export const aiConfig = configLoader.getAIConfig(appConfig);