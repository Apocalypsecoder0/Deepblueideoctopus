import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  
  if (!openai) {
    openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
  }
  
  return openai;
}

export interface CodeAnalysisRequest {
  code: string;
  language: string;
  task: 'explain' | 'debug' | 'optimize' | 'refactor' | 'document' | 'test';
  context?: string;
}

export interface CodeGenerationRequest {
  prompt: string;
  language: string;
  context?: string;
  includeComments?: boolean;
}

export interface AIResponse {
  content: string;
  confidence?: number;
  suggestions?: string[];
  codeSnippet?: string;
  error?: string;
}

export class OpenAIService {
  private static instance: OpenAIService;
  
  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  async analyzeCode(request: CodeAnalysisRequest): Promise<AIResponse> {
    try {
      const client = getOpenAIClient();
      if (!client) {
        return {
          content: "OpenAI API key is not configured. Please add your API key to enable AI features.",
          error: "Missing API key"
        };
      }

      const systemPrompt = this.getSystemPrompt(request.task, request.language);
      const userPrompt = this.buildUserPrompt(request);

      const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        content: result.explanation || result.content || "Analysis completed",
        confidence: result.confidence || 0.85,
        suggestions: result.suggestions || [],
        codeSnippet: result.code || result.codeSnippet,
        error: undefined
      };

    } catch (error) {
      console.error('OpenAI Service Error:', error);
      return {
        content: "Failed to analyze code. Please check your API key and try again.",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async generateCode(request: CodeGenerationRequest): Promise<AIResponse> {
    try {
      const client = getOpenAIClient();
      if (!client) {
        return {
          content: "OpenAI API key is not configured. Please add your API key to enable AI features.",
          error: "Missing API key"
        };
      }

      const systemPrompt = `You are an expert ${request.language} developer. Generate clean, efficient, and well-documented code.
      
      Respond with JSON in this format:
      {
        "code": "the generated code",
        "explanation": "brief explanation of the code",
        "suggestions": ["improvement suggestions"],
        "confidence": 0.95
      }`;

      const userPrompt = `${request.prompt}
      
      ${request.context ? `Context: ${request.context}` : ''}
      
      Language: ${request.language}
      ${request.includeComments ? 'Include detailed comments in the code.' : ''}`;

      const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        content: result.explanation || "Code generated successfully",
        confidence: result.confidence || 0.85,
        suggestions: result.suggestions || [],
        codeSnippet: result.code,
        error: undefined
      };

    } catch (error) {
      console.error('OpenAI Service Error:', error);
      return {
        content: "Failed to generate code. Please check your API key and try again.",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async chatCompletion(message: string, context?: string): Promise<AIResponse> {
    try {
      const client = getOpenAIClient();
      if (!client) {
        return {
          content: "OpenAI API key is not configured. Please add your API key to enable AI features.",
          error: "Missing API key"
        };
      }

      const systemPrompt = `You are an AI assistant integrated into DeepBlue:Octopus IDE. You help developers with coding, debugging, and development tasks. Be concise, helpful, and provide actionable advice.
      
      Respond with JSON in this format:
      {
        "content": "your response",
        "suggestions": ["additional suggestions"],
        "confidence": 0.95
      }`;

      const userPrompt = `${message}
      
      ${context ? `Context: ${context}` : ''}`;

      const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1500
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        content: result.content || "I understand your request.",
        confidence: result.confidence || 0.85,
        suggestions: result.suggestions || [],
        error: undefined
      };

    } catch (error) {
      console.error('OpenAI Service Error:', error);
      return {
        content: "I'm currently unavailable. Please check your API key configuration.",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  private getSystemPrompt(task: string, language: string): string {
    const basePrompt = `You are an expert ${language} developer and code analyst. `;
    
    const taskPrompts = {
      explain: `Explain code clearly and concisely. Break down complex logic into understandable parts.`,
      debug: `Identify bugs, errors, and potential issues in the code. Provide specific fixes and explanations.`,
      optimize: `Analyze code performance and suggest optimizations. Focus on efficiency, readability, and best practices.`,
      refactor: `Suggest code refactoring improvements. Focus on clean code principles, maintainability, and design patterns.`,
      document: `Generate comprehensive documentation including function descriptions, parameters, return values, and usage examples.`,
      test: `Generate unit tests that cover edge cases, error conditions, and expected behavior.`
    };

    return basePrompt + (taskPrompts[task as keyof typeof taskPrompts] || taskPrompts.explain) + `
    
    Respond with JSON in this format:
    {
      "explanation": "detailed explanation",
      "code": "improved/fixed code if applicable",
      "suggestions": ["additional suggestions"],
      "confidence": 0.95
    }`;
  }

  private buildUserPrompt(request: CodeAnalysisRequest): string {
    return `Task: ${request.task}
    Language: ${request.language}
    ${request.context ? `Context: ${request.context}` : ''}
    
    Code to analyze:
    \`\`\`${request.language}
    ${request.code}
    \`\`\``;
  }

  async generateImageFromCode(code: string, description: string): Promise<{ url: string } | { error: string }> {
    try {
      const client = getOpenAIClient();
      if (!client) {
        return { error: "OpenAI API key is not configured" };
      }

      const prompt = `Create a visual diagram representing this code structure: ${description}. 
      Code: ${code.substring(0, 500)}...
      Style: Clean, modern software architecture diagram with clear labels and connections.`;

      const response = await client.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      if (response.data && response.data[0] && response.data[0].url) {
        return { url: response.data[0].url };
      }
      return { error: "No image URL returned from OpenAI" };
    } catch (error) {
      console.error('Image generation error:', error);
      return { error: error instanceof Error ? error.message : "Image generation failed" };
    }
  }
}

export const openAIService = OpenAIService.getInstance();