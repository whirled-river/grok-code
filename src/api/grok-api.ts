import axios, { AxiosInstance } from 'axios';
import { Readable } from 'stream';
import { GrokApiRequest, GrokApiResponse } from '../types.js';

// Enhanced types for grok-code-fast-1 capabilities
export interface CodeGenerationRequest {
  language: string;
  functionality: string;
  context?: string[];
  requirements?: string[];
  constraints?: string[];
  existingCode?: string;
}

export interface StreamingResponse {
  onChunk: (chunk: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
  cancel: () => void;
}

export class EnhancedGrokApiClient {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: 'https://api.x.ai/v1',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 120000, // 2 minute timeout for complex code generation
    });
  }

  // Original basic chat method
  async chat(request: GrokApiRequest): Promise<string> {
    try {
      const response = await this.client.post('/chat/completions', {
        ...request,
        model: request.model || 'grok-code-fast-1',
        stream: false,
      });

      const data: GrokApiResponse = response.data;
      return data.choices[0]?.message?.content || 'No response from Grok';
    } catch (error: any) {
      console.error('Grok API error:', error.response?.data || error.message);
      throw new Error(`Failed to communicate with Grok API: ${error.message}`);
    }
  }

  // Enhanced method for code generation with optimized temperature and parameters
  async generateCode(request: CodeGenerationRequest): Promise<string> {
    const messages = [{
      role: 'system',
      content: `You are grok-code-fast-1, a specialized AI for rapid, high-quality ${request.language} code generation. Generate production-ready ${request.language} code that follows best practices, includes proper error handling, and complete documentation. Focus on clarity, performance, and maintainability.`
    }, {
      role: 'user',
      content: `Generate ${request.language} code for: ${request.functionality}

${request.requirements ? `Requirements:\n- ${request.requirements.join('\n- ')}\n` : ''}
${request.constraints ? `Constraints:\n- ${request.constraints.join('\n- ')}\n` : ''}
${request.context ? `Context:\n${request.context.join('\n')}\n` : ''}
${request.existingCode ? `Existing code to integrate with:\n${request.existingCode}\n` : ''}

Provide only the complete, working code with proper imports, error handling, and comments.`
    }];

    return this.chat({
      messages,
      model: 'grok-code-fast-1',
      temperature: 0.2, // Low temperature for consistent, high-quality code
      max_tokens: 4000, // Allow longer code generation
    });
  }

  // Streaming code generation for large/complex code
  async streamCode(request: CodeGenerationRequest, onChunk?: (chunk: string) => void): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const messages = [{
          role: 'system',
          content: `You are grok-code-fast-1, ultra-fast code generation specialist. Stream high-quality ${request.language} code incrementally, ensuring each chunk builds properly.`
        }, {
          role: 'user',
          content: `Generate ${request.language} code for: ${request.functionality}

${request.requirements ? `Requirements:\n- ${request.requirements.join('\n- ')}` : ''}
${request.constraints ? `Constraints:\n- ${request.constraints.join('\n- ')}` : ''}

Provide the complete, working code.`
        }];

        // Note: Actual streaming implementation would require API support
        // For now, using standard request with chunking simulation
        const response = await this.client.post('/chat/completions', {
          messages,
          model: 'grok-code-fast-1',
          temperature: 0.1,
          max_tokens: 4000,
          stream: false, // Set to true when API supports streaming
        });

        const data: GrokApiResponse = response.data;
        const fullResponse = data.choices[0]?.message?.content || '';

        // Simulate streaming by chunking the response
        const chunks = fullResponse.split('\n\n');
        if (onChunk) {
          chunks.forEach((chunk, index) => {
            setTimeout(() => {
              onChunk(chunk + '\n\n');
            }, index * 50); // Simulate gradual streaming
          });
        }

        // Resolve with full response after streaming
        setTimeout(() => resolve(fullResponse), chunks.length * 50 + 10);

      } catch (error: any) {
        console.error('Streaming API error:', error.response?.data || error.message);
        reject(new Error(`Streaming failed: ${error.message}`));
      }
    });
  }

  // Code analysis and review method
  async analyzeCode(code: string, language: string, analysisType?: string): Promise<string> {
    const messages = [{
      role: 'system',
      content: `You are grok-code-fast-1, expert code analyzer. Provide detailed analysis of ${language} code including performance, security, maintainability, and best practice recommendations.`
    }, {
      role: 'user',
      content: `Analyze this ${language} code${analysisType ? ` focusing on ${analysisType}` : ''}:

${code}

Provide analysis: ${analysisType || 'performance, security, best practices, improvements'}`
    }];

    return this.chat({
      messages,
      model: 'grok-code-fast-1',
      temperature: 0.1,
    });
  }

  // Code completion with context awareness
  async completeCode(prefix: string, suffix?: string, language?: string, context?: string): Promise<string> {
    const systemPrompt = `You are grok-code-fast-1, intelligent code completion specialist. Complete code naturally, maintaining context, style, and functionality. Return only the completion, not the full code.`;

    const userPrompt = `Complete this ${language || 'code'}:

Prefix:
${prefix}

${suffix ? `Suffix after completion:\n${suffix}\n` : ''}
${context ? `Context:\n${context}\n` : ''}
Complete naturally, maintaining style and functionality:`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    return this.chat({
      messages,
      model: 'grok-code-fast-1',
      temperature: 0.3, // Slightly higher for creative completion
      max_tokens: 1000,
    });
  }

  // Enhanced error handling and retry logic
  async robustRequest(request: GrokApiRequest, maxRetries: number = 3): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.chat(request);
      } catch (error: any) {
        lastError = error;
        console.warn(`Attempt ${attempt} failed, retrying...`);

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new Error(`All ${maxRetries} attempts failed. Last error: ${lastError?.message}`);
  }
}

// Export both interfaces for backward compatibility
export class GrokApiClient extends EnhancedGrokApiClient {}
