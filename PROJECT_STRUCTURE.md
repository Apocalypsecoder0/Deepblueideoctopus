
# DeepBlue:Octopus IDE v1.5 - Project Structure

## Root Directory Structure

```
deepblue-ide/
├── 📁 client/                        # Frontend React application
│   ├── 📁 public/                    # Static public assets
│   │   ├── favicon.ico
│   │   ├── logo192.png
│   │   ├── logo512.png
│   │   └── manifest.json
│   ├── 📁 src/                       # Source code
│   │   ├── 📁 components/            # React components
│   │   │   ├── 📁 auth/              # Authentication components
│   │   │   │   ├── account-manager.tsx
│   │   │   │   └── auth-dialog.tsx
│   │   │   ├── 📁 ide/               # IDE core components
│   │   │   │   ├── 📁 core/          # Core IDE functionality
│   │   │   │   │   ├── code-editor.tsx
│   │   │   │   │   ├── file-manager.tsx
│   │   │   │   │   ├── editor-tabs.tsx
│   │   │   │   │   └── status-bar.tsx
│   │   │   │   ├── 📁 panels/        # IDE panels
│   │   │   │   │   ├── terminal-panel.tsx
│   │   │   │   │   ├── debug-panel.tsx
│   │   │   │   │   ├── extensions-panel.tsx
│   │   │   │   │   └── settings-panel.tsx
│   │   │   │   ├── 📁 tools/         # IDE tools
│   │   │   │   │   ├── ai-assistant.tsx
│   │   │   │   │   ├── command-palette.tsx
│   │   │   │   │   ├── database-manager.tsx
│   │   │   │   │   ├── github-integration.tsx
│   │   │   │   │   └── package-manager.tsx
│   │   │   │   ├── 📁 advanced/      # Advanced features
│   │   │   │   │   ├── advanced-debugger.tsx
│   │   │   │   │   ├── advanced-text-editor.tsx
│   │   │   │   │   ├── multi-cursor-editor.tsx
│   │   │   │   │   └── intellisense-system.tsx
│   │   │   │   ├── 📁 development/   # Development tools
│   │   │   │   │   ├── game-engine.tsx
│   │   │   │   │   ├── mobile-framework.tsx
│   │   │   │   │   ├── testing-framework.tsx
│   │   │   │   │   └── documentation-generator.tsx
│   │   │   │   └── 📁 systems/       # Core systems
│   │   │   │       ├── syntax-highlighting-system.tsx
│   │   │   │       ├── code-analysis-system.tsx
│   │   │   │       ├── error-logging-system.tsx
│   │   │   │       └── performance-monitor.tsx
│   │   │   └── 📁 ui/                # UI components
│   │   │       ├── 📁 layout/        # Layout components
│   │   │       │   ├── button.tsx
│   │   │       │   ├── dialog.tsx
│   │   │       │   ├── tabs.tsx
│   │   │       │   └── sidebar.tsx
│   │   │       ├── 📁 forms/         # Form components
│   │   │       │   ├── input.tsx
│   │   │       │   ├── select.tsx
│   │   │       │   ├── checkbox.tsx
│   │   │       │   └── textarea.tsx
│   │   │       ├── 📁 feedback/      # Feedback components
│   │   │       │   ├── alert.tsx
│   │   │       │   ├── toast.tsx
│   │   │       │   ├── progress.tsx
│   │   │       │   └── skeleton.tsx
│   │   │       └── 📁 specialized/   # Specialized components
│   │   │           ├── octopus-logo.tsx
│   │   │           ├── sound-system.tsx
│   │   │           ├── physics-engine.tsx
│   │   │           └── theme-system.tsx
│   │   ├── 📁 hooks/                 # Custom React hooks
│   │   │   ├── use-ide-state.ts
│   │   │   ├── use-mobile.tsx
│   │   │   └── use-toast.ts
│   │   ├── 📁 lib/                   # Utility libraries
│   │   │   ├── file-icons.tsx
│   │   │   ├── plugin-engine.ts
│   │   │   ├── queryClient.ts
│   │   │   └── utils.ts
│   │   ├── 📁 pages/                 # Page components
│   │   │   ├── ide.tsx
│   │   │   └── not-found.tsx
│   │   ├── 📁 styles/                # Styling files
│   │   │   ├── globals.css
│   │   │   ├── components.css
│   │   │   └── themes/
│   │   │       ├── dark.css
│   │   │       └── light.css
│   │   ├── 📁 types/                 # TypeScript type definitions
│   │   │   ├── ide.ts
│   │   │   ├── user.ts
│   │   │   ├── project.ts
│   │   │   └── file.ts
│   │   ├── 📁 utils/                 # Utility functions
│   │   │   ├── api.ts
│   │   │   ├── storage.ts
│   │   │   ├── validation.ts
│   │   │   └── constants.ts
│   │   ├── 📁 assets/                # Static assets
│   │   │   ├── 📁 images/
│   │   │   ├── 📁 icons/
│   │   │   └── 📁 fonts/
│   │   ├── App.tsx                   # Main App component
│   │   ├── index.css                 # Global styles
│   │   └── main.tsx                  # Entry point
│   └── index.html                    # HTML template
├── 📁 server/                        # Backend Express server
│   ├── 📁 controllers/               # Route controllers
│   │   ├── auth.ts
│   │   ├── projects.ts
│   │   ├── files.ts
│   │   ├── plugins.ts
│   │   └── git.ts
│   ├── 📁 middleware/                # Express middleware
│   │   ├── auth.ts
│   │   ├── cors.ts
│   │   ├── logging.ts
│   │   └── validation.ts
│   ├── 📁 services/                  # Business logic services
│   │   ├── auth-service.ts
│   │   ├── file-service.ts
│   │   ├── project-service.ts
│   │   ├── plugin-service.ts
│   │   └── git-service.ts
│   ├── 📁 models/                    # Database models
│   │   ├── user.ts
│   │   ├── project.ts
│   │   ├── file.ts
│   │   └── plugin.ts
│   ├── 📁 utils/                     # Server utilities
│   │   ├── database.ts
│   │   ├── encryption.ts
│   │   ├── file-system.ts
│   │   └── logger.ts
│   ├── 📁 config/                    # Configuration files
│   │   ├── database.ts
│   │   ├── server.ts
│   │   └── environment.ts
│   ├── db.ts                         # Database configuration
│   ├── index.ts                      # Server entry point
│   ├── routes.ts                     # Route definitions
│   ├── storage.ts                    # Storage implementation
│   └── vite.ts                       # Vite dev server
├── 📁 shared/                        # Shared code between client/server
│   ├── 📁 types/                     # Shared TypeScript types
│   │   ├── api.ts
│   │   ├── user.ts
│   │   ├── project.ts
│   │   ├── file.ts
│   │   └── plugin.ts
│   ├── 📁 constants/                 # Shared constants
│   │   ├── api-endpoints.ts
│   │   ├── file-types.ts
│   │   └── languages.ts
│   ├── 📁 utils/                     # Shared utilities
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   └── helpers.ts
│   ├── plugin-schema.ts              # Plugin schema definitions
│   └── schema.ts                     # Database schema
├── 📁 migrations/                    # Database migrations
│   ├── 📁 meta/                      # Migration metadata
│   │   ├── 0000_snapshot.json
│   │   └── _journal.json
│   └── 0000_petite_the_order.sql     # Initial migration
├── 📁 docs/                          # Documentation
│   ├── 📁 api/                       # API documentation
│   │   ├── authentication.md
│   │   ├── projects.md
│   │   ├── files.md
│   │   └── plugins.md
│   ├── 📁 user-guide/                # User documentation
│   │   ├── getting-started.md
│   │   ├── features.md
│   │   ├── shortcuts.md
│   │   └── troubleshooting.md
│   ├── 📁 developer/                 # Developer documentation
│   │   ├── setup.md
│   │   ├── contributing.md
│   │   ├── architecture.md
│   │   └── plugin-development.md
│   └── README.md                     # Main documentation
├── 📁 tests/                         # Test files
│   ├── 📁 unit/                      # Unit tests
│   │   ├── 📁 client/
│   │   └── 📁 server/
│   ├── 📁 integration/               # Integration tests
│   ├── 📁 e2e/                       # End-to-end tests
│   ├── 📁 fixtures/                  # Test fixtures
│   └── setup.ts                     # Test setup
├── 📁 scripts/                       # Build and deployment scripts
│   ├── build.sh
│   ├── deploy.sh
│   ├── setup-dev.sh
│   └── migrate.sh
├── 📁 config/                        # Configuration files
│   ├── 📁 environments/              # Environment-specific configs
│   │   ├── development.json
│   │   ├── staging.json
│   │   └── production.json
│   ├── eslint.config.js
│   ├── prettier.config.js
│   └── jest.config.js
├── 📁 public/                        # Public static files
│   ├── 📁 assets/                    # Static assets
│   ├── 📁 templates/                 # Template files
│   └── robots.txt
├── 📁 plugins/                       # IDE plugins
│   ├── 📁 core-plugins/              # Core plugins
│   ├── 📁 community-plugins/         # Community plugins
│   └── 📁 plugin-templates/          # Plugin templates
├── .gitignore                        # Git ignore rules
├── .replit                           # Replit configuration
├── DESIGN_SPECIFICATION.md          # Design specifications
├── LICENSE.md                        # License file
├── MISSING_FEATURES_AUDIT.md        # Feature audit
├── components.json                   # Component configuration
├── drizzle.config.ts                # Database ORM config
├── package-lock.json                # NPM lock file
├── package.json                     # NPM package configuration
├── postcss.config.js                # PostCSS configuration
├── replit.md                        # Replit documentation
├── tailwind.config.ts               # Tailwind CSS configuration
├── tsconfig.json                    # TypeScript configuration
└── vite.config.ts                   # Vite build configuration
```

## Key Directory Purposes

### `/client/src/components/`
- **auth/**: User authentication components
- **ide/core/**: Essential IDE functionality (editor, file manager, tabs)
- **ide/panels/**: Side and bottom panels (terminal, debug, settings)
- **ide/tools/**: IDE tools and utilities
- **ide/advanced/**: Advanced editing features
- **ide/development/**: Development-specific tools
- **ide/systems/**: Core system components
- **ui/**: Reusable UI components organized by type

### `/server/`
- **controllers/**: Handle HTTP requests and responses
- **middleware/**: Express middleware functions
- **services/**: Business logic and data processing
- **models/**: Database models and schemas
- **utils/**: Server-side utility functions
- **config/**: Server configuration

### `/shared/`
- **types/**: TypeScript interfaces shared between client and server
- **constants/**: Shared constants and enums
- **utils/**: Utility functions used by both client and server

### `/docs/`
- **api/**: API endpoint documentation
- **user-guide/**: End-user documentation
- **developer/**: Developer and contributor documentation

### `/tests/`
- **unit/**: Component and function unit tests
- **integration/**: API and service integration tests
- **e2e/**: End-to-end user flow tests
- **fixtures/**: Test data and mock objects

## File Naming Conventions

- **Components**: kebab-case with .tsx extension (e.g., `code-editor.tsx`)
- **Utilities**: kebab-case with .ts extension (e.g., `file-utils.ts`)
- **Types**: kebab-case with .ts extension (e.g., `user-types.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS`)
- **Directories**: kebab-case (e.g., `user-guide/`)

## Organization Principles

1. **Feature-based grouping**: Related functionality is grouped together
2. **Layer separation**: Clear separation between client, server, and shared code
3. **Scalability**: Structure supports adding new features without reorganization
4. **Maintainability**: Logical organization makes code easy to find and modify
5. **Testing**: Parallel test structure mirrors source code organization
