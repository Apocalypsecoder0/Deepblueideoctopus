# DeepBlue:Octopus IDE - FTP Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the DeepBlue:Octopus IDE to a web hosting service using FTP. The IDE requires Node.js support and PostgreSQL database connectivity.

## Prerequisites

### Hosting Requirements
- **Node.js Support**: Version 18 or higher
- **Database**: PostgreSQL 14+ or compatible cloud database
- **Storage**: Minimum 500MB for application files
- **Memory**: Minimum 512MB RAM
- **FTP Access**: Full access to public_html or web root directory
- **Environment Variables**: Support for .env configuration

### Local Requirements
- FTP client (FileZilla, WinSCP, or command line)
- Git (for cloning the repository)
- Node.js 18+ (for building the application)
- PostgreSQL access (local or cloud)

## Step 1: Prepare the Application

### 1.1 Clone and Build the Application
```bash
# Clone the repository
git clone https://github.com/your-username/deepblue-octopus-ide.git
cd deepblue-octopus-ide

# Install dependencies
npm install

# Build the application for production
npm run build

# Build the server
npm run build:server
```

### 1.2 Create Production Environment File
Create a `.env.production` file in the root directory:
```env
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

# Optional API Keys (if using)
OPENAI_API_KEY=your-openai-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
VITE_STRIPE_PUBLIC_KEY=your-stripe-public-key

# Security Configuration
CORS_ORIGIN=https://your-domain.com
TRUSTED_PROXIES=cloudflare
```

## Step 2: Database Setup

### 2.1 Create PostgreSQL Database
1. Create a new PostgreSQL database on your hosting provider
2. Note the connection details (host, port, username, password, database name)
3. Ensure the database is accessible from your hosting environment

### 2.2 Run Database Migrations
```bash
# Push database schema
npm run db:push

# Verify database connection
npm run db:status
```

## Step 3: Prepare Files for Upload

### 3.1 Create Deployment Package
```bash
# Create deployment directory
mkdir deployment-package
cd deployment-package

# Copy built application files
cp -r ../dist/* .
cp ../package.json .
cp ../package-lock.json .
cp ../.env.production .env

# Copy necessary configuration files
cp ../drizzle.config.ts .
cp ../tsconfig.json .
```

### 3.2 Create Startup Script
Create a `start.js` file in the deployment directory:
```javascript
const { spawn } = require('child_process');
const path = require('path');

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
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  if (code !== 0) {
    process.exit(code);
  }
});

// Handle process termination
process.on('SIGTERM', () => {
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  server.kill('SIGINT');
});
```

## Step 4: FTP Upload Process

### 4.1 Using FileZilla (Recommended)
1. **Connect to FTP Server**:
   - Host: your-hosting-provider-ftp-host
   - Username: your-ftp-username
   - Password: your-ftp-password
   - Port: 21 (or 22 for SFTP)

2. **Navigate to Web Root**:
   - Usually `/public_html/` or `/www/` or `/htdocs/`
   - Create a subdirectory if needed (e.g., `/public_html/ide/`)

3. **Upload Files**:
   - Upload all files from the `deployment-package` directory
   - Ensure binary mode for executable files
   - Verify file permissions (755 for directories, 644 for files)

### 4.2 Using Command Line FTP
```bash
# Connect to FTP server
ftp your-hosting-provider-ftp-host

# Login with credentials
# Enter username and password when prompted

# Navigate to web root
cd public_html

# Create IDE directory (optional)
mkdir ide
cd ide

# Upload files (repeat for all files)
put package.json
put start.js
put index.js
put .env

# Upload directories recursively
mput public/*
```

### 4.3 Using WinSCP (Windows)
1. Open WinSCP and create new session
2. Enter FTP/SFTP connection details
3. Navigate to web root directory
4. Drag and drop the deployment-package contents
5. Verify all files are uploaded correctly

## Step 5: Server Configuration

### 5.1 Install Dependencies on Server
```bash
# SSH into your hosting server
ssh username@your-server.com

# Navigate to application directory
cd public_html/ide

# Install production dependencies
npm install --production

# Verify installation
npm list
```

### 5.2 Configure Process Manager
Create a `ecosystem.config.js` file for PM2 (if available):
```javascript
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
    time: true
  }]
};
```

## Step 6: Domain and SSL Configuration

### 6.1 Domain Setup
1. **Point Domain to Server**:
   - Update DNS A record to point to server IP
   - Configure subdomain if needed (ide.your-domain.com)

2. **Configure Virtual Host** (if using Apache):
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /public_html/ide/public
    
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:3000/api/
    ProxyPassReverse /api/ http://localhost:3000/api/
    
    <Directory "/public_html/ide/public">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### 6.2 SSL Certificate
1. **Obtain SSL Certificate**:
   - Use Let's Encrypt via cPanel
   - Upload custom certificate if provided
   - Configure automatic renewal

2. **Force HTTPS Redirect**:
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

## Step 7: Start the Application

### 7.1 Using PM2 (Recommended)
```bash
# Install PM2 globally (if not available)
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup auto-restart on server reboot
pm2 startup
```

### 7.2 Using Node.js Directly
```bash
# Start application in background
nohup node start.js > app.log 2>&1 &

# Check if running
ps aux | grep node
```

### 7.3 Using Forever
```bash
# Install forever
npm install -g forever

# Start application
forever start start.js

# Check status
forever list
```

## Step 8: Verification and Testing

### 8.1 Check Application Status
```bash
# Check if application is running
curl http://localhost:3000/api/health

# Check database connection
curl http://localhost:3000/api/status
```

### 8.2 Test Web Interface
1. **Access Application**:
   - Visit https://your-domain.com
   - Verify homepage loads correctly
   - Test IDE functionality at https://your-domain.com/ide

2. **Test Admin Panel**:
   - Visit https://your-domain.com/admin
   - Verify admin login works
   - Test all admin features

3. **Test API Endpoints**:
   - Check API health endpoint
   - Verify database connectivity
   - Test authentication flows

## Step 9: Monitoring and Maintenance

### 9.1 Log Monitoring
```bash
# View application logs
tail -f logs/combined.log

# View error logs
tail -f logs/err.log

# Monitor PM2 processes
pm2 monit
```

### 9.2 Regular Maintenance
1. **Database Backups**:
   ```bash
   # Create daily database backup
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
   ```

2. **Update Dependencies**:
   ```bash
   # Check for updates
   npm outdated
   
   # Update packages
   npm update
   ```

3. **Monitor Resources**:
   ```bash
   # Check disk usage
   df -h
   
   # Check memory usage
   free -m
   
   # Check CPU usage
   top
   ```

## Troubleshooting

### Common Issues

1. **Application Won't Start**:
   - Check Node.js version compatibility
   - Verify environment variables are set
   - Check database connectivity
   - Review error logs

2. **Database Connection Errors**:
   - Verify DATABASE_URL format
   - Check firewall settings
   - Ensure database server is running
   - Test connection manually

3. **Permission Errors**:
   - Set correct file permissions (755 for directories, 644 for files)
   - Ensure Node.js has execution permissions
   - Check user ownership of files

4. **Memory Issues**:
   - Increase server memory allocation
   - Optimize database queries
   - Enable application caching
   - Monitor memory usage

### Support Resources
- **Documentation**: https://deepblueide.dev/docs
- **Community Forum**: https://deepblueide.dev/community
- **Technical Support**: support@deepblueide.dev
- **GitHub Issues**: https://github.com/your-username/deepblue-octopus-ide/issues

## Security Checklist

- [ ] Environment variables are secure and not exposed
- [ ] Database credentials are encrypted
- [ ] SSL certificate is properly configured
- [ ] CORS origins are restricted to your domain
- [ ] Session secrets are cryptographically secure
- [ ] File permissions are properly set
- [ ] Server firewall is configured
- [ ] Regular security updates are applied
- [ ] Access logs are monitored
- [ ] Backup procedures are in place

## Performance Optimization

1. **Enable Gzip Compression**:
```apache
LoadModule deflate_module modules/mod_deflate.so
<Location />
    SetOutputFilter DEFLATE
    SetEnvIfNoCase Request_URI \.(?:gif|jpe?g|png)$ no-gzip dont-vary
</Location>
```

2. **Configure Caching**:
```apache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
</IfModule>
```

3. **Database Optimization**:
   - Create appropriate indexes
   - Configure connection pooling
   - Enable query optimization
   - Regular database maintenance

This deployment guide ensures a successful installation of the DeepBlue:Octopus IDE on any web hosting service that supports Node.js and PostgreSQL.