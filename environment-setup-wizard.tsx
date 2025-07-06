/**
 * Environment Setup Wizard - One-Click Development Environment Configuration
 * Helps users quickly set up their preferred development environment with popular tools and frameworks
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Download, 
  Code, 
  Database, 
  Globe, 
  Smartphone, 
  Gamepad2, 
  Layers, 
  Package, 
  Terminal,
  CheckCircle,
  Circle,
  Play,
  RefreshCw,
  Zap,
  Cog,
  FileText,
  Monitor
} from 'lucide-react';

interface EnvironmentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  technologies: string[];
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  dependencies: string[];
  devDependencies: string[];
  scripts: Record<string, string>;
  configFiles: Array<{
    name: string;
    content: string;
  }>;
  postInstallSteps: string[];
}

interface SetupProgress {
  step: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  message: string;
}

const environmentTemplates: EnvironmentTemplate[] = [
  {
    id: 'react-ts',
    name: 'React + TypeScript',
    description: 'Modern React application with TypeScript, Vite, and essential tools',
    category: 'Frontend',
    icon: <Code className="w-6 h-6" />,
    technologies: ['React', 'TypeScript', 'Vite', 'ESLint', 'Prettier'],
    estimatedTime: '2-3 minutes',
    difficulty: 'beginner',
    dependencies: ['react', 'react-dom'],
    devDependencies: ['@types/react', '@types/react-dom', '@vitejs/plugin-react', 'vite', 'typescript', 'eslint', 'prettier'],
    scripts: {
      'dev': 'vite',
      'build': 'tsc && vite build',
      'preview': 'vite preview',
      'lint': 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0',
      'format': 'prettier --write "src/**/*.{ts,tsx,css,md}"'
    },
    configFiles: [
      {
        name: 'tsconfig.json',
        content: JSON.stringify({
          "compilerOptions": {
            "target": "ES2020",
            "useDefineForClassFields": true,
            "lib": ["ES2020", "DOM", "DOM.Iterable"],
            "module": "ESNext",
            "skipLibCheck": true,
            "moduleResolution": "bundler",
            "allowImportingTsExtensions": true,
            "resolveJsonModule": true,
            "isolatedModules": true,
            "noEmit": true,
            "jsx": "react-jsx",
            "strict": true,
            "noUnusedLocals": true,
            "noUnusedParameters": true,
            "noFallthroughCasesInSwitch": true
          },
          "include": ["src"],
          "references": [{ "path": "./tsconfig.node.json" }]
        }, null, 2)
      },
      {
        name: '.eslintrc.json',
        content: JSON.stringify({
          "extends": ["@eslint/js", "@typescript-eslint/recommended", "plugin:react-hooks/recommended"],
          "ignorePatterns": ["dist", ".eslintrc.cjs"],
          "parser": "@typescript-eslint/parser",
          "plugins": ["react-refresh"],
          "rules": {
            "react-refresh/only-export-components": ["warn", { "allowConstantExport": true }]
          }
        }, null, 2)
      }
    ],
    postInstallSteps: [
      'Create src/App.tsx with basic React component',
      'Set up index.html with React root',
      'Configure Vite development server',
      'Initialize Git repository'
    ]
  },
  {
    id: 'node-express',
    name: 'Node.js + Express API',
    description: 'RESTful API server with Express, TypeScript, and authentication',
    category: 'Backend',
    icon: <Database className="w-6 h-6" />,
    technologies: ['Node.js', 'Express', 'TypeScript', 'JWT', 'bcrypt'],
    estimatedTime: '3-4 minutes',
    difficulty: 'intermediate',
    dependencies: ['express', 'cors', 'helmet', 'bcryptjs', 'jsonwebtoken', 'dotenv'],
    devDependencies: ['@types/node', '@types/express', '@types/cors', '@types/bcryptjs', '@types/jsonwebtoken', 'typescript', 'ts-node', 'nodemon'],
    scripts: {
      'dev': 'nodemon src/index.ts',
      'build': 'tsc',
      'start': 'node dist/index.js',
      'test': 'jest'
    },
    configFiles: [
      {
        name: 'tsconfig.json',
        content: JSON.stringify({
          "compilerOptions": {
            "target": "ES2020",
            "module": "commonjs",
            "outDir": "./dist",
            "rootDir": "./src",
            "strict": true,
            "esModuleInterop": true,
            "skipLibCheck": true,
            "forceConsistentCasingInFileNames": true,
            "resolveJsonModule": true
          },
          "include": ["src/**/*"],
          "exclude": ["node_modules", "dist"]
        }, null, 2)
      },
      {
        name: '.env.example',
        content: `PORT=3000
JWT_SECRET=your-secret-key
DB_CONNECTION_STRING=your-db-connection
NODE_ENV=development`
      }
    ],
    postInstallSteps: [
      'Create basic Express server structure',
      'Set up middleware (CORS, Helmet, JSON parsing)',
      'Create authentication routes',
      'Set up environment variables'
    ]
  },
  {
    id: 'nextjs-fullstack',
    name: 'Next.js Full-Stack',
    description: 'Full-stack application with Next.js, Prisma, and Tailwind CSS',
    category: 'Full-Stack',
    icon: <Globe className="w-6 h-6" />,
    technologies: ['Next.js', 'Prisma', 'Tailwind CSS', 'NextAuth', 'TypeScript'],
    estimatedTime: '4-5 minutes',
    difficulty: 'advanced',
    dependencies: ['next', 'react', 'react-dom', 'prisma', '@prisma/client', 'next-auth', 'tailwindcss'],
    devDependencies: ['@types/node', '@types/react', '@types/react-dom', 'typescript', 'autoprefixer', 'postcss'],
    scripts: {
      'dev': 'next dev',
      'build': 'next build',
      'start': 'next start',
      'lint': 'next lint',
      'db:push': 'prisma db push',
      'db:studio': 'prisma studio'
    },
    configFiles: [
      {
        name: 'tailwind.config.js',
        content: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`
      },
      {
        name: 'prisma/schema.prisma',
        content: `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}`
      }
    ],
    postInstallSteps: [
      'Initialize Prisma database',
      'Set up NextAuth configuration',
      'Create basic page structure',
      'Configure Tailwind CSS'
    ]
  },
  {
    id: 'react-native',
    name: 'React Native Mobile',
    description: 'Cross-platform mobile app with React Native and Expo',
    category: 'Mobile',
    icon: <Smartphone className="w-6 h-6" />,
    technologies: ['React Native', 'Expo', 'TypeScript', 'React Navigation'],
    estimatedTime: '5-6 minutes',
    difficulty: 'intermediate',
    dependencies: ['expo', 'react', 'react-native', '@react-navigation/native', '@react-navigation/stack'],
    devDependencies: ['@types/react', '@types/react-native', 'typescript'],
    scripts: {
      'start': 'expo start',
      'android': 'expo start --android',
      'ios': 'expo start --ios',
      'web': 'expo start --web'
    },
    configFiles: [
      {
        name: 'app.json',
        content: JSON.stringify({
          "expo": {
            "name": "MyApp",
            "slug": "my-app",
            "version": "1.0.0",
            "orientation": "portrait",
            "icon": "./assets/icon.png",
            "userInterfaceStyle": "light",
            "splash": {
              "image": "./assets/splash.png",
              "resizeMode": "contain",
              "backgroundColor": "#ffffff"
            },
            "assetBundlePatterns": ["**/*"],
            "ios": {
              "supportsTablet": true
            },
            "android": {
              "adaptiveIcon": {
                "foregroundImage": "./assets/adaptive-icon.png",
                "backgroundColor": "#FFFFFF"
              }
            },
            "web": {
              "favicon": "./assets/favicon.png"
            }
          }
        }, null, 2)
      }
    ],
    postInstallSteps: [
      'Initialize Expo project structure',
      'Set up React Navigation',
      'Create basic screen components',
      'Configure development build'
    ]
  },
  {
    id: 'python-fastapi',
    name: 'Python FastAPI',
    description: 'High-performance API with FastAPI, SQLAlchemy, and async support',
    category: 'Backend',
    icon: <Database className="w-6 h-6" />,
    technologies: ['Python', 'FastAPI', 'SQLAlchemy', 'Pydantic', 'uvicorn'],
    estimatedTime: '3-4 minutes',
    difficulty: 'intermediate',
    dependencies: ['fastapi', 'uvicorn', 'sqlalchemy', 'pydantic', 'python-multipart', 'passlib', 'python-jose'],
    devDependencies: ['pytest', 'black', 'flake8', 'mypy'],
    scripts: {
      'dev': 'uvicorn main:app --reload',
      'start': 'uvicorn main:app',
      'test': 'pytest',
      'format': 'black .',
      'lint': 'flake8 .'
    },
    configFiles: [
      {
        name: 'requirements.txt',
        content: `fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
pydantic==2.5.0
python-multipart==0.0.6
passlib==1.7.4
python-jose==3.3.0
pytest==7.4.3
black==23.11.0
flake8==6.1.0
mypy==1.7.1`
      },
      {
        name: 'pyproject.toml',
        content: `[tool.black]
line-length = 88
target-version = ['py39']

[tool.mypy]
python_version = "3.9"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]`
      }
    ],
    postInstallSteps: [
      'Create FastAPI application structure',
      'Set up SQLAlchemy models',
      'Configure authentication endpoints',
      'Create basic CRUD operations'
    ]
  },
  {
    id: 'game-phaser',
    name: 'Phaser Game Engine',
    description: '2D game development with Phaser.js and TypeScript',
    category: 'Game',
    icon: <Gamepad2 className="w-6 h-6" />,
    technologies: ['Phaser.js', 'TypeScript', 'Webpack', 'Matter.js'],
    estimatedTime: '4-5 minutes',
    difficulty: 'intermediate',
    dependencies: ['phaser'],
    devDependencies: ['typescript', 'webpack', 'webpack-cli', 'webpack-dev-server', 'ts-loader', 'html-webpack-plugin'],
    scripts: {
      'dev': 'webpack serve --mode development',
      'build': 'webpack --mode production',
      'start': 'webpack serve --mode development --open'
    },
    configFiles: [
      {
        name: 'webpack.config.js',
        content: `const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
  ],
  devServer: {
    static: path.join(__dirname, 'dist'),
    compress: true,
    port: 8080,
  },
};`
      }
    ],
    postInstallSteps: [
      'Create basic Phaser game scene',
      'Set up game configuration',
      'Add sprite and physics systems',
      'Configure development server'
    ]
  }
];

export default function EnvironmentSetupWizard(): JSX.Element {
  const [selectedTemplate, setSelectedTemplate] = useState<EnvironmentTemplate | null>(null);
  const [currentStep, setCurrentStep] = useState<'select' | 'configure' | 'install' | 'complete'>('select');
  const [setupProgress, setSetupProgress] = useState<SetupProgress[]>([]);
  const [isInstalling, setIsInstalling] = useState(false);
  const [customizations, setCustomizations] = useState<Record<string, any>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();

  const categories = ['all', 'Frontend', 'Backend', 'Full-Stack', 'Mobile', 'Game'];

  const filteredTemplates = selectedCategory === 'all' 
    ? environmentTemplates 
    : environmentTemplates.filter(t => t.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const simulateInstallation = async (template: EnvironmentTemplate) => {
    setIsInstalling(true);
    const steps: SetupProgress[] = [
      { step: 'dependencies', status: 'pending', message: 'Installing dependencies...' },
      { step: 'devDependencies', status: 'pending', message: 'Installing dev dependencies...' },
      { step: 'configuration', status: 'pending', message: 'Creating configuration files...' },
      { step: 'scripts', status: 'pending', message: 'Setting up npm scripts...' },
      { step: 'postInstall', status: 'pending', message: 'Running post-install steps...' },
      { step: 'complete', status: 'pending', message: 'Finalizing setup...' }
    ];

    setSetupProgress(steps);

    for (let i = 0; i < steps.length; i++) {
      // Update current step to running
      setSetupProgress(prev => prev.map((step, index) => 
        index === i ? { ...step, status: 'running' } : step
      ));

      // Simulate installation time
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

      // Mark as completed
      setSetupProgress(prev => prev.map((step, index) => 
        index === i ? { ...step, status: 'completed' } : step
      ));
    }

    setIsInstalling(false);
    setCurrentStep('complete');
    
    toast({
      title: "Environment Setup Complete!",
      description: `${template.name} environment is ready for development.`,
    });
  };

  const handleTemplateSelect = (template: EnvironmentTemplate) => {
    setSelectedTemplate(template);
    setCurrentStep('configure');
  };

  const handleStartInstallation = () => {
    if (!selectedTemplate) return;
    setCurrentStep('install');
    simulateInstallation(selectedTemplate);
  };

  const resetWizard = () => {
    setCurrentStep('select');
    setSelectedTemplate(null);
    setSetupProgress([]);
    setIsInstalling(false);
    setCustomizations({});
  };

  const openInIDE = () => {
    // This would navigate to the IDE with the new project
    toast({
      title: "Opening in IDE",
      description: "Your new project is being loaded in the IDE...",
    });
  };

  return (
    <div className="environment-setup-wizard h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Environment Setup Wizard
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Set up your development environment in one click with popular frameworks and tools
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {['select', 'configure', 'install', 'complete'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === step ? 'bg-blue-600 text-white' :
                  ['select', 'configure', 'install', 'complete'].indexOf(currentStep) > index ? 'bg-green-500 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {['select', 'configure', 'install', 'complete'].indexOf(currentStep) > index ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {index < 3 && (
                  <div className={`w-12 h-1 ${
                    ['select', 'configure', 'install', 'complete'].indexOf(currentStep) > index ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 'select' && (
          <div className="space-y-6">
            {/* Category Filter */}
            <div className="flex items-center space-x-4 mb-6">
              <Label htmlFor="category">Filter by Category:</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <Card 
                  key={template.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      {template.icon}
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge className={getDifficultyColor(template.difficulty)}>
                          {template.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">
                      {template.description}
                    </CardDescription>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Technologies:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {template.technologies.slice(0, 3).map(tech => (
                            <Badge key={tech} variant="secondary" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                          {template.technologies.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.technologies.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>⏱️ {template.estimatedTime}</span>
                        <span>📦 {template.dependencies.length + template.devDependencies.length} packages</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'configure' && selectedTemplate && (
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  {selectedTemplate.icon}
                  <div>
                    <CardTitle className="text-xl">{selectedTemplate.name}</CardTitle>
                    <CardDescription>{selectedTemplate.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
                    <TabsTrigger value="configuration">Configuration</TabsTrigger>
                    <TabsTrigger value="customization">Customization</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2">Technologies Included</h4>
                        <div className="space-y-2">
                          {selectedTemplate.technologies.map(tech => (
                            <div key={tech} className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span>{tech}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Setup Details</h4>
                        <div className="space-y-2 text-sm">
                          <p><strong>Category:</strong> {selectedTemplate.category}</p>
                          <p><strong>Difficulty:</strong> {selectedTemplate.difficulty}</p>
                          <p><strong>Estimated Time:</strong> {selectedTemplate.estimatedTime}</p>
                          <p><strong>Total Packages:</strong> {selectedTemplate.dependencies.length + selectedTemplate.devDependencies.length}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="dependencies" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Dependencies ({selectedTemplate.dependencies.length})</h4>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {selectedTemplate.dependencies.map(dep => (
                            <div key={dep} className="flex items-center space-x-2 text-sm">
                              <Package className="w-3 h-3 text-blue-500" />
                              <span>{dep}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-3">Dev Dependencies ({selectedTemplate.devDependencies.length})</h4>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {selectedTemplate.devDependencies.map(dep => (
                            <div key={dep} className="flex items-center space-x-2 text-sm">
                              <Package className="w-3 h-3 text-gray-500" />
                              <span>{dep}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="configuration" className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3">Configuration Files</h4>
                      <div className="space-y-3">
                        {selectedTemplate.configFiles.map(file => (
                          <div key={file.name} className="border rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <FileText className="w-4 h-4" />
                              <span className="font-medium">{file.name}</span>
                            </div>
                            <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                              {file.content.length > 200 
                                ? file.content.substring(0, 200) + '...' 
                                : file.content
                              }
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">Post-Install Steps</h4>
                      <div className="space-y-2">
                        {selectedTemplate.postInstallSteps.map((step, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Circle className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="customization" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="projectName">Project Name</Label>
                          <Input 
                            id="projectName"
                            placeholder="my-awesome-project"
                            value={customizations.projectName || ''}
                            onChange={(e) => setCustomizations(prev => ({ ...prev, projectName: e.target.value }))}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Input 
                            id="description"
                            placeholder="Project description"
                            value={customizations.description || ''}
                            onChange={(e) => setCustomizations(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="author">Author</Label>
                          <Input 
                            id="author"
                            placeholder="Your name"
                            value={customizations.author || ''}
                            onChange={(e) => setCustomizations(prev => ({ ...prev, author: e.target.value }))}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label>Additional Features</Label>
                          <div className="space-y-2 mt-2">
                            {['ESLint configuration', 'Prettier formatting', 'GitHub Actions', 'Docker setup', 'Testing framework'].map(feature => (
                              <div key={feature} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={feature}
                                  checked={customizations.features?.includes(feature) || false}
                                  onCheckedChange={(checked) => {
                                    const currentFeatures = customizations.features || [];
                                    if (checked) {
                                      setCustomizations(prev => ({ 
                                        ...prev, 
                                        features: [...currentFeatures, feature] 
                                      }));
                                    } else {
                                      setCustomizations(prev => ({ 
                                        ...prev, 
                                        features: currentFeatures.filter(f => f !== feature) 
                                      }));
                                    }
                                  }}
                                />
                                <Label htmlFor={feature} className="text-sm">{feature}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <Separator className="my-6" />
                
                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep('select')}>
                    Back to Templates
                  </Button>
                  <Button onClick={handleStartInstallation}>
                    <Download className="w-4 h-4 mr-2" />
                    Start Installation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 'install' && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCw className={`w-5 h-5 ${isInstalling ? 'animate-spin' : ''}`} />
                  <span>Installing {selectedTemplate?.name}</span>
                </CardTitle>
                <CardDescription>
                  Setting up your development environment...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {setupProgress.map((step, index) => (
                    <div key={step.step} className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        step.status === 'completed' ? 'bg-green-500 text-white' :
                        step.status === 'running' ? 'bg-blue-500 text-white' :
                        step.status === 'error' ? 'bg-red-500 text-white' :
                        'bg-gray-300 text-gray-600'
                      }`}>
                        {step.status === 'completed' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : step.status === 'running' ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </div>
                      <span className={`${
                        step.status === 'completed' ? 'text-green-700' :
                        step.status === 'running' ? 'text-blue-700' :
                        'text-gray-600'
                      }`}>
                        {step.message}
                      </span>
                    </div>
                  ))}
                </div>
                
                {setupProgress.length > 0 && (
                  <div className="mt-6">
                    <Progress 
                      value={(setupProgress.filter(s => s.status === 'completed').length / setupProgress.length) * 100} 
                      className="w-full"
                    />
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      {setupProgress.filter(s => s.status === 'completed').length} of {setupProgress.length} steps completed
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 'complete' && selectedTemplate && (
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Environment Setup Complete!</CardTitle>
                <CardDescription>
                  Your {selectedTemplate.name} environment is ready for development
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    What's been set up:
                  </h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>✓ All dependencies installed</li>
                    <li>✓ Configuration files created</li>
                    <li>✓ Development scripts configured</li>
                    <li>✓ Project structure initialized</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold">Next Steps:</h4>
                  <div className="text-left space-y-2">
                    {selectedTemplate.postInstallSteps.map((step, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={openInIDE} size="lg">
                    <Monitor className="w-4 h-4 mr-2" />
                    Open in IDE
                  </Button>
                  <Button variant="outline" onClick={resetWizard} size="lg">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Setup Another Environment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}