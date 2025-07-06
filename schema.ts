import { pgTable, text, serial, integer, boolean, timestamp, decimal, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profilePicture: text("profile_picture"),
  bio: text("bio"),
  location: text("location"),
  website: text("website"),
  githubUsername: text("github_username"),
  twitterUsername: text("twitter_username"),
  linkedinUsername: text("linkedin_username"),
  isEmailVerified: boolean("is_email_verified").default(false),
  isActive: boolean("is_active").default(true),
  isBetaUser: boolean("is_beta_user").default(false),
  betaAccessLevel: text("beta_access_level").default("basic"), // basic, premium, developer
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  theme: text("theme").default("deepblue-dark"),
  language: text("language").default("en"),
  timezone: text("timezone").default("UTC"),
  notifications: boolean("notifications").default(true),
  emailNotifications: boolean("email_notifications").default(true),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  publicProfile: boolean("public_profile").default(false),
  showEmail: boolean("show_email").default(false),
  showLocation: boolean("show_location").default(false),
  darkMode: boolean("dark_mode").default(true),
  compactMode: boolean("compact_mode").default(false),
  autoSave: boolean("auto_save").default(true),
  codeCompletion: boolean("code_completion").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionToken: text("session_token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const passwordResets = pgTable("password_resets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const emailVerifications = pgTable("email_verifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  token: text("token").notNull().unique(),
  newEmail: text("new_email"),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userActivity = pgTable("user_activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  path: text("path").notNull(),
  content: text("content").notNull().default(""),
  language: text("language").notNull().default("javascript"),
  projectId: integer("project_id").references(() => projects.id),
  isDirectory: boolean("is_directory").notNull().default(false),
  parentId: integer("parent_id").references(() => files.id),
  size: integer("size").default(0),
  lastModified: timestamp("last_modified").defaultNow(),
  isReadonly: boolean("is_readonly").default(false),
  encoding: text("encoding").default("utf-8"),
});

export const workspaceSettings = pgTable("workspace_settings", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  theme: text("theme").default("deepblue-dark"),
  fontSize: integer("font_size").default(14),
  fontFamily: text("font_family").default("JetBrains Mono"),
  tabSize: integer("tab_size").default(2),
  wordWrap: boolean("word_wrap").default(true),
  lineNumbers: boolean("line_numbers").default(true),
  minimap: boolean("minimap").default(false),
  autoSave: boolean("auto_save").default(true),
  formatOnSave: boolean("format_on_save").default(false),
  liveShare: boolean("live_share").default(false),
  extensions: text("extensions").array().default([]),
});

export const debugSessions = pgTable("debug_sessions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  name: text("name").notNull(),
  configuration: text("configuration").notNull(),
  status: text("status").default("stopped"),
  breakpoints: text("breakpoints").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const snippets = pgTable("snippets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  prefix: text("prefix").notNull(),
  body: text("body").notNull(),
  description: text("description"),
  language: text("language").notNull(),
  scope: text("scope").default("user"),
  isBuiltIn: boolean("is_built_in").default(false),
});

// Admin System Tables
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  role: text("role").notNull().default("admin"), // admin, super_admin, moderator
  permissions: text("permissions").array().default([]), // array of permission strings
  departmentId: integer("department_id").references(() => adminDepartments.id),
  isActive: boolean("is_active").default(true),
  hiredAt: timestamp("hired_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adminDepartments = pgTable("admin_departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  managerId: integer("manager_id").references(() => admins.id),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminSessions = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => admins.id),
  sessionToken: text("session_token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  loginTime: timestamp("login_time").defaultNow(),
  logoutTime: timestamp("logout_time"),
  isActive: boolean("is_active").default(true),
});

export const adminCredentials = pgTable("admin_credentials", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => admins.id),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  email: text("email").notNull().unique(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"),
  lastPasswordChange: timestamp("last_password_change").defaultNow(),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  mustChangePassword: boolean("must_change_password").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adminActions = pgTable("admin_actions", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => admins.id),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: integer("resource_id"),
  details: json("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Billing System Tables
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  planId: integer("plan_id").references(() => subscriptionPlans.id),
  status: text("status").notNull().default("active"), // active, cancelled, expired, suspended
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  cancelledAt: timestamp("cancelled_at"),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  interval: text("interval").notNull().default("month"), // month, year
  features: text("features").array().default([]),
  maxProjects: integer("max_projects").default(5),
  maxStorage: integer("max_storage").default(100), // MB
  maxAIRequests: integer("max_ai_requests").default(50),
  supportLanguages: integer("support_languages").default(10),
  stripePriceId: text("stripe_price_id"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("usd"),
  status: text("status").notNull(), // succeeded, failed, pending, cancelled
  paymentMethod: text("payment_method"),
  description: text("description"),
  metadata: json("metadata"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  stripeInvoiceId: text("stripe_invoice_id"),
  invoiceNumber: text("invoice_number").notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0"),
  currency: text("currency").default("usd"),
  status: text("status").notNull(), // draft, open, paid, void, uncollectible
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Support System Tables
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  assignedToId: integer("assigned_to_id").references(() => admins.id),
  categoryId: integer("category_id").references(() => supportCategories.id),
  priorityId: integer("priority_id").references(() => supportPriorities.id),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"), // open, in_progress, pending, resolved, closed
  tags: text("tags").array().default([]),
  metadata: json("metadata"),
  lastResponseAt: timestamp("last_response_at"),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const supportCategories = pgTable("support_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  parentId: integer("parent_id").references(() => supportCategories.id),
  color: text("color").default("#3b82f6"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
});

// Beta Testing System Tables
export const betaTokens = pgTable("beta_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  tokenType: text("token_type").notNull().default("access"), // access, invitation, developer
  accessLevel: text("access_level").notNull().default("basic"), // basic, premium, developer, admin
  maxUses: integer("max_uses").default(1),
  usedCount: integer("used_count").default(0),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  createdBy: integer("created_by").references(() => users.id),
  description: text("description"),
  metadata: json("metadata"), // Additional token data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const betaAccess = pgTable("beta_access", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tokenId: integer("token_id").references(() => betaTokens.id),
  accessLevel: text("access_level").notNull(),
  grantedBy: integer("granted_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const accountVerification = pgTable("account_verification", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  verificationType: text("verification_type").notNull(), // email, phone, identity, beta
  verificationToken: text("verification_token").notNull().unique(),
  verificationData: json("verification_data"), // Store verification details
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const betaFeedback = pgTable("beta_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  category: text("category").notNull(), // bug, feature, improvement, general
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").default("medium"), // low, medium, high, critical
  status: text("status").default("open"), // open, in-progress, resolved, closed
  rating: integer("rating"), // 1-5 stars
  browserInfo: text("browser_info"),
  deviceInfo: text("device_info"),
  reproductionSteps: text("reproduction_steps"),
  expectedBehavior: text("expected_behavior"),
  actualBehavior: text("actual_behavior"),
  attachments: json("attachments"), // File attachments metadata
  assignedTo: integer("assigned_to").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  responseMessage: text("response_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const supportPriorities = pgTable("support_priorities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  level: integer("level").notNull(), // 1-5, 1 being highest priority
  color: text("color").default("#6b7280"),
  responseTimeHours: integer("response_time_hours").default(24),
  isActive: boolean("is_active").default(true),
});

export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => supportTickets.id),
  senderId: integer("sender_id").references(() => users.id),
  senderType: text("sender_type").notNull().default("user"), // user, admin, system
  message: text("message").notNull(),
  isInternal: boolean("is_internal").default(false),
  attachments: text("attachments").array().default([]),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Security System Tables
export const securityLogs = pgTable("security_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  eventType: text("event_type").notNull(), // auth_success, auth_failed, code_blocked, threat_detected, etc.
  severity: text("severity").notNull().default("info"), // info, low, medium, high, critical
  message: text("message").notNull(),
  source: text("source").default("security_system"), // security_system, code_validator, auth_system
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: json("metadata"), // Additional event data
  createdAt: timestamp("created_at").defaultNow(),
});

export const securitySettings = pgTable("security_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  securityLevel: text("security_level").notNull().default("enhanced"), // basic, enhanced, maximum
  codeValidationEnabled: boolean("code_validation_enabled").default(true),
  realTimeMonitoring: boolean("real_time_monitoring").default(true),
  threatDetection: boolean("threat_detection").default(true),
  maxFailedAttempts: integer("max_failed_attempts").default(3),
  lockoutDuration: integer("lockout_duration").default(300), // seconds
  notifyOnThreats: boolean("notify_on_threats").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const codeValidationResults = pgTable("code_validation_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  code: text("code").notNull(),
  language: text("language").notNull(),
  securityScore: integer("security_score").default(100),
  violations: json("violations"), // Array of violation objects
  isBlocked: boolean("is_blocked").default(false),
  executionAttempted: boolean("execution_attempted").default(false),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const securityThreats = pgTable("security_threats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  threatType: text("threat_type").notNull(), // malicious, suspicious, restricted, unsafe
  severity: text("severity").notNull(), // low, medium, high, critical
  description: text("description").notNull(),
  source: text("source").notNull(), // code_validator, system_monitor, user_behavior
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => users.id),
  actionTaken: text("action_taken"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const supportProviders = pgTable("support_providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  website: text("website"),
  supportTypes: text("support_types").array().default([]), // technical, billing, general
  availability: json("availability"), // hours, timezone
  responseTimeHours: integer("response_time_hours").default(24),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  contractStart: timestamp("contract_start"),
  contractEnd: timestamp("contract_end"),
  createdAt: timestamp("created_at").defaultNow(),
});

// System Monitoring Tables
export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  metricType: text("metric_type").notNull(), // cpu, memory, disk, network, database
  value: decimal("value", { precision: 10, scale: 4 }).notNull(),
  unit: text("unit").notNull(), // percent, bytes, ms, count
  source: text("source").notNull(), // server, database, application
  metadata: json("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const systemAlerts = pgTable("system_alerts", {
  id: serial("id").primaryKey(),
  alertType: text("alert_type").notNull(), // error, warning, info
  title: text("title").notNull(),
  message: text("message").notNull(),
  source: text("source").notNull(),
  severity: integer("severity").notNull().default(1), // 1-5
  isResolved: boolean("is_resolved").default(false),
  resolvedBy: integer("resolved_by").references(() => admins.id),
  resolvedAt: timestamp("resolved_at"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification System
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  adminId: integer("admin_id").references(() => admins.id),
  type: text("type").notNull(), // billing, support, system, marketing
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  priority: text("priority").default("normal"), // low, normal, high, urgent
  actionUrl: text("action_url"),
  metadata: json("metadata"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
});

export const loginUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const registerUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
});

export const updateUserSchema = createInsertSchema(users).pick({
  firstName: true,
  lastName: true,
  bio: true,
  location: true,
  website: true,
  githubUsername: true,
  twitterUsername: true,
  linkedinUsername: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
});

export const insertPasswordResetSchema = createInsertSchema(passwordResets).omit({
  id: true,
  createdAt: true,
});

export const insertEmailVerificationSchema = createInsertSchema(emailVerifications).omit({
  id: true,
  createdAt: true,
});

export const insertUserActivitySchema = createInsertSchema(userActivity).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  lastModified: true,
});

export const insertWorkspaceSettingsSchema = createInsertSchema(workspaceSettings).omit({
  id: true,
});

export const insertDebugSessionSchema = createInsertSchema(debugSessions).omit({
  id: true,
  createdAt: true,
});

export const insertSnippetSchema = createInsertSchema(snippets).omit({
  id: true,
});

// Beta Token Schemas
export const insertBetaTokenSchema = createInsertSchema(betaTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Security Schemas
export const insertSecurityLogSchema = createInsertSchema(securityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertSecuritySettingsSchema = createInsertSchema(securitySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCodeValidationResultSchema = createInsertSchema(codeValidationResults).omit({
  id: true,
  createdAt: true,
});

export const insertSecurityThreatSchema = createInsertSchema(securityThreats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBetaAccessSchema = createInsertSchema(betaAccess).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAccountVerificationSchema = createInsertSchema(accountVerification).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBetaFeedbackSchema = createInsertSchema(betaFeedback).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type User = typeof users.$inferSelect;

// Beta System Types
export type BetaToken = typeof betaTokens.$inferSelect;
export type InsertBetaToken = z.infer<typeof insertBetaTokenSchema>;
export type BetaAccess = typeof betaAccess.$inferSelect;
export type InsertBetaAccess = z.infer<typeof insertBetaAccessSchema>;
export type AccountVerification = typeof accountVerification.$inferSelect;
export type InsertAccountVerification = z.infer<typeof insertAccountVerificationSchema>;
export type BetaFeedback = typeof betaFeedback.$inferSelect;
export type InsertBetaFeedback = z.infer<typeof insertBetaFeedbackSchema>;

export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;

export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;

export type InsertPasswordReset = z.infer<typeof insertPasswordResetSchema>;
export type PasswordReset = typeof passwordResets.$inferSelect;

export type InsertEmailVerification = z.infer<typeof insertEmailVerificationSchema>;
export type EmailVerification = typeof emailVerifications.$inferSelect;

export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type UserActivity = typeof userActivity.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

export type InsertWorkspaceSettings = z.infer<typeof insertWorkspaceSettingsSchema>;
export type WorkspaceSettings = typeof workspaceSettings.$inferSelect;

export type InsertDebugSession = z.infer<typeof insertDebugSessionSchema>;
export type DebugSession = typeof debugSessions.$inferSelect;

export type InsertSnippet = z.infer<typeof insertSnippetSchema>;
export type Snippet = typeof snippets.$inferSelect;

// Security types
export type InsertSecurityLog = z.infer<typeof insertSecurityLogSchema>;
export type SecurityLog = typeof securityLogs.$inferSelect;

export type InsertSecuritySettings = z.infer<typeof insertSecuritySettingsSchema>;
export type SecuritySettings = typeof securitySettings.$inferSelect;

export type InsertCodeValidationResult = z.infer<typeof insertCodeValidationResultSchema>;
export type CodeValidationResult = typeof codeValidationResults.$inferSelect;

export type InsertSecurityThreat = z.infer<typeof insertSecurityThreatSchema>;
export type SecurityThreat = typeof securityThreats.$inferSelect;

// Admin schemas
export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminCredentialsSchema = createInsertSchema(adminCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminSessionSchema = createInsertSchema(adminSessions).omit({
  id: true,
  loginTime: true,
});

// Admin auth types
export type AdminCredentials = typeof adminCredentials.$inferSelect;
export type InsertAdminCredentials = z.infer<typeof insertAdminCredentialsSchema>;

export const insertAdminDepartmentSchema = createInsertSchema(adminDepartments).omit({
  id: true,
  createdAt: true,
});

export const insertAdminActionSchema = createInsertSchema(adminActions).omit({
  id: true,
  timestamp: true,
});

// Billing System Schemas
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

// Support System Schemas
export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  lastResponseAt: true,
  resolvedAt: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupportCategorySchema = createInsertSchema(supportCategories).omit({
  id: true,
});

export const insertSupportPrioritySchema = createInsertSchema(supportPriorities).omit({
  id: true,
});

export const insertSupportMessageSchema = createInsertSchema(supportMessages).omit({
  id: true,
  createdAt: true,
});

export const insertSupportProviderSchema = createInsertSchema(supportProviders).omit({
  id: true,
  createdAt: true,
});

// System Monitoring Schemas
export const insertSystemMetricSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  timestamp: true,
});

export const insertSystemAlertSchema = createInsertSchema(systemAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  readAt: true,
  createdAt: true,
});

// Admin System Types
export type InsertAdminDepartment = z.infer<typeof insertAdminDepartmentSchema>;
export type AdminDepartment = typeof adminDepartments.$inferSelect;

export type InsertAdminAction = z.infer<typeof insertAdminActionSchema>;
export type AdminAction = typeof adminActions.$inferSelect;

// Billing System Types
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Support System Types
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;

export type InsertSupportCategory = z.infer<typeof insertSupportCategorySchema>;
export type SupportCategory = typeof supportCategories.$inferSelect;

export type InsertSupportPriority = z.infer<typeof insertSupportPrioritySchema>;
export type SupportPriority = typeof supportPriorities.$inferSelect;

export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;
export type SupportMessage = typeof supportMessages.$inferSelect;

export type InsertSupportProvider = z.infer<typeof insertSupportProviderSchema>;
export type SupportProvider = typeof supportProviders.$inferSelect;

// System Monitoring Types
export type InsertSystemMetric = z.infer<typeof insertSystemMetricSchema>;
export type SystemMetric = typeof systemMetrics.$inferSelect;

export type InsertSystemAlert = z.infer<typeof insertSystemAlertSchema>;
export type SystemAlert = typeof systemAlerts.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
