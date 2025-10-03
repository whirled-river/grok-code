import React, { useState } from 'react';
import { Box, Text, Newline, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { Agent } from '../types.js';
import { conceptualAgents } from '../default-agents.js';

interface ConceptualAgentSelectorProps {
  onAgentSelected: (agent: Agent) => void;
}

export const ConceptualAgentSelector: React.FC<ConceptualAgentSelectorProps> = ({
  onAgentSelected
}) => {
  const [showPipelines, setShowPipelines] = useState(false);

  const agentOptions = conceptualAgents.map(agent => ({
    label: `${agent.name.toUpperCase()} 🚀`,
    value: agent.name,
    description: agent.description
  }));

  const agentSummaries = [
    {
      name: 'orchestrator',
      title: '🤖 INTELLIGENT ORCHESTRATION',
      features: [
        'Multi-agent coordination system',
        'Automatic pipeline selection',
        'Memory pruning & optimization',
        'Context-aware problem solving'
      ],
      recommended: 'Use this for complex tasks requiring multiple coordinated agents'
    },
    {
      name: 'coder',
      title: '💻 FULL DEVELOPMENT PIPELINE',
      features: [
        'Complete development lifecycle',
        'Code generation & modification',
        'Testing & quality assurance',
        'Deployment readiness'
      ],
      recommended: 'Use this for software development and implementation'
    },
    {
      name: 'architect',
      title: '🏗️ SYSTEM ARCHITECTURE',
      features: [
        'Strategic system design',
        'API & interface planning',
        'Scalability architecture',
        'Security-first design'
      ],
      recommended: 'Use this for system design and technical planning'
    },
    {
      name: 'debugger',
      title: '🔍 DEBUGGING & REPAIR',
      features: [
        'Root cause analysis',
        'Error diagnosis & tracing',
        'Targeted fix implementation',
        'Regression prevention'
      ],
      recommended: 'Use this for bug fixing and system troubleshooting'
    },
    {
      name: 'optimizer',
      title: '⚡ PERFORMANCE OPTIMIZATION',
      features: [
        'Performance profiling',
        'Code quality enhancement',
        'Best practices implementation',
        'Efficiency optimization'
      ],
      recommended: 'Use this for code optimization and performance improvement'
    }
  ];

  const handleAgentSelect = (item: { label: string; value: string }) => {
    const selectedAgent = conceptualAgents.find(agent => agent.name === item.value);
    if (selectedAgent) {
      onAgentSelected(selectedAgent);
    }
  };

  const toggleView = () => {
    setShowPipelines(!showPipelines);
  };

  useInput((input) => {
    if (input === 'v' || input === 'V') {
      toggleView();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      {/* Banner */}
      <Text color="green" bold>
        {`
  ╔══════════════════════════════════════════════════════════════════════════════╗
  ║                    GROK CODE FAST - AI AGENT SELECTOR                        ║
  ║                           CONCEPTUAL ORCHESTRATION                          ║
  ╚══════════════════════════════════════════════════════════════════════════════╝
        `}
      </Text>

      {/* Quick Help */}
      <Box borderStyle="single" paddingX={2} paddingY={1} marginY={1}>
        <Text color="cyan" dimColor>
          ═══ SELECT YOUR AI AGENT TYPE ═══
        </Text>
        <Newline />
        <Text color="gray">
          Choose the conceptual agent that matches your task orientation.
          Each agent activates specialized orchestration pipelines optimized for different types of work.
        </Text>
        <Newline />
        <Text color="green">
          💡 Press 'V' to toggle between summary/details view
        </Text>
      </Box>

      {!showPipelines ? (
        /* Summary View - Clean agent selection */
        <Box flexDirection="column">
          <SelectInput items={agentOptions} onSelect={handleAgentSelect} />

          <Box marginTop={1}>
            <Text color="gray" dimColor>
              ↑↓ Navigate • Enter Select • 'V' Toggle View
            </Text>
          </Box>
        </Box>
      ) : (
        /* Detailed Pipeline View */
        <Box flexDirection="column">
          {agentSummaries.map((summary) => {
            const agent = conceptualAgents.find(a => a.name === summary.name);
            if (!agent) return null;

            const isOrchestrator = summary.name === 'orchestrator';

            return (
              <Box
                key={summary.name}
                borderStyle="round"
                borderColor={isOrchestrator ? "green" : "blue"}
                padding={1}
                marginBottom={1}
                flexDirection="column"
              >
                {/* Header with Agent Name and Select */}
                <Box justifyContent="space-between" alignItems="center">
                  <Text color={isOrchestrator ? "green" : "blue"} bold>
                    {summary.title}
                  </Text>
                  <Box>
                    <Text color="cyan">Press </Text>
                    <Text color="yellow" bold>{agentOptions.find(opt => opt.value === summary.name)?.label.charAt(0) || ''}</Text>
                    <Text color="cyan"> to select</Text>
                  </Box>
                </Box>

                {/* Description */}
                <Text color="white" wrap="wrap">
                  {summary.recommended}
                </Text>

                {/* Key Features */}
                <Box marginTop={1}>
                  <Text color="green" bold>Key Features:</Text>
                  {summary.features.map((feature, idx) => (
                    <Box key={idx} marginLeft={2}>
                      <Text color="gray">• {feature}</Text>
                    </Box>
                  ))}
                </Box>

                {/* Pipeline Info */}
                <Box marginTop={1}>
                  <Text color="cyan" dimColor>
                    Pipeline: {agent.pipeline?.toUpperCase() || 'DIRECT CHAT'}
                  </Text>
                </Box>
              </Box>
            );
          })}

          <Box marginTop={1} justifyContent="center">
            <Text color="yellow">
              [Press V to return to simple selection view]
            </Text>
          </Box>
        </Box>
      )}

      {/* Footer Info */}
      <Box borderStyle="single" paddingX={2} paddingY={1} marginTop={2}>
        <Text color="cyan" bold>
          🎯 CONCEPTUAL AGENT SYSTEM
        </Text>
        <Newline />
        <Text color="white">
          Each conceptual agent activates specialized multi-agent pipelines optimized for different types of work.
          You can switch agents anytime during conversation using the "/" command menu.
        </Text>
        <Newline />
        <Text color="green">
          🤖 <Text color="bold">ORCHESTRATOR</Text> - Multi-agent system with intelligent coordination
        </Text>
        <Text color="blue">
          💻 <Text color="bold">CODER</Text> - Full development pipeline from analysis to deployment
        </Text>
        <Newline />
        <Text color="gray" dimColor>
          Global Intelligence Enterprise © 2025 - Enhanced by grok-code-fast-1
        </Text>
      </Box>
    </Box>
  );
};
