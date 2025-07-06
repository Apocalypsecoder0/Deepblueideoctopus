/**
 * Admin Directory Authentication Middleware
 * Provides password protection for admin portal directories
 */
import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';

interface AdminAuthConfig {
  directoryUsername: string;
  directoryPassword: string;
  sessionTimeout: number;
}

// Default configuration - should be overridden by environment variables
const defaultConfig: AdminAuthConfig = {
  directoryUsername: process.env.ADMIN_DIR_USERNAME || 'deepblue_admin',
  directoryPassword: process.env.ADMIN_DIR_PASSWORD || 'SecureAdmin2025!',
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
};

class AdminDirectoryAuth {
  private config: AdminAuthConfig;
  private activeSessions: Map<string, { timestamp: number; username: string }>;

  constructor(config: AdminAuthConfig = defaultConfig) {
    this.config = config;
    this.activeSessions = new Map();
    
    // Clean up expired sessions every 5 minutes
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
  }

  /**
   * Generate session token
   */
  private generateSessionToken(): string {
    return `admin_dir_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [token, session] of this.activeSessions) {
      if (now - session.timestamp > this.config.sessionTimeout) {
        this.activeSessions.delete(token);
      }
    }
  }

  /**
   * Check if session is valid
   */
  private isValidSession(token: string): boolean {
    const session = this.activeSessions.get(token);
    if (!session) return false;
    
    const now = Date.now();
    if (now - session.timestamp > this.config.sessionTimeout) {
      this.activeSessions.delete(token);
      return false;
    }
    
    // Update session timestamp
    session.timestamp = now;
    return true;
  }

  /**
   * Authenticate directory access
   */
  async authenticate(username: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      console.log(`Directory auth attempt for user: ${username}`);
      
      // Check credentials
      if (username !== this.config.directoryUsername) {
        return { success: false, error: 'Invalid directory credentials' };
      }

      // For development, allow plain text comparison
      // In production, this should be hashed
      const isValidPassword = password === this.config.directoryPassword;
      
      if (!isValidPassword) {
        return { success: false, error: 'Invalid directory credentials' };
      }

      // Generate session token
      const token = this.generateSessionToken();
      this.activeSessions.set(token, {
        timestamp: Date.now(),
        username
      });

      console.log(`Directory authentication successful for: ${username}`);
      return { success: true, token };
      
    } catch (error) {
      console.error('Directory authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  /**
   * Middleware to protect admin routes
   */
  requireDirectoryAuth = (req: Request, res: Response, next: NextFunction) => {
    // Check for session token in cookie or header
    const token = req.cookies?.admin_dir_token || req.headers['x-admin-dir-token'];
    
    if (!token || !this.isValidSession(token as string)) {
      return res.status(401).json({
        error: 'Directory access denied',
        requiresAuth: true,
        type: 'directory_auth'
      });
    }
    
    next();
  };

  /**
   * Logout and invalidate session
   */
  logout(token: string): boolean {
    return this.activeSessions.delete(token);
  }

  /**
   * Get active sessions info (for admin monitoring)
   */
  getActiveSessions(): Array<{ username: string; timestamp: number; age: string }> {
    const now = Date.now();
    return Array.from(this.activeSessions.values()).map(session => ({
      username: session.username,
      timestamp: session.timestamp,
      age: this.formatDuration(now - session.timestamp)
    }));
  }

  private formatDuration(ms: number): string {
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }
}

// Export singleton instance
export const adminDirectoryAuth = new AdminDirectoryAuth();

// Export types for TypeScript
export type { AdminAuthConfig };