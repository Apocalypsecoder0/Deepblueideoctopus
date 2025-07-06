import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { adminDirectoryAuth } from "./admin-auth";
import { 
  insertFileSchema, 
  insertProjectSchema, 
  registerUserSchema, 
  loginUserSchema, 
  updateUserSchema,
  insertSecurityLogSchema,
  insertSecuritySettingsSchema,
  insertCodeValidationResultSchema,
  insertSecurityThreatSchema
} from "@shared/schema";
import { exec } from "child_process";
import { promisify } from "util";
import bcrypt from "bcrypt";
import crypto from "crypto";
import session from "express-session";
import { openAIService, type CodeAnalysisRequest, type CodeGenerationRequest } from "./openai-service";

const execAsync = promisify(exec);

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Directory Authentication Routes (First layer of admin protection)
  app.post('/api/admin/directory-auth', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password required'
        });
      }

      const result = await adminDirectoryAuth.authenticate(username, password);
      
      if (result.success && result.token) {
        // Set HTTP-only cookie for security
        res.cookie('admin_dir_token', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 30 * 60 * 1000, // 30 minutes
          sameSite: 'strict'
        });

        return res.json({
          success: true,
          message: 'Directory authentication successful',
          token: result.token
        });
      } else {
        return res.status(401).json({
          success: false,
          error: result.error || 'Authentication failed'
        });
      }
    } catch (error) {
      console.error('Directory auth error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Directory logout
  app.post('/api/admin/directory-logout', (req, res) => {
    const token = req.cookies?.admin_dir_token || req.headers['x-admin-dir-token'];
    
    if (token) {
      adminDirectoryAuth.logout(token as string);
      res.clearCookie('admin_dir_token');
    }
    
    res.json({ success: true, message: 'Directory session ended' });
  });

  // Check directory auth status
  app.get('/api/admin/directory-status', (req, res) => {
    const token = req.cookies?.admin_dir_token || req.headers['x-admin-dir-token'];
    const isAuthenticated = token && adminDirectoryAuth['isValidSession'](token as string);
    
    res.json({
      authenticated: isAuthenticated,
      activeSessions: adminDirectoryAuth.getActiveSessions().length
    });
  });
  
  // Session middleware configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'deepblue-ide-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication middleware
  function requireAuth(req: any, res: any, next: any) {
    if (req.session && req.session.userId) {
      return next();
    }
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Admin authentication middleware
  function requireAdminAuth(req: any, res: any, next: any) {
    if (req.session && req.session.adminId && req.session.adminRole === 'super_admin') {
      return next();
    }
    return res.status(401).json({ message: 'Admin authentication required' });
  }

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = registerUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: result.error.issues 
        });
      }

      const { username, email, password, firstName, lastName } = result.data;

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.registerUser({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName
      });

      // Log user activity
      await storage.logUserActivity({
        userId: user.id,
        action: "Account created",
        details: `New account registered with email: ${email}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Create session
      req.session.userId = user.id;
      req.session.username = user.username;

      // Return user data (without password)
      const { password: _, ...userResponse } = user;
      res.status(201).json(userResponse);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: result.error.issues 
        });
      }

      const { username, password } = result.data;

      // Find user by username or email
      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.getUserByEmail(username);
      }

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last login
      await storage.updateLastLogin(user.id);

      // Log user activity
      await storage.logUserActivity({
        userId: user.id,
        action: "User logged in",
        details: `Successful login from ${req.ip}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Create session
      req.session.userId = user.id;
      req.session.username = user.username;

      // Return user data (without password)
      const { password: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to log in" });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req: any, res) => {
    try {
      // Log user activity
      await storage.logUserActivity({
        userId: req.session.userId,
        action: "User logged out",
        details: `User logged out from ${req.ip}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Destroy session
      req.session.destroy((err: any) => {
        if (err) {
          return res.status(500).json({ message: "Failed to log out" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Failed to log out" });
    }
  });

  app.get("/api/auth/user", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user data (without password)
      const { password: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // User management routes
  app.put("/api/user/profile", requireAuth, async (req: any, res) => {
    try {
      const result = updateUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: result.error.issues 
        });
      }

      const updatedUser = await storage.updateUser(req.session.userId, result.data);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Log user activity
      await storage.logUserActivity({
        userId: req.session.userId,
        action: "Profile updated",
        details: "User profile information updated",
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Return updated user data (without password)
      const { password: _, ...userResponse } = updatedUser;
      res.json(userResponse);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.put("/api/user/password", requireAuth, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new passwords are required" });
      }

      // Get current user
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      const success = await storage.updateUserPassword(user.id, hashedPassword);
      if (!success) {
        return res.status(500).json({ message: "Failed to update password" });
      }

      // Log user activity
      await storage.logUserActivity({
        userId: req.session.userId,
        action: "Password changed",
        details: "User password was changed",
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Update password error:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  app.get("/api/user/settings", requireAuth, async (req: any, res) => {
    try {
      const settings = await storage.getUserSettings(req.session.userId);
      res.json(settings || {});
    } catch (error) {
      console.error("Get user settings error:", error);
      res.status(500).json({ message: "Failed to get user settings" });
    }
  });

  app.put("/api/user/settings", requireAuth, async (req: any, res) => {
    try {
      const settings = await storage.updateUserSettings(req.session.userId, req.body);
      
      // Log user activity
      await storage.logUserActivity({
        userId: req.session.userId,
        action: "Settings updated",
        details: "User settings were updated",
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(settings);
    } catch (error) {
      console.error("Update user settings error:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.get("/api/user/activity", requireAuth, async (req: any, res) => {
    try {
      const activity = await storage.getUserActivity(req.session.userId, 50);
      res.json(activity);
    } catch (error) {
      console.error("Get user activity error:", error);
      res.status(500).json({ message: "Failed to get user activity" });
    }
  });

  app.get("/api/user/sessions", requireAuth, async (req: any, res) => {
    try {
      const sessions = await storage.getUserSessions(req.session.userId);
      res.json(sessions);
    } catch (error) {
      console.error("Get user sessions error:", error);
      res.status(500).json({ message: "Failed to get user sessions" });
    }
  });

  app.delete("/api/user/sessions/:sessionId", requireAuth, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const success = await storage.deleteUserSession(sessionId);
      
      if (success) {
        // Log user activity
        await storage.logUserActivity({
          userId: req.session.userId,
          action: "Session terminated",
          details: `Session ${sessionId} was terminated`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.json({ message: "Session terminated successfully" });
      } else {
        res.status(404).json({ message: "Session not found" });
      }
    } catch (error) {
      console.error("Delete session error:", error);
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  app.delete("/api/user/account", requireAuth, async (req: any, res) => {
    try {
      // Log user activity before deletion
      await storage.logUserActivity({
        userId: req.session.userId,
        action: "Account deleted",
        details: "User account was permanently deleted",
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      const success = await storage.deleteUser(req.session.userId);
      if (success) {
        // Destroy session
        req.session.destroy(() => {
          res.json({ message: "Account deleted successfully" });
        });
      } else {
        res.status(500).json({ message: "Failed to delete account" });
      }
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Get default project and files
  app.get("/api/project", async (req, res) => {
    try {
      const projects = await storage.getProjectsByUser(1); // Default user
      const project = projects[0];
      if (!project) {
        return res.status(404).json({ message: "No project found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to get project" });
    }
  });

  // Get files for default project
  app.get("/api/files", async (req, res) => {
    try {
      console.log("Getting files for default project...");
      const projects = await storage.getProjectsByUser(1); // Default user
      console.log("Projects:", projects);
      const project = projects[0];
      if (!project) {
        console.log("No project found");
        return res.status(404).json({ message: "No project found" });
      }
      console.log("Getting files for project:", project.id);
      const files = await storage.getFilesByProject(project.id);
      console.log("Files:", files);
      res.json(files);
    } catch (error) {
      console.error("Error getting files:", error);
      res.status(500).json({ message: "Failed to get files", error: (error as Error).message });
    }
  });

  // Plugin API endpoints
  app.get("/api/plugins/installed", async (req, res) => {
    try {
      // For now, return empty array as no plugins are installed by default
      // In a real implementation, this would query the database
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Failed to get installed plugins" });
    }
  });

  app.post("/api/plugins/install", async (req, res) => {
    try {
      const { manifest, code } = req.body;
      
      // Validate plugin manifest
      if (!manifest?.id || !manifest?.name || !manifest?.version) {
        return res.status(400).json({ message: "Invalid plugin manifest" });
      }

      // In a real implementation, this would save to database
      // For now, just return success
      res.json({ success: true, message: `Plugin ${manifest.id} installed successfully` });
    } catch (error) {
      res.status(500).json({ message: "Failed to install plugin" });
    }
  });

  app.delete("/api/plugins/:pluginId", async (req, res) => {
    try {
      const { pluginId } = req.params;
      
      // In a real implementation, this would remove from database
      res.json({ success: true, message: `Plugin ${pluginId} uninstalled successfully` });
    } catch (error) {
      res.status(500).json({ message: "Failed to uninstall plugin" });
    }
  });

  // Environment Setup Wizard API endpoints
  app.get("/api/environment/templates", async (req, res) => {
    try {
      // Return available environment templates
      const templates = [
        {
          id: 'react-ts',
          name: 'React + TypeScript',
          description: 'Modern React application with TypeScript, Vite, and essential tools',
          category: 'Frontend',
          technologies: ['React', 'TypeScript', 'Vite', 'ESLint', 'Prettier'],
          estimatedTime: '2-3 minutes',
          difficulty: 'beginner',
          dependencies: ['react', 'react-dom'],
          devDependencies: ['@types/react', '@types/react-dom', '@vitejs/plugin-react', 'vite', 'typescript', 'eslint', 'prettier']
        },
        {
          id: 'node-express',
          name: 'Node.js + Express API',
          description: 'RESTful API server with Express, TypeScript, and authentication',
          category: 'Backend',
          technologies: ['Node.js', 'Express', 'TypeScript', 'JWT', 'bcrypt'],
          estimatedTime: '3-4 minutes',
          difficulty: 'intermediate',
          dependencies: ['express', 'cors', 'helmet', 'bcryptjs', 'jsonwebtoken', 'dotenv'],
          devDependencies: ['@types/node', '@types/express', '@types/cors', '@types/bcryptjs', '@types/jsonwebtoken', 'typescript', 'ts-node', 'nodemon']
        },
        {
          id: 'nextjs-fullstack',
          name: 'Next.js Full-Stack',
          description: 'Full-stack application with Next.js, Prisma, and Tailwind CSS',
          category: 'Full-Stack',
          technologies: ['Next.js', 'Prisma', 'Tailwind CSS', 'NextAuth', 'TypeScript'],
          estimatedTime: '4-5 minutes',
          difficulty: 'advanced',
          dependencies: ['next', 'react', 'react-dom', 'prisma', '@prisma/client', 'next-auth', 'tailwindcss'],
          devDependencies: ['@types/node', '@types/react', '@types/react-dom', 'typescript', 'autoprefixer', 'postcss']
        }
      ];
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to get environment templates" });
    }
  });

  app.post("/api/environment/setup", async (req, res) => {
    try {
      const { templateId, projectName, customizations } = req.body;
      
      // Validate input
      if (!templateId || !projectName) {
        return res.status(400).json({ message: "Template ID and project name are required" });
      }

      // Simulate environment setup process
      const setupProgress = [
        { step: 'dependencies', status: 'completed', message: 'Dependencies installed successfully' },
        { step: 'devDependencies', status: 'completed', message: 'Dev dependencies installed successfully' },
        { step: 'configuration', status: 'completed', message: 'Configuration files created' },
        { step: 'scripts', status: 'completed', message: 'npm scripts configured' },
        { step: 'postInstall', status: 'completed', message: 'Post-install steps completed' },
        { step: 'complete', status: 'completed', message: 'Environment setup complete' }
      ];

      // In a real implementation, this would:
      // 1. Create a new project in the database
      // 2. Install dependencies using npm/yarn
      // 3. Create configuration files
      // 4. Set up project structure
      // 5. Initialize git repository

      res.json({
        success: true,
        projectId: `project_${Date.now()}`,
        projectName,
        templateId,
        progress: setupProgress,
        message: `${projectName} environment setup completed successfully`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to setup environment", error: (error as Error).message });
    }
  });

  app.get("/api/environment/status/:projectId", async (req, res) => {
    try {
      const { projectId } = req.params;
      
      // In a real implementation, this would check the actual project status
      res.json({
        projectId,
        status: 'completed',
        progress: 100,
        message: 'Environment is ready for development'
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get environment status" });
    }
  });

  // Domain Configuration API endpoints
  app.get("/api/admin/domains", async (req, res) => {
    try {
      // Return configured domains
      const domains = [
        {
          id: '1',
          domain: 'deepblueide.dev',
          subdomain: 'www',
          environment: 'production',
          isActive: true,
          sslEnabled: true,
          sslStatus: 'active',
          sslExpiry: new Date('2025-12-31'),
          dnsStatus: 'connected',
          lastChecked: new Date(),
          redirects: [
            {
              id: 'r1',
              source: 'deepblueide.com',
              destination: 'https://deepblueide.dev',
              type: 'permanent',
              enabled: true
            }
          ],
          customHeaders: {
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
          },
          rateLimit: {
            enabled: true,
            requestsPerMinute: 1000,
            burstLimit: 100
          },
          cacheSettings: {
            enabled: true,
            ttl: 3600,
            staticAssets: true
          }
        },
        {
          id: '2',
          domain: 'api.deepblueide.dev',
          environment: 'production',
          isActive: true,
          sslEnabled: true,
          sslStatus: 'active',
          sslExpiry: new Date('2025-12-31'),
          dnsStatus: 'connected',
          lastChecked: new Date(),
          redirects: [],
          customHeaders: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          },
          rateLimit: {
            enabled: true,
            requestsPerMinute: 5000,
            burstLimit: 500
          },
          cacheSettings: {
            enabled: false,
            ttl: 0,
            staticAssets: false
          }
        }
      ];
      res.json(domains);
    } catch (error) {
      res.status(500).json({ message: "Failed to get domains" });
    }
  });

  app.post("/api/admin/domains", async (req, res) => {
    try {
      const { domain, subdomain, environment } = req.body;
      
      if (!domain) {
        return res.status(400).json({ message: "Domain is required" });
      }

      // In a real implementation, this would:
      // 1. Validate domain format
      // 2. Check DNS records
      // 3. Generate SSL certificate
      // 4. Save to database
      
      const newDomain = {
        id: `${Date.now()}`,
        domain,
        subdomain,
        environment: environment || 'development',
        isActive: false,
        sslEnabled: false,
        sslStatus: 'none',
        dnsStatus: 'pending',
        lastChecked: new Date(),
        redirects: [],
        customHeaders: {},
        rateLimit: {
          enabled: true,
          requestsPerMinute: 100,
          burstLimit: 10
        },
        cacheSettings: {
          enabled: false,
          ttl: 0,
          staticAssets: false
        }
      };

      res.json({
        success: true,
        domain: newDomain,
        message: `Domain ${domain} added successfully`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to add domain" });
    }
  });

  app.put("/api/admin/domains/:domainId", async (req, res) => {
    try {
      const { domainId } = req.params;
      const updates = req.body;
      
      // In a real implementation, this would update the database
      res.json({
        success: true,
        message: `Domain ${domainId} updated successfully`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update domain" });
    }
  });

  app.delete("/api/admin/domains/:domainId", async (req, res) => {
    try {
      const { domainId } = req.params;
      
      // In a real implementation, this would:
      // 1. Remove from database
      // 2. Clean up DNS records
      // 3. Revoke SSL certificates
      
      res.json({
        success: true,
        message: `Domain ${domainId} removed successfully`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove domain" });
    }
  });

  app.post("/api/admin/domains/:domainId/check-status", async (req, res) => {
    try {
      const { domainId } = req.params;
      
      // Simulate domain status check
      const statusUpdate = {
        dnsStatus: 'connected',
        sslStatus: 'active',
        lastChecked: new Date()
      };

      res.json({
        success: true,
        status: statusUpdate,
        message: 'Domain status updated successfully'
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check domain status" });
    }
  });

  // Patch Management API endpoints
  app.get("/api/admin/patches", async (req, res) => {
    try {
      const patches = [
        {
          id: 'patch-001',
          name: 'Security Update v2.1.1',
          version: '2.1.1',
          description: 'Critical security patch for authentication system. Fixes potential XSS vulnerabilities and improves session management.',
          type: 'security',
          priority: 'critical',
          status: 'pending',
          size: 2048000,
          createdAt: new Date('2025-01-04'),
          files: [
            { path: '/server/auth.ts', action: 'update', content: 'Updated authentication logic...' },
            { path: '/client/src/components/auth/', action: 'update', content: 'Updated auth components...' },
            { path: '/shared/security.ts', action: 'create', content: 'New security utilities...' }
          ],
          dependencies: [],
          rollbackInfo: { available: true, backupId: 'backup-001' }
        },
        {
          id: 'patch-002',
          name: 'UI Enhancement Package',
          version: '2.1.2',
          description: 'Enhanced user interface with new components, improved accessibility, and better responsive design.',
          type: 'ui',
          priority: 'medium',
          status: 'installed',
          size: 1536000,
          createdAt: new Date('2025-01-03'),
          installDate: new Date('2025-01-04'),
          files: [
            { path: '/client/src/components/ui/', action: 'update', content: 'Updated UI components...' },
            { path: '/client/src/styles/', action: 'update', content: 'Updated stylesheets...' }
          ],
          dependencies: ['patch-001'],
          rollbackInfo: { available: true, backupId: 'backup-002' }
        },
        {
          id: 'patch-003',
          name: 'Performance Optimization',
          version: '2.1.3',
          description: 'Database query optimization, caching improvements, and code splitting for better performance.',
          type: 'performance',
          priority: 'high',
          status: 'installing',
          size: 3072000,
          createdAt: new Date('2025-01-04'),
          files: [
            { path: '/server/db.ts', action: 'update', content: 'Optimized database queries...' },
            { path: '/server/cache.ts', action: 'create', content: 'New caching system...' },
            { path: '/client/src/utils/', action: 'update', content: 'Performance utilities...' }
          ],
          dependencies: [],
          rollbackInfo: { available: false, backupId: '' }
        },
        {
          id: 'patch-004',
          name: 'API Enhancement v2.2.0',
          version: '2.2.0',
          description: 'New REST API endpoints, improved error handling, and enhanced data validation.',
          type: 'api',
          priority: 'medium',
          status: 'pending',
          size: 1024000,
          createdAt: new Date('2025-01-05'),
          files: [
            { path: '/server/routes.ts', action: 'update', content: 'New API endpoints...' },
            { path: '/server/validation.ts', action: 'create', content: 'Data validation utilities...' },
            { path: '/shared/types.ts', action: 'update', content: 'Updated type definitions...' }
          ],
          dependencies: ['patch-001'],
          rollbackInfo: { available: true, backupId: 'backup-004' }
        }
      ];
      
      res.json(patches);
    } catch (error) {
      res.status(500).json({ message: "Failed to get patches" });
    }
  });

  app.get("/api/admin/update-packages", async (req, res) => {
    try {
      const packages = [
        {
          id: 'pkg-ide-core',
          name: 'IDE Core Update',
          version: '2.2.0',
          description: 'Major update to the IDE core system with new features and improvements',
          category: 'ide',
          files: [
            '/client/src/components/ide/',
            '/client/src/hooks/',
            '/client/src/utils/ide.ts'
          ],
          installScript: 'npm run update:ide-core',
          rollbackScript: 'npm run rollback:ide-core',
          checksums: {
            '/client/src/components/ide/': 'sha256:abc123...',
            '/client/src/hooks/': 'sha256:def456...'
          }
        },
        {
          id: 'pkg-website-ui',
          name: 'Website UI Refresh',
          version: '1.5.0',
          description: 'Complete redesign of the marketing website with modern components',
          category: 'website',
          files: [
            '/client/src/pages/',
            '/client/src/components/ui/',
            '/client/src/styles/'
          ],
          installScript: 'npm run update:website-ui',
          rollbackScript: 'npm run rollback:website-ui',
          checksums: {
            '/client/src/pages/': 'sha256:ghi789...',
            '/client/src/components/ui/': 'sha256:jkl012...'
          }
        },
        {
          id: 'pkg-admin-tools',
          name: 'Admin Tools Enhancement',
          version: '1.3.0',
          description: 'Enhanced admin panel with new management tools and analytics',
          category: 'admin',
          files: [
            '/client/src/components/admin/',
            '/server/admin/',
            '/shared/admin-types.ts'
          ],
          installScript: 'npm run update:admin-tools',
          rollbackScript: 'npm run rollback:admin-tools',
          checksums: {
            '/client/src/components/admin/': 'sha256:mno345...',
            '/server/admin/': 'sha256:pqr678...'
          }
        }
      ];
      
      res.json(packages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get update packages" });
    }
  });

  app.get("/api/admin/installation-history", async (req, res) => {
    try {
      const history = [
        {
          id: 'hist-001',
          name: 'Security Update v2.1.1',
          version: '2.1.1',
          description: 'Critical security patches installed successfully',
          status: 'installed',
          installDate: '2025-01-04T10:30:00Z',
          installer: 'admin@deepblueide.dev'
        },
        {
          id: 'hist-002',
          name: 'UI Enhancement Package',
          version: '2.1.2',
          description: 'User interface improvements and new components',
          status: 'installed',
          installDate: '2025-01-03T15:45:00Z',
          installer: 'admin@deepblueide.dev'
        },
        {
          id: 'hist-003',
          name: 'Database Migration v2.1.0',
          version: '2.1.0',
          description: 'Database schema updates and optimizations',
          status: 'installed',
          installDate: '2025-01-02T09:15:00Z',
          installer: 'system@deepblueide.dev'
        }
      ];
      
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to get installation history" });
    }
  });

  app.post("/api/admin/patches/upload", async (req, res) => {
    try {
      // In a real implementation, this would handle file upload
      // Extract patch metadata, validate, and store
      
      res.json({
        success: true,
        patchId: `patch-${Date.now()}`,
        message: 'Patch uploaded successfully'
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload patch" });
    }
  });

  app.post("/api/admin/patches/:patchId/install", async (req, res) => {
    try {
      const { patchId } = req.params;
      
      // In a real implementation, this would:
      // 1. Create backup
      // 2. Validate dependencies
      // 3. Apply file changes
      // 4. Run installation scripts
      // 5. Verify installation
      
      res.json({
        success: true,
        installationId: `install-${Date.now()}`,
        message: `Patch ${patchId} installation started`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to install patch" });
    }
  });

  app.post("/api/admin/patches/:patchId/rollback", async (req, res) => {
    try {
      const { patchId } = req.params;
      
      // In a real implementation, this would:
      // 1. Restore files from backup
      // 2. Reverse database changes
      // 3. Run rollback scripts
      // 4. Verify rollback success
      
      res.json({
        success: true,
        rollbackId: `rollback-${Date.now()}`,
        message: `Patch ${patchId} rollback started`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to rollback patch" });
    }
  });

  // Compiler API endpoint
  app.post("/api/compile", async (req, res) => {
    try {
      const { command, args, code, fileName, workingDirectory = '/tmp', environment = {} } = req.body;
      
      // Create temporary file with the code
      const fs = require('fs');
      const path = require('path');
      const { exec } = require('child_process');
      const os = require('os');
      
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, fileName);
      
      // Write code to temporary file
      fs.writeFileSync(tempFile, code);
      
      // Build command with arguments
      const fullCommand = `${command} ${args.join(' ')}`.replace(/\${file}/g, tempFile).replace(/\${fileBasenameNoExtension}/g, path.basename(fileName, path.extname(fileName)));
      
      console.log('Executing command:', fullCommand);
      
      // Execute compilation/run command
      exec(fullCommand, { 
        cwd: workingDirectory,
        env: { ...process.env, ...environment },
        timeout: 30000 // 30 second timeout
      }, (error, stdout, stderr) => {
        // Clean up temporary file
        try {
          fs.unlinkSync(tempFile);
        } catch (cleanupError) {
          console.warn('Failed to clean up temp file:', cleanupError);
        }
        
        if (error) {
          return res.json({
            success: false,
            output: stderr || error.message,
            exitCode: error.code || 1
          });
        }
        
        res.json({
          success: true,
          output: stdout + (stderr ? '\nWarnings:\n' + stderr : ''),
          exitCode: 0
        });
      });
      
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Compilation failed", 
        error: (error as Error).message 
      });
    }
  });

  // Get files by project
  app.get("/api/files/:projectId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const files = await storage.getFilesByProject(projectId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to get files" });
    }
  });

  // Get file content
  app.get("/api/file/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const file = await storage.getFile(id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to get file" });
    }
  });

  // Create new file
  app.post("/api/file", async (req, res) => {
    try {
      const fileData = insertFileSchema.parse(req.body);
      const file = await storage.createFile(fileData);
      res.json(file);
    } catch (error) {
      res.status(400).json({ message: "Invalid file data" });
    }
  });

  // Alternative endpoint for file creation (for consistency)
  app.post("/api/files", async (req, res) => {
    try {
      const fileData = insertFileSchema.parse(req.body);
      const file = await storage.createFile(fileData);
      res.json(file);
    } catch (error) {
      res.status(400).json({ message: "Invalid file data" });
    }
  });

  // Update file content
  app.put("/api/file/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const file = await storage.updateFile(id, updates);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to update file" });
    }
  });

  // Alternative endpoint for file updates (for consistency)
  app.put("/api/files/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const file = await storage.updateFile(id, updates);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to update file" });
    }
  });

  // Delete file
  app.delete("/api/file/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteFile(id);
      if (!success) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Execute code
  app.post("/api/execute", async (req, res) => {
    try {
      const { code, language, input = "" } = req.body;
      let command = "";
      let tempFile = "";
      let compileCommand = "";

      // Escape code for shell execution
      const escapedCode = code.replace(/'/g, "'\\''");

      switch (language) {
        case "javascript":
          tempFile = "temp.js";
          command = `echo '${escapedCode}' > ${tempFile} && node ${tempFile} && rm ${tempFile}`;
          break;
        
        case "typescript":
          tempFile = "temp.ts";
          command = `echo '${escapedCode}' > ${tempFile} && npx tsx ${tempFile} && rm ${tempFile}`;
          break;
        
        case "python":
          tempFile = "temp.py";
          if (input) {
            command = `echo '${escapedCode}' > ${tempFile} && echo '${input}' | python3 ${tempFile} && rm ${tempFile}`;
          } else {
            command = `echo '${escapedCode}' > ${tempFile} && python3 ${tempFile} && rm ${tempFile}`;
          }
          break;
        
        case "java":
          tempFile = "Main.java";
          compileCommand = `echo '${escapedCode}' > ${tempFile} && javac ${tempFile}`;
          if (input) {
            command = `${compileCommand} && echo '${input}' | java Main && rm ${tempFile} Main.class`;
          } else {
            command = `${compileCommand} && java Main && rm ${tempFile} Main.class`;
          }
          break;
        
        case "cpp":
        case "c++":
          tempFile = "temp.cpp";
          compileCommand = `echo '${escapedCode}' > ${tempFile} && g++ -o temp_exe ${tempFile}`;
          if (input) {
            command = `${compileCommand} && echo '${input}' | ./temp_exe && rm ${tempFile} temp_exe`;
          } else {
            command = `${compileCommand} && ./temp_exe && rm ${tempFile} temp_exe`;
          }
          break;
        
        case "c":
          tempFile = "temp.c";
          compileCommand = `echo '${escapedCode}' > ${tempFile} && gcc -o temp_exe ${tempFile}`;
          if (input) {
            command = `${compileCommand} && echo '${input}' | ./temp_exe && rm ${tempFile} temp_exe`;
          } else {
            command = `${compileCommand} && ./temp_exe && rm ${tempFile} temp_exe`;
          }
          break;
        
        case "rust":
          tempFile = "temp.rs";
          compileCommand = `echo '${escapedCode}' > ${tempFile} && rustc ${tempFile} -o temp_exe`;
          if (input) {
            command = `${compileCommand} && echo '${input}' | ./temp_exe && rm ${tempFile} temp_exe`;
          } else {
            command = `${compileCommand} && ./temp_exe && rm ${tempFile} temp_exe`;
          }
          break;
        
        case "go":
          tempFile = "temp.go";
          if (input) {
            command = `echo '${escapedCode}' > ${tempFile} && echo '${input}' | go run ${tempFile} && rm ${tempFile}`;
          } else {
            command = `echo '${escapedCode}' > ${tempFile} && go run ${tempFile} && rm ${tempFile}`;
          }
          break;
        
        case "php":
          tempFile = "temp.php";
          if (input) {
            command = `echo '${escapedCode}' > ${tempFile} && echo '${input}' | php ${tempFile} && rm ${tempFile}`;
          } else {
            command = `echo '${escapedCode}' > ${tempFile} && php ${tempFile} && rm ${tempFile}`;
          }
          break;
        
        case "ruby":
          tempFile = "temp.rb";
          if (input) {
            command = `echo '${escapedCode}' > ${tempFile} && echo '${input}' | ruby ${tempFile} && rm ${tempFile}`;
          } else {
            command = `echo '${escapedCode}' > ${tempFile} && ruby ${tempFile} && rm ${tempFile}`;
          }
          break;
        
        case "bash":
        case "shell":
          tempFile = "temp.sh";
          command = `echo '${escapedCode}' > ${tempFile} && chmod +x ${tempFile} && ./${tempFile} && rm ${tempFile}`;
          break;
        
        case "swift":
          tempFile = "temp.swift";
          if (input) {
            command = `echo '${escapedCode}' > ${tempFile} && echo '${input}' | swift ${tempFile} && rm ${tempFile}`;
          } else {
            command = `echo '${escapedCode}' > ${tempFile} && swift ${tempFile} && rm ${tempFile}`;
          }
          break;
        
        case "kotlin":
          tempFile = "temp.kt";
          compileCommand = `echo '${escapedCode}' > ${tempFile} && kotlinc ${tempFile} -include-runtime -d temp.jar`;
          if (input) {
            command = `${compileCommand} && echo '${input}' | java -jar temp.jar && rm ${tempFile} temp.jar`;
          } else {
            command = `${compileCommand} && java -jar temp.jar && rm ${tempFile} temp.jar`;
          }
          break;
        
        case "dart":
          tempFile = "temp.dart";
          if (input) {
            command = `echo '${escapedCode}' > ${tempFile} && echo '${input}' | dart ${tempFile} && rm ${tempFile}`;
          } else {
            command = `echo '${escapedCode}' > ${tempFile} && dart ${tempFile} && rm ${tempFile}`;
          }
          break;
        
        case "lua":
          tempFile = "temp.lua";
          if (input) {
            command = `echo '${escapedCode}' > ${tempFile} && echo '${input}' | lua ${tempFile} && rm ${tempFile}`;
          } else {
            command = `echo '${escapedCode}' > ${tempFile} && lua ${tempFile} && rm ${tempFile}`;
          }
          break;
        
        case "scala":
          tempFile = "temp.scala";
          if (input) {
            command = `echo '${escapedCode}' > ${tempFile} && echo '${input}' | scala ${tempFile} && rm ${tempFile}`;
          } else {
            command = `echo '${escapedCode}' > ${tempFile} && scala ${tempFile} && rm ${tempFile}`;
          }
          break;
        
        case "haskell":
          tempFile = "temp.hs";
          compileCommand = `echo '${escapedCode}' > ${tempFile} && ghc -o temp_exe ${tempFile}`;
          if (input) {
            command = `${compileCommand} && echo '${input}' | ./temp_exe && rm ${tempFile} temp_exe temp.hi temp.o`;
          } else {
            command = `${compileCommand} && ./temp_exe && rm ${tempFile} temp_exe temp.hi temp.o`;
          }
          break;
        
        case "elixir":
          tempFile = "temp.exs";
          if (input) {
            command = `echo '${escapedCode}' > ${tempFile} && echo '${input}' | elixir ${tempFile} && rm ${tempFile}`;
          } else {
            command = `echo '${escapedCode}' > ${tempFile} && elixir ${tempFile} && rm ${tempFile}`;
          }
          break;
        
        case "crystal":
          tempFile = "temp.cr";
          if (input) {
            command = `echo '${escapedCode}' > ${tempFile} && echo '${input}' | crystal run ${tempFile} && rm ${tempFile}`;
          } else {
            command = `echo '${escapedCode}' > ${tempFile} && crystal run ${tempFile} && rm ${tempFile}`;
          }
          break;
        
        case "nim":
          tempFile = "temp.nim";
          compileCommand = `echo '${escapedCode}' > ${tempFile} && nim compile --run ${tempFile}`;
          if (input) {
            command = `${compileCommand} && echo '${input}' | ./temp && rm ${tempFile} temp`;
          } else {
            command = `${compileCommand} && rm ${tempFile} temp`;
          }
          break;
        
        case "zig":
          tempFile = "temp.zig";
          if (input) {
            command = `echo '${escapedCode}' > ${tempFile} && echo '${input}' | zig run ${tempFile} && rm ${tempFile}`;
          } else {
            command = `echo '${escapedCode}' > ${tempFile} && zig run ${tempFile} && rm ${tempFile}`;
          }
          break;
        
        case "html":
          return res.json({
            output: "HTML preview would be shown in browser",
            error: "",
            success: true,
            html: code
          });
        
        case "css":
          return res.json({
            output: "CSS styles would be applied to HTML",
            error: "",
            success: true,
            css: code
          });
        
        default:
          return res.status(400).json({ 
            message: `Language '${language}' is not supported yet`,
            supportedLanguages: [
              "javascript", "typescript", "python", "java", "cpp", "c", 
              "rust", "go", "php", "ruby", "bash", "html", "css",
              "swift", "kotlin", "dart", "lua", "scala", "haskell",
              "elixir", "crystal", "nim", "zig"
            ]
          });
      }

      // Set execution timeout
      const timeout = 10000; // 10 seconds
      const { stdout, stderr } = await Promise.race([
        execAsync(command),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Execution timeout")), timeout)
        )
      ]);

      res.json({ 
        output: stdout || "Code executed successfully (no output)",
        error: stderr,
        success: !stderr,
        language: language,
        executionTime: Date.now()
      });
    } catch (error: any) {
      res.json({
        output: "",
        error: error.message || "Execution failed",
        success: false,
        language: req.body.language || "unknown"
      });
    }
  });

  // ===== SECURITY SYSTEM API ENDPOINTS =====
  
  // Security authentication endpoint
  app.post("/api/security/authenticate", async (req, res) => {
    try {
      const { password, securityLevel } = req.body;
      const userId = req.session?.userId || null;
      
      // Simple security check - in production, implement proper authentication
      const isValid = password === "deepblue2025" || password === "admin123" || password === "security";
      
      if (isValid) {
        // Log successful authentication
        await storage.createSecurityLog({
          userId,
          eventType: "auth_success",
          severity: "info",
          message: `Security authentication successful for level: ${securityLevel}`,
          source: "security_system",
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          metadata: { securityLevel, timestamp: new Date() }
        });
        
        res.json({ 
          success: true, 
          message: "Security authentication successful",
          timestamp: new Date().toISOString()
        });
      } else {
        // Log failed authentication
        await storage.createSecurityLog({
          userId,
          eventType: "auth_failed",
          severity: "medium",
          message: `Security authentication failed for level: ${securityLevel}`,
          source: "security_system",
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          metadata: { securityLevel, timestamp: new Date() }
        });
        
        res.status(401).json({ 
          success: false, 
          message: "Invalid security credentials" 
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Security authentication error" });
    }
  });

  // Code validation endpoint
  app.post("/api/security/validate-code", async (req, res) => {
    try {
      const { code, language } = req.body;
      const userId = req.session?.userId || null;
      
      // Security validation patterns
      const dangerousPatterns = [
        /rm\s+-rf/i,
        /format\s+c:/i,
        /del\s+\/[sq]/i,
        /system\(/i,
        /exec\(/i,
        /eval\(/i,
        /document\.write/i,
        /innerHTML\s*=/i,
        /\.setRequestHeader/i,
        /XMLHttpRequest/i,
        /fetch\(/i,
        /import\s+os/i,
        /import\s+subprocess/i,
        /require\s*\(\s*['"]child_process['"]/i,
        /__import__/i,
        /globals\(\)/i,
        /locals\(\)/i
      ];
      
      const suspiciousPatterns = [
        /window\./i,
        /document\./i,
        /location\./i,
        /navigator\./i,
        /history\./i,
        /cookie/i,
        /localStorage/i,
        /sessionStorage/i,
        /process\.env/i,
        /os\.environ/i
      ];
      
      const violations = [];
      let securityScore = 100;
      let isBlocked = false;
      
      // Check for dangerous patterns
      dangerousPatterns.forEach((pattern, index) => {
        if (pattern.test(code)) {
          violations.push({
            type: 'malicious',
            severity: 'critical',
            message: 'Potentially malicious code detected',
            line: null,
            suggestion: 'Remove dangerous system calls and file operations'
          });
          securityScore -= 25;
          isBlocked = true;
        }
      });
      
      // Check for suspicious patterns
      suspiciousPatterns.forEach((pattern, index) => {
        if (pattern.test(code)) {
          violations.push({
            type: 'suspicious',
            severity: 'medium',
            message: 'Suspicious code pattern detected',
            line: null,
            suggestion: 'Review browser API usage and environment access'
          });
          securityScore -= 10;
        }
      });
      
      // Create validation result
      const validationResult = await storage.createCodeValidationResult({
        userId,
        code,
        language,
        securityScore,
        violations,
        isBlocked,
        executionAttempted: false,
        ipAddress: req.ip
      });
      
      // Log security event
      const logSeverity = isBlocked ? "high" : violations.length > 0 ? "medium" : "info";
      await storage.createSecurityLog({
        userId,
        eventType: isBlocked ? "code_blocked" : "code_validated",
        severity: logSeverity,
        message: `Code validation completed - Score: ${securityScore}, Blocked: ${isBlocked}`,
        source: "code_validator",
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { validationId: validationResult.id, securityScore, violationCount: violations.length }
      });
      
      res.json({
        isValid: !isBlocked,
        violations,
        securityScore,
        validationId: validationResult.id
      });
      
    } catch (error) {
      res.status(500).json({ message: "Code validation error" });
    }
  });

  // Security settings endpoints
  app.get("/api/security/settings/:userId?", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId) || req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }
      
      const settings = await storage.getSecuritySettings(userId);
      res.json(settings || {
        securityLevel: "enhanced",
        codeValidationEnabled: true,
        realTimeMonitoring: true,
        threatDetection: true,
        maxFailedAttempts: 3,
        lockoutDuration: 300,
        notifyOnThreats: true,
        isActive: true
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get security settings" });
    }
  });

  app.post("/api/security/settings", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const settingsData = insertSecuritySettingsSchema.parse({
        ...req.body,
        userId
      });
      
      const settings = await storage.createSecuritySettings(settingsData);
      
      // Log settings change
      await storage.createSecurityLog({
        userId,
        eventType: "settings_updated",
        severity: "info",
        message: "Security settings updated",
        source: "security_system",
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { settingsId: settings.id }
      });
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update security settings" });
    }
  });

  // Security logs endpoint
  app.get("/api/security/logs", async (req, res) => {
    try {
      const userId = req.session?.userId;
      const logs = await storage.getSecurityLogs(userId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to get security logs" });
    }
  });

  // Security threats endpoint
  app.get("/api/security/threats", async (req, res) => {
    try {
      const userId = req.session?.userId;
      const threats = await storage.getSecurityThreats(userId);
      res.json(threats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get security threats" });
    }
  });

  // Create security threat
  app.post("/api/security/threats", async (req, res) => {
    try {
      const userId = req.session?.userId;
      const threatData = insertSecurityThreatSchema.parse({
        ...req.body,
        userId
      });
      
      const threat = await storage.createSecurityThreat(threatData);
      
      // Log threat creation
      await storage.createSecurityLog({
        userId,
        eventType: "threat_detected",
        severity: threatData.severity,
        message: `New security threat detected: ${threatData.description}`,
        source: "system_monitor",
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { threatId: threat.id, threatType: threatData.threatType }
      });
      
      res.json(threat);
    } catch (error) {
      res.status(500).json({ message: "Failed to create security threat" });
    }
  });

  // Security system status
  app.get("/api/security/status", async (req, res) => {
    try {
      const userId = req.session?.userId;
      
      // Get recent security activity
      const recentLogs = await storage.getSecurityLogs(userId, 10);
      const activeThreats = await storage.getSecurityThreats(userId);
      const settings = await storage.getSecuritySettings(userId);
      
      const status = {
        isActive: settings?.isActive ?? true,
        securityLevel: settings?.securityLevel ?? "enhanced",
        recentActivity: recentLogs.length,
        activeThreats: activeThreats.filter(t => !t.isResolved).length,
        lastUpdate: new Date().toISOString(),
        systemHealth: "operational"
      };
      
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to get security status" });
    }
  });

  // Get language info
  app.get("/api/languages", async (req, res) => {
    const languages = [
      {
        id: "javascript",
        name: "JavaScript",
        extensions: [".js", ".mjs"],
        hasCompiler: false,
        hasInterpreter: true,
        supportsInput: false
      },
      {
        id: "typescript", 
        name: "TypeScript",
        extensions: [".ts"],
        hasCompiler: true,
        hasInterpreter: true,
        supportsInput: false
      },
      {
        id: "python",
        name: "Python",
        extensions: [".py"],
        hasCompiler: false,
        hasInterpreter: true,
        supportsInput: true
      },
      {
        id: "java",
        name: "Java",
        extensions: [".java"],
        hasCompiler: true,
        hasInterpreter: false,
        supportsInput: true
      },
      {
        id: "cpp",
        name: "C++",
        extensions: [".cpp", ".cxx", ".cc"],
        hasCompiler: true,
        hasInterpreter: false,
        supportsInput: true
      },
      {
        id: "c",
        name: "C",
        extensions: [".c"],
        hasCompiler: true,
        hasInterpreter: false,
        supportsInput: true
      },
      {
        id: "rust",
        name: "Rust",
        extensions: [".rs"],
        hasCompiler: true,
        hasInterpreter: false,
        supportsInput: true
      },
      {
        id: "go",
        name: "Go",
        extensions: [".go"],
        hasCompiler: true,
        hasInterpreter: true,
        supportsInput: true
      },
      {
        id: "php",
        name: "PHP",
        extensions: [".php"],
        hasCompiler: false,
        hasInterpreter: true,
        supportsInput: true
      },
      {
        id: "ruby",
        name: "Ruby",
        extensions: [".rb"],
        hasCompiler: false,
        hasInterpreter: true,
        supportsInput: true
      },
      {
        id: "bash",
        name: "Bash",
        extensions: [".sh", ".bash"],
        hasCompiler: false,
        hasInterpreter: true,
        supportsInput: false
      },
      {
        id: "html",
        name: "HTML",
        extensions: [".html", ".htm"],
        hasCompiler: false,
        hasInterpreter: false,
        supportsInput: false
      },
      {
        id: "css",
        name: "CSS",
        extensions: [".css"],
        hasCompiler: false,
        hasInterpreter: false,
        supportsInput: false
      }
    ];

    res.json(languages);
  });

  // Server Management API endpoints
  app.get("/api/servers", async (req, res) => {
    const servers = [
      {
        name: 'Apache HTTP Server',
        type: 'apache',
        port: 80,
        status: 'stopped',
        version: '2.4.57',
        configPath: '/etc/apache2/apache2.conf',
        logPath: '/var/log/apache2/access.log'
      },
      {
        name: 'MySQL Database',
        type: 'mysql',
        port: 3306,
        status: 'stopped',
        version: '8.0.35',
        configPath: '/etc/mysql/mysql.conf.d/mysqld.cnf',
        logPath: '/var/log/mysql/error.log'
      },
      {
        name: 'phpMyAdmin',
        type: 'phpmyadmin',
        port: 8080,
        status: 'stopped',
        version: '5.2.1',
        configPath: '/etc/phpmyadmin/config.inc.php',
        logPath: '/var/log/apache2/phpmyadmin.log'
      }
    ];
    res.json(servers);
  });

  app.post("/api/servers/:type/toggle", async (req, res) => {
    try {
      const { type } = req.params;
      const { action } = req.body; // 'start' or 'stop'
      
      // Simulate server management
      const mockResult = {
        success: true,
        message: `${type} server ${action}ed successfully`,
        status: action === 'start' ? 'running' : 'stopped',
        timestamp: new Date().toISOString()
      };
      
      res.json(mockResult);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: `Failed to ${req.body.action} server: ${error.message}`
      });
    }
  });

  // PHP code execution endpoint
  app.post("/api/execute/php", async (req, res) => {
    try {
      const { code, input } = req.body;
      const escapedCode = code.replace(/'/g, "'\"'\"'");
      const tempFile = "temp.php";
      
      let command;
      if (input) {
        command = `echo '<?php ${escapedCode}' > ${tempFile} && echo '${input}' | php ${tempFile} && rm ${tempFile}`;
      } else {
        command = `echo '<?php ${escapedCode}' > ${tempFile} && php ${tempFile} && rm ${tempFile}`;
      }

      const { exec } = await import("child_process");
      exec(command, { timeout: 10000 }, (error: any, stdout: any, stderr: any) => {
        res.json({
          output: stdout || "PHP code executed successfully",
          error: stderr || error?.message,
          success: !error && !stderr,
          language: "php",
          executionTime: Date.now()
        });
      });
    } catch (error: any) {
      res.json({
        output: "",
        error: error.message || "PHP execution failed",
        success: false,
        language: "php"
      });
    }
  });

  // Database management endpoints
  app.get("/api/databases", async (req, res) => {
    const databases = [
      {
        name: "blog_db",
        tables: 15,
        size: "1.2MB",
        lastModified: new Date(Date.now() - 86400000).toISOString()
      },
      {
        name: "ecommerce_db", 
        tables: 8,
        size: "856KB",
        lastModified: new Date(Date.now() - 172800000).toISOString()
      },
      {
        name: "test_db",
        tables: 3,
        size: "124KB", 
        lastModified: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    res.json(databases);
  });

  app.post("/api/sql/execute", async (req, res) => {
    try {
      const { query } = req.body;
      
      // Mock SQL execution
      const mockResult = {
        success: true,
        message: "Query executed successfully",
        rows: [],
        affectedRows: 0,
        executionTime: Math.random() * 100
      };
      
      res.json(mockResult);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: `SQL execution failed: ${error.message}`
      });
    }
  });

  // GitHub Integration endpoints
  app.post('/api/github/push', async (req, res) => {
    try {
      const { repository, branch, commitMessage, files } = req.body;
      
      if (!repository || !branch || !commitMessage) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }

      // Get current project files
      const projects = await storage.getProjectsByUser(1);
      const project = projects[0];
      const projectFiles = project ? await storage.getFilesByProject(project.id) : [];
      
      // Simulate GitHub push operation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      res.json({
        success: true,
        message: `Successfully pushed to ${repository}/${branch}`,
        commitSha: `abc${Math.random().toString(36).substring(7)}`,
        filesChanged: projectFiles.length
      });
    } catch (error) {
      console.error('Failed to push to GitHub:', error);
      res.status(500).json({ message: 'Failed to push to GitHub' });
    }
  });

  app.post('/api/github/clone', async (req, res) => {
    try {
      const { repositoryUrl, branch = 'main' } = req.body;
      
      if (!repositoryUrl) {
        return res.status(400).json({ message: 'Repository URL is required' });
      }

      // Extract repository name from URL
      const repoName = repositoryUrl.split('/').pop()?.replace('.git', '') || 'cloned-repo';
      
      // Create a new project for the cloned repository
      const newProject = await storage.createProject({
        name: repoName,
        description: `Cloned from ${repositoryUrl}`,
        userId: 1
      });

      // Create sample files for the cloned repository
      const sampleFiles = [
        {
          name: 'README.md',
          path: '/README.md',
          content: `# ${repoName}\n\nCloned from ${repositoryUrl}`,
          language: 'markdown',
          projectId: newProject.id,
          isDirectory: false,
          parentId: null,
          size: 50,
          isReadonly: false,
          encoding: 'utf-8'
        },
        {
          name: 'main.js',
          path: '/main.js',
          content: `// ${repoName} - Main file\nconsole.log("Hello from ${repoName}!");`,
          language: 'javascript',
          projectId: newProject.id,
          isDirectory: false,
          parentId: null,
          size: 80,
          isReadonly: false,
          encoding: 'utf-8'
        }
      ];

      for (const fileData of sampleFiles) {
        await storage.createFile(fileData as any);
      }

      // Simulate clone operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      res.json({
        success: true,
        message: `Successfully cloned ${repositoryUrl}`,
        projectId: newProject.id,
        projectName: repoName,
        branch,
        filesCloned: sampleFiles.length
      });
    } catch (error) {
      console.error('Failed to clone repository:', error);
      res.status(500).json({ message: 'Failed to clone repository' });
    }
  });

  app.post('/api/github/pull-request', async (req, res) => {
    try {
      const { repository, title, description, sourceBranch, targetBranch } = req.body;
      
      if (!repository || !title || !sourceBranch || !targetBranch) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }

      // Simulate pull request creation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const prNumber = Math.floor(Math.random() * 1000) + 1;
      
      res.json({
        success: true,
        message: `Pull request created successfully`,
        pullRequestNumber: prNumber,
        url: `https://github.com/${repository}/pull/${prNumber}`,
        title,
        sourceBranch,
        targetBranch
      });
    } catch (error) {
      console.error('Failed to create pull request:', error);
      res.status(500).json({ message: 'Failed to create pull request' });
    }
  });

  app.get('/api/github/status', async (req, res) => {
    try {
      // Get current project status
      const projects = await storage.getProjectsByUser(1);
      const project = projects[0];
      const files = project ? await storage.getFilesByProject(project.id) : [];
      
      // Simulate git status
      const modifiedFiles = files.filter(f => !f.isDirectory).slice(0, 3);
      const stagedFiles = files.filter(f => !f.isDirectory).slice(0, 2);
      
      res.json({
        currentBranch: 'main',
        ahead: Math.floor(Math.random() * 5),
        behind: Math.floor(Math.random() * 3),
        modifiedFiles: modifiedFiles.map(f => ({
          name: f.name,
          path: f.path,
          status: 'modified'
        })),
        stagedFiles: stagedFiles.map(f => ({
          name: f.name,
          path: f.path,
          status: 'staged'
        })),
        untrackedFiles: [],
        repository: project?.name || 'unknown',
        lastCommit: {
          sha: 'abc123def',
          message: 'Update project files',
          author: 'DeepBlue IDE',
          date: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to get git status:', error);
      res.status(500).json({ message: 'Failed to get git status' });
    }
  });

  // Mission System endpoints
  app.get('/api/missions', async (req, res) => {
    try {
      // Sample missions data
      const sampleMissions = [
        {
          id: 'mission-1',
          title: 'Complete First JavaScript Project',
          description: 'Build a simple calculator application using vanilla JavaScript with basic arithmetic operations.',
          category: 'coding',
          difficulty: 'easy',
          status: 'active',
          progress: 3,
          maxProgress: 5,
          reward: {
            points: 100,
            coins: 25,
            badges: ['JavaScript Beginner'],
            unlocks: ['Advanced JS Missions']
          },
          requirements: [
            { description: 'Create HTML structure', completed: true },
            { description: 'Implement basic operations', completed: true },
            { description: 'Add CSS styling', completed: true },
            { description: 'Test all functions', completed: false },
            { description: 'Deploy to GitHub Pages', completed: false }
          ],
          timeLimit: 48,
          createdAt: '2025-01-01T10:00:00Z',
          assignedBy: 'System'
        },
        {
          id: 'mission-2',
          title: 'Master Git Version Control',
          description: 'Learn essential Git commands and workflow by managing a real project with branches, commits, and merges.',
          category: 'learning',
          difficulty: 'medium',
          status: 'pending',
          progress: 0,
          maxProgress: 8,
          reward: {
            points: 200,
            coins: 50,
            badges: ['Git Master'],
            unlocks: ['Collaboration Missions']
          },
          requirements: [
            { description: 'Create repository', completed: false },
            { description: 'Make 10 commits', completed: false },
            { description: 'Create and merge branch', completed: false },
            { description: 'Resolve merge conflict', completed: false },
            { description: 'Use pull requests', completed: false },
            { description: 'Tag a release', completed: false },
            { description: 'Collaborate with team', completed: false },
            { description: 'Write good commit messages', completed: false }
          ],
          timeLimit: 72,
          createdAt: '2025-01-01T12:00:00Z',
          assignedBy: 'System'
        },
        {
          id: 'mission-3',
          title: 'Database Design Challenge',
          description: 'Design and implement a relational database schema for an e-commerce application with proper normalization.',
          category: 'coding',
          difficulty: 'hard',
          status: 'pending',
          progress: 0,
          maxProgress: 6,
          reward: {
            points: 350,
            coins: 100,
            badges: ['Database Architect'],
            unlocks: ['Advanced Database Missions']
          },
          requirements: [
            { description: 'Design ER diagram', completed: false },
            { description: 'Create normalized tables', completed: false },
            { description: 'Implement relationships', completed: false },
            { description: 'Write complex queries', completed: false },
            { description: 'Add indexes and constraints', completed: false },
            { description: 'Test data integrity', completed: false }
          ],
          timeLimit: 96,
          createdAt: '2025-01-01T14:00:00Z',
          assignedBy: 'System'
        },
        {
          id: 'mission-4',
          title: 'Daily Code Review',
          description: 'Review and provide constructive feedback on team member\'s code submissions.',
          category: 'daily',
          difficulty: 'easy',
          status: 'completed',
          progress: 1,
          maxProgress: 1,
          reward: {
            points: 50,
            coins: 10,
            badges: [],
            unlocks: []
          },
          requirements: [
            { description: 'Review 3 pull requests', completed: true }
          ],
          timeLimit: 24,
          createdAt: '2025-01-01T08:00:00Z',
          completedAt: '2025-01-01T16:30:00Z',
          assignedBy: 'System'
        },
        {
          id: 'mission-5',
          title: 'Team Collaboration Sprint',
          description: 'Successfully complete a week-long sprint with your development team, meeting all sprint goals.',
          category: 'collaboration',
          difficulty: 'medium',
          status: 'active',
          progress: 4,
          maxProgress: 7,
          reward: {
            points: 250,
            coins: 75,
            badges: ['Team Player', 'Sprint Champion'],
            unlocks: ['Leadership Missions']
          },
          requirements: [
            { description: 'Attend all daily standups', completed: true },
            { description: 'Complete assigned tasks', completed: true },
            { description: 'Help team members', completed: true },
            { description: 'Participate in retrospective', completed: true },
            { description: 'Meet sprint deadline', completed: false },
            { description: 'Zero critical bugs', completed: false },
            { description: 'Document deliverables', completed: false }
          ],
          timeLimit: 168,
          createdAt: '2024-12-30T09:00:00Z',
          assignedBy: 'Team Lead'
        }
      ];

      res.json(sampleMissions);
    } catch (error) {
      console.error('Failed to get missions:', error);
      res.status(500).json({ message: 'Failed to get missions' });
    }
  });

  app.get('/api/missions/stats', async (req, res) => {
    try {
      const stats = {
        totalMissions: 15,
        completedMissions: 8,
        failedMissions: 2,
        totalPoints: 2450,
        totalCoins: 125,
        currentLevel: 5,
        experiencePoints: 2450,
        nextLevelExp: 3000,
        badges: ['First Steps', 'Code Warrior', 'Team Player', 'Git Master', 'Database Pro'],
        streak: 7,
        rank: 'Advanced Developer'
      };

      res.json(stats);
    } catch (error) {
      console.error('Failed to get mission stats:', error);
      res.status(500).json({ message: 'Failed to get mission stats' });
    }
  });

  app.post('/api/missions/:id/start', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Simulate mission start
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      res.json({
        success: true,
        message: `Mission ${id} started successfully`,
        startedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to start mission:', error);
      res.status(500).json({ message: 'Failed to start mission' });
    }
  });

  app.post('/api/missions/:id/complete', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Simulate mission completion with rewards
      const reward = {
        points: Math.floor(Math.random() * 200) + 50,
        coins: Math.floor(Math.random() * 50) + 10,
        badges: Math.random() > 0.7 ? ['Mission Master'] : [],
        unlocks: Math.random() > 0.8 ? ['Advanced Missions'] : []
      };
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      res.json({
        success: true,
        message: `Mission ${id} completed successfully`,
        reward,
        completedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to complete mission:', error);
      res.status(500).json({ message: 'Failed to complete mission' });
    }
  });

  app.post('/api/missions', async (req, res) => {
    try {
      const { title, description, category, difficulty, timeLimit, requirements } = req.body;
      
      if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required' });
      }
      
      const newMission = {
        id: `mission-${Date.now()}`,
        title,
        description,
        category: category || 'coding',
        difficulty: difficulty || 'medium',
        status: 'pending',
        progress: 0,
        maxProgress: requirements?.length || 1,
        reward: {
          points: difficulty === 'easy' ? 50 : difficulty === 'medium' ? 100 : difficulty === 'hard' ? 200 : 300,
          coins: Math.floor((difficulty === 'easy' ? 50 : difficulty === 'medium' ? 100 : difficulty === 'hard' ? 200 : 300) / 4),
          badges: [],
          unlocks: []
        },
        requirements: requirements?.map((req: string) => ({
          description: req,
          completed: false
        })) || [{ description: 'Complete the mission', completed: false }],
        timeLimit: timeLimit || 24,
        createdAt: new Date().toISOString(),
        assignedBy: 'User'
      };
      
      // In a real implementation, this would save to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      res.json({
        success: true,
        message: 'Mission created successfully',
        mission: newMission
      });
    } catch (error) {
      console.error('Failed to create mission:', error);
      res.status(500).json({ message: 'Failed to create mission' });
    }
  });

  app.delete('/api/missions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Simulate mission deletion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      res.json({
        success: true,
        message: `Mission ${id} deleted successfully`
      });
    } catch (error) {
      console.error('Failed to delete mission:', error);
      res.status(500).json({ message: 'Failed to delete mission' });
    }
  });

  app.post('/api/missions/:id/progress', async (req, res) => {
    try {
      const { id } = req.params;
      const { requirementIndex, completed } = req.body;
      
      // Simulate progress update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      res.json({
        success: true,
        message: 'Mission progress updated',
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update mission progress:', error);
      res.status(500).json({ message: 'Failed to update mission progress' });
    }
  });

  app.get('/api/missions/leaderboard', async (req, res) => {
    try {
      const leaderboard = [
        { rank: 1, username: 'CodeMaster', points: 4250, level: 8, badges: 12 },
        { rank: 2, username: 'DevNinja', points: 3890, level: 7, badges: 10 },
        { rank: 3, username: 'BugHunter', points: 3560, level: 6, badges: 9 },
        { rank: 4, username: 'GitGuru', points: 3200, level: 6, badges: 8 },
        { rank: 5, username: 'DataWiz', points: 2890, level: 5, badges: 7 },
        { rank: 6, username: 'You', points: 2450, level: 5, badges: 5 },
        { rank: 7, username: 'ScriptKid', points: 2100, level: 4, badges: 6 },
        { rank: 8, username: 'FullStack', points: 1950, level: 4, badges: 5 },
        { rank: 9, username: 'ReactPro', points: 1750, level: 3, badges: 4 },
        { rank: 10, username: 'NodeJS', points: 1500, level: 3, badges: 3 }
      ];

      res.json(leaderboard);
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      res.status(500).json({ message: 'Failed to get leaderboard' });
    }
  });

  // GitHub Integration routes
  let githubToken: string | null = null;

  app.post('/api/github/auth', async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      // Test the token by making a request to GitHub API
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'DeepBlue-IDE'
        }
      });

      if (!response.ok) {
        return res.status(401).json({ error: 'Invalid GitHub token' });
      }

      githubToken = token;
      const user = await response.json();
      
      res.json({ authenticated: true, user });
    } catch (error) {
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  app.get('/api/github/status', async (req, res) => {
    res.json({ authenticated: !!githubToken });
  });

  app.get('/api/github/user', async (req, res) => {
    if (!githubToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${githubToken}`,
          'User-Agent': 'DeepBlue-IDE'
        }
      });

      if (!response.ok) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const user = await response.json();
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user info' });
    }
  });

  app.get('/api/github/repositories', async (req, res) => {
    if (!githubToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50', {
        headers: {
          'Authorization': `token ${githubToken}`,
          'User-Agent': 'DeepBlue-IDE'
        }
      });

      if (!response.ok) {
        return res.status(401).json({ error: 'Failed to fetch repositories' });
      }

      const repos = await response.json();
      res.json(repos);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch repositories' });
    }
  });

  app.post('/api/github/push', async (req, res) => {
    if (!githubToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const { repository, commitMessage, branch } = req.body;
      
      // Get all files from current project
      const files = await storage.getFilesByProject(1); // Default project
      
      // Create commit data
      const commitData = {
        message: commitMessage,
        content: files.map(file => ({
          path: file.path.startsWith('/') ? file.path.slice(1) : file.path,
          content: file.content,
          encoding: 'utf-8'
        }))
      };

      // For now, return success - full GitHub push implementation would require more complex API calls
      res.json({ 
        success: true, 
        message: 'Code push initiated',
        repository,
        branch,
        filesCount: files.length
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to push code' });
    }
  });

  app.post('/api/github/clone', async (req, res) => {
    try {
      const { repositoryUrl } = req.body;
      
      // For now, return success - full clone implementation would require git operations
      res.json({ 
        success: true, 
        message: 'Repository clone initiated',
        url: repositoryUrl
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clone repository' });
    }
  });

  app.post('/api/github/create-repo', async (req, res) => {
    if (!githubToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const { name, description, private: isPrivate } = req.body;
      
      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'User-Agent': 'DeepBlue-IDE',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description,
          private: isPrivate,
          auto_init: true
        })
      });

      if (!response.ok) {
        const error = await response.json();
        return res.status(response.status).json({ error: error.message });
      }

      const repo = await response.json();
      res.json(repo);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create repository' });
    }
  });

  // OpenAI Integration API endpoints
  app.post('/api/openai/analyze-code', async (req, res) => {
    try {
      const request: CodeAnalysisRequest = req.body;
      
      if (!request.code || !request.language || !request.task) {
        return res.status(400).json({ error: 'Missing required parameters: code, language, task' });
      }

      const result = await openAIService.analyzeCode(request);
      res.json(result);
    } catch (error: any) {
      console.error('OpenAI analyze code error:', error);
      res.status(500).json({ error: error.message || 'Failed to analyze code' });
    }
  });

  app.post('/api/openai/generate-code', async (req, res) => {
    try {
      const request: CodeGenerationRequest = req.body;
      
      if (!request.prompt || !request.language) {
        return res.status(400).json({ error: 'Missing required parameters: prompt, language' });
      }

      const result = await openAIService.generateCode(request);
      res.json(result);
    } catch (error: any) {
      console.error('OpenAI generate code error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate code' });
    }
  });

  app.post('/api/openai/chat', async (req, res) => {
    try {
      const { message, context } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const result = await openAIService.chatCompletion(message, context);
      res.json(result);
    } catch (error: any) {
      console.error('OpenAI chat error:', error);
      res.status(500).json({ error: error.message || 'Failed to process chat request' });
    }
  });

  app.post('/api/openai/generate-image', async (req, res) => {
    try {
      const { code, description } = req.body;
      
      if (!code || !description) {
        return res.status(400).json({ error: 'Code and description are required' });
      }

      const result = await openAIService.generateImageFromCode(code, description);
      res.json(result);
    } catch (error: any) {
      console.error('OpenAI image generation error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate image' });
    }
  });

  app.get('/api/openai/status', async (req, res) => {
    try {
      const hasApiKey = !!process.env.OPENAI_API_KEY;
      res.json({
        available: hasApiKey,
        message: hasApiKey ? 'OpenAI API is configured and ready' : 'OpenAI API key not configured',
        features: {
          codeAnalysis: hasApiKey,
          codeGeneration: hasApiKey,
          chatCompletion: hasApiKey,
          imageGeneration: hasApiKey
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to check OpenAI status' });
    }
  });

  // Enhanced User Account Management API endpoints
  app.get('/api/user/profile', requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userSettings = await storage.getUserSettings(userId);
      const userActivity = await storage.getUserActivity(userId, 10);
      
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        bio: user.bio,
        location: user.location,
        website: user.website,
        githubUsername: user.githubUsername,
        twitterUsername: user.twitterUsername,
        linkedinUsername: user.linkedinUsername,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        settings: userSettings,
        recentActivity: userActivity
      });
    } catch (error: any) {
      console.error('Get user profile error:', error);
      res.status(500).json({ error: 'Failed to get user profile' });
    }
  });

  app.put('/api/user/profile', requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const updates = req.body;
      
      // Validate input
      if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      const updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName
        }
      });
    } catch (error: any) {
      console.error('Update user profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  app.post('/api/user/change-password', requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters long' });
      }

      // Verify current password
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const bcrypt = await import('bcrypt');
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      const success = await storage.updateUserPassword(userId, hashedNewPassword);

      if (success) {
        // Log activity
        await storage.logUserActivity({
          userId,
          action: 'password_changed',
          details: 'User changed their password',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.json({ message: 'Password changed successfully' });
      } else {
        res.status(500).json({ error: 'Failed to change password' });
      }
    } catch (error: any) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  });

  app.get('/api/user/sessions', requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const sessions = await storage.getUserSessions(userId);
      
      const sessionsWithDetails = sessions.map(session => ({
        id: session.id,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        isActive: session.isActive,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        isCurrent: session.sessionToken === req.sessionID
      }));

      res.json(sessionsWithDetails);
    } catch (error: any) {
      console.error('Get user sessions error:', error);
      res.status(500).json({ error: 'Failed to get user sessions' });
    }
  });

  app.delete('/api/user/sessions/:sessionId', requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const sessionId = parseInt(req.params.sessionId);

      const success = await storage.deleteUserSession(sessionId);
      if (success) {
        await storage.logUserActivity({
          userId,
          action: 'session_revoked',
          details: `User revoked session ${sessionId}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.json({ message: 'Session revoked successfully' });
      } else {
        res.status(404).json({ error: 'Session not found' });
      }
    } catch (error: any) {
      console.error('Revoke session error:', error);
      res.status(500).json({ error: 'Failed to revoke session' });
    }
  });

  app.put('/api/user/settings', requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const settings = req.body;

      const updatedSettings = await storage.updateUserSettings(userId, settings);
      res.json({
        message: 'Settings updated successfully',
        settings: updatedSettings
      });
    } catch (error: any) {
      console.error('Update user settings error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  app.get('/api/user/activity', requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const activities = await storage.getUserActivity(userId, limit);
      res.json(activities);
    } catch (error: any) {
      console.error('Get user activity error:', error);
      res.status(500).json({ error: 'Failed to get user activity' });
    }
  });

  app.get('/api/user/subscription-status', requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Mock subscription data - in real implementation, this would come from a billing service
      const subscriptionData = {
        plan: 'pro',
        status: 'active',
        startDate: '2024-01-15',
        endDate: '2025-01-15',
        autoRenew: true,
        features: ['Unlimited Projects', '10GB Storage', 'AI Assistant', 'Advanced Debugging', 'Team Collaboration'],
        usage: {
          projects: { used: 15, limit: -1 },
          storage: { used: 2.5, limit: 10 },
          aiRequests: { used: 850, limit: -1 }
        },
        apiUsage: {
          openaiRequests: { used: 850, limit: -1, resetDate: '2025-02-01' },
          githubIntegrations: { used: 5, limit: 10 },
          deployments: { used: 12, limit: 50 },
          collaborators: { used: 3, limit: 10 }
        }
      };

      res.json(subscriptionData);
    } catch (error: any) {
      console.error('Get subscription status error:', error);
      res.status(500).json({ error: 'Failed to get subscription status' });
    }
  });

  // Beta System API endpoints
  app.get('/api/beta/status', (req, res) => {
    // For development, simulate beta status
    res.json({
      isBetaUser: false,
      betaAccessLevel: null,
      verificationStatus: 'none'
    });
  });

  // Admin Beta Management endpoints
  app.get('/api/admin/beta/settings', (req, res) => {
    // Simulate beta system settings
    res.json({
      betaSystemEnabled: true,
      autoApprovalEnabled: false,
      maxBetaUsers: 1000,
      currentBetaUsers: 127,
      requiresVerification: true,
      allowedDomains: ['deepblueide.dev', 'localhost'],
      betaFeatures: {
        aiAssistant: true,
        advancedDebugger: true,
        gameEngine: true,
        collaboration: false,
        premiumThemes: true
      }
    });
  });

  app.post('/api/admin/beta/toggle', (req, res) => {
    const { enabled } = req.body;
    
    // Simulate toggling beta system
    console.log(`Beta system ${enabled ? 'enabled' : 'disabled'} by admin`);
    
    res.json({
      success: true,
      message: `Beta system has been ${enabled ? 'enabled' : 'disabled'}`,
      betaSystemEnabled: enabled
    });
  });

  app.get('/api/admin/beta/users', (req, res) => {
    // Simulate beta users list
    const betaUsers = [
      {
        id: 1,
        email: 'developer@example.com',
        accessLevel: 'developer',
        status: 'active',
        joinedAt: '2025-01-01T10:00:00Z',
        lastActive: '2025-01-04T15:30:00Z',
        feedbackCount: 12,
        bugsReported: 5
      },
      {
        id: 2,
        email: 'tester@example.com',
        accessLevel: 'premium',
        status: 'active',
        joinedAt: '2025-01-02T14:20:00Z',
        lastActive: '2025-01-04T12:15:00Z',
        feedbackCount: 8,
        bugsReported: 3
      },
      {
        id: 3,
        email: 'beta@example.com',
        accessLevel: 'basic',
        status: 'inactive',
        joinedAt: '2025-01-03T09:45:00Z',
        lastActive: '2025-01-03T16:22:00Z',
        feedbackCount: 2,
        bugsReported: 1
      }
    ];
    
    res.json(betaUsers);
  });

  app.post('/api/admin/beta/generate-token', (req, res) => {
    const { accessLevel, maxUses, expiresAt } = req.body;
    
    // Generate a demo token
    const token = `BETA-${Date.now()}-${accessLevel.toUpperCase()}`;
    
    res.json({
      success: true,
      token,
      accessLevel,
      maxUses: maxUses || 1,
      expiresAt: expiresAt || null,
      createdAt: new Date().toISOString()
    });
  });

  app.get('/api/admin/beta/tokens', (req, res) => {
    // Simulate beta tokens list
    const tokens = [
      {
        id: 1,
        token: 'BETA-2025-DEEPBLUE',
        accessLevel: 'premium',
        maxUses: 1,
        usedCount: 0,
        isActive: true,
        expiresAt: null,
        createdAt: '2025-01-01T10:00:00Z',
        createdBy: 'admin@deepblueide.dev'
      },
      {
        id: 2,
        token: 'DEV-PREVIEW-001',
        accessLevel: 'developer',
        maxUses: 5,
        usedCount: 2,
        isActive: true,
        expiresAt: '2025-06-01T00:00:00Z',
        createdAt: '2025-01-01T10:00:00Z',
        createdBy: 'admin@deepblueide.dev'
      },
      {
        id: 3,
        token: 'ADMIN-ACCESS-123',
        accessLevel: 'admin',
        maxUses: 999,
        usedCount: 1,
        isActive: true,
        expiresAt: null,
        createdAt: '2025-01-01T10:00:00Z',
        createdBy: 'admin@deepblueide.dev'
      }
    ];
    
    res.json(tokens);
  });

  app.post('/api/admin/beta/update-settings', (req, res) => {
    const settings = req.body;
    
    // Simulate updating beta settings
    console.log('Beta settings updated:', settings);
    
    res.json({
      success: true,
      message: 'Beta settings updated successfully',
      settings
    });
  });

  app.post('/api/beta/verify-token', (req, res) => {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Beta token is required'
      });
    }

    // Simulate token verification for development
    if (token === 'BETA-2025-DEEPBLUE' || token === 'DEV-PREVIEW-001' || token === 'ADMIN-ACCESS-123') {
      const accessLevel = token === 'ADMIN-ACCESS-123' ? 'admin' : 
                         token === 'DEV-PREVIEW-001' ? 'developer' : 'premium';
      
      return res.json({
        success: true,
        message: 'Beta token verified successfully',
        tokenData: {
          token,
          tokenType: 'access',
          accessLevel,
          maxUses: accessLevel === 'admin' ? 999 : 1,
          usedCount: 0,
          isActive: true,
          expiresAt: null,
          description: `${accessLevel.charAt(0).toUpperCase() + accessLevel.slice(1)} beta access token`
        }
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid or expired beta token'
    });
  });

  app.post('/api/beta/activate', (req, res) => {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Beta token is required'
      });
    }

    // Simulate activation for development
    res.json({
      success: true,
      message: 'Beta access activated successfully',
      userStatus: {
        isBetaUser: true,
        betaAccessLevel: 'premium',
        verificationStatus: 'verified'
      }
    });
  });

  app.post('/api/beta/feedback', (req, res) => {
    const feedback = req.body;
    
    // Simulate feedback submission
    console.log('Beta feedback received:', feedback);
    
    res.json({
      success: true,
      message: 'Thank you for your feedback! It has been submitted to our development team.'
    });
  });

  const httpServer = createServer(app);
  // Systems Status API endpoints
  app.get("/api/admin/system-status", async (req, res) => {
    try {
      const systemStatus = {
        overallHealth: 'healthy',
        uptime: '99.98%',
        responseTime: '145ms',
        totalUsers: 1247,
        activeUsers: 342,
        errorRate: '0.02%',
        lastUpdated: new Date().toISOString(),
        maintenanceMode: false,
      };
      res.json(systemStatus);
    } catch (error) {
      res.status(500).json({ message: "Failed to get system status" });
    }
  });

  app.get("/api/admin/service-health", async (req, res) => {
    try {
      const serviceHealth = [
        { 
          name: 'API Server', 
          status: 'healthy', 
          uptime: '99.99%', 
          responseTime: '45ms', 
          cpu: Math.floor(Math.random() * 50) + 20, 
          memory: Math.floor(Math.random() * 40) + 40 
        },
        { 
          name: 'Database', 
          status: 'healthy', 
          uptime: '99.95%', 
          responseTime: '12ms', 
          cpu: Math.floor(Math.random() * 30) + 15, 
          memory: Math.floor(Math.random() * 30) + 30 
        },
        { 
          name: 'File Storage', 
          status: 'warning', 
          uptime: '99.87%', 
          responseTime: '234ms', 
          cpu: Math.floor(Math.random() * 30) + 70, 
          memory: Math.floor(Math.random() * 20) + 80 
        },
        { 
          name: 'Authentication', 
          status: 'healthy', 
          uptime: '100%', 
          responseTime: '23ms', 
          cpu: Math.floor(Math.random() * 20) + 10, 
          memory: Math.floor(Math.random() * 20) + 25 
        },
        { 
          name: 'Code Execution', 
          status: 'healthy', 
          uptime: '99.92%', 
          responseTime: '567ms', 
          cpu: Math.floor(Math.random() * 30) + 35, 
          memory: Math.floor(Math.random() * 20) + 45 
        },
        { 
          name: 'Real-time Sync', 
          status: 'degraded', 
          uptime: '98.12%', 
          responseTime: '1.2s', 
          cpu: Math.floor(Math.random() * 20) + 80, 
          memory: Math.floor(Math.random() * 15) + 85 
        },
      ];
      res.json(serviceHealth);
    } catch (error) {
      res.status(500).json({ message: "Failed to get service health" });
    }
  });

  app.get("/api/admin/performance-metrics", async (req, res) => {
    try {
      const performanceMetrics = {
        cpu: { 
          current: Math.floor(Math.random() * 40) + 30, 
          average: Math.floor(Math.random() * 30) + 25, 
          peak: Math.floor(Math.random() * 30) + 70 
        },
        memory: { 
          current: Math.floor(Math.random() * 30) + 50, 
          average: Math.floor(Math.random() * 20) + 45, 
          peak: Math.floor(Math.random() * 20) + 80 
        },
        disk: { 
          current: Math.floor(Math.random() * 20) + 25, 
          average: Math.floor(Math.random() * 15) + 20, 
          peak: Math.floor(Math.random() * 20) + 35 
        },
        network: { 
          current: Math.floor(Math.random() * 30) + 15, 
          average: Math.floor(Math.random() * 20) + 20, 
          peak: Math.floor(Math.random() * 30) + 50 
        },
        requests: { 
          current: Math.floor(Math.random() * 500) + 800, 
          total: Math.floor(Math.random() * 10000) + 40000, 
          errors: Math.floor(Math.random() * 20) + 5 
        },
        bandwidth: { 
          incoming: `${(Math.random() * 3 + 1).toFixed(1)} GB/h`, 
          outgoing: `${(Math.random() * 5 + 3).toFixed(1)} GB/h` 
        },
      };
      res.json(performanceMetrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to get performance metrics" });
    }
  });

  app.get("/api/admin/incidents", async (req, res) => {
    try {
      const incidents = [
        {
          id: 1,
          title: 'File Storage Slowdown',
          status: 'investigating',
          severity: 'medium',
          startTime: '2025-01-04T18:45:00Z',
          description: 'Users experiencing slower file upload speeds',
          updates: 3,
        },
        {
          id: 2,
          title: 'API Rate Limiting Issues',
          status: 'resolved',
          severity: 'low',
          startTime: '2025-01-04T14:20:00Z',
          endTime: '2025-01-04T15:30:00Z',
          description: 'Some users encountered rate limiting errors',
          updates: 5,
        },
      ];
      res.json(incidents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get incidents" });
    }
  });

  app.post("/api/admin/maintenance-mode", async (req, res) => {
    try {
      const { enabled } = req.body;
      // In a real implementation, this would update a global maintenance flag
      res.json({ 
        success: true, 
        maintenanceMode: enabled,
        message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle maintenance mode" });
    }
  });

  app.post("/api/admin/restart-service", async (req, res) => {
    try {
      const { serviceName } = req.body;
      // In a real implementation, this would restart the specified service
      res.json({ 
        success: true, 
        service: serviceName,
        message: `Service ${serviceName} restarted successfully`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to restart service" });
    }
  });

  // Admin Authentication Routes
  
  // PIN Verification endpoint (Protected by directory auth)
  app.post("/api/admin/verify-pin", adminDirectoryAuth.requireDirectoryAuth, async (req, res) => {
    try {
      const { pin } = req.body;
      
      // Production PIN verification - configurable through environment variables
      const adminPin = process.env.ADMIN_PIN || "123456";
      
      console.log('PIN verification attempt:', { pinLength: pin?.length });
      
      if (pin === adminPin) {
        console.log('PIN verification successful');
        res.json({
          success: true,
          token: "verified-pin-token-" + Date.now(),
          message: "PIN verified successfully"
        });
      } else {
        console.log('Invalid PIN provided');
        res.status(401).json({ 
          success: false,
          message: "Invalid PIN" 
        });
      }
    } catch (error: any) {
      console.error('PIN verification error:', error);
      res.status(500).json({ 
        success: false,
        message: "PIN verification failed" 
      });
    }
  });

  app.post("/api/admin/login", adminDirectoryAuth.requireDirectoryAuth, async (req, res) => {
    try {
      const { username, password, token } = req.body;
      
      // Debug logging for production troubleshooting
      console.log('Admin login attempt:', { 
        username, 
        passwordLength: password?.length, 
        hasToken: !!token,
        tokenType: token?.substring(0, 20) + '...'
      });
      
      // Verify PIN token first
      if (!token || !token.includes('verified-pin-token')) {
        console.log('PIN verification failed - token missing or invalid');
        return res.status(401).json({ message: "PIN verification required" });
      }
      
      // Production admin credentials - configurable through environment variables
      const adminUsername = process.env.ADMIN_USERNAME || "admin";
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
      
      if (username === adminUsername && password === adminPassword) {
        const adminData = {
          id: 1,
          username: adminUsername,
          email: process.env.ADMIN_EMAIL || "admin@deepblueide.dev",
          role: "super_admin",
          department: "system",
          permissions: ["all"],
          lastLogin: new Date().toISOString(),
          loginCount: Math.floor(Math.random() * 200) + 50,
          accountCreated: "2025-01-01T00:00:00Z"
        };
        
        console.log('Admin login successful for user:', username);
        
        // Create admin session
        (req.session as any).adminId = adminData.id;
        (req.session as any).adminUsername = adminData.username;
        (req.session as any).adminRole = adminData.role;
        
        res.json({
          success: true,
          admin: adminData,
          token: "admin-session-" + Date.now(),
          sessionExpires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours
        });
      } else {
        console.log('Invalid credentials provided:', { username, expectedUsername: adminUsername });
        res.status(401).json({ message: "Invalid admin credentials" });
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/admin/logout", async (req, res) => {
    try {
      // Clear admin session data
      if (req.session) {
        const adminUsername = (req.session as any).adminUsername;
        delete (req.session as any).adminId;
        delete (req.session as any).adminUsername;
        delete (req.session as any).adminRole;
        
        console.log('Admin logout successful for user:', adminUsername);
      }
      
      res.json({ success: true, message: "Admin logged out successfully" });
    } catch (error: any) {
      console.error('Admin logout error:', error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  app.get("/api/admin/profile", requireAdminAuth, async (req, res) => {
    try {
      // Get admin profile from session
      const adminId = (req.session as any).adminId;
      const adminUsername = (req.session as any).adminUsername;
      const adminRole = (req.session as any).adminRole;
      
      const adminProfile = {
        id: adminId,
        username: adminUsername,
        email: process.env.ADMIN_EMAIL || "admin@deepblueide.dev",
        firstName: "System",
        lastName: "Administrator",
        role: adminRole,
        department: "system",
        permissions: ["all"],
        lastLogin: new Date().toISOString(),
        loginCount: Math.floor(Math.random() * 200) + 100,
        accountCreated: "2025-01-01T00:00:00Z"
      };
      
      res.json(adminProfile);
    } catch (error: any) {
      console.error('Admin profile fetch error:', error);
      res.status(500).json({ message: "Failed to fetch admin profile" });
    }
  });

  // Admin Configuration Routes
  app.get("/api/admin/configuration", async (req, res) => {
    try {
      // In production, this would load from database or config files
      const defaultConfiguration = {
        system: {
          maintenanceMode: false,
          maxConcurrentUsers: 1000,
          systemName: 'DeepBlue:Octopus IDE',
          systemVersion: '2.1.0',
          autoBackup: true,
          backupFrequency: 'daily',
          logLevel: 'info',
          debugMode: false,
        },
        features: {
          aiAssistant: true,
          codeExecution: true,
          fileSharing: true,
          collaboration: true,
          gitIntegration: true,
          terminalAccess: true,
          packageManager: true,
          debugger: true,
          gameEngine: true,
          mobileFramework: true,
          umlDesigner: true,
          mathLibrary: true,
          audioVideoEditor: true,
          betaAccess: true,
          advancedEditor: true,
          multiLanguageSupport: true,
          cloudStorage: true,
          realTimeCollaboration: true,
          codeAnalysis: true,
          performanceMonitoring: true,
        },
        billing: {
          freeTierLimits: {
            maxProjects: 5,
            storageLimit: '100MB',
            aiRequestsPerDay: 50,
            supportedLanguages: 10,
            collaborators: 2,
          },
          goldTierLimits: {
            maxProjects: 50,
            storageLimit: '5GB',
            aiRequestsPerDay: 500,
            supportedLanguages: 20,
            collaborators: 10,
            price: 19.99,
          },
          platinumTierLimits: {
            maxProjects: 999,
            storageLimit: '50GB',
            aiRequestsPerDay: 'unlimited',
            supportedLanguages: 25,
            collaborators: 100,
            price: 49.99,
          },
          paymentMethods: ['credit_card', 'paypal', 'bank_transfer'],
          taxRate: 0.0875,
          trialPeriodDays: 14,
          refundPeriodDays: 30,
        },
        security: {
          enforceHttps: true,
          sessionTimeout: 3600,
          maxLoginAttempts: 5,
          passwordMinLength: 8,
          requireTwoFactor: false,
          allowedDomains: ['deepblueide.dev'],
          ipWhitelist: [],
          encryptionEnabled: true,
          auditLogging: true,
        },
        performance: {
          maxFileSize: 50,
          executionTimeout: 30,
          memoryLimit: 512,
          cpuLimit: 80,
          cacheExpiry: 3600,
          compressionEnabled: true,
          cdnEnabled: true,
          loadBalancing: true,
        },
        interface: {
          defaultTheme: 'deepblue-dark',
          allowThemeCustomization: true,
          defaultLanguage: 'en',
          supportedLanguages: ['en', 'es', 'fr', 'de', 'zh', 'ja'],
          splashScreenEnabled: true,
          tutorialsEnabled: true,
          notificationsEnabled: true,
          soundEffectsEnabled: true,
        },
        api: {
          rateLimit: 1000,
          cors: {
            enabled: true,
            allowedOrigins: ['https://deepblueide.dev', 'http://localhost:3000'],
          },
          versioning: {
            currentVersion: 'v2.1',
            supportedVersions: ['v2.0', 'v2.1'],
          },
          documentation: {
            enabled: true,
            publicAccess: true,
          },
        },
        integrations: {
          github: {
            enabled: true,
            clientId: '',
            webhooksEnabled: false,
          },
          stripe: {
            enabled: true,
            webhooksEnabled: true,
            testMode: true,
          },
          openai: {
            enabled: true,
            model: 'gpt-4',
            maxTokens: 4000,
          },
          analytics: {
            enabled: true,
            provider: 'custom',
            trackingId: '',
          },
        },
      };

      res.json(defaultConfiguration);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch configuration" });
    }
  });

  app.post("/api/admin/configuration", async (req, res) => {
    try {
      const configuration = req.body;
      
      // In production, this would save to database or config files
      // For now, we'll just validate the structure and return success
      
      if (!configuration || typeof configuration !== 'object') {
        return res.status(400).json({ message: "Invalid configuration data" });
      }

      // Validate required sections
      const requiredSections = ['system', 'features', 'billing', 'security', 'performance', 'interface', 'api', 'integrations'];
      for (const section of requiredSections) {
        if (!configuration[section]) {
          return res.status(400).json({ message: `Missing required section: ${section}` });
        }
      }

      res.json({ 
        success: true, 
        message: "Configuration saved successfully",
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to save configuration" });
    }
  });

  app.post("/api/admin/configuration/reset", async (req, res) => {
    try {
      // In production, this would reset configuration to defaults
      res.json({ 
        success: true, 
        message: "Configuration reset to defaults",
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to reset configuration" });
    }
  });

  app.get("/api/admin/configuration/export", async (req, res) => {
    try {
      // In production, this would export current configuration as JSON
      const configuration = {
        exportedAt: new Date().toISOString(),
        version: "2.1.0",
        // ... full configuration data would be here
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="deepblue-config.json"');
      res.json(configuration);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to export configuration" });
    }
  });

  app.post("/api/admin/configuration/import", async (req, res) => {
    try {
      const { configuration } = req.body;
      
      if (!configuration || typeof configuration !== 'object') {
        return res.status(400).json({ message: "Invalid configuration file" });
      }

      // In production, this would validate and import the configuration
      res.json({ 
        success: true, 
        message: "Configuration imported successfully",
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to import configuration" });
    }
  });

  // Development Panel API Routes
  app.get('/api/admin/dev/updates', async (req, res) => {
    try {
      // Simulated file updates data
      const updates = [
        {
          id: '1',
          fileName: 'auth-system.tsx',
          filePath: '/client/src/components/auth/auth-system.tsx',
          updateType: 'security',
          description: 'Enhanced multi-factor authentication system',
          status: 'completed',
          progress: 100,
          errors: [],
          warnings: []
        },
        {
          id: '2',
          fileName: 'database-config.ts',
          filePath: '/server/config/database-config.ts',
          updateType: 'performance',
          description: 'Optimized database connection pooling',
          status: 'pending',
          progress: 0,
          errors: [],
          warnings: ['Backup database before applying']
        }
      ];
      
      res.json({ updates });
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to fetch updates', error: error.message });
    }
  });

  app.get('/api/admin/dev/diagnostics', async (req, res) => {
    try {
      // Run system diagnostics
      const diagnostics = {
        errors: 0,
        warnings: 2,
        suggestions: 5
      };
      
      res.json(diagnostics);
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to run diagnostics', error: error.message });
    }
  });

  app.post('/api/admin/dev/upload', async (req, res) => {
    try {
      // Handle file upload for updates
      console.log('File upload received');
      
      res.json({ 
        success: true, 
        message: 'File uploaded successfully',
        fileId: Date.now().toString()
      });
    } catch (error: any) {
      res.status(500).json({ message: 'File upload failed', error: error.message });
    }
  });

  app.post('/api/admin/dev/execute-script', async (req, res) => {
    try {
      const { script, language } = req.body;
      
      if (!script) {
        return res.status(400).json({ message: 'Script content is required' });
      }
      
      console.log('Executing script:', script.substring(0, 100) + '...');
      console.log('Language:', language);
      
      // Simulate script execution
      const result = {
        success: true,
        output: 'Script executed successfully',
        exitCode: 0,
        executionTime: '0.5s'
      };
      
      res.json({ 
        message: 'Script executed successfully',
        result 
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Script execution failed', error: error.message });
    }
  });

  app.post('/api/admin/dev/ai-assist', async (req, res) => {
    try {
      const { prompt, context } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: 'AI prompt is required' });
      }
      
      console.log('AI assistance requested:', prompt);
      console.log('Context:', context);
      
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        return res.json({
          suggestion: `// AI Assistant Response to: "${prompt}"
          
// Note: OpenAI API key not configured. 
// Please add OPENAI_API_KEY to environment variables for real AI assistance.

// Mock enhancement based on prompt:
const enhancedCode = {
  // Your code would be improved here based on the AI analysis
  improvements: [
    'Code structure optimization',
    'Performance enhancements', 
    'Security improvements',
    'Best practices implementation'
  ]
};

console.log('AI assistance applied:', enhancedCode);`,
          confidence: 85,
          suggestions: ['Add error handling', 'Optimize performance', 'Improve readability']
        });
      }
      
      // Real OpenAI integration would go here
      res.json({
        suggestion: `// AI-enhanced code based on prompt: "${prompt}"
        
const optimizedCode = {
  // AI-generated improvements would appear here
  status: 'enhanced',
  improvements: ['Better error handling', 'Performance optimization']
};`,
        confidence: 90,
        suggestions: ['Consider adding TypeScript types', 'Add unit tests']
      });
    } catch (error: any) {
      res.status(500).json({ message: 'AI assistance failed', error: error.message });
    }
  });

  app.post('/api/admin/dev/apply-update/:updateId', async (req, res) => {
    try {
      const { updateId } = req.params;
      
      console.log('Applying update:', updateId);
      
      // Simulate update application
      res.json({ 
        success: true,
        message: `Update ${updateId} applied successfully`,
        updatedFiles: ['auth-system.tsx', 'types.ts']
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to apply update', error: error.message });
    }
  });

  app.post('/api/admin/dev/save-file', async (req, res) => {
    try {
      const { filePath, content, language } = req.body;
      
      if (!filePath || !content) {
        return res.status(400).json({ message: 'File path and content are required' });
      }
      
      console.log('Saving file:', filePath);
      console.log('Content length:', content.length);
      console.log('Language:', language);
      
      // In a real implementation, you would save the file to the filesystem
      // For now, we'll just log and respond with success
      
      res.json({ 
        success: true,
        message: 'File saved successfully',
        filePath,
        size: content.length
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to save file', error: error.message });
    }
  });

  return httpServer;
}
