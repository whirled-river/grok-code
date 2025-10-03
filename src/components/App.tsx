import React, { useState } from 'react';
import { ConceptualAgentSelector } from './ConceptualAgentSelector.js';
import { Chat } from './Chat.js';
import { Agent } from '../types.js';
import { GrokApiClient } from '../api/grok-api.js';
import { getApiKey } from '../utils/config.js';

interface AppProps {
  initialApiKey?: string;
}

export const App: React.FC<AppProps> = ({ initialApiKey }) => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [apiClient, setApiClient] = useState<GrokApiClient | null>(null);

  const handleAgentSelected = async (agent: Agent) => {
    let apiKey = initialApiKey;

    if (!apiKey) {
      try {
        apiKey = await getApiKey();
      } catch (error) {
        console.error('Failed to get API key:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    }

    const client = new GrokApiClient(apiKey);
    setSelectedAgent(agent);
    setApiClient(client);
  };

  const handleAgentSwitch = async (newAgent: Agent) => {
    if (!newAgent) return;

    let apiKey = initialApiKey;

    if (!apiKey) {
      try {
        apiKey = await getApiKey();
      } catch (error) {
        console.error('Failed to get API key for agent switch:', error instanceof Error ? error.message : error);
        return;
      }
    }

    const client = new GrokApiClient(apiKey);
    setSelectedAgent(newAgent);
    setApiClient(client);
  };

  // Show agent selector if no agent is selected
  if (!selectedAgent || !apiClient) {
    return <ConceptualAgentSelector onAgentSelected={handleAgentSelected} />;
  }

  // Show chat interface with selected agent
  return (
    <Chat
      agent={selectedAgent}
      apiClient={apiClient}
      onAgentSwitch={handleAgentSwitch}
    />
  );
};
