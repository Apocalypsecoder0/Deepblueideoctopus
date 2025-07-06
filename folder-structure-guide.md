
# Folder Structure Guide

## Overview

This guide explains the organization and purpose of each directory in the DeepBlue:Octopus IDE project.

## Root Level Directories

### `/client/` - Frontend Application
React-based frontend application with TypeScript and Tailwind CSS.

**Key subdirectories:**
- `src/components/` - All React components
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility libraries and configurations
- `src/pages/` - Page-level components
- `src/styles/` - CSS and styling files

### `/server/` - Backend API
Express.js server with TypeScript providing REST API endpoints.

**Key files:**
- `index.ts` - Main server entry point
- `routes.ts` - API route definitions
- `storage.ts` - Data storage implementation
- `db.ts` - Database configuration

### `/shared/` - Shared Code
Code shared between client and server to ensure consistency.

**Contents:**
- Type definitions
- Constants
- Validation schemas
- Utility functions

### `/migrations/` - Database Migrations
Database schema migrations using Drizzle ORM.

### `/docs/` - Documentation
Comprehensive documentation for users and developers.

### `/tests/` - Test Suite
Organized test files for different testing levels.

## Component Organization Strategy

### IDE Components (`/client/src/components/ide/`)

Components are organized by functionality:

1. **Core Components** - Essential IDE functionality
   - `code-editor.tsx` - Main code editing interface
   - `file-manager.tsx` - File system management
   - `editor-tabs.tsx` - Tab management system

2. **Panel Components** - Side and bottom panels
   - `terminal-panel.tsx` - Integrated terminal
   - `debug-panel.tsx` - Debugging interface
   - `settings-panel.tsx` - IDE settings

3. **Tool Components** - IDE tools and utilities
   - `ai-assistant.tsx` - AI-powered coding assistant
   - `command-palette.tsx` - Quick command access
   - `package-manager.tsx` - Package management

4. **System Components** - Core systems
   - `syntax-highlighting-system.tsx` - Code highlighting
   - `error-logging-system.tsx` - Error tracking
   - `performance-monitor.tsx` - Performance monitoring

## Best Practices

### File Naming
- Use kebab-case for files and directories
- Include component purpose in name (e.g., `auth-dialog.tsx`)
- Use descriptive names that indicate functionality

### Directory Structure
- Group related functionality together
- Keep directory depth reasonable (max 4-5 levels)
- Use consistent naming across similar directories

### Import Organization
```typescript
// External libraries
import React from 'react';
import { Button } from '@/components/ui/button';

// Internal utilities
import { cn } from '@/lib/utils';

// Types
import type { User } from '@/shared/types/user';
```

### Component Organization
```typescript
// Types and interfaces first
interface ComponentProps {
  // ...
}

// Component implementation
export function ComponentName({ prop }: ComponentProps) {
  // Hooks
  // Event handlers
  // Render logic
}

// Default export
export default ComponentName;
```

## Adding New Features

When adding new IDE features:

1. **Determine category** - Core, panel, tool, or system
2. **Create component file** - Follow naming conventions
3. **Add to appropriate directory** - Based on functionality
4. **Update exports** - Add to relevant index files
5. **Add tests** - Create corresponding test files
6. **Document** - Update relevant documentation

## Maintenance Guidelines

- **Regular cleanup** - Remove unused files and dependencies
- **Consistent structure** - Follow established patterns
- **Documentation updates** - Keep docs current with changes
- **Test coverage** - Maintain comprehensive test suite
