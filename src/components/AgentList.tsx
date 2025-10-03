import React, { useState, useEffect } from 'react';
import { Box, Text, Newline, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { AgentManager } from '../agent-manager.js';
import { Agent } from '../types.js';

interface AgentListProps {
  mode?: 'select' | 'config';
  onSelect?: (agent: Agent) => void;
}

export const AgentList: React.FC<AgentListProps> = ({ mode = 'select', onSelect }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const manager = new AgentManager();
    const allAgents = manager.getAllAgents();
    setAgents(allAgents);
    setLoading(false);
  }, []);

  const selectItems = agents.map(agent => ({
    label: `${agent.name} - ${agent.description}`,
    value: agent,
  }));

  const handleSelect = (item: { label: string; value: Agent }) => {
    if (onSelect) {
      onSelect(item.value);
    } else {
      // Default action: just show info
      console.log(`Selected agent: ${item.value.name}`);
    }
  };

  if (loading) {
    return (
      <Box flexDirection="column">
        <Text>Loading agents...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold>Available Agents</Text>
      <Newline />
      <SelectInput items={selectItems} onSelect={handleSelect} />
      <Newline />
      <Text dimColor>Use arrow keys to select, Enter to confirm</Text>
    </Box>
  );
};
