# DeepBlue:Octopus IDE - MySQL Database Setup Guide

## Overview
This guide provides comprehensive instructions for setting up MySQL as an alternative to PostgreSQL for the DeepBlue:Octopus IDE. The application supports both database systems with minimal configuration changes.

## Prerequisites

### System Requirements
- MySQL 8.0+ or MariaDB 10.5+
- Node.js 18+ with MySQL2 driver
- Administrative access to MySQL server
- SSL support (recommended for production)

### Required Packages
```bash
# Install MySQL2 driver
npm install mysql2
npm install @types/mysql2 --save-dev

# Install Drizzle MySQL adapter
npm install drizzle-orm drizzle-kit
```

## Step 1: MySQL Server Installation

### 1.1 Ubuntu/Debian Installation
```bash
# Update package repository
sudo apt update

# Install MySQL Server
sudo apt install mysql-server mysql-client

# Secure MySQL installation
sudo mysql_secure_installation

# Start and enable MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 1.2 CentOS/RHEL Installation
```bash
# Install MySQL repository
sudo dnf install mysql-server mysql

# Start and enable MySQL service
sudo systemctl start mysqld
sudo systemctl enable mysqld

# Get temporary root password
sudo grep 'temporary password' /var/log/mysqld.log

# Secure installation
sudo mysql_secure_installation
```

### 1.3 Windows Installation
1. Download MySQL Installer from [mysql.com](https://dev.mysql.com/downloads/installer/)
2. Run installer and select "Developer Default" configuration
3. Configure MySQL Server with strong root password
4. Complete installation and start MySQL service

### 1.4 macOS Installation
```bash
# Using Homebrew
brew install mysql

# Start MySQL service
brew services start mysql

# Secure installation
mysql_secure_installation
```

## Step 2: Database and User Creation

### 2.1 Connect to MySQL
```bash
# Connect as root
mysql -u root -p
```

### 2.2 Create Database and User
```sql
-- Create database for DeepBlue:Octopus IDE
CREATE DATABASE deepblue_octopus_ide 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Create dedicated user
CREATE USER 'deepblue_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';
CREATE USER 'deepblue_user'@'%' IDENTIFIED BY 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON deepblue_octopus_ide.* TO 'deepblue_user'@'localhost';
GRANT ALL PRIVILEGES ON deepblue_octopus_ide.* TO 'deepblue_user'@'%';

-- Apply privileges
FLUSH PRIVILEGES;

-- Verify database creation
SHOW DATABASES;
USE deepblue_octopus_ide;
SHOW TABLES;
```

### 2.3 Configure Remote Access (if needed)
```sql
-- Allow remote connections
UPDATE mysql.user SET host='%' WHERE user='deepblue_user';
FLUSH PRIVILEGES;
```

Edit MySQL configuration file:
```bash
# Ubuntu/Debian
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# CentOS/RHEL
sudo nano /etc/my.cnf

# Add or modify:
bind-address = 0.0.0.0
port = 3306
```

Restart MySQL service:
```bash
sudo systemctl restart mysql
```

## Step 3: Application Configuration

### 3.1 Update Database Configuration
Create `server/mysql-db.ts`:
```typescript
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

if (!process.env.MYSQL_URL && !process.env.DATABASE_URL) {
  throw new Error(
    "MYSQL_URL or DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create MySQL connection
const connection = mysql.createConnection({
  uri: process.env.MYSQL_URL || process.env.DATABASE_URL,
  // Alternative configuration
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'deepblue_user',
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || 'deepblue_octopus_ide',
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  charset: 'utf8mb4',
  timezone: '+00:00',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});

export const db = drizzle(connection, { schema, mode: 'default' });
export { connection };
```

### 3.2 Update Schema for MySQL
Create `shared/mysql-schema.ts`:
```typescript
import {
  mysqlTable,
  serial,
  varchar,
  text,
  boolean,
  timestamp,
  json,
  int,
  index,
  primaryKey,
  unique
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// Users table
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profilePicture: varchar("profile_picture", { length: 500 }),
  bio: text("bio"),
  location: varchar("location", { length: 255 }),
  website: varchar("website", { length: 500 }),
  githubUsername: varchar("github_username", { length: 255 }),
  twitterUsername: varchar("twitter_username", { length: 255 }),
  linkedinUrl: varchar("linkedin_url", { length: 500 }),
  subscription: varchar("subscription", { length: 50 }).default('free'),
  betaAccess: boolean("beta_access").default(false),
  betaAccessLevel: varchar("beta_access_level", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  lastLoginAt: timestamp("last_login_at")
});

// Projects table
export const projects = mysqlTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  userId: int("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});

// Files table
export const files = mysqlTable("files", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  path: varchar("path", { length: 1000 }).notNull(),
  content: text("content"),
  language: varchar("language", { length: 50 }).notNull(),
  projectId: int("project_id").references(() => projects.id),
  isDirectory: boolean("is_directory").default(false),
  parentId: int("parent_id"),
  size: int("size"),
  lastModified: timestamp("last_modified").defaultNow().onUpdateNow(),
  isReadonly: boolean("is_readonly").default(false),
  encoding: varchar("encoding", { length: 50 }).default('utf-8')
}, (table) => ({
  projectIdIdx: index("project_id_idx").on(table.projectId),
  parentIdIdx: index("parent_id_idx").on(table.parentId)
}));

// Sessions table for authentication
export const sessions = mysqlTable("sessions", {
  sid: varchar("sid", { length: 255 }).primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire").notNull()
}, (table) => ({
  expireIdx: index("expire_idx").on(table.expire)
}));

// Admin tables
export const admins = mysqlTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default('admin'),
  department: varchar("department", { length: 100 }),
  permissions: json("permissions"),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});

// Subscriptions table
export const subscriptions = mysqlTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: int("user_id").references(() => users.id),
  plan: varchar("plan", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).default('active'),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});

// Support tickets table
export const supportTickets = mysqlTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: int("user_id").references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  priority: varchar("priority", { length: 50 }).default('medium'),
  status: varchar("status", { length: 50 }).default('open'),
  assignedTo: int("assigned_to").references(() => admins.id),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  resolvedAt: timestamp("resolved_at")
});

// Beta access tokens
export const betaTokens = mysqlTable("beta_tokens", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  userId: int("user_id").references(() => users.id),
  accessLevel: varchar("access_level", { length: 50 }).default('basic'),
  usageCount: int("usage_count").default(0),
  maxUsage: int("max_usage").default(100),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at")
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  subscriptions: many(subscriptions),
  supportTickets: many(supportTickets),
  betaTokens: many(betaTokens)
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id]
  }),
  files: many(files)
}));

export const filesRelations = relations(files, ({ one }) => ({
  project: one(projects, {
    fields: [files.projectId],
    references: [projects.id]
  })
}));

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type File = typeof files.$inferSelect;
export type InsertFile = typeof files.$inferInsert;
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;
export type BetaToken = typeof betaTokens.$inferSelect;
export type InsertBetaToken = typeof betaTokens.$inferInsert;
```

### 3.3 Create MySQL Drizzle Configuration
Create `drizzle-mysql.config.ts`:
```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/mysql-schema.ts",
  out: "./migrations/mysql",
  driver: "mysql2",
  dbCredentials: {
    connectionString: process.env.MYSQL_URL || process.env.DATABASE_URL || "",
    // Alternative configuration
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT || "3306"),
    user: process.env.MYSQL_USER || "deepblue_user",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "deepblue_octopus_ide",
    ssl: process.env.NODE_ENV === "production"
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

### 3.4 Environment Variables
Update your `.env` file:
```env
# MySQL Configuration (Alternative to PostgreSQL)
MYSQL_URL=mysql://deepblue_user:your_password@localhost:3306/deepblue_octopus_ide
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=deepblue_user
MYSQL_PASSWORD=your_secure_password_here
MYSQL_DATABASE=deepblue_octopus_ide

# Or use generic DATABASE_URL (works with both PostgreSQL and MySQL)
DATABASE_URL=mysql://deepblue_user:your_password@localhost:3306/deepblue_octopus_ide

# Application Configuration
NODE_ENV=development
SESSION_SECRET=your-super-secure-session-secret-key
REPLIT_DOMAINS=localhost:5000,your-domain.com

# Optional API Keys
OPENAI_API_KEY=your-openai-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
VITE_STRIPE_PUBLIC_KEY=your-stripe-public-key
```

## Step 4: Database Migration and Initialization

### 4.1 Generate Migration Files
```bash
# Generate MySQL migration
npx drizzle-kit generate:mysql --config=drizzle-mysql.config.ts

# Push schema to MySQL database
npx drizzle-kit push:mysql --config=drizzle-mysql.config.ts

# Check migration status
npx drizzle-kit status --config=drizzle-mysql.config.ts
```

### 4.2 Alternative Manual Schema Creation
If you prefer to create tables manually:
```sql
-- Connect to MySQL
mysql -u deepblue_user -p deepblue_octopus_ide

-- Create tables manually
SOURCE ./migrations/mysql/schema.sql;
```

### 4.3 Verify Database Setup
```bash
# Test database connection
node -e "
const mysql = require('mysql2/promise');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'deepblue_user',
  password: 'your_password',
  database: 'deepblue_octopus_ide'
});
connection.execute('SELECT 1 as test').then(() => {
  console.log('✅ MySQL connection successful');
  process.exit(0);
}).catch(err => {
  console.error('❌ MySQL connection failed:', err);
  process.exit(1);
});
"
```

## Step 5: Application Updates

### 5.1 Update Package.json Scripts
```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "start": "NODE_ENV=production node dist/index.js",
    "build": "vite build",
    "build:server": "esbuild server/index.ts --bundle --platform=node --outfile=dist/index.js",
    "db:generate": "drizzle-kit generate:mysql --config=drizzle-mysql.config.ts",
    "db:push": "drizzle-kit push:mysql --config=drizzle-mysql.config.ts",
    "db:status": "drizzle-kit status --config=drizzle-mysql.config.ts",
    "db:migrate": "drizzle-kit migrate --config=drizzle-mysql.config.ts",
    "mysql:generate": "drizzle-kit generate:mysql --config=drizzle-mysql.config.ts",
    "mysql:push": "drizzle-kit push:mysql --config=drizzle-mysql.config.ts",
    "mysql:status": "drizzle-kit status --config=drizzle-mysql.config.ts"
  }
}
```

### 5.2 Update Server Index File
Modify `server/index.ts` to support MySQL:
```typescript
import express from "express";
import { registerRoutes } from "./routes";

// Import database based on environment
let db;
if (process.env.DATABASE_TYPE === 'mysql' || process.env.MYSQL_URL) {
  db = require('./mysql-db').db;
} else {
  db = require('./db').db;
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

registerRoutes(app).then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🐙 DeepBlue:Octopus IDE server running on port ${PORT}`);
    console.log(`📊 Database: ${process.env.DATABASE_TYPE === 'mysql' ? 'MySQL' : 'PostgreSQL'}`);
  });
}).catch(console.error);
```

## Step 6: Production Deployment with MySQL

### 6.1 Cloud MySQL Services

#### AWS RDS MySQL
```env
MYSQL_URL=mysql://username:password@your-rds-endpoint:3306/deepblue_octopus_ide
```

#### Google Cloud SQL MySQL
```env
MYSQL_URL=mysql://username:password@your-cloud-sql-ip:3306/deepblue_octopus_ide
```

#### DigitalOcean Managed MySQL
```env
MYSQL_URL=mysql://username:password@your-db-cluster:25060/deepblue_octopus_ide?ssl-mode=REQUIRED
```

#### PlanetScale MySQL
```env
MYSQL_URL=mysql://username:password@your-planetscale-host/deepblue_octopus_ide?ssl={"rejectUnauthorized":true}
```

### 6.2 SSL Configuration for Production
```javascript
// In mysql-db.ts for production
const connection = mysql.createConnection({
  uri: process.env.MYSQL_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    ca: process.env.MYSQL_SSL_CA,
    cert: process.env.MYSQL_SSL_CERT,
    key: process.env.MYSQL_SSL_KEY,
    rejectUnauthorized: true
  } : false
});
```

## Step 7: Performance Optimization

### 7.1 MySQL Configuration Tuning
Add to `/etc/mysql/mysql.conf.d/mysqld.cnf`:
```ini
[mysqld]
# Performance tuning
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 1
innodb_file_per_table = 1

# Connection settings
max_connections = 200
max_connect_errors = 1000000

# Query cache
query_cache_type = 1
query_cache_size = 128M

# Logging
slow_query_log = 1
slow_query_log_file = /var/log/mysql/mysql-slow.log
long_query_time = 2
```

### 7.2 Database Indexing
```sql
-- Add indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_files_project_id ON files(project_id);
CREATE INDEX idx_files_parent_id ON files(parent_id);
CREATE INDEX idx_sessions_expire ON sessions(expire);
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
```

### 7.3 Connection Pooling
```typescript
// Enhanced mysql-db.ts with connection pooling
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';

const pool = mysql.createPool({
  uri: process.env.MYSQL_URL,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: 'utf8mb4',
  timezone: '+00:00'
});

export const db = drizzle(pool, { schema, mode: 'default' });
export { pool };
```

## Step 8: Backup and Maintenance

### 8.1 Automated Backup Script
Create `scripts/mysql-backup.sh`:
```bash
#!/bin/bash

# MySQL backup script for DeepBlue:Octopus IDE
BACKUP_DIR="/var/backups/mysql"
DB_NAME="deepblue_octopus_ide"
DB_USER="deepblue_user"
DB_PASS="your_password"
DATE=$(date +"%Y%m%d_%H%M%S")

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "✅ MySQL backup completed: backup_$DATE.sql.gz"
```

### 8.2 Restore from Backup
```bash
# Restore from backup
gunzip backup_20250104_120000.sql.gz
mysql -u deepblue_user -p deepblue_octopus_ide < backup_20250104_120000.sql
```

## Step 9: Monitoring and Troubleshooting

### 9.1 MySQL Performance Monitoring
```sql
-- Check database size
SELECT 
  table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'deepblue_octopus_ide'
GROUP BY table_schema;

-- Check slow queries
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;

-- Check connection status
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Max_used_connections';
```

### 9.2 Common Issues and Solutions

#### Connection Refused Error
```bash
# Check MySQL service status
sudo systemctl status mysql

# Start MySQL if stopped
sudo systemctl start mysql

# Check if MySQL is listening on port 3306
netstat -tlnp | grep 3306
```

#### Access Denied Error
```sql
-- Reset user permissions
GRANT ALL PRIVILEGES ON deepblue_octopus_ide.* TO 'deepblue_user'@'localhost';
FLUSH PRIVILEGES;
```

#### Character Set Issues
```sql
-- Convert database to UTF8MB4
ALTER DATABASE deepblue_octopus_ide CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Convert tables
ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Step 10: Migration from PostgreSQL to MySQL

### 10.1 Data Export from PostgreSQL
```bash
# Export PostgreSQL data
pg_dump -h localhost -U postgres -d deepblue_octopus_ide --data-only --column-inserts > postgresql_data.sql
```

### 10.2 Convert and Import to MySQL
```bash
# Convert PostgreSQL dump to MySQL format
sed -i 's/true/1/g' postgresql_data.sql
sed -i 's/false/0/g' postgresql_data.sql
sed -i 's/SERIAL/AUTO_INCREMENT/g' postgresql_data.sql

# Import to MySQL
mysql -u deepblue_user -p deepblue_octopus_ide < postgresql_data.sql
```

## Security Checklist

- [ ] MySQL root password is secure and unique
- [ ] Application user has minimal required privileges
- [ ] Remote access is properly configured with SSL
- [ ] Firewall rules allow only necessary connections
- [ ] Regular security updates are applied
- [ ] Backup files are encrypted and stored securely
- [ ] Database audit logging is enabled
- [ ] Connection strings use SSL in production
- [ ] Default MySQL accounts are removed
- [ ] File permissions on MySQL data directory are correct

## Support and Resources

- **MySQL Documentation**: https://dev.mysql.com/doc/
- **Drizzle MySQL Guide**: https://orm.drizzle.team/docs/get-started-mysql
- **Performance Tuning**: https://dev.mysql.com/doc/refman/8.0/en/optimization.html
- **Security Guide**: https://dev.mysql.com/doc/refman/8.0/en/security.html

This comprehensive MySQL setup guide provides everything needed to run DeepBlue:Octopus IDE with MySQL instead of PostgreSQL, including production deployment, performance optimization, and maintenance procedures.