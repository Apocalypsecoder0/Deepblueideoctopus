import { 
  users, projects, files, workspaceSettings, debugSessions, snippets,
  userSettings, userSessions, passwordResets, emailVerifications, userActivity,
  type User, type InsertUser, type UpdateUser, type RegisterUser, type LoginUser,
  type Project, type InsertProject, type File, type InsertFile, 
  type WorkspaceSettings, type InsertWorkspaceSettings,
  type DebugSession, type InsertDebugSession, type Snippet, type InsertSnippet,
  type UserSettings, type InsertUserSettings, type UserSession, type InsertUserSession,
  type PasswordReset, type InsertPasswordReset, type EmailVerification, type InsertEmailVerification,
  type UserActivity, type InsertUserActivity
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  registerUser(user: RegisterUser): Promise<User>;
  updateUser(id: number, updates: UpdateUser): Promise<User | undefined>;
  updateUserPassword(id: number, hashedPassword: string): Promise<boolean>;
  deleteUser(id: number): Promise<boolean>;
  verifyUserEmail(id: number): Promise<boolean>;
  updateLastLogin(id: number): Promise<boolean>;
  
  // User settings operations
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  updateUserSettings(userId: number, settings: Partial<InsertUserSettings>): Promise<UserSettings>;
  
  // User session operations
  getUserSessions(userId: number): Promise<UserSession[]>;
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  updateUserSession(id: number, updates: Partial<InsertUserSession>): Promise<UserSession | undefined>;
  deleteUserSession(id: number): Promise<boolean>;
  deleteAllUserSessions(userId: number): Promise<boolean>;
  getUserSessionByToken(token: string): Promise<UserSession | undefined>;
  
  // Password reset operations
  createPasswordReset(reset: InsertPasswordReset): Promise<PasswordReset>;
  getPasswordReset(token: string): Promise<PasswordReset | undefined>;
  markPasswordResetUsed(id: number): Promise<boolean>;
  
  // Email verification operations
  createEmailVerification(verification: InsertEmailVerification): Promise<EmailVerification>;
  getEmailVerification(token: string): Promise<EmailVerification | undefined>;
  markEmailVerificationUsed(id: number): Promise<boolean>;
  
  // User activity operations
  getUserActivity(userId: number, limit?: number): Promise<UserActivity[]>;
  logUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
  
  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByUser(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  
  // File operations
  getFile(id: number): Promise<File | undefined>;
  getFilesByProject(projectId: number): Promise<File[]>;
  getFilesByParent(parentId: number | null, projectId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, updates: Partial<InsertFile>): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;
  
  // Workspace settings operations
  getWorkspaceSettings(projectId: number): Promise<WorkspaceSettings | undefined>;
  updateWorkspaceSettings(projectId: number, settings: Partial<InsertWorkspaceSettings>): Promise<WorkspaceSettings>;
  
  // Debug session operations
  getDebugSessions(projectId: number): Promise<DebugSession[]>;
  createDebugSession(session: InsertDebugSession): Promise<DebugSession>;
  updateDebugSession(id: number, updates: Partial<InsertDebugSession>): Promise<DebugSession | undefined>;
  deleteDebugSession(id: number): Promise<boolean>;
  
  // Snippet operations
  getSnippets(language?: string): Promise<Snippet[]>;
  createSnippet(snippet: InsertSnippet): Promise<Snippet>;
  updateSnippet(id: number, updates: Partial<InsertSnippet>): Promise<Snippet | undefined>;
  deleteSnippet(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private projects: Map<number, Project> = new Map();
  private files: Map<number, File> = new Map();
  private workspaceSettings: Map<number, WorkspaceSettings> = new Map();
  private debugSessions: Map<number, DebugSession> = new Map();
  private snippets: Map<number, Snippet> = new Map();
  private currentUserId = 1;
  private currentProjectId = 1;
  private currentFileId = 1;
  private currentSettingsId = 1;
  private currentDebugId = 1;
  private currentSnippetId = 1;

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default user with complete schema
    const defaultUser: User = {
      id: this.currentUserId++,
      username: "developer",
      email: "developer@deepblue-ide.com",
      password: "password123",
      firstName: "DeepBlue",
      lastName: "Developer",
      profilePicture: null,
      bio: "Default IDE developer user",
      location: null,
      website: null,
      isVerified: true,
      isActive: true,
      role: "admin",
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(defaultUser.id, defaultUser);

    // Create default project
    const defaultProject: Project = {
      id: this.currentProjectId++,
      name: "my-project",
      description: "Default IDE project",
      userId: defaultUser.id,
      createdAt: new Date()
    };
    this.projects.set(defaultProject.id, defaultProject);

    // Create default files
    const srcFolder: File = {
      id: this.currentFileId++,
      name: "src",
      path: "/src",
      content: "",
      language: "folder",
      projectId: defaultProject.id,
      isDirectory: true,
      parentId: null,
      size: 0,
      lastModified: new Date(),
      isReadonly: false,
      encoding: "utf-8"
    };
    this.files.set(srcFolder.id, srcFolder);

    const mainJs: File = {
      id: this.currentFileId++,
      name: "main.js",
      path: "/src/main.js",
      content: `// Main application file for DeepBlue IDE
import { Editor } from './core/editor';
import { FileManager } from './core/fileManager';

class IDEApplication {
    constructor() {
        this.editor = new Editor();
        this.fileManager = new FileManager();
        this.initialize();
    }

    initialize() {
        // Initialize Monaco Editor
        this.editor.init('editor-container');
        this.setupEventListeners();
        console.log('IDE DeepBlue:Octopus initialized successfully');
    }
}

const app = new IDEApplication();`,
      language: "javascript",
      projectId: defaultProject.id,
      isDirectory: false,
      parentId: srcFolder.id,
      size: 450,
      lastModified: new Date(),
      isReadonly: false,
      encoding: "utf-8"
    };
    this.files.set(mainJs.id, mainJs);

    const stylesCss: File = {
      id: this.currentFileId++,
      name: "styles.css",
      path: "/src/styles.css",
      content: `/* DeepBlue IDE Styles */
.ide-container {
    height: 100vh;
    background: #1E1E1E;
    color: #CCCCCC;
    font-family: 'Inter', sans-serif;
}

.editor-content {
    font-family: 'JetBrains Mono', monospace;
    line-height: 1.6;
}`,
      language: "css",
      projectId: defaultProject.id,
      isDirectory: false,
      parentId: srcFolder.id,
      size: 180,
      lastModified: new Date(),
      isReadonly: false,
      encoding: "utf-8"
    };
    this.files.set(stylesCss.id, stylesCss);

    const indexHtml: File = {
      id: this.currentFileId++,
      name: "index.html",
      path: "/src/index.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DeepBlue IDE</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div id="app" class="ide-container">
        <h1>DeepBlue:Octopus IDE v1.5</h1>
        <div id="editor-container"></div>
    </div>
    <script src="main.js"></script>
</body>
</html>`,
      language: "html",
      projectId: defaultProject.id,
      isDirectory: false,
      parentId: srcFolder.id
    };
    this.files.set(indexHtml.id, indexHtml);

    const packageJson: File = {
      id: this.currentFileId++,
      name: "package.json",
      path: "/package.json",
      content: `{
  "name": "deepblue-ide-project",
  "version": "1.0.0",
  "description": "A project created with DeepBlue:Octopus IDE",
  "main": "src/main.js",
  "scripts": {
    "start": "node src/main.js",
    "dev": "node src/main.js"
  },
  "dependencies": {},
  "devDependencies": {}
}`,
      language: "json",
      projectId: defaultProject.id,
      isDirectory: false,
      parentId: null
    };
    this.files.set(packageJson.id, packageJson);

    const readme: File = {
      id: this.currentFileId++,
      name: "README.md",
      path: "/README.md",
      content: `# DeepBlue IDE Project

This project was created with DeepBlue:Octopus IDE v1.5.

## Getting Started

1. Open the project in the IDE
2. Edit your files in the editor
3. Use the terminal to run commands
4. Save your work regularly

## Features

- Multi-language support
- Syntax highlighting
- File management
- Terminal integration
- Code execution

Happy coding!`,
      language: "markdown",
      projectId: defaultProject.id,
      isDirectory: false,
      parentId: null
    };
    this.files.set(readme.id, readme);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = { 
      ...insertUser, 
      id: this.currentUserId++,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async registerUser(user: RegisterUser): Promise<User> {
    const newUser: User = {
      id: this.currentUserId++,
      username: user.username,
      email: user.email,
      password: user.password,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      profilePicture: null,
      bio: null,
      location: null,
      website: null,
      isVerified: false,
      isActive: true,
      role: "user",
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async updateUser(id: number, updates: UpdateUser): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    
    user.password = hashedPassword;
    user.updatedAt = new Date();
    this.users.set(id, user);
    return true;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async verifyUserEmail(id: number): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    
    user.isVerified = true;
    user.updatedAt = new Date();
    this.users.set(id, user);
    return true;
  }

  async updateLastLogin(id: number): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    
    user.lastLoginAt = new Date();
    user.updatedAt = new Date();
    this.users.set(id, user);
    return true;
  }

  // User settings operations
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    return Array.from(this.workspaceSettings.values()).find(s => s.projectId === userId) as any;
  }

  async updateUserSettings(userId: number, settings: Partial<InsertUserSettings>): Promise<UserSettings> {
    const newSettings: UserSettings = {
      id: this.currentSettingsId++,
      userId,
      theme: settings.theme || "dark",
      language: settings.language || "en",
      timezone: settings.timezone || "UTC",
      notifications: settings.notifications || true,
      emailNotifications: settings.emailNotifications || false,
      twoFactorEnabled: settings.twoFactorEnabled || false,
      privacy: settings.privacy || "public",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return newSettings;
  }

  // User session operations
  private userSessions: Map<number, UserSession> = new Map();
  private passwordResets: Map<number, PasswordReset> = new Map();
  private emailVerifications: Map<number, EmailVerification> = new Map();
  private userActivity: Map<number, UserActivity> = new Map();

  async getUserSessions(userId: number): Promise<UserSession[]> {
    return Array.from(this.userSessions.values()).filter(session => session.userId === userId);
  }

  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const newSession: UserSession = {
      id: this.currentDebugId++,
      userId: session.userId,
      sessionToken: session.sessionToken,
      ipAddress: session.ipAddress || null,
      userAgent: session.userAgent || null,
      isActive: session.isActive || true,
      expiresAt: session.expiresAt,
      createdAt: new Date()
    };
    this.userSessions.set(newSession.id, newSession);
    return newSession;
  }

  async updateUserSession(id: number, updates: Partial<InsertUserSession>): Promise<UserSession | undefined> {
    const session = this.userSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates };
    this.userSessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteUserSession(id: number): Promise<boolean> {
    return this.userSessions.delete(id);
  }

  async deleteAllUserSessions(userId: number): Promise<boolean> {
    const userSessions = Array.from(this.userSessions.values()).filter(s => s.userId === userId);
    userSessions.forEach(session => this.userSessions.delete(session.id));
    return true;
  }

  async getUserSessionByToken(token: string): Promise<UserSession | undefined> {
    return Array.from(this.userSessions.values()).find(s => s.sessionToken === token);
  }

  // Password reset operations
  async createPasswordReset(reset: InsertPasswordReset): Promise<PasswordReset> {
    const newReset: PasswordReset = {
      id: this.currentDebugId++,
      userId: reset.userId,
      token: reset.token,
      expiresAt: reset.expiresAt,
      isUsed: false,
      createdAt: new Date()
    };
    this.passwordResets.set(newReset.id, newReset);
    return newReset;
  }

  async getPasswordReset(token: string): Promise<PasswordReset | undefined> {
    return Array.from(this.passwordResets.values()).find(r => r.token === token);
  }

  async markPasswordResetUsed(id: number): Promise<boolean> {
    const reset = this.passwordResets.get(id);
    if (!reset) return false;
    
    reset.isUsed = true;
    this.passwordResets.set(id, reset);
    return true;
  }

  // Email verification operations
  async createEmailVerification(verification: InsertEmailVerification): Promise<EmailVerification> {
    const newVerification: EmailVerification = {
      id: this.currentDebugId++,
      userId: verification.userId,
      token: verification.token,
      expiresAt: verification.expiresAt,
      isUsed: false,
      createdAt: new Date()
    };
    this.emailVerifications.set(newVerification.id, newVerification);
    return newVerification;
  }

  async getEmailVerification(token: string): Promise<EmailVerification | undefined> {
    return Array.from(this.emailVerifications.values()).find(v => v.token === token);
  }

  async markEmailVerificationUsed(id: number): Promise<boolean> {
    const verification = this.emailVerifications.get(id);
    if (!verification) return false;
    
    verification.isUsed = true;
    this.emailVerifications.set(id, verification);
    return true;
  }

  // User activity operations
  async getUserActivity(userId: number, limit?: number): Promise<UserActivity[]> {
    const activities = Array.from(this.userActivity.values()).filter(a => a.userId === userId);
    return limit ? activities.slice(0, limit) : activities;
  }

  async logUserActivity(activity: InsertUserActivity): Promise<UserActivity> {
    const newActivity: UserActivity = {
      id: this.currentDebugId++,
      userId: activity.userId,
      action: activity.action,
      resource: activity.resource || null,
      metadata: activity.metadata || null,
      ipAddress: activity.ipAddress || null,
      userAgent: activity.userAgent || null,
      createdAt: new Date()
    };
    this.userActivity.set(newActivity.id, newActivity);
    return newActivity;
  }

  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByUser(userId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(project => project.userId === userId);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const project: Project = { 
      ...insertProject, 
      id: this.currentProjectId++,
      createdAt: new Date()
    };
    this.projects.set(project.id, project);
    return project;
  }

  // File operations
  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getFilesByProject(projectId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(file => file.projectId === projectId);
  }

  async getFilesByParent(parentId: number | null, projectId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      file => file.parentId === parentId && file.projectId === projectId
    );
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const file: File = { ...insertFile, id: this.currentFileId++ };
    this.files.set(file.id, file);
    return file;
  }

  async updateFile(id: number, updates: Partial<InsertFile>): Promise<File | undefined> {
    const file = this.files.get(id);
    if (!file) return undefined;
    
    const updatedFile = { ...file, ...updates };
    this.files.set(id, updatedFile);
    return updatedFile;
  }

  async deleteFile(id: number): Promise<boolean> {
    return this.files.delete(id);
  }

  // Workspace settings operations
  async getWorkspaceSettings(projectId: number): Promise<WorkspaceSettings | undefined> {
    return Array.from(this.workspaceSettings.values()).find(settings => settings.projectId === projectId);
  }

  async updateWorkspaceSettings(projectId: number, settings: Partial<InsertWorkspaceSettings>): Promise<WorkspaceSettings> {
    const existing = await this.getWorkspaceSettings(projectId);
    if (existing) {
      const updated = { ...existing, ...settings };
      this.workspaceSettings.set(existing.id, updated);
      return updated;
    } else {
      const newSettings: WorkspaceSettings = {
        id: this.currentSettingsId++,
        projectId,
        theme: "dark",
        fontSize: 14,
        wordWrap: true,
        autoSave: true,
        showLineNumbers: true,
        showMinimap: true,
        tabSize: 2,
        ...settings
      };
      this.workspaceSettings.set(newSettings.id, newSettings);
      return newSettings;
    }
  }

  // Debug session operations
  async getDebugSessions(projectId: number): Promise<DebugSession[]> {
    return Array.from(this.debugSessions.values()).filter(session => session.projectId === projectId);
  }

  async createDebugSession(session: InsertDebugSession): Promise<DebugSession> {
    const debugSession: DebugSession = {
      ...session,
      id: this.currentDebugId++,
      createdAt: new Date()
    };
    this.debugSessions.set(debugSession.id, debugSession);
    return debugSession;
  }

  async updateDebugSession(id: number, updates: Partial<InsertDebugSession>): Promise<DebugSession | undefined> {
    const session = this.debugSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates };
    this.debugSessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteDebugSession(id: number): Promise<boolean> {
    return this.debugSessions.delete(id);
  }

  // Snippet operations
  async getSnippets(language?: string): Promise<Snippet[]> {
    const snippets = Array.from(this.snippets.values());
    if (language) {
      return snippets.filter(snippet => snippet.language === language);
    }
    return snippets;
  }

  async createSnippet(snippet: InsertSnippet): Promise<Snippet> {
    const newSnippet: Snippet = {
      ...snippet,
      id: this.currentSnippetId++,
      createdAt: new Date()
    };
    this.snippets.set(newSnippet.id, newSnippet);
    return newSnippet;
  }

  async updateSnippet(id: number, updates: Partial<InsertSnippet>): Promise<Snippet | undefined> {
    const snippet = this.snippets.get(id);
    if (!snippet) return undefined;
    
    const updatedSnippet = { ...snippet, ...updates };
    this.snippets.set(id, updatedSnippet);
    return updatedSnippet;
  }

  async deleteSnippet(id: number): Promise<boolean> {
    return this.snippets.delete(id);
  }
}

// DatabaseStorage implementation using PostgreSQL
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async registerUser(user: RegisterUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const [newUser] = await db
      .insert(users)
      .values({
        ...user,
        password: hashedPassword,
        isEmailVerified: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newUser;
  }

  async updateUser(id: number, updates: UpdateUser): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async verifyUserEmail(id: number): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ isEmailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async updateLastLogin(id: number): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // User settings operations
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings || undefined;
  }

  async updateUserSettings(userId: number, settings: Partial<InsertUserSettings>): Promise<UserSettings> {
    const existing = await this.getUserSettings(userId);
    if (existing) {
      const [updated] = await db
        .update(userSettings)
        .set(settings)
        .where(eq(userSettings.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userSettings)
        .values({ userId, ...settings })
        .returning();
      return created;
    }
  }

  // User session operations
  async getUserSessions(userId: number): Promise<UserSession[]> {
    return await db.select().from(userSessions).where(eq(userSessions.userId, userId));
  }

  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const [newSession] = await db
      .insert(userSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async updateUserSession(id: number, updates: Partial<InsertUserSession>): Promise<UserSession | undefined> {
    const [session] = await db
      .update(userSessions)
      .set(updates)
      .where(eq(userSessions.id, id))
      .returning();
    return session || undefined;
  }

  async deleteUserSession(id: number): Promise<boolean> {
    const result = await db.delete(userSessions).where(eq(userSessions.id, id));
    return result.rowCount > 0;
  }

  async deleteAllUserSessions(userId: number): Promise<boolean> {
    const result = await db.delete(userSessions).where(eq(userSessions.userId, userId));
    return result.rowCount > 0;
  }

  async getUserSessionByToken(token: string): Promise<UserSession | undefined> {
    const [session] = await db.select().from(userSessions).where(eq(userSessions.token, token));
    return session || undefined;
  }

  // Password reset operations
  async createPasswordReset(reset: InsertPasswordReset): Promise<PasswordReset> {
    const [newReset] = await db
      .insert(passwordResets)
      .values(reset)
      .returning();
    return newReset;
  }

  async getPasswordReset(token: string): Promise<PasswordReset | undefined> {
    const [reset] = await db.select().from(passwordResets).where(eq(passwordResets.token, token));
    return reset || undefined;
  }

  async markPasswordResetUsed(id: number): Promise<boolean> {
    const result = await db
      .update(passwordResets)
      .set({ isUsed: true })
      .where(eq(passwordResets.id, id));
    return result.rowCount > 0;
  }

  // Email verification operations
  async createEmailVerification(verification: InsertEmailVerification): Promise<EmailVerification> {
    const [newVerification] = await db
      .insert(emailVerifications)
      .values(verification)
      .returning();
    return newVerification;
  }

  async getEmailVerification(token: string): Promise<EmailVerification | undefined> {
    const [verification] = await db.select().from(emailVerifications).where(eq(emailVerifications.token, token));
    return verification || undefined;
  }

  async markEmailVerificationUsed(id: number): Promise<boolean> {
    const result = await db
      .update(emailVerifications)
      .set({ isUsed: true })
      .where(eq(emailVerifications.id, id));
    return result.rowCount > 0;
  }

  // User activity operations
  async getUserActivity(userId: number, limit?: number): Promise<UserActivity[]> {
    let query = db.select().from(userActivity).where(eq(userActivity.userId, userId));
    if (limit) {
      query = query.limit(limit);
    }
    return await query;
  }

  async logUserActivity(activity: InsertUserActivity): Promise<UserActivity> {
    const [newActivity] = await db
      .insert(userActivity)
      .values(activity)
      .returning();
    return newActivity;
  }

  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectsByUser(userId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId));
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  // File operations
  async getFile(id: number): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file || undefined;
  }

  async getFilesByProject(projectId: number): Promise<File[]> {
    return await db.select().from(files).where(eq(files.projectId, projectId));
  }

  async getFilesByParent(parentId: number | null, projectId: number): Promise<File[]> {
    return await db.select().from(files).where(
      and(eq(files.parentId, parentId), eq(files.projectId, projectId))
    );
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const [file] = await db
      .insert(files)
      .values(insertFile)
      .returning();
    return file;
  }

  async updateFile(id: number, updates: Partial<InsertFile>): Promise<File | undefined> {
    const [file] = await db
      .update(files)
      .set(updates)
      .where(eq(files.id, id))
      .returning();
    return file || undefined;
  }

  async deleteFile(id: number): Promise<boolean> {
    const result = await db.delete(files).where(eq(files.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Workspace settings operations
  async getWorkspaceSettings(projectId: number): Promise<WorkspaceSettings | undefined> {
    const [settings] = await db.select().from(workspaceSettings).where(eq(workspaceSettings.projectId, projectId));
    return settings || undefined;
  }

  async updateWorkspaceSettings(projectId: number, settings: Partial<InsertWorkspaceSettings>): Promise<WorkspaceSettings> {
    const [result] = await db
      .insert(workspaceSettings)
      .values({ ...settings, projectId })
      .onConflictDoUpdate({
        target: workspaceSettings.projectId,
        set: settings
      })
      .returning();
    return result;
  }

  // Debug session operations
  async getDebugSessions(projectId: number): Promise<DebugSession[]> {
    return await db.select().from(debugSessions).where(eq(debugSessions.projectId, projectId));
  }

  async createDebugSession(session: InsertDebugSession): Promise<DebugSession> {
    const [result] = await db
      .insert(debugSessions)
      .values(session)
      .returning();
    return result;
  }

  async updateDebugSession(id: number, updates: Partial<InsertDebugSession>): Promise<DebugSession | undefined> {
    const [result] = await db
      .update(debugSessions)
      .set(updates)
      .where(eq(debugSessions.id, id))
      .returning();
    return result || undefined;
  }

  async deleteDebugSession(id: number): Promise<boolean> {
    const result = await db.delete(debugSessions).where(eq(debugSessions.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Snippet operations
  async getSnippets(language?: string): Promise<Snippet[]> {
    if (language) {
      return await db.select().from(snippets).where(eq(snippets.language, language));
    }
    return await db.select().from(snippets);
  }

  async createSnippet(snippet: InsertSnippet): Promise<Snippet> {
    const [result] = await db
      .insert(snippets)
      .values(snippet)
      .returning();
    return result;
  }

  async updateSnippet(id: number, updates: Partial<InsertSnippet>): Promise<Snippet | undefined> {
    const [result] = await db
      .update(snippets)
      .set(updates)
      .where(eq(snippets.id, id))
      .returning();
    return result || undefined;
  }

  async deleteSnippet(id: number): Promise<boolean> {
    const result = await db.delete(snippets).where(eq(snippets.id, id));
    return (result.rowCount || 0) > 0;
  }
}

// Initialize default data in database
async function initializeDefaultData() {
  try {
    // Check if default user exists
    const existingUser = await db.select().from(users).where(eq(users.username, "developer"));
    if (existingUser.length > 0) {
      return; // Data already initialized
    }

    // Create default user with full authentication schema
    const hashedPassword = await bcrypt.hash("password123", 10);
    const [defaultUser] = await db
      .insert(users)
      .values({
        username: "developer",
        email: "developer@deepblue-ide.com",
        password: hashedPassword,
        firstName: "Demo",
        lastName: "Developer",
        bio: "Default developer account for DeepBlue IDE",
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // Create default project
    const [defaultProject] = await db
      .insert(projects)
      .values({
        name: "my-project",
        description: "Default IDE project",
        userId: defaultUser.id
      })
      .returning();

    // Create default files
    const [srcFolder] = await db
      .insert(files)
      .values({
        name: "src",
        path: "/src",
        content: "",
        language: "folder",
        projectId: defaultProject.id,
        isDirectory: true,
        parentId: null,
        size: 0,
        isReadonly: false,
        encoding: "utf-8"
      })
      .returning();

    const fileContents = [
      {
        name: "main.js",
        path: "/src/main.js",
        content: `// Welcome to DeepBlue IDE with Database Integration!
console.log("Hello from DeepBlue IDE!");

// This IDE now supports:
// - PostgreSQL Database
// - 13+ Programming Languages
// - VS Code-like Interface
// - Debugging and Extensions

class IDEApplication {
    constructor() {
        console.log("IDE DeepBlue:Octopus v1.5 with Database!");
    }
}

const app = new IDEApplication();`,
        language: "javascript",
        parentId: srcFolder.id
      },
      {
        name: "styles.css",
        path: "/src/styles.css",
        content: `/* DeepBlue IDE Styles */
.ide-container {
    height: 100vh;
    background: #1E1E1E;
    color: #CCCCCC;
    font-family: 'Inter', sans-serif;
}

.editor-content {
    font-family: 'JetBrains Mono', monospace;
    line-height: 1.6;
}`,
        language: "css",
        parentId: srcFolder.id
      },
      {
        name: "package.json",
        path: "/package.json",
        content: `{
  "name": "deepblue-ide-project",
  "version": "1.0.0",
  "description": "A project created with DeepBlue:Octopus IDE with PostgreSQL",
  "main": "src/main.js",
  "scripts": {
    "start": "node src/main.js",
    "dev": "node src/main.js"
  },
  "dependencies": {},
  "devDependencies": {}
}`,
        language: "json",
        parentId: null
      },
      {
        name: "README.md",
        path: "/README.md",
        content: `# DeepBlue IDE Project with Database

This project was created with DeepBlue:Octopus IDE v1.5 with PostgreSQL database integration.

## Features

- **PostgreSQL Database**: Persistent storage for projects and files
- **Multi-Language Support**: JavaScript, TypeScript, Python, Java, C++, Rust, Go, and more
- **VS Code-like Interface**: Activity bar, command palette, settings panel
- **Debug Console**: Advanced debugging with breakpoints and variable inspection
- **Source Control**: Git integration with commit management
- **Extensions**: Marketplace with installable extensions

## Getting Started

1. Open the project in the IDE
2. Edit your files in the Monaco editor
3. Use Ctrl+Shift+P for the command palette
4. Use Ctrl+, for settings
5. Switch between panels using the activity bar

Happy coding with database-powered persistence!`,
        language: "markdown",
        parentId: null
      }
    ];

    for (const fileData of fileContents) {
      await db
        .insert(files)
        .values({
          ...fileData,
          projectId: defaultProject.id,
          isDirectory: false,
          size: fileData.content.length,
          isReadonly: false,
          encoding: "utf-8"
        });
    }

    console.log("✅ Default data initialized in database");
  } catch (error) {
    console.error("❌ Failed to initialize default data:", error);
  }
}

// Add security-related methods to the MemStorage class
class MemStorageWithSecurity extends MemStorage {
  // Security Logs
  async createSecurityLog(logData: any): Promise<any> {
    const securityLog = {
      id: this.nextId++,
      ...logData,
      createdAt: new Date()
    };
    console.log("🔒 Security Log Created:", securityLog);
    return securityLog;
  }

  async getSecurityLogs(userId?: number, limit?: number): Promise<any[]> {
    // Return mock security logs for development
    const mockLogs = [
      {
        id: 1,
        userId: userId || 1,
        eventType: "auth_success",
        severity: "info",
        message: "Security authentication successful",
        source: "security_system",
        ipAddress: "127.0.0.1",
        userAgent: "Browser",
        metadata: {},
        createdAt: new Date()
      },
      {
        id: 2,
        userId: userId || 1,
        eventType: "code_validated",
        severity: "info",
        message: "Code validation completed - Score: 95",
        source: "code_validator",
        ipAddress: "127.0.0.1",
        userAgent: "Browser",
        metadata: { securityScore: 95 },
        createdAt: new Date()
      }
    ];
    
    return limit ? mockLogs.slice(0, limit) : mockLogs;
  }

  // Security Settings
  async createSecuritySettings(settingsData: any): Promise<any> {
    const securitySettings = {
      id: this.nextId++,
      ...settingsData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    console.log("🔒 Security Settings Created:", securitySettings);
    return securitySettings;
  }

  async getSecuritySettings(userId: number): Promise<any> {
    // Return default security settings
    return {
      id: 1,
      userId,
      securityLevel: "enhanced",
      codeValidationEnabled: true,
      realTimeMonitoring: true,
      threatDetection: true,
      maxFailedAttempts: 3,
      lockoutDuration: 300,
      notifyOnThreats: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async updateSecuritySettings(userId: number, updates: any): Promise<any> {
    const updatedSettings = {
      id: 1,
      userId,
      ...updates,
      updatedAt: new Date()
    };
    console.log("🔒 Security Settings Updated:", updatedSettings);
    return updatedSettings;
  }

  // Code Validation Results
  async createCodeValidationResult(resultData: any): Promise<any> {
    const validationResult = {
      id: this.nextId++,
      ...resultData,
      createdAt: new Date()
    };
    console.log("🔒 Code Validation Result Created:", validationResult);
    return validationResult;
  }

  async getCodeValidationResults(userId?: number): Promise<any[]> {
    // Return mock validation results
    return [
      {
        id: 1,
        userId: userId || 1,
        code: "console.log('Hello World');",
        language: "javascript",
        securityScore: 100,
        violations: [],
        isBlocked: false,
        executionAttempted: false,
        ipAddress: "127.0.0.1",
        createdAt: new Date()
      }
    ];
  }

  // Security Threats
  async createSecurityThreat(threatData: any): Promise<any> {
    const securityThreat = {
      id: this.nextId++,
      ...threatData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    console.log("🔒 Security Threat Created:", securityThreat);
    return securityThreat;
  }

  async getSecurityThreats(userId?: number): Promise<any[]> {
    // Return mock security threats
    return [
      {
        id: 1,
        userId: userId || 1,
        threatType: "suspicious",
        severity: "medium",
        description: "Suspicious browser API usage detected",
        source: "code_validator",
        isResolved: false,
        resolvedAt: null,
        resolvedBy: null,
        actionTaken: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  async updateSecurityThreat(threatId: number, updates: any): Promise<any> {
    const updatedThreat = {
      id: threatId,
      ...updates,
      updatedAt: new Date()
    };
    console.log("🔒 Security Threat Updated:", updatedThreat);
    return updatedThreat;
  }

  async resolveSecurityThreat(threatId: number, resolvedBy: number, actionTaken: string): Promise<any> {
    const resolvedThreat = {
      id: threatId,
      isResolved: true,
      resolvedAt: new Date(),
      resolvedBy,
      actionTaken,
      updatedAt: new Date()
    };
    console.log("🔒 Security Threat Resolved:", resolvedThreat);
    return resolvedThreat;
  }
}

export const storage = new MemStorageWithSecurity();

// Initialize default data on startup for database mode
// initializeDefaultData();
