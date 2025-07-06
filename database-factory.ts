/**
 * Database Factory - Supports both PostgreSQL and MySQL
 * Automatically detects database type from environment variables
 */

interface DatabaseConfig {
  type: 'postgresql' | 'mysql';
  url: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

export function detectDatabaseType(): 'postgresql' | 'mysql' {
  // Check for explicit MySQL configuration
  if (process.env.MYSQL_URL || 
      process.env.MYSQL_HOST || 
      process.env.DATABASE_URL?.includes('mysql://')) {
    return 'mysql';
  }
  
  // Check for explicit PostgreSQL configuration
  if (process.env.DATABASE_URL?.includes('postgresql://') || 
      process.env.DATABASE_URL?.includes('postgres://') ||
      process.env.PGHOST) {
    return 'postgresql';
  }
  
  // Default to PostgreSQL
  return 'postgresql';
}

export function getDatabaseConfig(): DatabaseConfig {
  const dbType = detectDatabaseType();
  
  if (dbType === 'mysql') {
    return {
      type: 'mysql',
      url: process.env.MYSQL_URL || process.env.DATABASE_URL || '',
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'deepblue_user',
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE || 'deepblue_octopus_ide'
    };
  }
  
  return {
    type: 'postgresql',
    url: process.env.DATABASE_URL || '',
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE
  };
}

export async function initializeDatabase() {
  const config = getDatabaseConfig();
  
  console.log(`🗄️  Initializing ${config.type.toUpperCase()} database...`);
  
  try {
    if (config.type === 'mysql') {
      const { db, testConnection } = await import('./mysql-db');
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error('MySQL connection test failed');
      }
      return { db, type: 'mysql' };
    } else {
      const { db } = await import('./db');
      // Test PostgreSQL connection
      await db.execute('SELECT 1 as test');
      console.log('✅ PostgreSQL connection successful');
      return { db, type: 'postgresql' };
    }
  } catch (error) {
    console.error(`❌ ${config.type.toUpperCase()} database initialization failed:`, error);
    throw error;
  }
}

export function getDatabaseScripts() {
  const dbType = detectDatabaseType();
  
  return {
    generate: dbType === 'mysql' 
      ? 'drizzle-kit generate:mysql --config=drizzle-mysql.config.ts'
      : 'drizzle-kit generate --config=drizzle.config.ts',
    push: dbType === 'mysql' 
      ? 'drizzle-kit push:mysql --config=drizzle-mysql.config.ts'
      : 'drizzle-kit push --config=drizzle.config.ts',
    status: dbType === 'mysql' 
      ? 'drizzle-kit status --config=drizzle-mysql.config.ts'
      : 'drizzle-kit status --config=drizzle.config.ts'
  };
}