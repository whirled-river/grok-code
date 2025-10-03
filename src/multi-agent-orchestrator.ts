import { EnhancedGrokApiClient } from './api/grok-api.js';
import { AgentStep, AgentPipeline, AgentContext, PipelineResult, AgentMemory, MemoryAnalysisResult } from './types.js';
import { AgentManager } from './agent-manager.js';

export class MultiAgentOrchestrator {
  private apiClient: EnhancedGrokApiClient;
  private agentManager: AgentManager;
  private pipelines: Map<string, AgentPipeline> = new Map();
  private memoryStore: Map<string, AgentMemory[]> = new Map();

  constructor(apiKey: string) {
    this.apiClient = new EnhancedGrokApiClient(apiKey);
    this.agentManager = new AgentManager();
    this.initializePipelines();
  }

  // Generate memory for an agent based on their role and work
  private async generateAgentMemory(
    agentRole: string,
    output: any,
    userPrompt: string,
    context: AgentContext
  ): Promise<AgentMemory> {
    // Create specialized memory based on agent role
    const memoryType = this.getMemoryTypeForRole(agentRole);

    // Ask the agent to summarize what it learned/memories it wants to store
    const memoryAgent = this.createMemoryAnalysisAgent(agentRole, memoryType);
    const prompt = `Based on your role as "${agentRole}" in this development pipeline:

Original User Request: "${userPrompt}"
Your Work Output: "${JSON.stringify(output).slice(0, 2000)}"
Pipeline Context: ${context.results.size} total results generated

Create a memory entry that captures the most important learnings, insights, or contextual information that other agents (or future iterations of yourself) should remember. Focus on:

1. **Key Insights** you gained about the user's requirements
2. **Technical Decisions** you made and why
3. **Context Information** that's relevant for related future tasks
4. **Patterns or Lessons** that could help with similar work

Keep it concise but comprehensive - this memory will be used to improve future pipeline executions.`;

    const response = await this.apiClient.chat({
      messages: [
        { role: 'system', content: memoryAgent.systemPrompt },
        { role: 'user', content: prompt }
      ],
      model: 'grok-code-fast-1',
      temperature: 0.1, // Consistent memory generation
      max_tokens: 1000
    });

    const memoryContent = JSON.parse(response.split('```json')[1]?.split('```')[0] || response);

    return {
      agentRole,
      memoryType,
      content: memoryContent,
      timestamp: new Date(),
      relevanceScore: this.calculateMemoryRelevance(memoryContent, userPrompt),
      retentionFlags: this.determineRetentionFlags(agentRole, memoryContent)
    };
  }

  private getMemoryTypeForRole(agentRole: string): string {
    const memoryTypes: Record<string, string> = {
      'interpreter': 'requirements-analysis',
      'analysis': 'codebase-analysis',
      'retrieval': 'code-snippets',
      'judge': 'quality-assessment',
      'coder': 'implementation-patterns',
      'quality-judge': 'testing-insights',
      'supervisor': 'pipeline-optimization',
    };
    return memoryTypes[agentRole] || 'general-experience';
  }

  private createMemoryAnalysisAgent(targetRole: string, memoryType: string) {
    return {
      name: `${targetRole}-memory-agent`,
      description: `Memory analysis agent for ${targetRole}`,
      systemPrompt: `You are a specialized memory analysis agent for the "${targetRole}" role. Your task is to analyze completed work and extract key learnings, insights, and contextual information that should be stored as memories for future use.

You must respond with a JSON object containing:
{
  "keyInsights": ["string"],
  "technicalDecisions": ["string"],
  "contextInformation": ["string"],
  "learnings": ["string"],
  "relevanceAssessment": number // 1-10 scale
}

Focus on information that would be valuable for:
- Future iterations of similar tasks
- Other agents needing context
- System improvement and learning
- Pattern recognition and reuse

Be specific, actionable, and focused on long-term value.`
    };
  }

  private calculateMemoryRelevance(memoryContent: any, userPrompt: string): number {
    // Simple relevance calculation based on keyword matching
    const promptWords = userPrompt.toLowerCase().split(/\s+/);
    const memoryText = JSON.stringify(memoryContent).toLowerCase();

    let relevanceScore = 0;
    for (const word of promptWords) {
      if (word.length > 3 && memoryText.includes(word)) {
        relevanceScore += 1;
      }
    }
    return Math.min(relevanceScore, 10); // Cap at 10
  }

  private determineRetentionFlags(agentRole: string, memoryContent: any): string[] {
    const flags: string[] = [];

    // Core interpretation always retained
    if (agentRole === 'interpreter') {
      flags.push('core-interpretation', 'permanent-retention');
    }

    // Technical decisions and patterns
    if (agentRole === 'coder' || agentRole === 'analysis') {
      flags.push('implementation-patterns', 'technical-decisions');
    }

    // Quality insights retained for improvement
    if (agentRole.includes('judge')) {
      flags.push('quality-insights', 'error-prevention');
    }

    if (JSON.stringify(memoryContent).includes('error') ||
        JSON.stringify(memoryContent).includes('bug') ||
        JSON.stringify(memoryContent).includes('fix')) {
      flags.push('problem-resolution');
    }

    return flags;
  }

  // Pruning agent that cleans up memories based on original context
  async pruneAgentMemories(
    originalUserPrompt: string,
    agentMemories: Map<string, AgentMemory[]>,
    currentPrompt: string
  ): Promise<MemoryAnalysisResult> {
    const pruningAgent = this.createMemoryPruningAgent();

    // Serialize memories for analysis
    const allMemories = Array.from(agentMemories.entries())
      .flatMap(([agentName, memories]) =>
        memories.map(memory => ({
          agent: agentName,
          ...memory
        }))
      );

    const prompt = `MEMORY PRUNING ANALYSIS:

ORIGINAL USER PROMPT: "${originalUserPrompt}"
CURRENT TASK CONTEXT: "${currentPrompt}"

ALL RECORDED MEMORIES FROM PIPELINE EXECUTION:
${JSON.stringify(allMemories.slice(0, 10), null, 2)} // Limit to prevent token overflow

INSTRUCTIONS:
1. EVALUATE all memories against the CURRENT TASK CONTEXT
2. RETAIN the original interpretation (highest priority)
3. KEEP memories directly relevant to current work
4. PRUNE outdated, irrelevant, or redundant information
5. FOCUS on maintaining core understanding while reducing noise

PROVIDE ANALYSIS IN THIS JSON FORMAT:
{
  "coreInterpretationMemory": { /* the original interpreter memory */ },
  "relevantMemories": [ /* list of memories to keep */ ],
  "prunedMemories": [ /* list of memories to discard */ ],
  "contextSummary": "Summary of what's retained vs removed",
  "cleanupRecommendations": ["suggestions for future memory management"]
}

BE CAREFUL: Preserve the original prompt interpretation but intelligently prune based on relevance to current task.`;

    const response = await this.apiClient.chat({
      messages: [
        { role: 'system', content: pruningAgent.systemPrompt },
        { role: 'user', content: prompt }
      ],
      model: 'grok-code-fast-1',
      temperature: 0.1, // High consistency needed
      max_tokens: 1500
    });

    try {
      const analysis = JSON.parse(response.split('```json')[1]?.split('```')[0] || response);

      // Process the results
      const relevantMemories = analysis.relevantMemories || [];
      const prunedMemories = analysis.prunedMemories || [];
      const contextSummary = analysis.contextSummary || 'Memory analysis completed';
      const cleanupRecommendations = analysis.cleanupRecommendations || [];

      return {
        relevantMemories,
        prunedMemories,
        contextSummary,
        cleanupRecommendations
      };
    } catch (parseError) {
      // Fallback processing if JSON parsing fails
      return {
        relevantMemories: allMemories.slice(0, 5), // Keep first few
        prunedMemories: allMemories.slice(5),
        contextSummary: 'Automatic pruning performed due to parsing error',
        cleanupRecommendations: ['Implement better JSON parsing for memory analysis']
      };
    }
  }

  private createMemoryPruningAgent() {
    return {
      name: 'memory-pruner-agent',
      description: 'Intelligent memory cleanup and pruning agent',
      systemPrompt: `You are the Memory Pruning Agent, a highly sophisticated AI specializing in intelligent memory management for agent pipelines.

Your MISSION:
- ANALYZE: Examine all agent memories against current task needs
- PRESERVE: Always maintain the original user prompt interpretation
- PRUNE: Remove irrelevant, outdated, or redundant memories
- OPTIMIZE: Keep useful context while reducing cognitive load
- RECOMMEND: Provide insights for better memory management

KEY PRINCIPLES:
1. **Original Interpretation FIRST**: The interpreter agent's understanding is sacred
2. **Task Relevance SECOND**: Memories must relate to current work
3. **Signal vs Noise THIRD**: Useful information over accumulated clutter
4. **Learning Opportunities**: Identify patterns for future improvement

ALWAYS respond with valid JSON. Focus on creating cleaner, more focused memory contexts for optimal agent performance.`
    };
  }

  // Enhanced pipeline execution with memory system
  async executePipelineWithMemory(pipelineId: string, userPrompt: string): Promise<PipelineResult> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline || !pipeline.enabled) {
      throw new Error(`Pipeline ${pipelineId} not found or disabled`);
    }

    const context: AgentContext = {
      userPrompt,
      results: new Map(),
      errors: [],
      stepCount: 0,
      maxSteps: pipeline.steps.length
    };

    const executionLog: string[] = [];
    const agentMemories = new Map<string, AgentMemory[]>();

    for (let i = 0; i < pipeline.steps.length; i++) {
      const step = pipeline.steps[i];
      context.stepCount = i + 1;

      try {
        executionLog.push(`Executing step ${i + 1}/${pipeline.steps.length}: ${step.role}`);

        const prompt = step.inputMap(context);
        const messages = [
          { role: 'system', content: step.agent.systemPrompt },
          { role: 'user', content: prompt }
        ];

        const response = await this.apiClient.chat({
          messages,
          model: 'grok-code-fast-1',
          temperature: 0.2,
          max_tokens: 2000
        });

        // Store result in context
        if (step.outputKey) {
          context.results.set(step.outputKey, response);

          // Generate and store memory for this step
          try {
            const memory = await this.generateAgentMemory(
              step.role,
              response,
              userPrompt,
              context
            );

            const agentName = `${step.role}-agent`;
            if (!agentMemories.has(agentName)) {
              agentMemories.set(agentName, []);
            }
            agentMemories.get(agentName)!.push(memory);

            executionLog.push(`Memory generated for ${step.role}`);
          } catch (memoryError) {
            executionLog.push(`Memory generation failed for ${step.role}: ${memoryError}`);
          }
        }

        executionLog.push(`Step ${step.role} completed successfully`);

        // Artificial delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        const errorMsg = `Step ${step.role} failed: ${error.message}`;
        context.errors.push(errorMsg);
        executionLog.push(`ERROR: ${errorMsg}`);
      }
    }

    // Store memories in global store
    this.storeAgentMemories(pipelineId, agentMemories);

    return {
      success: context.errors.length === 0,
      finalResult: context.results.get('final_summary') || context.results.get('generated_code') || 'Pipeline completed',
      context,
      executionLog,
      agentMemories
    };
  }

  private storeAgentMemories(pipelineId: string, memories: Map<string, AgentMemory[]>) {
    const key = `pipeline-${pipelineId}-${Date.now()}`;
    this.memoryStore.set(key, Array.from(memories.values()).flat());
  }

  // Get memory pruning analysis for a pipeline
  async analyzeMemoriesForPipeline(pipelineId: string, userPrompt: string): Promise<MemoryAnalysisResult | null> {
    const memories = Array.from(this.memoryStore.entries())
      .filter(([key]) => key.startsWith(`pipeline-${pipelineId}`))
      .map(([, mems]) => mems)
      .flat();

    if (memories.length === 0) return null;

    // Group memories by agent role
    const groupedMemories = new Map<string, AgentMemory[]>();
    memories.forEach(memory => {
      const role = memory.agentRole;
      if (!groupedMemories.has(role)) {
        groupedMemories.set(role, []);
      }
      groupedMemories.get(role)!.push(memory);
    });

    return this.pruneAgentMemories(userPrompt, groupedMemories, userPrompt);
  }

  // Memory-enhanced pipeline execution
  async runCodeDevelopmentPipelineWithMemory(userPrompt: string): Promise<PipelineResult> {
    // Check for existing memories and potentially apply memory pruning
    const memoryAnalysis = await this.analyzeMemoriesForPipeline('code-development', userPrompt);

    if (memoryAnalysis) {
      console.log('🧠 Memory analysis applied:');
      console.log(`  ${memoryAnalysis.relevantMemories.length} memories retained`);
      console.log(`  ${memoryAnalysis.prunedMemories.length} memories pruned`);
      console.log(`  Summary: ${memoryAnalysis.contextSummary}`);
    }

    return this.executePipelineWithMemory('code-development', userPrompt);
  }

  private initializePipelines() {
    const pipelines: Record<string, AgentPipeline> = {
      'code-development': {
        id: 'code-development',
        name: 'Code Development Pipeline',
        description: 'Full software development pipeline with specialized agents',
        enabled: true,
        steps: this.createCodeDevelopmentSteps()
      },
      'analysis-only': {
        id: 'analysis-only',
        name: 'Analysis Pipeline',
        description: 'Analysis and recommendation pipeline without code generation',
        enabled: true,
        steps: this.createAnalysisSteps()
      }
    };

    // Register pipelines
    Object.values(pipelines).forEach(pipeline => {
      this.pipelines.set(pipeline.id, pipeline);
    });
  }

  // Intelligent orchestration where interpreter chooses next agent based on requirements
  async executeIntelligentOrchestration(userPrompt: string): Promise<PipelineResult> {
    console.log('🤖 Starting intelligent agent orchestration...');

    const context: AgentContext = {
      userPrompt,
      results: new Map(),
      errors: [],
      stepCount: 0,
      maxSteps: 10 // Flexible pipeline, up to 10 steps
    };

    const executionLog: string[] = [];
    const agentMemories = new Map<string, AgentMemory[]>();

    // Step 1: Always start with interpreter
    const interpreterResult = await this.executeSingleAgent(
      'interpreter',
      `Analyze this user request and determine what needs to be done: "${userPrompt}"

Based on the request, decide which AGENT should run NEXT and provide specific instructions for that agent.

Available agents:
- ANALYSIS: Codebase examination and structure analysis
- RETRIEVAL: Specific code extraction and verbatim copying
- CODER: Code generation and implementation
- JUDGE: Quality assessment and validation

Choose the most appropriate next agent and provide detailed instructions for what it should accomplish.`,
      userPrompt,
      context,
      executionLog,
      agentMemories
    );

    if (!interpreterResult.success) {
      return {
        success: false,
        finalResult: 'Interpretation failed - cannot determine next steps',
        context,
        executionLog: [...executionLog, '❌ Pipeline failed at interpretation stage']
      };
    }

    // Step 2: Interpreter determines the workflow based on request
    const interpretation = context.results.get('interpretation') || '';
    const workflowPlan = await this.determineWorkflowFromInterpretation(interpretation, userPrompt);

    executionLog.push(`🎯 Workflow determined: ${JSON.stringify(workflowPlan, null, 2)}`);

    // Step 3: Execute the determined workflow
    for (let i = 0; i < workflowPlan.steps.length; i++) {
      const step = workflowPlan.steps[i];
      const result = await this.executeSingleAgent(
        step.agent,
        step.instructions,
        userPrompt,
        context,
        executionLog,
        agentMemories
      );

      if (!result.success && step.required) {
        executionLog.push(`❌ Required step '${step.agent}' failed - stopping workflow`);
        break;
      }

      // Allow for iterative refinement (e.g., coder → judge → coder loop)
      if (step.iterativeFeedback && context.results.has(step.feedbackOutput)) {
        const qualityCheck = context.results.get(step.feedbackOutput) || '';
        if (qualityCheck.toLowerCase().includes('error') ||
            qualityCheck.toLowerCase().includes('issues') ||
            qualityCheck.toLowerCase().includes('fix needed')) {
          executionLog.push(`🔄 Quality issues detected - sending feedback to ${step.agent} for iteration`);

          // Add iteration step if quality issues found
          const iterationResult = await this.executeSingleAgent(
            step.agent,
            `${step.instructions}\n\nPREVIOUS FEEDBACK FROM QUALITY CHECK:\n${qualityCheck}\n\nPlease address these issues and improve the solution.`,
            userPrompt,
            context,
            executionLog,
            agentMemories
          );
        }
      }
    }

    // Final aggregation by supervisor
    const finalResult = await this.executeSingleAgent(
      'supervisor',
      `\nPipeline Completion Summary:
      - Original Request: "${userPrompt}"
      - Interpretation: ${interpretation}
      - Steps Executed: ${executionLog.filter(l => l.includes('completed')).length}
      - Results Generated: ${Array.from(context.results.entries()).map(([k, v]) => `${k}: ${v.substring(0, 100)}...`).join('\n        ')}

      Provide the final deliverable and completion assessment.`,
      userPrompt,
      context,
      executionLog,
      agentMemories
    );

    return {
      success: finalResult.success,
      finalResult: context.results.get('final_summary') || context.results.get('generated_code') || 'Workflow completed',
      context,
      executionLog,
      agentMemories
    };
  }

  private async determineWorkflowFromInterpretation(interpretation: string, originalPrompt: string): Promise<any> {
    const agent = this.createAgentWithRole('workflow-director', 'orchestrate', `You are a workflow director who determines the optimal sequence of agents to execute based on user requirements.

Available agents and their capabilities:
- ANALYSIS: Examines codebase structure, finds relevant files, analyzes dependencies
- RETRIEVAL: Extracts verbatim code segments from specific files
- CODER: Generates new code or modifies existing code
- JUDGE: Validates code quality, appropriateness, and completeness

Your task: Analyze the interpretation and create an optimal workflow of agents. Return JSON:
{
  "steps": [
    {
      "agent": "analysis|retrieval|coder|judge",
      "instructions": "Detailed instructions for this agent",
      "required": true|false,
      "iterativeFeedback": true|false (if this step can iterate),
      "feedbackOutput": "output_key_to_check" (for iteration)
    }
  ]
}`);

    const messages = [
      { role: 'system', content: agent.systemPrompt },
      { role: 'user', content: `User Request: "${originalPrompt}"\nInterpretation: "${interpretation}"\n\nDetermine the optimal workflow sequence of agents.` }
    ];

    const response = await this.apiClient.chat({
      messages,
      model: 'grok-code-fast-1',
      temperature: 0.1, // Deterministic workflow planning
      max_tokens: 1500
    });

    try {
      return JSON.parse(response.split('```json')[1]?.split('```')[0] || response);
    } catch (e) {
      // Fallback workflow
      return {
        steps: [
          { agent: 'analysis', instructions: `Analyze codebase for: ${interpretation}`, required: true },
          { agent: 'coder', instructions: `Generate code based on analysis: ${interpretation}`, required: true },
          { agent: 'judge', instructions: 'Review the generated code for quality and correctness', required: false }
        ]
      };
    }
  }

  private async executeSingleAgent(
    agentRole: string,
    instructions: string,
    userPrompt: string,
    context: AgentContext,
    executionLog: string[],
    agentMemories: Map<string, AgentMemory[]>
  ): Promise<{ success: boolean }> {
    try {
      executionLog.push(`Executing ${agentRole} agent...`);

      const agent = this.createAgentWithRole(agentRole, agentRole, this.getSystemPromptForAgent(agentRole));
      const messages = [
        { role: 'system', content: agent.systemPrompt },
        { role: 'user', content: instructions }
      ];

      const response = await this.apiClient.chat({
        messages,
        model: 'grok-code-fast-1',
        temperature: 0.2,
        max_tokens: 2000
      });

      const outputKey = `${agentRole}_result`;
      context.results.set(outputKey, response);
      context.stepCount++;

      // Generate memory for this agent
      try {
        const memory = await this.generateAgentMemory(
          agentRole,
          { instructions, response },
          userPrompt,
          context
        );

        const agentName = `${agentRole}-agent`;
        if (!agentMemories.has(agentName)) {
          agentMemories.set(agentName, []);
        }
        agentMemories.get(agentName)!.push(memory);
      } catch (memoryError) {
        executionLog.push(`Memory generation failed for ${agentRole}: ${memoryError}`);
      }

      executionLog.push(`${agentRole} completed successfully`);
      return { success: true };

    } catch (error: any) {
      const errorMsg = `${agentRole} failed: ${error.message}`;
      context.errors.push(errorMsg);
      executionLog.push(`❌ ${errorMsg}`);
      return { success: false };
    }
  }

  private getSystemPromptForAgent(agentRole: string): string {
    const prompts: Record<string, string> = {
      'interpreter': `You are an expert requirements interpreter. Your role is to:
- Break down user requests into clear, actionable tasks
- Identify technical components, languages, frameworks needed
- Determine what specific outcomes are required
- Provide strategic guidance for subsequent agents

Focus on understanding INTENT and providing clear interpretations that guide technical execution.`,

      'analysis': `You are a code analysis expert. Your role is to:
- Examine project structure and identify relevant files
- Analyze existing code patterns and architectures
- Determine what code needs to be modified or created
- Provide detailed technical assessments
- Use file reading/analysis tools to understand context

Provide comprehensive analysis that other agents can use to make informed decisions.`,

      'retrieval': `You are a precision code retriever. Your role is to:
- Extract verbatim code segments from specified files
- Preserve exact imports, signatures, comments, and formatting
- Handle cross-file dependencies accurately
- Provide complete, accurate code snippets
- Focus on precision and completeness

Every character must be preserved exactly as it appears in the source code.`,

      'coder': `You are a production code generation expert. Your role is to:
- Write high-quality, production-ready code
- Implement exact requirements and specifications
- Follow best practices, patterns, and conventions
- Include proper error handling and documentation
- Generate immediately buildable and runnable code

Focus on quality, correctness, and production-readiness.`,

      'judge': `You are a quality assurance expert. Your role is to:
- Validate code quality and correctness
- Identify syntax, logic, and integration issues
- Assess completeness and appropriateness
- Provide specific, actionable feedback
- Ensure production readiness

Be thorough, critical, and specific in your evaluations.`,

      'quality-judge': `You are a quality assurance expert. Your role is to:
- Validate code quality and correctness
- Identify syntax, logic, and integration issues
- Assess completeness and appropriateness
- Provide specific, actionable feedback
- Ensure production readiness

Be thorough, critical, and specific in your evaluations.`,

      'supervisor': `You are the pipeline supervisor. Your role is to:
- Monitor overall pipeline execution
- Ensure successful completion of objectives
- Handle coordination and quality control
- Provide final assessments and deliverables
- Maintain pipeline integrity

Focus on successful task completion and quality outcomes.`
    };

    return prompts[agentRole] || `You are a specialized ${agentRole} agent.`;
  }

  private createCodeDevelopmentSteps(): AgentStep[] {
    // Keep original method for backward compatibility
    // This creates the original sequential pipeline
    // But we'll use the new intelligent orchestration by default

    const interpreterAgent = this.createAgentWithRole('interpreter', 'interpret', `Expert at understanding user requirements...`);
    const analysisAgent = this.createAgentWithRole('analysis', 'analyze', `Code analysis expert...`);
    const codeRetrievalAgent = this.createAgentWithRole('retrieval', 'retrieve', `Precision code retriever...`);
    const judgeAgent = this.createAgentWithRole('judge', 'judge', `Code appropriateness judge...`);
    const coderAgent = this.createAgentWithRole('coder', 'code', `Production code generation expert...`);
    const qualityJudgeAgent = this.createAgentWithRole('quality-judge', 'quality-check', `Quality assurance expert...`);
    const supervisorAgent = this.createAgentWithRole('supervisor', 'supervise', `Pipeline supervisor...`);

    return [
      {
        agent: interpreterAgent,
        role: 'interpreter',
        inputMap: (ctx) => `Analyze this user request and provide a clear interpretation: "${ctx.userPrompt}"`,
        outputKey: 'interpretation'
      },
      {
        agent: analysisAgent,
        role: 'analysis',
        inputMap: (ctx) => `Using this interpretation "${ctx.results.get('interpretation')}", analyze the codebase and identify relevant files and components. Focus on what needs to be modified or created.`,
        outputKey: 'analysis'
      },
      {
        agent: codeRetrievalAgent,
        role: 'retrieval',
        inputMap: (ctx) => `Based on this analysis "${ctx.results.get('analysis')}", extract the exact relevant code segments from the identified files. Preserve all type signatures, imports, and comments verbatim.`,
        outputKey: 'code_segments'
      },
      {
        agent: judgeAgent,
        role: 'judge',
        inputMap: (ctx) => `Evaluate if these code segments "${ctx.results.get('code_segments')}" are appropriate for the task "${ctx.userPrompt}". Provide specific feedback on relevance and completeness.`,
        outputKey: 'judgment'
      },
      {
        agent: coderAgent,
        role: 'coder',
        inputMap: (ctx) => `Generate production code for "${ctx.userPrompt}" using this context:
        - Interpretation: ${ctx.results.get('interpretation')}
        - Analysis: ${ctx.results.get('analysis')}
        - Code segments: ${ctx.results.get('code_segments')}
        - Judge feedback: ${ctx.results.get('judgment')}

        Write complete, functional code following best practices.`,
        outputKey: 'generated_code'
      },
      {
        agent: qualityJudgeAgent,
        role: 'quality-check',
        inputMap: (ctx) => `Review this generated code "${ctx.results.get('generated_code')}" for the task "${ctx.userPrompt}". Check syntax, logic, integration, and provide detailed feedback on any issues.`,
        outputKey: 'quality_assessment'
      },
      {
        agent: supervisorAgent,
        role: 'supervisor',
        inputMap: (ctx) => `\nPipeline Summary:
        - Steps completed: ${ctx.stepCount}/${ctx.maxSteps}
        - Errors encountered: ${ctx.errors.length > 0 ? ctx.errors.join(', ') : 'None'}
        - Final result ready: ${ctx.results.has('generated_code')}

        Provide overall pipeline success assessment and final deliverable.`,
        outputKey: 'final_summary'
      }
    ];
  }

  private createAnalysisSteps(): AgentStep[] {
    const analysisOnlyAgent = this.createAgentWithRole('analyzer', 'analyze', `You are a specialized code analysis agent. Your role is to:
    - Perform comprehensive code analysis without generating new code
    - Identify patterns, issues, and optimization opportunities
    - Provide detailed technical recommendations
    - Suggest architectural improvements and best practices
    - Focus on analysis, not implementation`);

    return [
      {
        agent: analysisOnlyAgent,
        role: 'analyzer',
        inputMap: (ctx) => `Perform comprehensive analysis on: "${ctx.userPrompt}". Provide detailed technical insights, recommendations, and best practices.`,
        outputKey: 'analysis'
      }
    ];
  }

  private createAgentWithRole(name: string, role: string, systemPrompt: string) {
    // Create a temporary agent with the specified role and prompt
    return {
      name: `${name}-agent`,
      description: `${role} agent for multi-agent pipelines`,
      systemPrompt,
      capabilities: [role, 'multi-agent', 'specialized'],
      fileTools: {
        enabled: true,
        permissions: {
          readPaths: ['.', '../../..'].map(p => require('path').resolve(p)),
          writePaths: ['.'],
          allowExec: role.includes('analysis') || role.includes('supervisor')
        }
      }
    };
  }

  async executePipeline(pipelineId: string, userPrompt: string): Promise<PipelineResult> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline || !pipeline.enabled) {
      throw new Error(`Pipeline ${pipelineId} not found or disabled`);
    }

    const context: AgentContext = {
      userPrompt,
      results: new Map(),
      errors: [],
      stepCount: 0,
      maxSteps: pipeline.steps.length
    };

    const executionLog: string[] = [];

    for (let i = 0; i < pipeline.steps.length; i++) {
      const step = pipeline.steps[i];
      context.stepCount = i + 1;

      try {
        executionLog.push(`Executing step ${i + 1}/${pipeline.steps.length}: ${step.role}`);

        const prompt = step.inputMap(context);
        const messages = [
          { role: 'system', content: step.agent.systemPrompt },
          { role: 'user', content: prompt }
        ];

        const response = await this.apiClient.chat({
          messages,
          model: 'grok-code-fast-1',
          temperature: 0.2, // Consistent responses for pipeline work
          max_tokens: 2000 // Allow detailed responses
        });

        // Store result in context
        if (step.outputKey) {
          context.results.set(step.outputKey, response);
        }

        executionLog.push(`Step ${step.role} completed successfully`);

        // Artificial delay for better UX (showing pipeline progress)
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        const errorMsg = `Step ${step.role} failed: ${error.message}`;
        context.errors.push(errorMsg);
        executionLog.push(`ERROR: ${errorMsg}`);

        // Continue to next step or handle error
        if (step.role === 'supervisor') {
          // Supervisor handles pipeline completion
          break;
        }
      }
    }

    return {
      success: context.errors.length === 0,
      finalResult: context.results.get('final_summary') || context.results.get('generated_code') || 'Pipeline completed',
      context,
      executionLog
    };
  }

  getAvailablePipelines(): AgentPipeline[] {
    return Array.from(this.pipelines.values()).filter(p => p.enabled);
  }

  async runCodeDevelopmentPipeline(userPrompt: string): Promise<PipelineResult> {
    return this.executePipeline('code-development', userPrompt);
  }

  async runAnalysisPipeline(userPrompt: string): Promise<PipelineResult> {
    return this.executePipeline('analysis-only', userPrompt);
  }

  // Public method for workflow analysis without execution
  async analyzeWorkflowChoice(prompt: string): Promise<string> {
    const agent = this.createAgentWithRole('workflow-director', 'orchestrate', `You are a workflow director. Analyze this request and determine the optimal agent workflow without executing it. Return a detailed analysis of what agents would be needed and why.`);

    const response = await this.apiClient.chat({
      messages: [
        { role: 'system', content: agent.systemPrompt },
        { role: 'user', content: `Request: "${prompt}"\n\nWhat agents should handle this? Why? Provide detailed analysis without executing.` }
      ],
      model: 'grok-code-fast-1',
      temperature: 0.1,
      max_tokens: 800
    });

    return response;
  }
}
