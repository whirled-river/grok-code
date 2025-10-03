import React, { useState } from 'react';
import { Box, Text, Newline } from 'ink';
import TextInput from 'ink-text-input';
import { saveApiKey } from '../utils/config.js';

interface SetupProps {
  onComplete: () => void;
}

export const Setup: React.FC<SetupProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'info' | 'input'>('info');
  const [apiKey, setApiKey] = useState('');

  const handleInfoConfirm = () => {
    setStep('input');
  };

  const handleKeySubmit = (key: string) => {
    if (key.trim()) {
      saveApiKey(key.trim());
      onComplete();
    }
  };

  if (step === 'info') {
    return (
      <Box flexDirection="column">
        <Text bold color="cyan">🔑 Grok API Key Setup</Text>
        <Newline />
        <Text>
          Welcome to Grok Code! To use this tool, you need a Grok API key from xAI.
        </Text>
        <Newline />
        <Text>Get one at: https://www.x.ai/api</Text>
        <Newline />
        <Text>Your API key will be encrypted and stored locally in ~/.grok-code/</Text>
        <Text>Press Enter to continue...</Text>
        <TextInput value="" onChange={() => {}} onSubmit={handleInfoConfirm} placeholder="Press Enter" />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold>Enter your Grok API key:</Text>
      <Text dimColor>⚠️  Make sure it's correct - this will be saved locally</Text>
      <Newline />
      <TextInput
        value={apiKey}
        onChange={setApiKey}
        onSubmit={handleKeySubmit}
        placeholder="xai-xxxxxxxxxxxxxxxx"
        mask="*"
      />
      <Newline />
      <Text dimColor>API Key will be encrypted and stored securely</Text>
    </Box>
  );
};
