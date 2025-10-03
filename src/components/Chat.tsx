import React, { useState, useEffect, memo } from 'react';
import { Box, Text, Newline, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { Agent, Message, Session } from '../types.js';
import { GrokApiClient } from '../api/grok-api.js';
import { safeExecCommand } from '../utils/exec.js';
import { SessionManager } from '../session-manager.js';
import { AgentManager } from '../agent-manager.js';
import { FileTools } from '../utils/file-tools.js';

interface ChatProps {
  agent: Agent;
  apiClient: GrokApiClient;
  autonomous?: boolean;
  onAgentSwitch?: (newAgent: Agent) => Promise<void>;
}

export const Chat: React.FC<ChatProps> = ({ agent, apiClient, autonomous = false, onAgentSwitch }) => {
  const header_art = `
  GROK-CODE-FAST-1 TERMINAL AGENT v2.0 - ULTRA-FAST AI POWERED
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  const footer_art = ` Press '/' to access COMMAND PALETTE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: '**Welcome to the Grok Code Fast Terminal Agent**\n\n' +
               `I'm *${agent.name}*, ready to help with ${agent.description.toLowerCase()}.\n\n` +
               'I can:\n' +
               '• Answer questions and provide information\n' +
               (agent.fileTools?.enabled ? '• Read, write, and analyze files on your system\n' : '') +
               '• Execute terminal commands safely\n' +
               '• Learn from our conversation\n\n' +
               'Try asking me about:\n' +
               (agent.name === 'coder' ? '• "What patterns do I see in this codebase?"\n• "Help me refactor this function"\n' : '') +
               (agent.name === 'agentic-coder' ? '• "Build a complete Node.js API"\n• "Analyze this project and suggest improvements"\n' : '') +
               (agent.name === 'planner' ? '• "Plan a microservices architecture"\n• "Estimate project timeline for X features"\n' : '') +
               (agent.name === 'idiomatic-go' ? '• "Design a high-performance Go service"\n• "Refactor this code for better concurrency"\n' : '') +
               '\nCommands: Press "/" for the command palette anytime',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  const [commandExecuted, setCommandExecuted] = useState(false);
  const [commandOutput, setCommandOutput] = useState<string>('');
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessionManager] = useState(() => new SessionManager());
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [showSessionSelector, setShowSessionSelector] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [agentManager] = useState(() => new AgentManager());
  const [fileTools, setFileTools] = useState<FileTools | null>(null);
  const [pendingFileOp, setPendingFileOp] = useState<{type: string, path: string, content?: string} | null>(null);
  const [fileOpResult, setFileOpResult] = useState<string>('');
  const [showResponseModes, setShowResponseModes] = useState(false);
  const [autoModeActive, setAutoModeActive] = useState(false);
  const [lastAssistantMessage, setLastAssistantMessage] = useState<Message | null>(null);
  const [currentMode, setCurrentMode] = useState<'thinking' | 'planning' | 'execution'>('execution');

  const modeOptions = [
    {
      label: 'Thinking Mode - Deep analysis and step-by-step reasoning',
      value: 'thinking'
    },
    {
      label: 'Planning Mode - Strategy and project planning focus',
      value: 'planning'
    },
    {
      label: 'Execution Mode - Direct action and task completion',
      value: 'execution'
    }
  ];

  const responseModeOptions = [
    {
      label: 'Continue - Business as usual',
      value: 'continue'
    },
    {
      label: 'Auto-complete - Let agent finish work (ESC to stop)',
      value: 'auto'
    },
    {
      label: 'Wait - Manual control for next response',
      value: 'wait'
    }
  ];

  const commands = [
    {
      label: '/help - Show available commands',
      value: 'help'
    },
    {
      label: '/conceptual-agents - Switch conceptual agent orientation (orchestrator/coder/architect/debugger/optimizer)',
      value: 'conceptual-agents'
    },
    {
      label: '/sessions - Load previous conversations',
      value: 'sessions'
    },
    {
      label: '/mode - Switch thinking mode (thinking/planning/execution)',
      value: 'mode'
    },
    {
      label: '/config - Configure current agent',
      value: 'config'
    },
    {
      label: '/save - Manually save session',
      value: 'save'
    },
    {
      label: '/export - Export conversation as markdown',
      value: 'export'
    },
    {
      label: '/clear - Clear current conversation',
      value: 'clear'
    },
    {
      label: '/exit - Return to main menu',
      value: 'exit'
    }
  ];

  const handleCommandSelect = (item: { label: string; value: string }) => {
    setShowCommandPalette(false);

    switch (item.value) {
      case 'help':
        setMessages(prev => [...prev, {
          role: 'system',
          content: 'Available commands:\n' + commands.map(cmd => cmd.label).join('\n'),
          timestamp: new Date()
        }]);
        break;
      case 'conceptual-agents':
        // Show conceptual agent selector (this switches the actual agent/pipeline)
        showConceptualAgentSelector();
        break;
      case 'sessions':
        setShowSessionSelector(true);
        break;
      case 'mode':
        setShowModeSelector(true);
        break;
      case 'save':
        if (currentSession) {
          sessionManager.updateSession(currentSession);
          setMessages(prev => [...prev, {
            role: 'system',
            content: 'Session saved successfully',
            timestamp: new Date()
          }]);
        }
        break;
      case 'export':
        const markdown = messages.slice(1).map(msg =>
          `**${msg.role === 'user' ? 'You' : agent.name}:**\n${msg.content}\n`
        ).join('\n---\n\n');
        console.log('\n' + markdown); // Export to terminal
        setMessages(prev => [...prev, {
          role: 'system',
          content: 'Conversation exported to terminal output',
          timestamp: new Date()
        }]);
        break;
      case 'clear':
        setMessages([messages[0]]); // Keep only system message
        break;
      case 'config':
        setMessages(prev => [...prev, {
          role: 'system',
          content: `Current conceptual agent: ${agent.name.toUpperCase()}\nDescription: ${agent.description}\nCapabilities: ${agent.capabilities?.join(', ') || 'general'}\nPipeline: ${agent.pipeline || 'Direct chat'}\nSystem Prompt: ${agent.systemPrompt.slice(0, 100)}...`,
          timestamp: new Date()
        }]);
        break;
      case 'exit':
        process.exit(0);
        break;
    }
  };

  const showConceptualAgentSelector = () => {
    // Display available conceptual agents for selection
    const { conceptualAgents } = require('../default-agents.js');

    const agentOptions = conceptualAgents.map(agent => ({
      label: `${agent.name.toUpperCase()} 🚀`,
      value: agent.name
    }));

    setMessages(prev => [...prev, {
      role: 'system',
      content: '🎯 **CONCEPTUAL AGENT SELECTION** 🎯\n\n' +
               'Current agent: ' + agent.name.toUpperCase() + '\n\n' +
               '**Available conceptual agents:**\n\n' +
               conceptualAgents.map((agent, idx) =>
                 `${idx + 1}. **${agent.name.toUpperCase()}**\n` +
                 `   ${agent.description}\n` +
                 `   Pipeline: ${agent.pipeline || 'Direct chat'}\n`
               ).join('\n') + '\n\n' +
               '**Type an agent name to switch (orchestrator, coder, architect, debugger, optimizer):**',
      timestamp: new Date()
    }]);

    // Set up listening for the next input to capture agent selection
    setCommandPalettePrompt(true); // Flag to indicate we're waiting for conceptual agent selection
  };

  const [commandPalettePrompt, setCommandPalettePrompt] = useState(false);

  const handleAgentSelect = (selectedAgent: Agent) => {
    setShowAgentSelector(false);
    // In a full implementation, this would switch to the selected agent
    // For now, just show that it's selected
    setMessages(prev => [...prev, {
      role: 'system',
      content: `Agent "${selectedAgent.name}" selected. In full implementation, this would switch the current agent.`,
      timestamp: new Date()
    }]);
  };

  const handleSessionSelect = (selectedSession: Session) => {
    setShowSessionSelector(false);
    // Load the selected session
    setMessages(selectedSession.messages);
    setCurrentSession(selectedSession);
    setMessages(prev => [...prev, {
      role: 'system',
      content: `Loaded session from ${selectedSession.createdAt.toLocaleString()}`,
      timestamp: new Date()
    }]);
  };

  // Create session on mount
  useEffect(() => {
    // Clear screen on startup
    console.clear();

    const session = sessionManager.createSession(agent);
    setCurrentSession(session);
    setMessages(session.messages);

    // Initialize file tools if agent has them configured
    if (agent.fileTools?.enabled) {
      setFileTools(new FileTools(agent.fileTools.permissions));
    }
  }, []);

  // Save session when messages change
  useEffect(() => {
    if (currentSession && messages.length > 1) { // Don't save empty sessions
      // Update currentSession with latest messages
      currentSession.messages = messages;
      sessionManager.updateSession(currentSession);
    }
  }, [messages]);

  // Execute pending file operations
  useEffect(() => {
    const executeFileOperation = async () => {
      if (!pendingFileOp || !fileTools) return;

      try {
        let result: string;

        switch (pendingFileOp.type) {
          case 'read':
            result = await fileTools.readFile(pendingFileOp.path);
            break;
          case 'write':
            const writeResult = await fileTools.safeWriteFile(pendingFileOp.path, pendingFileOp.content || '');
            result = `File written successfully${writeResult.backupCreated ? ` (backup: ${writeResult.backupCreated})` : ''}`;
            break;
          case 'list':
            const files = await fileTools.listDirectory(pendingFileOp.path);
            result = `Directory contents:\n${files.join('\n')}`;
            break;
          case 'info':
            const stats = await fileTools.getFileInfo(pendingFileOp.path);
            result = `File info:
Size: ${stats.size} bytes
Modified: ${stats.mtime.toLocaleString()}
Permissions: ${stats.mode}`;
            break;
          default:
            result = 'Unknown file operation type';
        }

        setFileOpResult(result);
        setMessages(prev => [...prev, {
          role: 'system',
          content: `[${pendingFileOp.type.toUpperCase()}] ${pendingFileOp.path}:\n${result}`,
          timestamp: new Date()
        }]);

      } catch (error: any) {
        setFileOpResult(`Error: ${error.message}`);
        setMessages(prev => [...prev, {
          role: 'system',
          content: `[${pendingFileOp.type.toUpperCase()}] ${pendingFileOp.path}:\nError: ${error.message}`,
          timestamp: new Date()
        }]);
      }

      setPendingFileOp(null);
    };

    if (pendingFileOp && fileTools) {
      executeFileOperation();
    }
  }, [pendingFileOp, fileTools]);

  const executeCommand = async (command: string) => {
    setCommandExecuted(true);
    try {
      const result = await safeExecCommand(command);
      setCommandOutput(result.success ? result.output : `Error: ${result.output}`);
      // Add command result as a system message
      const commandMessage: Message = {
        role: 'system',
        content: `Command executed: ${command}\n${result.success ? 'Success' : 'Failed'}: ${result.output}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, commandMessage]);
    } catch (error) {
      setCommandOutput(`Failed to execute: ${error instanceof Error ? error.message : error}`);
    }
    setPendingCommand(null);
  };

  const declineCommand = () => {
    setPendingCommand(null);
    setCommandExecuted(false);
  };

  const handleInput = (value: string) => {
    // Handle conceptual agent selection input
    if (commandPalettePrompt) {
      handleConceptualAgentInput(value);
      return;
    }

    if (value === '/' && !showCommandPalette) {
      setShowCommandPalette(true);
      setInput('');
      return;
    }
    setInput(value);
  };

  const handleConceptualAgentInput = async (agentName: string) => {
    const { conceptualAgents } = require('../default-agents.js');
    const selectedAgent = conceptualAgents.find((a: Agent) => a.name.toLowerCase() === agentName.toLowerCase());

    setCommandPalettePrompt(false);
    setInput('');

    if (!selectedAgent) {
      setMessages(prev => [...prev, {
        role: 'system',
        content: `❌ Agent "${agentName}" not found. Available agents: ${conceptualAgents.map((a: Agent) => a.name).join(', ')}`,
        timestamp: new Date()
      }]);
      return;
    }

    if (!onAgentSwitch) {
      setMessages(prev => [...prev, {
        role: 'system',
        content: `⚠️ Agent switching not available in this context. Please use the agent selector at startup.`,
        timestamp: new Date()
      }]);
      return;
    }

    setMessages(prev => [...prev, {
      role: 'system',
      content: `🌀 Switching to ${selectedAgent.name.toUpperCase()} agent...\n\n${selectedAgent.description}\n\nPipeline: ${selectedAgent.pipeline || 'Direct chat'}`,
      timestamp: new Date()
    }]);

    try {
      await onAgentSwitch(selectedAgent);
      setMessages(prev => [...prev, {
        role: 'system',
        content: `✅ Successfully switched to ${selectedAgent.name.toUpperCase()}!\n\nThe ${selectedAgent.name} agent is now active with the following capabilities:\n• ${selectedAgent.capabilities?.join('\n• ') || 'General assistance'}\n\n${selectedAgent.name === 'orchestrator' ? '🤖 I will now orchestrate multiple specialized agents to handle your requests intelligently.' : ''}${selectedAgent.name === 'coder' ? '💻 I will now execute comprehensive code development pipelines.' : ''}${selectedAgent.name === 'architect' ? '🏗️ I will now focus on system design and architecture planning.' : ''}${selectedAgent.name === 'debugger' ? '🔍 I will now perform comprehensive debugging and repair operations.' : ''}${selectedAgent.name === 'optimizer' ? '⚡ I will now focus on performance optimization and code quality improvement.' : ''}`,
        timestamp: new Date()
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'system',
        content: `❌ Failed to switch agent: ${error.message}`,
        timestamp: new Date()
      }]);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await apiClient.chat({
        messages: [...messages, userMessage].map(m => ({
          role: m.role,
          content: m.content
        })),
        model: 'grok-code-fast-1'
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setLastAssistantMessage(assistantMessage);
      setShowResponseModes(true);

      // Handle [EXEC] commands if agent has execute permissions (either autonomous or agent capabilities)
      if (response.includes('[EXEC]')) {
        const execCommand = extractExecCommand(response);
        if (execCommand && agent.fileTools?.permissions.allowExec) {
          // Execute immediately since agent requested it and has permissions
          setPendingCommand(execCommand);
        }
      }

      // Handle file operations: look for [READ], [WRITE], [LIST], [INFO] commands
      // Process multiple file operations in sequence for agentic behavior
      if (fileTools && response.includes('[')) {
        const operations = extractMultipleFileOperations(response);
        if (operations.length > 0) {
          // Execute operations one by one for better UX
          setPendingFileOp(operations[0]);
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const extractExecCommand = (response: string): string | null => {
    const match = response.match(/\[EXEC\](.*?)\[\/EXEC\]/)?.[1] || response.match(/\[EXEC\](.*)/)?.[1];
    return match?.trim() || null;
  };

  const extractFileOperation = (response: string): {type: string, path: string, content?: string} | null => {
    // Look for [READ]filename.ext
    const readMatch = response.match(/\[READ\]([^\s\]]*)/);
    if (readMatch) {
      return { type: 'read', path: readMatch[1] };
    }

    // Look for [WRITE]filename.ext + captured content (if any)
    const writeMatch = response.match(/\[WRITE\]([^\s\]]*)\s*([\s\S]*?)$/);
    if (writeMatch) {
      return {
        type: 'write',
        path: writeMatch[1],
        content: writeMatch[2]?.trim() || 'Hello World'
      };
    }

    // Look for [LIST]directory/
    const listMatch = response.match(/\[LIST\]([^\s\]]*)/);
    if (listMatch) {
      return { type: 'list', path: listMatch[1] };
    }

    // Look for [INFO]filename.ext
    const infoMatch = response.match(/\[INFO\]([^\s\]]*)/);
    if (infoMatch) {
      return { type: 'info', path: infoMatch[1] };
    }

    return null;
  };

  const extractMultipleFileOperations = (response: string): Array<{type: string, path: string, content?: string}> => {
    const operations: Array<{type: string, path: string, content?: string}> = [];
    const patterns = [
      { regex: /\[READ\]([^\s\]]*)/g, type: 'read' },
      { regex: /\[LIST\]([^\s\]]*)/g, type: 'list' },
      { regex: /\[INFO\]([^\s\]]*)/g, type: 'info' },
      { regex: /\[WRITE\]([^\s\]]*)\s*([\s\S]*?)(?=\[WRITE\]|\[READ\]|\[LIST\]|\[INFO\]|\[EXEC\]|$)/g, type: 'write' }
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.regex.exec(response)) !== null) {
        if (pattern.type === 'write') {
          operations.push({
            type: pattern.type,
            path: match[1],
            content: match[2]?.trim() || 'Hello World'
          });
        } else {
          operations.push({
            type: pattern.type,
            path: match[1]
          });
        }
      }
    }

    return operations;
  };

  const handleSubmit = () => {
    sendMessage(input);
  };

  useInput((input, key) => {
    // Handle ESC key across all modes
    if (key.escape) {
      if (autoModeActive) {
        setAutoModeActive(false);
        setShowResponseModes(true);
        return;
      }
      if (showCommandPalette) {
        setShowCommandPalette(false);
        return;
      }
      if (showAgentSelector) {
        setShowAgentSelector(false);
        return;
      }
      if (showSessionSelector) {
        setShowSessionSelector(false);
        return;
      }
      if (showModeSelector) {
        setShowModeSelector(false);
        return;
      }
    }

    if (pendingCommand) {
      // Handle command execution input
      if (input === 'y' || input === 'Y') {
        executeCommand(pendingCommand);
      } else if (input === 'n' || input === 'N') {
        declineCommand();
      }
    } else if (key.return && !showResponseModes && !autoModeActive) {
      handleSubmit();
    }
  });

  return (
    <Box flexDirection="column" height="100%" width={100}>
      {/* Matrix-style header */}
      <Text color="green">{header_art}</Text>

      {/* Agent info bar - compact */}
      <Box borderStyle="single" paddingX={1} paddingY={0} width={100}>
        <Text color="green" bold>
          AGENT: {agent.name.toUpperCase()} | STATUS: {autonomous ? 'AUTO' : 'MANUAL'} | '/'
        </Text>
      </Box>

      {/* Chat messages area - 3x taller for better initial display */}
      <Box borderStyle="round" flexDirection="column" flexGrow={3} paddingX={1} paddingY={0} width={100}>
        <Text color="gray" dimColor>
          {agent.description}
        </Text>
        <Newline />

        <Box flexDirection="column" flexGrow={1} paddingX={1}>
          {messages.map((msg, index) => (
            <Box key={index} marginY={0.5}>
              <Text color={msg.role === 'user' ? 'cyan' : 'green'} bold>
                {msg.role === 'user' ? '╭─ YOU:' : `╭─ ${agent.name.toUpperCase()}:`}
              </Text>
              <Newline />
              <Text color={msg.role === 'user' ? 'cyan' : 'green'} wrap="wrap">
                {'  │ ' + msg.content.split('\n').join('\n  │ ')}
              </Text>
              <Newline />
              <Text color="gray" dimColor>
                {msg.role === 'user' ? '╰─ HUMAN' : `╰─ ${agent.name.toUpperCase()}`}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Compact command suggestion area */}
      {pendingCommand && (
        <Box borderStyle="single" borderColor="yellow" paddingX={1} paddingY={0} width={100}>
          <Text color="yellow">COMMAND DETECTED: {pendingCommand} [Y/N]</Text>
          {commandExecuted && commandOutput && (
            <Text color={commandOutput.includes('Error') ? 'red' : 'green'}>
              RESULT: {commandOutput.length > 50 ? commandOutput.slice(0, 47) + '...' : commandOutput}
            </Text>
          )}
        </Box>
      )}

      {/* Compact command palette */}
      {showCommandPalette && (
        <Box borderStyle="single" borderColor="green" paddingX={1} paddingY={0} width={100} flexDirection="column">
          <Text color="green">COMMANDS - UP DOWN TO SELECT, ENTER TO EXECUTE, ESC TO CANCEL</Text>
          <SelectInput items={commands} onSelect={handleCommandSelect} />
        </Box>
      )}

      {/* Compact agent selector */}
      {showAgentSelector && (
        <Box borderStyle="single" borderColor="green" paddingX={1} paddingY={0} width={100} flexDirection="column">
          <Text color="green">SELECT AGENT</Text>
          <SelectInput
            items={agentManager.getAllAgents().map(agent => ({
              label: `${agent.name}: ${agent.description}`,
              value: agent
            }))}
            onSelect={(item) => handleAgentSelect(item.value)}
          />
        </Box>
      )}

      {/* Compact session selector */}
      {showSessionSelector && (
        <Box borderStyle="single" borderColor="green" paddingX={1} paddingY={0} width={100} flexDirection="column">
          <Text color="green">LOAD SESSION</Text>
          {sessionManager.getSessionsForAgent(agent.name).length > 0 ? (
            <SelectInput
              items={sessionManager.getSessionsForAgent(agent.name).map(session => ({
                label: `${session.updatedAt.toDateString()} (${session.messages.length - 1} msgs)`,
                value: session
              }))}
              onSelect={(item) => handleSessionSelect(item.value)}
            />
          ) : (
            <Text color="gray">No sessions found</Text>
          )}
        </Box>
      )}

      {/* Mode selector */}
      {showModeSelector && (
        <Box borderStyle="single" borderColor="blue" paddingX={1} paddingY={0} width={100} flexDirection="column">
          <Text color="blue" bold>MODE SELECTOR - Current: {currentMode.toUpperCase()}</Text>
          <Text color="green">Choose how the agent should approach problem-solving:</Text>
          <Text color="cyan">
            THINKING: Deep analysis with step-by-step reasoning
            PLANNING: Strategic planning and long-term vision
            EXECUTION: Direct action and rapid implementation
          </Text>
          <SelectInput
            items={modeOptions}
            onSelect={(item) => {
              setShowModeSelector(false);
              setCurrentMode(item.value as 'thinking' | 'planning' | 'execution');
              setMessages(prev => [...prev, {
                role: 'system',
                content: `Mode switched to ${item.value.toUpperCase()}. Agent behavior has been updated.`,
                timestamp: new Date()
              }]);
            }}
          />
        </Box>
      )}

      {/* Response mode selector */}
      {showResponseModes && !autoModeActive && (
        <Box borderStyle="single" borderColor="green" paddingX={1} paddingY={0} width={100} flexDirection="column">
          <Text color="green" bold>RESPONSE MODE SELECTION</Text>
          <Text color="green">Agent has responded. Choose next action:</Text>
          <SelectInput
            items={responseModeOptions}
            onSelect={(item) => {
              setShowResponseModes(false);
              if (item.value === 'auto') {
                setAutoModeActive(true);
              }
            }}
          />
        </Box>
      )}

      {/* Auto mode indicator */}
      {autoModeActive && (
        <Box borderStyle="bold" borderColor="red" paddingX={1} paddingY={0} width={100}>
          <Text color="red">
            AUTO MODE ACTIVE - AGENT WORKING AUTONOMOUSLY - PRESS ESC TO INTERRUPT
          </Text>
        </Box>
      )}

      {/* Compact input area */}
      <Box borderStyle="single" paddingX={1} paddingY={0} width={100}>
        {isTyping ? (
          <Text color="green" dimColor>
            ░░░ AGENT IS ANALYZING ░░░
          </Text>
        ) : showResponseModes || autoModeActive ? (
          <Text color="gray">Waiting for response mode selection...</Text>
        ) : (
          <>
            <Text color="green">Input Query:</Text>
            <TextInput
              value={input}
              onChange={handleInput}
              placeholder="Enter your message or press '/' for commands..."
              showCursor={true}
            />
          </>
        )}
      </Box>

      {/* Matrix-style footer */}
      <Text color="green">{footer_art}</Text>
    </Box>
  );
};

export default Chat;
