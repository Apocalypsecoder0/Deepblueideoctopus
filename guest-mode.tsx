/**
 * Guest Mode Component - Trial IDE Experience
 * Provides a complete IDE experience without account creation
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Folder, Play, Download, Users, Zap, Code } from "lucide-react";

interface GuestFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isDirectory: boolean;
  parentId?: string;
}

interface GuestProject {
  id: string;
  name: string;
  description: string;
  template: string;
  files: GuestFile[];
}

export default function GuestMode(): JSX.Element {
  const [currentProject, setCurrentProject] = useState<GuestProject | null>(null);
  const [currentFile, setCurrentFile] = useState<GuestFile | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState("");

  // Sample project templates
  const projectTemplates: GuestProject[] = [
    {
      id: "hello-world-js",
      name: "Hello World - JavaScript",
      description: "Basic JavaScript project with HTML, CSS, and JS files",
      template: "javascript",
      files: [
        {
          id: "1",
          name: "src",
          path: "/src",
          content: "",
          language: "folder",
          isDirectory: true
        },
        {
          id: "2",
          name: "index.html",
          path: "/index.html",
          content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DeepBlue IDE - Hello World</title>
    <link rel="stylesheet" href="src/styles.css">
</head>
<body>
    <div class="container">
        <h1 id="title">🌊 Welcome to DeepBlue IDE!</h1>
        <p class="subtitle">Your Cross-Platform Development Environment</p>
        <div class="features">
            <div class="feature">
                <span class="icon">🚀</span>
                <span>25+ Languages</span>
            </div>
            <div class="feature">
                <span class="icon">🤖</span>
                <span>AI Assistant</span>
            </div>
            <div class="feature">
                <span class="icon">🎮</span>
                <span>Game Engine</span>
            </div>
        </div>
        <button id="demo-btn" onclick="runDemo()">Try Interactive Demo</button>
        <div id="output"></div>
    </div>
    <script src="src/main.js"></script>
</body>
</html>`,
          language: "html",
          isDirectory: false
        },
        {
          id: "3",
          name: "main.js",
          path: "/src/main.js",
          content: `// DeepBlue IDE - Hello World Demo
console.log("🌊 DeepBlue IDE initialized!");

function runDemo() {
    const output = document.getElementById('output');
    const title = document.getElementById('title');
    
    // Animated demo sequence
    const demos = [
        "🔥 Compiling TypeScript...",
        "🐍 Running Python script...",
        "⚡ Building React app...",
        "🎯 Testing complete!",
        "✨ Welcome to DeepBlue IDE!"
    ];
    
    let step = 0;
    output.innerHTML = '<div class="demo-output">Starting demo...</div>';
    
    const interval = setInterval(() => {
        if (step < demos.length) {
            output.innerHTML += \`<div class="demo-step">\${demos[step]}</div>\`;
            step++;
        } else {
            clearInterval(interval);
            title.textContent = "🎉 Demo Complete!";
            output.innerHTML += '<div class="success">Ready to start coding?</div>';
        }
    }, 800);
}

// Auto-greeting
setTimeout(() => {
    console.log("Try the interactive demo above! 👆");
}, 1000);`,
          language: "javascript",
          isDirectory: false,
          parentId: "1"
        },
        {
          id: "4",
          name: "styles.css",
          path: "/src/styles.css",
          content: `/* DeepBlue IDE Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
    color: #e2e8f0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.container {
    text-align: center;
    max-width: 600px;
    padding: 2rem;
    background: rgba(30, 41, 59, 0.8);
    border-radius: 1rem;
    border: 1px solid rgba(56, 189, 248, 0.3);
    backdrop-filter: blur(10px);
}

h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    background: linear-gradient(45deg, #38bdf8, #06b6d4, #0891b2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.subtitle {
    font-size: 1.2rem;
    color: #94a3b8;
    margin-bottom: 2rem;
}

.features {
    display: flex;
    justify-content: space-around;
    margin: 2rem 0;
}

.feature {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}

.icon {
    font-size: 2rem;
}

#demo-btn {
    background: linear-gradient(45deg, #06b6d4, #0891b2);
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 0.5rem;
    font-size: 1.1rem;
    cursor: pointer;
    transition: transform 0.2s;
    margin: 1rem 0;
}

#demo-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(6, 182, 212, 0.3);
}

#output {
    margin-top: 2rem;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.8);
    border-radius: 0.5rem;
    border-left: 4px solid #06b6d4;
    text-align: left;
    font-family: 'JetBrains Mono', monospace;
    min-height: 100px;
}

.demo-output, .demo-step {
    margin: 0.5rem 0;
    color: #38bdf8;
}

.success {
    color: #22c55e;
    font-weight: bold;
    margin-top: 1rem;
}

@media (max-width: 768px) {
    h1 { font-size: 2rem; }
    .features { flex-direction: column; gap: 1rem; }
}`,
          language: "css",
          isDirectory: false,
          parentId: "1"
        },
        {
          id: "5",
          name: "README.md",
          path: "/README.md",
          content: `# DeepBlue IDE - Hello World Project

Welcome to your first project in DeepBlue:Octopus IDE! 🌊

## What's Included

- **index.html** - Main HTML page with interactive demo
- **src/main.js** - JavaScript functionality and demo logic
- **src/styles.css** - Modern CSS styling with ocean theme
- **README.md** - This documentation file

## Features Demonstrated

✨ **Modern Web Development**
- Responsive design with CSS Grid/Flexbox
- Interactive JavaScript functionality
- Ocean-themed gradient styling

🚀 **IDE Capabilities**
- Multi-file project structure
- Syntax highlighting for HTML, CSS, JS
- Live code execution
- File management

## Try These Next Steps

1. **Modify the greeting** - Edit the title in index.html
2. **Add new features** - Extend the JavaScript demo
3. **Style changes** - Customize colors in styles.css
4. **Create new files** - Add more pages or scripts

## DeepBlue IDE Features

- 🎯 **25+ Programming Languages**
- 🤖 **AI-Powered Assistant**
- 🎮 **Game Development Tools**
- 📱 **Mobile App Framework**
- 🔧 **Advanced Debugging**
- ☁️ **Cloud Integration**

## Getting Started

Click the "Try Interactive Demo" button to see the IDE in action!

Happy coding! 🎉`,
          language: "markdown",
          isDirectory: false
        }
      ]
    },
    {
      id: "hello-world-py",
      name: "Hello World - Python",
      description: "Python project with data science and web examples",
      template: "python",
      files: [
        {
          id: "6",
          name: "main.py",
          path: "/main.py",
          content: `#!/usr/bin/env python3
"""
DeepBlue IDE - Python Hello World
A comprehensive Python demonstration
"""

import datetime
import json
from typing import List, Dict

class DeepBlueDemo:
    """Demo class showcasing Python features in DeepBlue IDE"""
    
    def __init__(self):
        self.name = "DeepBlue:Octopus IDE"
        self.version = "2.1.0 Alpha"
        self.languages = ["Python", "JavaScript", "TypeScript", "Java", "C++", "Rust"]
        
    def greet_user(self, name: str = "Developer") -> str:
        """Generate a personalized greeting"""
        current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        return f"🌊 Hello {name}! Welcome to {self.name} v{self.version} at {current_time}"
    
    def demonstrate_features(self) -> Dict[str, any]:
        """Showcase IDE capabilities"""
        features = {
            "ai_assistant": "🤖 Powered by GPT-4o",
            "code_execution": "⚡ Real-time compilation",
            "game_engine": "🎮 Built-in game development",
            "collaboration": "👥 Real-time team coding",
            "supported_languages": len(self.languages),
            "cross_platform": "🌐 Web, Desktop, Mobile"
        }
        return features
    
    def fibonacci_sequence(self, n: int) -> List[int]:
        """Generate Fibonacci sequence - algorithm demonstration"""
        if n <= 0:
            return []
        elif n == 1:
            return [0]
        elif n == 2:
            return [0, 1]
        
        sequence = [0, 1]
        for i in range(2, n):
            sequence.append(sequence[i-1] + sequence[i-2])
        return sequence
    
    def data_analysis_demo(self) -> Dict[str, any]:
        """Simulate data analysis capabilities"""
        sample_data = [1, 4, 7, 8, 9, 12, 15, 18, 21, 25]
        
        analysis = {
            "dataset_size": len(sample_data),
            "mean": sum(sample_data) / len(sample_data),
            "min_value": min(sample_data),
            "max_value": max(sample_data),
            "sum_total": sum(sample_data),
            "median": sorted(sample_data)[len(sample_data)//2]
        }
        return analysis

def main():
    """Main demonstration function"""
    print("=" * 60)
    print("🌊 DEEPBLUE:OCTOPUS IDE - PYTHON DEMO")
    print("=" * 60)
    
    # Initialize demo
    demo = DeepBlueDemo()
    
    # Greeting
    print(demo.greet_user("Python Developer"))
    print()
    
    # Features showcase
    print("🚀 IDE Features:")
    features = demo.demonstrate_features()
    for feature, description in features.items():
        print(f"  • {feature.replace('_', ' ').title()}: {description}")
    print()
    
    # Algorithm demonstration
    print("🔢 Fibonacci Sequence (first 10 numbers):")
    fib_sequence = demo.fibonacci_sequence(10)
    print(f"  {fib_sequence}")
    print()
    
    # Data analysis
    print("📊 Data Analysis Demo:")
    analysis = demo.data_analysis_demo()
    for metric, value in analysis.items():
        print(f"  • {metric.replace('_', ' ').title()}: {value}")
    print()
    
    # JSON export example
    export_data = {
        "demo_info": {
            "ide_name": demo.name,
            "version": demo.version,
            "timestamp": datetime.datetime.now().isoformat()
        },
        "features": features,
        "sample_algorithm": {
            "name": "Fibonacci",
            "result": fib_sequence
        },
        "data_analysis": analysis
    }
    
    print("📄 JSON Export Example:")
    print(json.dumps(export_data, indent=2))
    print()
    
    print("✨ Demo complete! Ready to start your Python journey?")
    print("Try modifying this code or create new Python files!")

if __name__ == "__main__":
    main()`,
          language: "python",
          isDirectory: false
        },
        {
          id: "7",
          name: "requirements.txt",
          path: "/requirements.txt",
          content: `# DeepBlue IDE - Python Dependencies
# Basic requirements for Python development

# Data Science & Analysis
numpy>=1.21.0
pandas>=1.3.0
matplotlib>=3.4.0

# Web Development
flask>=2.0.0
requests>=2.25.0

# Development Tools
pylint>=2.9.0
black>=21.6.0
pytest>=6.2.0

# AI & Machine Learning (optional)
# scikit-learn>=1.0.0
# tensorflow>=2.6.0
# torch>=1.9.0

# Note: In DeepBlue IDE, you can install packages using:
# 1. The Package Manager (Ctrl+Shift+N)
# 2. Terminal: pip install package_name
# 3. Requirements: pip install -r requirements.txt`,
          language: "text",
          isDirectory: false
        }
      ]
    },
    {
      id: "hello-world-react",
      name: "Hello World - React",
      description: "Modern React project with TypeScript and components",
      template: "react",
      files: [
        {
          id: "8",
          name: "src",
          path: "/src",
          content: "",
          language: "folder",
          isDirectory: true
        },
        {
          id: "9",
          name: "App.tsx",
          path: "/src/App.tsx",
          content: `import React, { useState, useEffect } from 'react';
import './App.css';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [clickCount, setClickCount] = useState<number>(0);
  
  const features: Feature[] = [
    {
      icon: '🚀',
      title: 'Fast Development',
      description: '25+ programming languages with real-time compilation'
    },
    {
      icon: '🤖',
      title: 'AI Assistant',
      description: 'GPT-4o powered coding assistant for all languages'
    },
    {
      icon: '🎮',
      title: 'Game Engine',
      description: 'Built-in game development tools and framework'
    },
    {
      icon: '📱',
      title: 'Cross-Platform',
      description: 'Deploy to web, desktop, mobile, and gaming consoles'
    }
  ];

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleDemoClick = () => {
    setClickCount(prev => prev + 1);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="ocean-animation">
          <div className="wave wave1"></div>
          <div className="wave wave2"></div>
          <div className="wave wave3"></div>
        </div>
        
        <h1 className="app-title">
          🌊 DeepBlue:Octopus IDE
        </h1>
        
        <p className="app-subtitle">
          Cross-Platform Game Development Environment
        </p>
        
        <div className="time-display">
          Current Time: {currentTime}
        </div>
      </header>

      <main className="app-main">
        <section className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </section>

        <section className="interactive-demo">
          <button 
            className="demo-button"
            onClick={handleDemoClick}
          >
            Try Interactive Demo
          </button>
          
          {clickCount > 0 && (
            <div className="demo-output">
              <p>🎉 Demo clicked {clickCount} time{clickCount !== 1 ? 's' : ''}!</p>
              {clickCount >= 3 && (
                <p>✨ You're getting the hang of it! Ready to build something amazing?</p>
              )}
            </div>
          )}
        </section>

        <section className="code-showcase">
          <h2>React + TypeScript in DeepBlue IDE</h2>
          <div className="code-preview">
            <pre>
              <code>// Type-safe React development{'\n'}
interface Props {'{'}
  message: string;
  onClick: () => void;
{'}'}

const Button: React.FC&lt;Props&gt; = ({'{'} message, onClick {'}'}) =&gt; (
  &lt;button onClick={'{'}onClick{'}'}&gt;{'{'}message{'}'}&lt;/button&gt;
);</code>
            </pre>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>Built with ❤️ in DeepBlue:Octopus IDE v2.1.0 Alpha</p>
        <p>Ready to start your development journey?</p>
      </footer>
    </div>
  );
};

export default App;`,
          language: "tsx",
          isDirectory: false,
          parentId: "8"
        },
        {
          id: "10",
          name: "App.css",
          path: "/src/App.css",
          content: `.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  color: #e2e8f0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.app-header {
  position: relative;
  text-align: center;
  padding: 4rem 2rem 2rem;
  overflow: hidden;
}

.ocean-animation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  z-index: 0;
}

.wave {
  position: absolute;
  width: 200%;
  height: 100%;
  background: linear-gradient(45deg, rgba(56, 189, 248, 0.1), rgba(6, 182, 212, 0.1));
  border-radius: 50%;
  animation: wave-animation 8s ease-in-out infinite;
}

.wave1 { animation-delay: 0s; }
.wave2 { animation-delay: 2s; }
.wave3 { animation-delay: 4s; }

@keyframes wave-animation {
  0%, 100% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.1); }
}

.app-title {
  position: relative;
  z-index: 1;
  font-size: 3.5rem;
  margin: 0 0 1rem 0;
  background: linear-gradient(45deg, #38bdf8, #06b6d4, #0891b2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-subtitle {
  position: relative;
  z-index: 1;
  font-size: 1.3rem;
  color: #94a3b8;
  margin-bottom: 2rem;
}

.time-display {
  position: relative;
  z-index: 1;
  font-family: 'JetBrains Mono', monospace;
  color: #06b6d4;
  font-size: 1.1rem;
}

.app-main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
}

.feature-card {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(6, 182, 212, 0.2);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-title {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: #38bdf8;
}

.feature-description {
  color: #94a3b8;
  line-height: 1.6;
}

.interactive-demo {
  text-align: center;
  margin: 4rem 0;
}

.demo-button {
  background: linear-gradient(45deg, #06b6d4, #0891b2);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(6, 182, 212, 0.3);
}

.demo-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(6, 182, 212, 0.5);
}

.demo-output {
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 0.5rem;
  border-left: 4px solid #06b6d4;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.code-showcase {
  margin: 4rem 0;
}

.code-showcase h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #38bdf8;
}

.code-preview {
  background: rgba(15, 23, 42, 0.9);
  border-radius: 0.5rem;
  padding: 2rem;
  border: 1px solid rgba(56, 189, 248, 0.3);
  overflow-x: auto;
}

.code-preview pre {
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
  color: #e2e8f0;
  line-height: 1.6;
}

.code-preview code {
  color: #94a3b8;
}

.app-footer {
  text-align: center;
  padding: 2rem;
  border-top: 1px solid rgba(56, 189, 248, 0.3);
  margin-top: 4rem;
  color: #94a3b8;
}

@media (max-width: 768px) {
  .app-title { font-size: 2.5rem; }
  .features-grid { grid-template-columns: 1fr; }
  .app-header { padding: 2rem 1rem 1rem; }
}`,
          language: "css",
          isDirectory: false,
          parentId: "8"
        },
        {
          id: "11",
          name: "package.json",
          path: "/package.json",
          content: `{
  "name": "deepblue-react-demo",
  "version": "1.0.0",
  "private": true,
  "description": "React TypeScript demo for DeepBlue:Octopus IDE",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}`,
          language: "json",
          isDirectory: false
        }
      ]
    }
  ];

  useEffect(() => {
    // Auto-load first project
    if (projectTemplates.length > 0) {
      setCurrentProject(projectTemplates[0]);
      setCurrentFile(projectTemplates[0].files.find(f => !f.isDirectory) || null);
    }
  }, []);

  const selectProject = (project: GuestProject) => {
    setCurrentProject(project);
    setCurrentFile(project.files.find(f => !f.isDirectory) || null);
    setOutput("");
  };

  const selectFile = (file: GuestFile) => {
    setCurrentFile(file);
  };

  const runCode = async () => {
    if (!currentFile) return;
    
    setIsRunning(true);
    setOutput("🚀 Running code...\n");
    
    // Simulate code execution
    setTimeout(() => {
      let mockOutput = "";
      
      switch (currentFile.language) {
        case "javascript":
          mockOutput = "🌊 DeepBlue IDE initialized!\nConsole output: Hello World!\n✨ Execution completed successfully!";
          break;
        case "python":
          mockOutput = "🌊 DEEPBLUE:OCTOPUS IDE - PYTHON DEMO\n============================================================\nHello Python Developer! Welcome to DeepBlue:Octopus IDE v2.1.0 Alpha\n✨ Demo complete! Ready to start your Python journey?";
          break;
        case "tsx":
          mockOutput = "🚀 Compiling TypeScript...\n📦 Building React components...\n🌐 Starting development server...\n✅ App running at http://localhost:3000";
          break;
        default:
          mockOutput = `✅ ${currentFile.language.toUpperCase()} code executed successfully!\n🎉 Output: Hello World from ${currentFile.name}`;
      }
      
      setOutput(mockOutput);
      setIsRunning(false);
    }, 2000);
  };

  const downloadProject = () => {
    if (!currentProject) return;
    
    // Create a simple download simulation
    const projectData = {
      name: currentProject.name,
      files: currentProject.files.map(f => ({
        name: f.name,
        path: f.path,
        content: f.content,
        language: f.language
      }))
    };
    
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-cyan-500/30 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                DeepBlue IDE - Guest Mode
              </h1>
              <p className="text-sm text-slate-400">Try our IDE without creating an account</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
              <Zap className="w-3 h-3 mr-1" />
              Trial Mode
            </Badge>
            <Button variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10">
              <Users className="w-4 h-4 mr-2" />
              Sign Up for Full Access
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Project Templates Sidebar */}
          <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center gap-2">
                <Folder className="w-5 h-5" />
                Project Templates
              </CardTitle>
              <CardDescription>Choose a starter template to explore</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {projectTemplates.map((project) => (
                <div
                  key={project.id}
                  onClick={() => selectProject(project)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    currentProject?.id === project.id
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
                  }`}
                >
                  <h4 className="font-medium text-sm">{project.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{project.description}</p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {project.template}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Main IDE Interface */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* File Explorer and Editor */}
            {currentProject && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-cyan-400 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {currentProject.name}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        onClick={runCode}
                        disabled={isRunning || !currentFile}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {isRunning ? "Running..." : "Run Code"}
                      </Button>
                      <Button
                        onClick={downloadProject}
                        variant="outline"
                        size="sm"
                        className="border-slate-600"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="editor" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-slate-700">
                      <TabsTrigger value="files">Files</TabsTrigger>
                      <TabsTrigger value="editor">Editor</TabsTrigger>
                      <TabsTrigger value="output">Output</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="files" className="mt-4">
                      <div className="space-y-2">
                        {currentProject.files.map((file) => (
                          <div
                            key={file.id}
                            onClick={() => !file.isDirectory && selectFile(file)}
                            className={`p-2 rounded flex items-center gap-2 cursor-pointer transition-colors ${
                              file.isDirectory
                                ? 'text-slate-400'
                                : currentFile?.id === file.id
                                ? 'bg-cyan-500/10 text-cyan-400'
                                : 'hover:bg-slate-700/50'
                            }`}
                          >
                            {file.isDirectory ? (
                              <Folder className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                            <span className="font-mono text-sm">{file.name}</span>
                            {!file.isDirectory && (
                              <Badge variant="outline" className="ml-auto text-xs">
                                {file.language}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="editor" className="mt-4">
                      {currentFile ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
                            <span className="font-mono text-sm">{currentFile.path}</span>
                            <Badge variant="secondary">{currentFile.language}</Badge>
                          </div>
                          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                            <pre className="text-sm font-mono overflow-auto max-h-96">
                              <code>{currentFile.content}</code>
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-400">
                          Select a file from the Files tab to view its content
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="output" className="mt-4">
                      <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="font-mono text-sm text-slate-400">Terminal Output</span>
                        </div>
                        <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap min-h-32">
                          {output || "Click 'Run Code' to see output here..."}
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Feature Showcase */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-cyan-400">Experience DeepBlue IDE Features</CardTitle>
                <CardDescription>
                  This guest mode showcases core IDE functionality. Sign up for full access to all features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-green-400">✅ Available in Guest Mode</h4>
                    <ul className="space-y-2 text-sm text-slate-300">
                      <li>• Code editor with syntax highlighting</li>
                      <li>• File management and organization</li>
                      <li>• Code execution simulation</li>
                      <li>• Multiple programming languages</li>
                      <li>• Project templates</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-orange-400">🔒 Full Version Features</h4>
                    <ul className="space-y-2 text-sm text-slate-300">
                      <li>• AI-powered coding assistant</li>
                      <li>• Real-time collaboration</li>
                      <li>• Cloud storage and sync</li>
                      <li>• Advanced debugging tools</li>
                      <li>• Game development engine</li>
                      <li>• Mobile app framework</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}