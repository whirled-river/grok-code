export interface Agent {
  name: string;
  description: string;
  systemPrompt: string;
  capabilities?: string[];
  fileTools?: {
    enabled: boolean;
    permissions: import('./utils/file-tools.js').FileToolPermissions;
  };
  modes?: {
    thinking?: string;
    planning?: string;
    execution?: string;
  };
  pipeline?: string; // Maps conceptual agent to orchestration pipeline
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  agent: Agent;
  messages: Message[];
}

export interface GrokApiRequest {
  messages: {
    role: string;
    content: string;
  }[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface GrokApiResponse {
  choices: {
    message: {
      role: string;
      content: string;
    };
  }[];
}

export interface AgentConfig {
  agents: Agent[];
}

export interface Session {
  id: string;
  agent: Agent;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// Multi-agent system types
export interface AgentStep {
  agent: Agent;
  role: string;
  inputMap: (context: AgentContext) => string;
  outputKey?: string;
}

export interface AgentPipeline {
  id: string;
  name: string;
  description: string;
  steps: AgentStep[];
  enabled: boolean;
}

export interface AgentContext {
  userPrompt: string;
  results: Map<string, any>;
  errors: string[];
  stepCount: number;
  maxSteps: number;
}

export interface PipelineResult {
  success: boolean;
  finalResult: any;
  context: AgentContext;
  executionLog: string[];
  agentMemories?: Map<string, AgentMemory[]>;
}

export interface AgentMemory {
  agentRole: string;
  memoryType: string;
  content: any;
  timestamp: Date;
  relevanceScore?: number;
  retentionFlags?: string[];
}

export interface MemoryAnalysisResult {
  relevantMemories: AgentMemory[];
  prunedMemories: AgentMemory[];
  contextSummary: string;
  cleanupRecommendations: string[];
}

// Meta-Agent system types (invisible assistants that coordinate pipelines)
export interface MetaAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  capabilities: string[];
  systemPrompt: string;
  accessLevel: 'whisper-network' | 'coordination-layer' | 'system-admin';
  triggers: string[]; // Conditions that activate this meta-agent
  outputs: string[]; // What this agent produces
  integrationPoints: string[]; // Where this agent connects in pipelines
}
