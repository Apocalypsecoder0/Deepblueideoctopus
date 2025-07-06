#!/bin/bash

# DeepBlue:Octopus IDE - Automated Deployment Script
# This script prepares the application for FTP deployment

set -e

echo "🐙 DeepBlue:Octopus IDE - Deployment Preparation"
echo "================================================"

# Check if required tools are installed
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ NPM is required but not installed. Aborting." >&2; exit 1; }

echo "✅ Prerequisites check passed"

# Create deployment directory
DEPLOY_DIR="deployment-package"
echo "📁 Creating deployment directory: $DEPLOY_DIR"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application for production..."
npm run build

# Build the server
echo "🔨 Building server..."
npm run build:server

# Copy built files to deployment directory
echo "📋 Copying files to deployment directory..."
cp -r dist/* $DEPLOY_DIR/
cp package.json $DEPLOY_DIR/
cp package-lock.json $DEPLOY_DIR/
cp drizzle.config.ts $DEPLOY_DIR/
cp tsconfig.json $DEPLOY_DIR/

# Copy WHC-specific files
cp install-whc.sh $DEPLOY_DIR/
cp WHC_DEPLOYMENT_GUIDE.md $DEPLOY_DIR/
cp MYSQL_SETUP_GUIDE.md $DEPLOY_DIR/
cp FTP_DEPLOYMENT_GUIDE.md $DEPLOY_DIR/
cp QUICK_DEPLOYMENT_GUIDE.md $DEPLOY_DIR/

# Create production environment template
echo "🔧 Creating environment template..."
cat > $DEPLOY_DIR/.env.template << EOL
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database_name
PGHOST=your-postgres-host
PGPORT=5432
PGUSER=your-username
PGPASSWORD=your-password
PGDATABASE=your-database-name

# Server Configuration
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-super-secure-session-secret-key

# Domain Configuration
REPLIT_DOMAINS=your-domain.com,www.your-domain.com
ISSUER_URL=https://replit.com/oidc

# Optional API Keys
OPENAI_API_KEY=your-openai-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
VITE_STRIPE_PUBLIC_KEY=your-stripe-public-key

# Security Configuration
CORS_ORIGIN=https://your-domain.com
TRUSTED_PROXIES=cloudflare
EOL

# Create startup script
echo "🚀 Creating startup script..."
cat > $DEPLOY_DIR/start.js << 'EOL'
const { spawn } = require('child_process');
const path = require('path');

console.log('🐙 Starting DeepBlue:Octopus IDE...');

// Start the production server
const server = spawn('node', ['index.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`🔄 Server process exited with code ${code}`);
  if (code !== 0) {
    process.exit(code);
  }
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
});

console.log('✅ DeepBlue:Octopus IDE started successfully');
EOL

# Create PM2 ecosystem file
echo "⚙️ Creating PM2 configuration..."
cat > $DEPLOY_DIR/ecosystem.config.js << 'EOL'
module.exports = {
  apps: [{
    name: 'deepblue-octopus-ide',
    script: 'start.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    min_uptime: '10s',
    max_restarts: 10
  }]
};
EOL

# Create .htaccess for Apache servers
echo "🔧 Creating Apache configuration..."
cat > $DEPLOY_DIR/.htaccess << 'EOL'
# DeepBlue:Octopus IDE - Apache Configuration

# Enable rewrite engine
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# API proxy to Node.js server
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ http://localhost:3000/api/$1 [P,L]

# Serve static files
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Cache control
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"
    ExpiresByType application/font-woff "access plus 1 month"
    ExpiresByType application/font-woff2 "access plus 1 month"
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
EOL

# Create deployment instructions
echo "📖 Creating deployment instructions..."
cat > $DEPLOY_DIR/DEPLOYMENT_INSTRUCTIONS.txt << 'EOL'
DeepBlue:Octopus IDE - FTP Deployment Instructions
================================================

1. BEFORE UPLOADING:
   - Copy .env.template to .env
   - Edit .env with your actual configuration values
   - Ensure you have a PostgreSQL database ready

2. FTP UPLOAD:
   - Upload ALL files in this directory to your web root
   - Set file permissions: 755 for directories, 644 for files
   - Make sure start.js has execute permissions (755)

3. ON YOUR SERVER:
   - SSH into your server
   - Navigate to the upload directory
   - Run: npm install --production
   - Run: node start.js (or use PM2: pm2 start ecosystem.config.js)

4. DATABASE SETUP:
   - Run: npm run db:push (to create database tables)
   - Verify: npm run db:status

5. VERIFICATION:
   - Visit your domain to test the application
   - Check /admin for admin panel access
   - Monitor logs for any errors

For detailed instructions, see FTP_DEPLOYMENT_GUIDE.md

Support: support@deepblueide.dev
Documentation: https://deepblueide.dev/docs
EOL

# Create logs directory
mkdir -p $DEPLOY_DIR/logs

# Create package.json for production
echo "📋 Creating production package.json..."
cat > $DEPLOY_DIR/package.json << 'EOL'
{
  "name": "deepblue-octopus-ide",
  "version": "2.1.0",
  "description": "DeepBlue:Octopus IDE - Cross-Platform Game Development Environment",
  "main": "index.js",
  "scripts": {
    "start": "node start.js",
    "pm2:start": "pm2 start ecosystem.config.js",
    "pm2:stop": "pm2 stop deepblue-octopus-ide",
    "pm2:restart": "pm2 restart deepblue-octopus-ide",
    "pm2:logs": "pm2 logs deepblue-octopus-ide",
    "db:push": "drizzle-kit push",
    "db:status": "drizzle-kit status",
    "logs": "tail -f logs/combined.log"
  },
  "keywords": ["ide", "development", "game-engine", "octopus"],
  "author": "Stephen Deline Jr. <stephend8846@gmail.com>",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.9.0",
    "drizzle-orm": "^0.29.0",
    "drizzle-kit": "^0.20.0",
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "bcrypt": "^5.1.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "compression": "^1.7.4",
    "dotenv": "^16.3.0"
  }
}
EOL

# Create a deployment checklist
echo "✅ Creating deployment checklist..."
cat > $DEPLOY_DIR/DEPLOYMENT_CHECKLIST.md << 'EOL'
# DeepBlue:Octopus IDE - Deployment Checklist

## Pre-Deployment
- [ ] PostgreSQL database created and accessible
- [ ] Domain name configured and pointing to server
- [ ] SSL certificate obtained and installed
- [ ] FTP/SFTP access credentials available
- [ ] Server meets minimum requirements (Node.js 18+, 512MB RAM)

## Environment Configuration
- [ ] Copied .env.template to .env
- [ ] Updated DATABASE_URL with actual credentials
- [ ] Set secure SESSION_SECRET (32+ characters)
- [ ] Configured REPLIT_DOMAINS with your domain
- [ ] Added API keys (OpenAI, Stripe) if needed
- [ ] Set CORS_ORIGIN to your domain

## File Upload
- [ ] Uploaded all files via FTP/SFTP
- [ ] Set correct file permissions (755 directories, 644 files)
- [ ] Verified start.js has execute permissions
- [ ] Confirmed all dependencies are uploaded

## Server Setup
- [ ] SSH access to server
- [ ] Ran: npm install --production
- [ ] Ran: npm run db:push
- [ ] Started application: node start.js or PM2
- [ ] Verified application is running on correct port

## Testing
- [ ] Homepage loads at https://your-domain.com
- [ ] IDE loads at https://your-domain.com/ide
- [ ] Admin panel accessible at https://your-domain.com/admin
- [ ] API endpoints respond correctly
- [ ] Database connectivity confirmed
- [ ] SSL certificate working properly

## Production Monitoring
- [ ] Set up log monitoring
- [ ] Configure automated backups
- [ ] Set up uptime monitoring
- [ ] Configure error alerting
- [ ] Document maintenance procedures

## Security
- [ ] All environment variables are secure
- [ ] Database access is restricted
- [ ] HTTPS is enforced
- [ ] Security headers are configured
- [ ] File permissions are correct
EOL

# Create zip archive for easy download
if command -v zip >/dev/null 2>&1; then
    echo "📦 Creating deployment archive..."
    cd $DEPLOY_DIR
    zip -r "../deepblue-octopus-ide-deployment.zip" .
    cd ..
    echo "✅ Deployment archive created: deepblue-octopus-ide-deployment.zip"
fi

echo ""
echo "🎉 Deployment preparation complete!"
echo "================================================"
echo "📁 Deployment files are in: $DEPLOY_DIR/"
echo "📖 Read DEPLOYMENT_INSTRUCTIONS.txt for next steps"
echo "📋 Use DEPLOYMENT_CHECKLIST.md to verify setup"
echo ""
echo "🌐 Deployment Options:"
echo "• WHC Hosting: Run ./install-whc.sh after FTP upload"
echo "• General FTP: Follow FTP_DEPLOYMENT_GUIDE.md"
echo "• Quick Setup: See QUICK_DEPLOYMENT_GUIDE.md"
echo ""
echo "🗄️ Database Options:"
echo "• PostgreSQL (default): Use existing configuration"
echo "• MySQL: Follow MYSQL_SETUP_GUIDE.md"
echo ""
echo "Next steps:"
echo "1. Configure your .env file with actual values"
echo "2. Upload files to your web hosting via FTP"
echo "3. For WHC: Run './install-whc.sh' to auto-configure"
echo "4. For others: Run 'npm install --production' and start app"
echo ""
echo "📚 Documentation included:"
echo "• WHC_DEPLOYMENT_GUIDE.md - Complete WHC hosting setup"
echo "• FTP_DEPLOYMENT_GUIDE.md - General FTP deployment"
echo "• MYSQL_SETUP_GUIDE.md - MySQL database configuration"
echo "• QUICK_DEPLOYMENT_GUIDE.md - 5-minute setup guide"
echo ""
echo "🔐 Admin Portal: Access at /admin with admin/admin123"
echo "🧪 Beta Tokens: BETA-2025-DEEPBLUE, DEV-PREVIEW-001"
echo ""
echo "Support: support@deepblueide.dev"