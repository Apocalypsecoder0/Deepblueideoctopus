#!/bin/bash

# DeepBlue:Octopus IDE - WHC FTP Post-Install Script
# This script runs after unzipping the deployment package on WHC hosting
# Automatically configures the application and sets up the MySQL database

set -e

echo "🐙 DeepBlue:Octopus IDE - WHC Installation Script"
echo "=================================================="

# Configuration variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR"
LOG_FILE="$APP_DIR/install.log"
DB_SQL_FILE="$APP_DIR/sql/deepblue_octopus_schema.sql"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

log_error() {
    log "${RED}❌ ERROR: $1${NC}"
}

log_success() {
    log "${GREEN}✅ SUCCESS: $1${NC}"
}

log_warning() {
    log "${YELLOW}⚠️  WARNING: $1${NC}"
}

log_info() {
    log "${BLUE}ℹ️  INFO: $1${NC}"
}

# Check if running on WHC hosting
check_whc_environment() {
    log_info "Checking WHC hosting environment..."
    
    if [[ ! -d "/home" ]] || [[ ! -d "/public_html" ]] && [[ ! -d "./public_html" ]]; then
        log_warning "This script is optimized for WHC hosting environment"
    fi
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please contact WHC support to enable Node.js"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    log_success "Node.js found: $NODE_VERSION"
    
    # Check for npm
    if ! command -v npm &> /dev/null; then
        log_error "NPM is not installed"
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    log_success "NPM found: $NPM_VERSION"
}

# Create directory structure
setup_directories() {
    log_info "Setting up directory structure..."
    
    # Create necessary directories
    mkdir -p "$APP_DIR/logs"
    mkdir -p "$APP_DIR/backups"
    mkdir -p "$APP_DIR/tmp"
    mkdir -p "$APP_DIR/sql"
    
    # Set permissions
    chmod 755 "$APP_DIR/logs"
    chmod 755 "$APP_DIR/backups"
    chmod 755 "$APP_DIR/tmp"
    chmod 644 "$APP_DIR"/*.js 2>/dev/null || true
    chmod 755 "$APP_DIR/start.js" 2>/dev/null || true
    
    log_success "Directory structure created"
}

# Generate MySQL schema file
generate_mysql_schema() {
    log_info "Generating MySQL schema file..."
    
    cat > "$DB_SQL_FILE" << 'EOL'
-- DeepBlue:Octopus IDE - MySQL Database Schema
-- Created by WHC Installation Script

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Database: deepblue_octopus_ide
CREATE DATABASE IF NOT EXISTS `deepblue_octopus_ide` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `deepblue_octopus_ide`;

-- Table structure for table `users`
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `profile_picture` varchar(500) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `website` varchar(500) DEFAULT NULL,
  `github_username` varchar(255) DEFAULT NULL,
  `twitter_username` varchar(255) DEFAULT NULL,
  `linkedin_url` varchar(500) DEFAULT NULL,
  `subscription` varchar(50) DEFAULT 'free',
  `beta_access` tinyint(1) DEFAULT 0,
  `beta_access_level` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `projects`
CREATE TABLE `projects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `files`
CREATE TABLE `files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `path` varchar(1000) NOT NULL,
  `content` longtext DEFAULT NULL,
  `language` varchar(50) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `is_directory` tinyint(1) DEFAULT 0,
  `parent_id` int(11) DEFAULT NULL,
  `size` int(11) DEFAULT NULL,
  `last_modified` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_readonly` tinyint(1) DEFAULT 0,
  `encoding` varchar(50) DEFAULT 'utf-8',
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `files_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `sessions`
CREATE TABLE `sessions` (
  `sid` varchar(255) NOT NULL,
  `sess` json NOT NULL,
  `expire` timestamp NOT NULL,
  PRIMARY KEY (`sid`),
  KEY `expire_idx` (`expire`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `admins`
CREATE TABLE `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'admin',
  `department` varchar(100) DEFAULT NULL,
  `permissions` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `subscriptions`
CREATE TABLE `subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `plan` varchar(50) NOT NULL,
  `status` varchar(50) DEFAULT 'active',
  `stripe_customer_id` varchar(255) DEFAULT NULL,
  `stripe_subscription_id` varchar(255) DEFAULT NULL,
  `current_period_start` timestamp NULL DEFAULT NULL,
  `current_period_end` timestamp NULL DEFAULT NULL,
  `cancel_at_period_end` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `support_tickets`
CREATE TABLE `support_tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `priority` varchar(50) DEFAULT 'medium',
  `status` varchar(50) DEFAULT 'open',
  `assigned_to` int(11) DEFAULT NULL,
  `resolution` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `resolved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `assigned_to` (`assigned_to`),
  CONSTRAINT `support_tickets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `support_tickets_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `beta_tokens`
CREATE TABLE `beta_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token` varchar(255) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `access_level` varchar(50) DEFAULT 'basic',
  `usage_count` int(11) DEFAULT 0,
  `max_usage` int(11) DEFAULT 100,
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_used_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `beta_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin123)
INSERT INTO `admins` (`username`, `email`, `password`, `role`, `department`, `is_active`) VALUES
('admin', 'admin@deepblueide.dev', '$2b$10$rOzJZjqvLZKpYE8P8rQ5UeF3h9QG4lJ2fVhCdKpR6lW1pX3kZ2mN6', 'super_admin', 'IT', 1);

-- Insert demo beta tokens
INSERT INTO `beta_tokens` (`token`, `access_level`, `max_usage`, `expires_at`, `is_active`) VALUES
('BETA-2025-DEEPBLUE', 'premium', 1000, '2025-12-31 23:59:59', 1),
('DEV-PREVIEW-001', 'developer', 500, '2025-06-30 23:59:59', 1),
('ADMIN-ACCESS-123', 'admin', 100, '2025-03-31 23:59:59', 1);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_files_project_id ON files(project_id);
CREATE INDEX idx_files_parent_id ON files(parent_id);
CREATE INDEX idx_sessions_expire ON sessions(expire);
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_beta_tokens_token ON beta_tokens(token);
CREATE INDEX idx_beta_tokens_user_id ON beta_tokens(user_id);

EOL

    log_success "MySQL schema file generated: $DB_SQL_FILE"
}

# Create environment configuration
create_environment_config() {
    log_info "Creating environment configuration..."
    
    # Detect domain from SERVER_NAME or use default
    DOMAIN=${SERVER_NAME:-"your-domain.com"}
    
    cat > "$APP_DIR/.env" << EOL
# DeepBlue:Octopus IDE - WHC Production Configuration
# Generated by WHC Installation Script

# Application Configuration
NODE_ENV=production
PORT=3000

# Domain Configuration (Update with your actual domain)
REPLIT_DOMAINS=$DOMAIN,www.$DOMAIN
ISSUER_URL=https://replit.com/oidc

# MySQL Database Configuration (Update with your database credentials)
DATABASE_URL=mysql://your_db_user:your_db_password@localhost:3306/deepblue_octopus_ide
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_db_user
MYSQL_PASSWORD=your_db_password
MYSQL_DATABASE=deepblue_octopus_ide

# Session Security (IMPORTANT: Change this to a secure random string)
SESSION_SECRET=$(openssl rand -base64 32)

# CORS Configuration
CORS_ORIGIN=https://$DOMAIN

# Optional API Keys (Add your keys here)
# OPENAI_API_KEY=your-openai-api-key
# STRIPE_SECRET_KEY=your-stripe-secret-key
# VITE_STRIPE_PUBLIC_KEY=your-stripe-public-key

# Security Configuration
TRUSTED_PROXIES=cloudflare
EOL

    log_success "Environment configuration created"
    log_warning "Please update .env file with your actual database credentials and domain"
}

# Install Node.js dependencies
install_dependencies() {
    log_info "Installing Node.js dependencies..."
    
    cd "$APP_DIR"
    
    # Check if package.json exists
    if [[ ! -f "package.json" ]]; then
        log_error "package.json not found. Please ensure all files were uploaded correctly."
        exit 1
    fi
    
    # Install production dependencies
    npm install --production --no-audit --no-fund 2>&1 | tee -a "$LOG_FILE"
    
    if [[ ${PIPESTATUS[0]} -eq 0 ]]; then
        log_success "Dependencies installed successfully"
    else
        log_error "Failed to install dependencies"
        exit 1
    fi
}

# Setup PM2 configuration
setup_pm2() {
    log_info "Setting up PM2 process manager..."
    
    # Check if PM2 is available
    if ! command -v pm2 &> /dev/null; then
        log_warning "PM2 not found. Installing globally..."
        npm install -g pm2 2>&1 | tee -a "$LOG_FILE"
    fi
    
    # Create PM2 ecosystem file if not exists
    if [[ ! -f "$APP_DIR/ecosystem.config.js" ]]; then
        cat > "$APP_DIR/ecosystem.config.js" << 'EOL'
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
    fi
    
    log_success "PM2 configuration ready"
}

# Create database import instructions
create_database_instructions() {
    log_info "Creating database import instructions..."
    
    cat > "$APP_DIR/DATABASE_IMPORT_INSTRUCTIONS.txt" << EOL
DeepBlue:Octopus IDE - Database Import Instructions
=================================================

The SQL schema file has been created at: sql/deepblue_octopus_schema.sql

To import the database via phpMyAdmin:

1. Log in to your WHC cPanel
2. Open phpMyAdmin
3. Create a new database called 'deepblue_octopus_ide' (if not exists)
4. Select the database
5. Click on the 'Import' tab
6. Click 'Choose File' and select: sql/deepblue_octopus_schema.sql
7. Click 'Go' to import the schema

Database Credentials:
- Database Name: deepblue_octopus_ide
- Update .env file with your MySQL credentials

Default Admin Account:
- Username: admin
- Email: admin@deepblueide.dev
- Password: admin123

Demo Beta Tokens:
- BETA-2025-DEEPBLUE (Premium access)
- DEV-PREVIEW-001 (Developer access)
- ADMIN-ACCESS-123 (Admin access)

After importing, update the .env file with your database credentials and start the application.
EOL

    log_success "Database import instructions created"
}

# Create startup script
create_startup_script() {
    log_info "Creating startup script..."
    
    cat > "$APP_DIR/start-app.sh" << 'EOL'
#!/bin/bash

# DeepBlue:Octopus IDE Startup Script for WHC
echo "🐙 Starting DeepBlue:Octopus IDE..."

# Change to application directory
cd "$(dirname "$0")"

# Check if .env exists
if [[ ! -f ".env" ]]; then
    echo "❌ .env file not found. Please configure your environment variables."
    exit 1
fi

# Load environment variables
source .env

# Check database connection
echo "📊 Testing database connection..."
if ! npm run db:status > /dev/null 2>&1; then
    echo "⚠️  Database connection failed. Please check your database configuration."
fi

# Start application with PM2
if command -v pm2 &> /dev/null; then
    echo "🚀 Starting with PM2..."
    pm2 start ecosystem.config.js
    pm2 save
    echo "✅ Application started with PM2"
    echo "📊 View logs: pm2 logs deepblue-octopus-ide"
    echo "🔄 Restart: pm2 restart deepblue-octopus-ide"
    echo "🛑 Stop: pm2 stop deepblue-octopus-ide"
else
    echo "🚀 Starting with Node.js..."
    nohup node start.js > logs/app.log 2>&1 &
    echo $! > app.pid
    echo "✅ Application started (PID: $(cat app.pid))"
    echo "📊 View logs: tail -f logs/app.log"
fi

echo ""
echo "🌐 Your DeepBlue:Octopus IDE should be running at:"
echo "   https://your-domain.com"
echo "   Admin Portal: https://your-domain.com/admin"
echo ""
echo "📖 For support, visit: https://deepblueide.dev/support"
EOL

    chmod +x "$APP_DIR/start-app.sh"
    log_success "Startup script created: start-app.sh"
}

# Create backup script
create_backup_script() {
    log_info "Creating backup script..."
    
    cat > "$APP_DIR/backup.sh" << 'EOL'
#!/bin/bash

# DeepBlue:Octopus IDE Backup Script
BACKUP_DIR="./backups"
DATE=$(date +"%Y%m%d_%H%M%S")

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database
if [[ -f ".env" ]]; then
    source .env
    echo "📊 Creating database backup..."
    mysqldump -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" > "$BACKUP_DIR/database_backup_$DATE.sql"
    gzip "$BACKUP_DIR/database_backup_$DATE.sql"
    echo "✅ Database backup created: database_backup_$DATE.sql.gz"
fi

# Backup application files
echo "📁 Creating file backup..."
tar -czf "$BACKUP_DIR/app_backup_$DATE.tar.gz" \
    --exclude=backups \
    --exclude=node_modules \
    --exclude=logs \
    --exclude=tmp \
    .

echo "✅ Application backup created: app_backup_$DATE.tar.gz"

# Clean old backups (keep last 7 days)
find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete

echo "🎉 Backup completed successfully!"
EOL

    chmod +x "$APP_DIR/backup.sh"
    log_success "Backup script created: backup.sh"
}

# Create status check script
create_status_script() {
    log_info "Creating status check script..."
    
    cat > "$APP_DIR/status.sh" << 'EOL'
#!/bin/bash

# DeepBlue:Octopus IDE Status Check Script
echo "🐙 DeepBlue:Octopus IDE Status Check"
echo "=================================="

# Check if application is running
if command -v pm2 &> /dev/null; then
    echo "📊 PM2 Status:"
    pm2 status deepblue-octopus-ide
    echo ""
    echo "📈 Memory Usage:"
    pm2 monit deepblue-octopus-ide --lines 5
elif [[ -f "app.pid" ]]; then
    PID=$(cat app.pid)
    if ps -p "$PID" > /dev/null; then
        echo "✅ Application is running (PID: $PID)"
    else
        echo "❌ Application is not running"
    fi
else
    echo "❓ Application status unknown"
fi

echo ""
echo "📊 System Resources:"
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')"
echo "Memory Usage: $(free -m | awk 'NR==2{printf "%.1f%%\n", $3*100/$2}')"
echo "Disk Usage: $(df -h . | awk 'NR==2{print $5}')"

echo ""
echo "🌐 Network Status:"
if curl -s --head http://localhost:3000 | head -n 1 | grep "200 OK" > /dev/null; then
    echo "✅ Application responding on port 3000"
else
    echo "❌ Application not responding on port 3000"
fi

echo ""
echo "📁 Log Files:"
if [[ -d "logs" ]]; then
    ls -la logs/
else
    echo "No log directory found"
fi
EOL

    chmod +x "$APP_DIR/status.sh"
    log_success "Status check script created: status.sh"
}

# Final setup and instructions
final_setup() {
    log_info "Completing installation..."
    
    # Create installation complete marker
    cat > "$APP_DIR/INSTALLATION_COMPLETE.txt" << EOL
DeepBlue:Octopus IDE - Installation Complete
==========================================

Installation Date: $(date)
Installed By: WHC Installation Script
Version: 2.1.0 Alpha

Next Steps:
1. Import the database using phpMyAdmin (see DATABASE_IMPORT_INSTRUCTIONS.txt)
2. Update .env file with your database credentials and domain
3. Run: ./start-app.sh
4. Visit your website to test the application

Files Created:
- .env (Environment configuration)
- sql/deepblue_octopus_schema.sql (Database schema)
- start-app.sh (Application startup script)
- backup.sh (Backup utility)
- status.sh (Status checker)
- logs/ (Log directory)
- backups/ (Backup directory)

Support:
- Documentation: https://deepblueide.dev/docs
- Support Email: support@deepblueide.dev
- Community: https://deepblueide.dev/community

Admin Portal Access:
- URL: https://your-domain.com/admin
- Username: admin
- Password: admin123 (CHANGE THIS IMMEDIATELY)

Beta Access Tokens:
- BETA-2025-DEEPBLUE
- DEV-PREVIEW-001
- ADMIN-ACCESS-123
EOL

    # Set final permissions
    chmod 644 "$APP_DIR/.env"
    chmod 755 "$APP_DIR"/*.sh 2>/dev/null || true
    chmod 644 "$APP_DIR"/*.txt
    chmod 644 "$APP_DIR"/*.json
    
    log_success "Installation completed successfully!"
}

# Print final instructions
print_instructions() {
    echo ""
    echo "🎉 DeepBlue:Octopus IDE Installation Complete!"
    echo "=============================================="
    echo ""
    echo "📋 Next Steps:"
    echo "1. Import database: Follow instructions in DATABASE_IMPORT_INSTRUCTIONS.txt"
    echo "2. Configure environment: Edit .env file with your credentials"
    echo "3. Start application: ./start-app.sh"
    echo "4. Test website: Visit https://your-domain.com"
    echo ""
    echo "🔧 Management Commands:"
    echo "- Start: ./start-app.sh"
    echo "- Status: ./status.sh"
    echo "- Backup: ./backup.sh"
    echo "- Logs: tail -f logs/combined.log"
    echo ""
    echo "🔐 Admin Access:"
    echo "- URL: https://your-domain.com/admin"
    echo "- Username: admin"
    echo "- Password: admin123 (CHANGE IMMEDIATELY)"
    echo ""
    echo "📞 Support:"
    echo "- Email: support@deepblueide.dev"
    echo "- Documentation: https://deepblueide.dev/docs"
    echo ""
    echo "⚠️  Important Security Notes:"
    echo "- Change default admin password immediately"
    echo "- Update .env with secure SESSION_SECRET"
    echo "- Configure proper database credentials"
    echo "- Enable HTTPS/SSL certificate"
    echo ""
}

# Main installation process
main() {
    log_info "Starting WHC installation process..."
    log_info "Installation directory: $APP_DIR"
    
    # Check environment
    check_whc_environment
    
    # Setup application
    setup_directories
    generate_mysql_schema
    create_environment_config
    install_dependencies
    setup_pm2
    
    # Create utility scripts
    create_database_instructions
    create_startup_script
    create_backup_script
    create_status_script
    
    # Final setup
    final_setup
    print_instructions
    
    log_success "WHC installation script completed successfully!"
    echo "📄 Installation log saved to: $LOG_FILE"
}

# Error handling
trap 'log_error "Installation failed at line $LINENO. Check $LOG_FILE for details."; exit 1' ERR

# Run main installation
main "$@"