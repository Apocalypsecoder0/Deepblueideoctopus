#!/usr/bin/env node

/**
 * DeepBlue:Octopus IDE v2.1.0 Alpha - Application Startup Script
 * Cross-Platform Game Development Environment
 * 
 * This script provides an alternative startup method for the IDE application
 * with enhanced logging, error handling, and environment configuration.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Application configuration
const config = {
  name: 'DeepBlue:Octopus IDE',
  version: '2.1.0 Alpha',
  description: 'Cross-Platform Game Development Environment',
  author: 'Stephen Deline Jr.',
  email: 'stephend8846@gmail.com',
  github: 'apocalypsecode0',
  website: 'https://deepblueide.dev',
  port: process.env.PORT || 5000
};

// ASCII Art Logo
const logo = `
${colors.cyan}${colors.bright}
    ╔══════════════════════════════════════════════════════════════╗
    ║                    ${colors.blue}DeepBlue:Octopus IDE${colors.cyan}                     ║
    ║                    ${colors.white}v2.1.0 Alpha Release${colors.cyan}                    ║
    ║              ${colors.magenta}Cross-Platform Game Development${colors.cyan}               ║
    ╚══════════════════════════════════════════════════════════════╝
${colors.reset}
`;

// Utility functions
function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logHeader(message) {
  log(`\n${colors.bright}${colors.cyan}═══ ${message} ═══${colors.reset}`);
}

// Environment checks
function checkEnvironment() {
  logHeader('Environment Check');
  
  // Check Node.js version
  const nodeVersion = process.version;
  logInfo(`Node.js version: ${nodeVersion}`);
  
  // Check if package.json exists
  if (fs.existsSync('package.json')) {
    logSuccess('package.json found');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    logInfo(`Project: ${packageJson.name} v${packageJson.version}`);
  } else {
    logWarning('package.json not found');
  }
  
  // Check if node_modules exists
  if (fs.existsSync('node_modules')) {
    logSuccess('Dependencies installed');
  } else {
    logWarning('Dependencies not installed - run npm install');
  }
  
  // Check environment variables
  const requiredEnvVars = ['DATABASE_URL'];
  const optionalEnvVars = ['OPENAI_API_KEY', 'STRIPE_SECRET_KEY', 'VITE_STRIPE_PUBLIC_KEY'];
  
  logInfo('Checking environment variables:');
  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      logSuccess(`${envVar} configured`);
    } else {
      logWarning(`${envVar} not set`);
    }
  });
  
  optionalEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      logSuccess(`${envVar} configured`);
    } else {
      logInfo(`${envVar} not set (optional)`);
    }
  });
}

// Database connection check
function checkDatabase() {
  logHeader('Database Connection');
  
  if (process.env.DATABASE_URL) {
    logSuccess('Database URL configured');
    if (process.env.DATABASE_URL.includes('postgresql://')) {
      logInfo('Database type: PostgreSQL');
    } else if (process.env.DATABASE_URL.includes('mysql://')) {
      logInfo('Database type: MySQL');
    } else {
      logInfo('Database type: Unknown');
    }
  } else {
    logWarning('Database URL not configured');
  }
}

// Start the application
function startApplication() {
  logHeader('Starting Application');
  
  logInfo('Launching DeepBlue:Octopus IDE...');
  logInfo(`Server will run on port ${config.port}`);
  logInfo(`Access the IDE at: http://localhost:${config.port}`);
  logInfo(`Admin Portal: http://localhost:${config.port}/admin`);
  logInfo(`Website: http://localhost:${config.port}/`);
  
  // Start the development server
  const child = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });
  
  child.on('error', (error) => {
    logError(`Failed to start application: ${error.message}`);
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    if (code === 0) {
      logSuccess('Application exited successfully');
    } else {
      logError(`Application exited with code ${code}`);
    }
    process.exit(code);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('\n');
    logInfo('Received SIGINT, shutting down gracefully...');
    child.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    logInfo('Received SIGTERM, shutting down gracefully...');
    child.kill('SIGTERM');
  });
}

// Display help information
function showHelp() {
  console.log(`
${colors.bright}${colors.cyan}DeepBlue:Octopus IDE Startup Script${colors.reset}

${colors.bright}Usage:${colors.reset}
  node start.js [options]

${colors.bright}Options:${colors.reset}
  --help, -h     Show this help message
  --version, -v  Show version information
  --check, -c    Run environment checks only
  --port <port>  Specify port number (default: 5000)

${colors.bright}Examples:${colors.reset}
  node start.js              Start the application
  node start.js --check      Check environment only
  node start.js --port 3000  Start on port 3000

${colors.bright}Features:${colors.reset}
  • Comprehensive IDE with VS Code-like functionality
  • Multi-language support (25+ programming languages)
  • AI-powered development tools and assistants
  • Professional admin portal with development panel
  • Cross-platform game development environment
  • Real-time collaboration and version control
  • Advanced debugging and performance monitoring

${colors.bright}Access Points:${colors.reset}
  IDE Application: http://localhost:${config.port}/ide
  Admin Portal:    http://localhost:${config.port}/admin
  Website:         http://localhost:${config.port}/

${colors.bright}Support:${colors.reset}
  Email: ${config.email}
  GitHub: github.com/${config.github}
  Website: ${config.website}
`);
}

// Show version information
function showVersion() {
  console.log(`
${colors.bright}${colors.cyan}${config.name}${colors.reset}
Version: ${colors.green}${config.version}${colors.reset}
Description: ${config.description}
Author: ${config.author}
Email: ${config.email}
GitHub: ${config.github}
Website: ${config.website}
`);
}

// Main function
function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  if (args.includes('--version') || args.includes('-v')) {
    showVersion();
    return;
  }
  
  // Check for port argument
  const portIndex = args.indexOf('--port');
  if (portIndex !== -1 && args[portIndex + 1]) {
    const port = parseInt(args[portIndex + 1]);
    if (!isNaN(port)) {
      config.port = port;
      process.env.PORT = port.toString();
    }
  }
  
  // Display logo and info
  console.log(logo);
  log(`${colors.bright}Welcome to ${config.name} ${config.version}${colors.reset}`);
  log(`${colors.dim}${config.description}${colors.reset}`);
  log(`${colors.dim}Created by ${config.author} | ${config.website}${colors.reset}\n`);
  
  // Run environment checks
  checkEnvironment();
  checkDatabase();
  
  // If only checking environment, exit here
  if (args.includes('--check') || args.includes('-c')) {
    logInfo('Environment check complete');
    return;
  }
  
  // Start the application
  startApplication();
}

// Run the main function
if (require.main === module) {
  main();
}

module.exports = {
  config,
  checkEnvironment,
  checkDatabase,
  startApplication,
  showHelp,
  showVersion
};