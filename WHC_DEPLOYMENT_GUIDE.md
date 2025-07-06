# DeepBlue:Octopus IDE - WHC (Web Hosting Company) Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying DeepBlue:Octopus IDE on Web Hosting Company (WHC) shared hosting using FTP and phpMyAdmin database setup.

## Prerequisites

### Hosting Requirements
- **WHC Shared/Business Hosting Plan** with Node.js support
- **MySQL Database** access via phpMyAdmin
- **FTP/SFTP Access** to upload files
- **SSH Access** (for advanced management)
- **SSL Certificate** (Let's Encrypt or custom)
- **Domain Name** configured and pointing to WHC servers

### Minimum Server Requirements
- Node.js 18+ support
- MySQL 8.0+ or MariaDB 10.5+
- 1GB storage space
- 512MB RAM allocation
- SSL/TLS support

## Step 1: Prepare Deployment Package

### 1.1 Build and Package Application
```bash
# On your local development machine
git clone https://github.com/your-username/deepblue-octopus-ide.git
cd deepblue-octopus-ide

# Run the automated deployment preparation
./deploy.sh

# This creates deployment-package/ with all necessary files
```

### 1.2 Create Deployment Archive
```bash
# Create ZIP file for easy upload
cd deployment-package
zip -r ../deepblue-octopus-whc-deployment.zip .
cd ..
```

## Step 2: WHC cPanel Setup

### 2.1 Enable Node.js Application
1. **Log in to WHC cPanel**
2. **Navigate to "Software" → "Node.js Selector"**
3. **Create New Application:**
   - Node.js Version: 18.x or higher
   - Application Mode: Production
   - Application Root: public_html/ide (or your preferred directory)
   - Application URL: your-domain.com/ide (or root domain)
   - Application Startup File: start.js

### 2.2 Create MySQL Database
1. **Navigate to "Databases" → "MySQL Databases"**
2. **Create Database:**
   - Database Name: `your_username_deepblue` (WHC adds your username prefix)
   - Character Set: utf8mb4_unicode_ci
3. **Create Database User:**
   - Username: `your_username_dbuser`
   - Password: Generate strong password (save this!)
4. **Add User to Database:**
   - Select user and database
   - Grant ALL PRIVILEGES

### 2.3 Configure Domain/Subdomain
1. **Navigate to "Domains" → "Subdomains" (if using subdomain)**
2. **Create Subdomain:**
   - Subdomain: ide
   - Domain: your-domain.com
   - Document Root: public_html/ide
3. **Or use main domain by uploading to public_html/**

## Step 3: File Upload via FTP

### 3.1 Connect to WHC FTP
**Using FileZilla (Recommended):**
- Host: ftp.your-domain.com (or IP provided by WHC)
- Username: Your cPanel username
- Password: Your cPanel password
- Port: 21 (FTP) or 22 (SFTP)

### 3.2 Upload Deployment Package
1. **Navigate to Target Directory:**
   - For subdomain: `/public_html/ide/`
   - For main domain: `/public_html/`

2. **Upload and Extract:**
   - Upload `deepblue-octopus-whc-deployment.zip`
   - Use cPanel File Manager to extract the ZIP file
   - Delete the ZIP file after extraction

3. **Verify File Structure:**
```
public_html/ide/
├── start.js
├── index.js
├── package.json
├── .env.template
├── ecosystem.config.js
├── .htaccess
├── install-whc.sh
├── sql/
├── logs/
├── public/
└── node_modules/ (will be created after npm install)
```

## Step 4: Database Import via phpMyAdmin

### 4.1 Run Installation Script
```bash
# SSH into your WHC server
ssh your_username@your-server.com
cd public_html/ide

# Run the WHC installation script
./install-whc.sh
```

This script will:
- Generate MySQL schema file (`sql/deepblue_octopus_schema.sql`)
- Create environment configuration
- Install Node.js dependencies
- Setup PM2 process manager
- Create utility scripts

### 4.2 Import Database Schema
1. **Open phpMyAdmin from cPanel**
2. **Select Your Database:** `your_username_deepblue`
3. **Import Schema:**
   - Click "Import" tab
   - Choose file: `sql/deepblue_octopus_schema.sql`
   - Click "Go" to import
4. **Verify Tables Created:**
   - users, projects, files, sessions, admins, subscriptions, support_tickets, beta_tokens

### 4.3 Verify Database Import
```sql
-- Check if tables were created
SHOW TABLES;

-- Verify admin user exists
SELECT username, email, role FROM admins;

-- Check beta tokens
SELECT token, access_level FROM beta_tokens WHERE is_active = 1;
```

## Step 5: Environment Configuration

### 5.1 Update Environment Variables
```bash
# Edit the .env file
nano .env

# Update with your actual values:
DATABASE_URL=mysql://your_username_dbuser:your_password@localhost:3306/your_username_deepblue
MYSQL_HOST=localhost
MYSQL_USER=your_username_dbuser
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=your_username_deepblue
REPLIT_DOMAINS=your-domain.com,www.your-domain.com
SESSION_SECRET=your-32-character-secure-secret
```

### 5.2 Test Database Connection
```bash
# Test database connectivity
mysql -u your_username_dbuser -p your_username_deepblue
# Enter password when prompted

# If successful, exit:
exit
```

## Step 6: Application Deployment

### 6.1 Install Dependencies
```bash
# Navigate to application directory
cd public_html/ide

# Install production dependencies
npm install --production

# Verify installation
npm list --depth=0
```

### 6.2 Start Application
```bash
# Start application using the generated script
./start-app.sh

# Or manually with PM2
pm2 start ecosystem.config.js

# Or with Node.js directly
nohup node start.js > logs/app.log 2>&1 &
```

### 6.3 Verify Application Status
```bash
# Check application status
./status.sh

# View logs
tail -f logs/combined.log

# Test application response
curl -I http://localhost:3000
```

## Step 7: WHC-Specific Configuration

### 7.1 Configure .htaccess for Apache
The installation script creates an `.htaccess` file with:
```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Proxy API requests to Node.js
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ http://localhost:3000/api/$1 [P,L]

# Serve static files, fallback to index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
```

### 7.2 Configure SSL Certificate
1. **Navigate to "Security" → "SSL/TLS"**
2. **Enable Let's Encrypt Certificate:**
   - Select your domain
   - Enable "Auto-renew"
   - Force HTTPS redirect

## Step 8: WHC Optimization

### 8.1 Performance Optimization
```bash
# Enable Node.js application caching
# In Node.js Selector, enable:
# - Application caching
# - Startup file optimization
# - Environment variable caching
```

### 8.2 Resource Monitoring
```bash
# Check resource usage
./status.sh

# Monitor application logs
tail -f logs/combined.log

# Check MySQL performance
mysql -u your_username_dbuser -p -e "SHOW PROCESSLIST;"
```

## Step 9: Testing and Verification

### 9.1 Test Website Functionality
1. **Visit Homepage:** `https://your-domain.com`
2. **Test IDE:** `https://your-domain.com/ide`
3. **Admin Portal:** `https://your-domain.com/admin`
   - Username: admin
   - Password: admin123 (CHANGE IMMEDIATELY)

### 9.2 Test Beta Access
1. **Visit:** `https://your-domain.com/beta`
2. **Use Demo Tokens:**
   - BETA-2025-DEEPBLUE (Premium)
   - DEV-PREVIEW-001 (Developer)
   - ADMIN-ACCESS-123 (Admin)

### 9.3 Verify API Endpoints
```bash
# Test API health
curl https://your-domain.com/api/health

# Test database connectivity
curl https://your-domain.com/api/status

# Test admin endpoints
curl https://your-domain.com/api/admin/stats
```

## Step 10: Production Maintenance

### 10.1 Regular Backups
```bash
# Run backup script (created by installation)
./backup.sh

# This creates:
# - Database backup: backups/database_backup_YYYYMMDD_HHMMSS.sql.gz
# - Application backup: backups/app_backup_YYYYMMDD_HHMMSS.tar.gz
```

### 10.2 Log Management
```bash
# View application logs
tail -f logs/combined.log

# View error logs only
tail -f logs/err.log

# Rotate logs (add to cron)
logrotate -f /path/to/logrotate.conf
```

### 10.3 Security Maintenance
1. **Change Default Passwords:**
   ```sql
   -- Update admin password
   UPDATE admins SET password = '$2b$10$newhashedpassword' WHERE username = 'admin';
   ```

2. **Update Dependencies:**
   ```bash
   npm audit
   npm update
   ```

3. **Monitor Security:**
   ```bash
   # Check for suspicious activity
   grep "401\|403\|404" logs/combined.log | tail -20
   ```

## Step 11: Troubleshooting Common Issues

### 11.1 Application Won't Start
```bash
# Check Node.js version
node --version

# Check permissions
ls -la start.js
chmod +x start.js

# Check environment variables
cat .env

# Test manual start
node start.js
```

### 11.2 Database Connection Issues
```bash
# Test MySQL connection
mysql -u your_username_dbuser -p your_username_deepblue

# Check database exists
mysql -u your_username_dbuser -p -e "SHOW DATABASES;"

# Verify user permissions
mysql -u your_username_dbuser -p -e "SHOW GRANTS;"
```

### 11.3 WHC-Specific Issues
1. **Node.js Not Working:**
   - Contact WHC support to enable Node.js
   - Verify hosting plan supports Node.js applications

2. **Memory/CPU Limits:**
   - Check WHC resource usage in cPanel
   - Upgrade hosting plan if needed

3. **Port Access Issues:**
   - Ensure port 3000 is accessible
   - Configure proxy correctly in .htaccess

## Step 12: WHC Support and Resources

### 12.1 WHC Support Channels
- **Support Ticket:** Submit via cPanel
- **Live Chat:** Available 24/7
- **Phone Support:** Check WHC website
- **Knowledge Base:** https://whc.ca/help

### 12.2 Required Information for Support
- **Account Username:** your_username
- **Domain Name:** your-domain.com
- **Error Messages:** Copy exact error text
- **Log Files:** Share relevant log entries
- **Screenshots:** Include when helpful

### 12.3 DeepBlue:Octopus Support
- **Email:** support@deepblueide.dev
- **Documentation:** https://deepblueide.dev/docs
- **Community:** https://deepblueide.dev/community
- **GitHub Issues:** For technical bugs

## Step 13: Post-Deployment Checklist

### 13.1 Security Checklist
- [ ] Changed default admin password
- [ ] Updated SESSION_SECRET in .env
- [ ] Enabled HTTPS/SSL certificate
- [ ] Configured proper database permissions
- [ ] Set up regular backups
- [ ] Configured log rotation
- [ ] Updated all default passwords and tokens

### 13.2 Performance Checklist
- [ ] Verified Node.js application is running
- [ ] Tested all major features (IDE, Admin, Beta access)
- [ ] Checked page load times
- [ ] Verified database performance
- [ ] Configured caching where possible
- [ ] Set up monitoring alerts

### 13.3 Functionality Checklist
- [ ] Homepage loads correctly
- [ ] IDE functionality works
- [ ] Admin portal is accessible
- [ ] User registration/login works
- [ ] Beta access tokens function
- [ ] Database operations succeed
- [ ] API endpoints respond correctly

## Summary

This comprehensive guide provides everything needed to successfully deploy DeepBlue:Octopus IDE on WHC hosting. The automated installation script (`install-whc.sh`) handles most of the configuration, while this guide provides the complete context and troubleshooting information needed for a production deployment.

### Key Benefits of WHC Deployment:
- **Automated Setup:** Installation script handles complex configuration
- **Database Integration:** Complete MySQL setup with phpMyAdmin
- **Professional Management:** PM2 process management and monitoring
- **Security Features:** SSL, secure headers, and authentication
- **Backup Systems:** Automated backup and recovery procedures
- **WHC Integration:** Optimized for WHC hosting environment

For additional support or custom deployment requirements, contact the DeepBlue:Octopus support team at support@deepblueide.dev.