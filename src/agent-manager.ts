import * as fs from 'fs';
import * as path from 'path';
import { Agent, AgentConfig } from './types.js';
import { defaultAgents } from './default-agents.js';

const CONFIG_FILE = path.join(process.cwd(), 'agents.json');

export class AgentManager {
  private agents: Map<string, Agent>;

  constructor() {
    this.agents = new Map();
    this.loadAgents();
  }

  private loadAgents(): void {
    // Load default agents
    defaultAgents.forEach(agent => {
      this.agents.set(agent.name, agent);
    });

    // Load custom agents if config file exists
    if (fs.existsSync(CONFIG_FILE)) {
      try {
        const config: AgentConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        config.agents.forEach(agent => {
          this.agents.set(agent.name, agent);
        });
      } catch (error) {
        console.error('Error loading custom agents:', error);
      }
    }
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getAgent(name: string): Agent | undefined {
    return this.agents.get(name);
  }

  addAgent(agent: Agent): void {
    this.agents.set(agent.name, agent);
    this.saveCustomAgents();
  }

  removeAgent(name: string): void {
    if (!defaultAgents.find(a => a.name === name)) {
      this.agents.delete(name);
      this.saveCustomAgents();
    } else {
      throw new Error('Cannot remove default agents');
    }
  }

  private saveCustomAgents(): void {
    const customAgents = Array.from(this.agents.values()).filter(agent =>
      !defaultAgents.find(defaultAgent => defaultAgent.name === agent.name)
    );

    const config: AgentConfig = { agents: customAgents };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  }
}
