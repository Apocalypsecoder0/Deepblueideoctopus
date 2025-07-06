# Admin Portal Production Security Guide

## Overview

The DeepBlue:Octopus IDE admin portal now features **multi-layer authentication** with directory-level password protection to prevent unauthorized access from humans, bots, and search crawlers.

## Security Architecture

### 3-Layer Authentication System

1. **Layer 1: Directory Authentication**
   - Server-level directory access protection
   - Configurable via environment variables
   - HTTP-only cookies with 30-minute timeout
   - Protection against automated crawlers and bots

2. **Layer 2: PIN Verification**
   - 6-digit security PIN
   - Configurable via environment variables
   - Rate limiting with account lockout

3. **Layer 3: Admin Credentials**
   - Username and password authentication
   - Session management with localStorage persistence
   - Role-based access control

## Production Configuration

### Environment Variables

Create a `.env.production` file with the following variables:

```env
# Directory Authentication (Layer 1)
ADMIN_DIR_USERNAME=your_directory_username
ADMIN_DIR_PASSWORD=your_secure_directory_password

# Admin PIN (Layer 2)
ADMIN_PIN=your_6_digit_pin

# Admin Credentials (Layer 3)
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_admin_password
ADMIN_EMAIL=admin@yourdomain.com

# Session Security
SESSION_SECRET=your_ultra_secure_session_secret_key_here

# Database
DATABASE_URL=your_production_database_url

# Environment
NODE_ENV=production
```

### Security Recommendations

#### Directory Authentication
- **Username**: Use a unique, non-obvious directory username (not "admin")
- **Password**: Minimum 16 characters with mixed case, numbers, and symbols
- **Example**: `dir_admin_2025` / `SecureDirectoryPass!2025#Admin`

#### Admin PIN
- **Format**: 6-digit numeric PIN
- **Security**: Avoid sequential numbers (123456) or repeated digits (111111)
- **Example**: `847293`, `519607`

#### Admin Credentials
- **Username**: Professional username (not "admin")
- **Password**: Minimum 20 characters, highly secure
- **Example**: `system_administrator` / `UltraSecureAdminPass2025!@#$`

#### Session Secret
- **Length**: Minimum 64 characters
- **Content**: Random string with high entropy
- **Generation**: Use a cryptographic random generator
- **Example**: `crypto.randomBytes(64).toString('hex')`

## VPS/Server Deployment

### Apache/Nginx Configuration

#### Apache .htaccess (Alternative Protection)
```apache
# Add to admin directory
AuthType Basic
AuthName "Admin Directory Access"
AuthUserFile /path/to/.htpasswd
Require valid-user

# Additional security headers
Header always set X-Frame-Options DENY
Header always set X-Content-Type-Options nosniff
Header always set Referrer-Policy strict-origin-when-cross-origin
```

#### Nginx Configuration
```nginx
location /admin {
    auth_basic "Admin Directory Access";
    auth_basic_user_file /etc/nginx/.htpasswd;
    
    # Additional security
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy strict-origin-when-cross-origin;
    
    try_files $uri $uri/ /index.html;
}
```

### Forms Authentication Mode

For shared hosting or VPS environments, you can enable forms authentication:

#### IIS web.config (Windows)
```xml
<configuration>
  <system.web>
    <authentication mode="Forms">
      <forms loginUrl="~/admin/directory-auth" timeout="30" />
    </authentication>
    <authorization>
      <deny users="?" />
    </authorization>
  </system.web>
</configuration>
```

## Security Features

### Crawler Protection
- **User-Agent Filtering**: Blocks common search bot patterns
- **Rate Limiting**: Prevents automated access attempts
- **IP Whitelisting**: Optional restriction to specific IP ranges
- **CAPTCHA Integration**: Optional human verification

### Session Management
- **HTTP-Only Cookies**: Prevents XSS access to session tokens
- **Secure Cookies**: HTTPS-only in production
- **SameSite Strict**: CSRF protection
- **Automatic Timeout**: 30-minute inactivity logout

### Attack Prevention
- **Brute Force Protection**: Account lockout after 3 failed attempts
- **CSRF Protection**: Token-based request validation
- **SQL Injection**: Parameterized queries and ORM protection
- **XSS Prevention**: Input sanitization and CSP headers

## Monitoring and Logging

### Security Logs
```javascript
// Log all authentication attempts
console.log('Directory auth attempt:', { 
  username, 
  ip: req.ip, 
  userAgent: req.headers['user-agent'],
  timestamp: new Date().toISOString() 
});
```

### Alert System
- Failed authentication attempts
- Unusual access patterns
- IP-based anomalies
- Session hijacking attempts

## Production Deployment Steps

### 1. Environment Setup
```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit with secure values
nano .env.production

# Set proper file permissions
chmod 600 .env.production
```

### 2. Database Configuration
```bash
# Run database migrations
npm run db:push

# Verify database connection
npm run db:status
```

### 3. Security Hardening
```bash
# Install security headers middleware
npm install helmet

# Configure SSL/TLS certificates
certbot --nginx -d yourdomain.com

# Set up firewall rules
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

### 4. Application Deployment
```bash
# Build production application
npm run build

# Start with PM2 process manager
pm2 start ecosystem.config.js --env production

# Enable PM2 startup
pm2 startup
pm2 save
```

### 5. Monitoring Setup
```bash
# Configure log rotation
logrotate -d /etc/logrotate.d/deepblue-ide

# Set up monitoring alerts
# Configure with DataDog, New Relic, or similar
```

## Security Checklist

### Pre-Deployment
- [ ] All environment variables configured with secure values
- [ ] Database connection secured with SSL
- [ ] Session secrets generated with high entropy
- [ ] HTTPS certificates installed and configured
- [ ] Firewall rules configured appropriately

### Post-Deployment
- [ ] Admin portal accessible only via HTTPS
- [ ] Directory authentication functioning correctly
- [ ] All three authentication layers working in sequence
- [ ] Session timeouts configured appropriately
- [ ] Logging and monitoring active

### Ongoing Maintenance
- [ ] Regular security updates applied
- [ ] Log files monitored for suspicious activity
- [ ] Access credentials rotated quarterly
- [ ] Backup procedures tested monthly
- [ ] Security assessments performed annually

## Emergency Procedures

### Lockout Recovery
If you're locked out of the admin portal:

1. **SSH Access**: Connect to server via SSH
2. **Reset Database**: Clear admin sessions in database
3. **Environment Reset**: Verify environment variables
4. **Service Restart**: Restart the application service

```bash
# Clear admin sessions
psql $DATABASE_URL -c "DELETE FROM sessions WHERE sess LIKE '%admin%';"

# Restart application
pm2 restart deepblue-ide
```

### Security Incident Response
1. **Immediate**: Disable admin portal access
2. **Investigation**: Review logs for unauthorized access
3. **Containment**: Change all admin credentials
4. **Recovery**: Restore from clean backup if necessary
5. **Prevention**: Update security measures

## Performance Considerations

### Session Storage
- Use Redis or database-backed sessions for scalability
- Implement session clustering for multiple server instances
- Configure appropriate session cleanup intervals

### Rate Limiting
- Implement progressive delays for failed attempts
- Use distributed rate limiting for load-balanced deployments
- Monitor and adjust thresholds based on usage patterns

## Compliance

### Data Protection
- GDPR compliance for EU users
- Session data encryption at rest
- Audit trail maintenance
- Right to be forgotten implementation

### Security Standards
- OWASP Top 10 compliance
- PCI DSS for payment processing
- SOC 2 Type II for enterprise clients
- ISO 27001 alignment

---

**Note**: This guide provides comprehensive security measures for production deployment. Adjust configurations based on your specific hosting environment and security requirements.

**Support**: For security questions or incident response, contact: admin@deepblueide.dev