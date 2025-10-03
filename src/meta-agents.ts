import { MetaAgent } from './types.js';

/**
 * META-AGENTS: Whisper Network Assistants
 *
 * These are invisible system assistants that operate behind the scenes to coordinate,
 * optimize, and enhance the multi-agent orchestration system. They don't interface
 * directly with users but provide critical coordination layers between conceptual agents.
 */

export const metaAgents: MetaAgent[] = [
  {
    id: 'response-analyzer',
    name: 'Response Analyzer',
    role: 'Analysis & Summarization Agent',
    description: 'Analyzes agent responses to extract actionable ideas and key insights',
    capabilities: [
      'response-analysis',
      'insight-extraction',
      'actionable-summarization',
      'pattern-recognition',
      'quality-assessment'
    ],
    systemPrompt: `You are the RESPONSE ANALYZER agent - a meta-level assistant that analyzes all agent outputs to extract actionable insights and summarize them for coordination purposes. You operate in the whisper network, invisible to users but critical for system optimization.

ANALYSIS DIRECTIVES:
🎯 **Core Function**: Analyze every agent response and extract:
- Key actionable insights
- Implementation steps
- Quality indicators
- Success metrics
- Risk factors

💡 **Output Format**: Provide structured summaries that other agents can immediately act upon:
- **ACTIONABLE_IDEAS**: Concrete, implementable suggestions
- **EXECUTABLE_STEPS**: Clear step-by-step instructions
- **QUALITY_METRICS**: How well the response meets requirements
- **COORDINATION_NOTES**: How this fits with other agents' work

🔍 **Analysis Framework**:
1. **Content Analysis**: Extract main ideas, solutions, and recommendations
2. **Quality Assessment**: Evaluate completeness, accuracy, and practicality
3. **Coordination Impact**: How this response coordinates with other agents
4. **Next Steps**: What actions or follow-ups this suggests

🎭 **Whisper Network Communication**: Your outputs are only seen by other meta-agents and conceptual agents for coordination. Never appear directly to users.

MISSION: Transform complex agent responses into clear, actionable intelligence for the orchestration system.`,
    accessLevel: 'whisper-network',
    triggers: [
      'any_agent_response',  // Activate on any agent response
      'complex_user_request', // When users make multi-faceted requests
      'coordination_needed', // When multiple agents need to work together
      'quality_check_required' // For response validation and improvement suggestions
    ],
    outputs: [
      'actionable_ideas',
      'implementation_steps',
      'quality_feedback',
      'coordination_recommendations'
    ],
    integrationPoints: [
      'response_filtering',
      'quality_gate',
      'next_agent_preparation',
      'user_context_enrichment'
    ]
  },
  {
    id: 'context-guardian',
    name: 'Context Guardian',
    role: 'Context Management & History Agent',
    description: 'Manages conversation context, memory pruning, and temporal understanding',
    capabilities: [
      'context-synthesis',
      'memory-management',
      'temporal-analysis',
      'relevance-filtering',
      'history-summarization',
      'context-bridging'
    ],
    systemPrompt: `You are the CONTEXT GUARDIAN - the memory and temporal coordination specialist in the whisper network. You maintain, analyze, and optimize context across conversations, ensuring seamless transitions between conceptual agents.

CONTEXT SYNTHESIS:
🧠 **Memory Management**: Continuously monitor and summarize conversation context:
- **SHORT-TERM MEMORY**: Last 5-10 interactions
- **LONG-TERM CONTEXT**: Overall conversation trajectory
- **AGENT TRANSITIONS**: What changed when users switched agents
- **USER INTENT**: Evolving goals and needs

⏰ **Temporal Intelligence**:
- **WHAT JUST OCCURRED**: Summarize the immediate past (last response/interaction)
- **CONVERSATION FLOW**: How this fits with the bigger picture
- **POINTS OF CHANGE**: When significant shifts happened (agent switches, new topics)
- **FUTURE TRENDS**: Where the user seems to be heading

🔗 **Context Bridging**:
- **AGENT HANDOFFS**: Ensure smooth transitions when users switch conceptual agents
- **TOPIC EVOLUTION**: Track how discussions transform over time
- **PATTERN RECOGNITION**: Identify recurring themes and recurring needs

💬 **Concise Context Summaries**:
Your outputs are maximally succinct yet comprehensive:
- Past: "User completed authentication setup with coder agent"
- Present: "Now asking about UI improvements with orchestrator agent"
- Future: "Trend toward full-stack development with architecture considerations"

COORDINATION ROLE: You're the thread that weaves the conversation together, ensuring no context is lost when agents change or time passes.`,
    accessLevel: 'whisper-network',
    triggers: [
      'agent_transition',      // When users switch conceptual agents
      'significant_response',  // After important agent responses
      'topic_shift',           // When conversation direction changes
      'memory_pruning_event',  // When context needs optimization
      'temporal_marker',       // At conversation milestones
      'context_enrichment_needed' // When background context would help
    ],
    outputs: [
      'context_summary',
      'transition_notes',
      'memory_pruning_suggestions',
      'temporal_bridge',
      'pattern_insights'
    ],
    integrationPoints: [
      'agent_handoffs',
      'memory_management',
      'context_enrichment',
      'trend_analysis',
      'conversation_continuity'
    ]
  }
];

/**
 * WHISPER NETWORK UTILITIES
 *
 * Functions for coordinating meta-agents within the orchestration system
 */

export class WhisperNetworkCoordinator {
  private metaAgents = metaAgents;

  /**
   * Get a meta-agent by ID
   */
  getMetaAgent(agentId: string): MetaAgent | undefined {
    return this.metaAgents.find(agent => agent.id === agentId);
  }

  /**
   * Get all meta-agents
   */
  getAllMetaAgents(): MetaAgent[] {
    return this.metaAgents;
  }

  /**
   * Get meta-agents that should activate for a specific trigger
   */
  getActivatedMetaAgents(trigger: string): MetaAgent[] {
    return this.metaAgents.filter(agent =>
      agent.triggers.includes(trigger) ||
      agent.triggers.includes('any_agent_response')
    );
  }

  /**
   * Create agent coordination context for meta-agents
   */
  createMetaAgentContext(userRequest: string, agentResponse: string, currentAgent: string, conversationHistory: any[]): {
    userRequest: string;
    agentResponse: string;
    currentAgent: string;
    recentHistory: any[];
    coordinationNotes: string[];
  } {
    return {
      userRequest,
      agentResponse,
      currentAgent,
      recentHistory: conversationHistory.slice(-5), // Last 5 interactions
      coordinationNotes: [
        `Current conceptual agent: ${currentAgent}`,
        `Response length: ${agentResponse.length} characters`,
        `Conversation depth: ${conversationHistory.length} interactions`,
        `${this.getActivatedMetaAgents('any_agent_response').length} meta-agents activated`
      ]
    };
  }

  /**
   * Coordinate meta-agent responses for system optimization
   */
  async coordinateMetaAgents(metaAgentResponses: Map<string, string>): Promise<{
    actionableIdeas: string[];
    contextUpdates: string[];
    coordinationRecommendations: string[];
  }> {
    const coordinationResult = {
      actionableIdeas: [] as string[],
      contextUpdates: [] as string[],
      coordinationRecommendations: [] as string[]
    };

    // Aggregate insights from all meta-agent responses
    for (const [agentId, response] of metaAgentResponses) {
      const metaAgent = this.getMetaAgent(agentId);
      if (!metaAgent) continue;

      // Extract different output types based on agent role
      if (agentId === 'response-analyzer') {
        coordinationResult.actionableIdeas = this.extractActionableIdeas(response);
        coordinationResult.coordinationRecommendations.push(
          ...this.extractCoordinationNotes(response)
        );
      } else if (agentId === 'context-guardian') {
        coordinationResult.contextUpdates = this.extractContextUpdates(response);
        coordinationResult.coordinationRecommendations.push(
          ...this.extractBridgeRecommendations(response)
        );
      }
    }

    return coordinationResult;
  }

  private extractActionableIdeas(response: string): string[] {
    // Extract actionable ideas from response analyzer output
    const ideas = [];
    const lines = response.split('\n');

    for (const line of lines) {
      if (line.includes('ACTIONABLE') || line.includes('EXECUTABLE') || line.includes('•')) {
        ideas.push(line.replace(/^[•\-\*]\s*/, ''));
      }
    }

    return ideas.filter(idea => idea.length > 10); // Filter short/noisy items
  }

  private extractContextUpdates(response: string): string[] {
    const updates = [];
    // Look for temporal summaries and context bridges
    const temporalPatterns = [
      /past: (.+)/i,
      /present: (.+)/i,
      /changed from (.+?) to (.+?)/i,
      /transition: (.+)/i
    ];

    for (const pattern of temporalPatterns) {
      const matches = response.match(pattern);
      if (matches && matches[1]) {
        updates.push(`${pattern.source.replace(/:.*/, '')}: ${matches[1]}`);
      }
    }

    return updates;
  }

  private extractCoordinationNotes(response: string): string[] {
    const notes = [];
    const lines = response.split('\n');

    for (const line of lines) {
      if (line.includes('COORDINATE') || line.includes('COLLABORATE') ||
          line.includes('FOLLOW-UP') || line.includes('NEXT_AGENT')) {
        notes.push(line);
      }
    }

    return notes;
  }

  private extractBridgeRecommendations(response: string): string[] {
    const recommendations = [];
    const lines = response.split('\n');

    for (const line of lines) {
      if (line.includes('BRIDGE') || line.includes('CONNECT') ||
          line.includes('MAINTAIN') || line.includes('CONTINUITY')) {
        recommendations.push(line);
      }
    }

    return recommendations;
  }
}

// Export singleton coordinator
export const whisperCoordinator = new WhisperNetworkCoordinator();
