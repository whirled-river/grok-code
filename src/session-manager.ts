import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';
import { Session, Agent, Message } from './types.js';

const SESSIONS_DIR = path.join(homedir(), '.grok-code', 'sessions');

export class SessionManager {
  private sessions: Map<string, Session> = new Map();

  constructor() {
    this.ensureSessionsDir();
    this.loadAllSessions();
  }

  private ensureSessionsDir(): void {
    if (!fs.existsSync(SESSIONS_DIR)) {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true, mode: 0o700 });
    }
  }

  private loadAllSessions(): void {
    if (!fs.existsSync(SESSIONS_DIR)) return;

    try {
      const sessionFiles = fs.readdirSync(SESSIONS_DIR);
      for (const file of sessionFiles) {
        if (file.endsWith('.json')) {
          const sessionPath = path.join(SESSIONS_DIR, file);
          const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf-8')) as Session;
          // Convert timestamp strings back to Date objects
          sessionData.messages = sessionData.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          this.sessions.set(sessionData.id, sessionData);
        }
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }

  createSession(agent: Agent): Session {
    const session: Session = {
      id: `${agent.name}_${Date.now()}`,
      agent: agent,
      messages: [{
        role: 'system',
        content: agent.systemPrompt,
        timestamp: new Date()
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.sessions.set(session.id, session);
    this.saveSession(session);
    return session;
  }

  getSessionsForAgent(agentName: string): Session[] {
    return Array.from(this.sessions.values())
      .filter(session => session.agent.name === agentName)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  updateSession(session: Session, newMessage?: Message): void {
    session.updatedAt = new Date();
    if (newMessage) {
      session.messages.push(newMessage);
    }
    this.saveSession(session);
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    const sessionPath = path.join(SESSIONS_DIR, `${sessionId}.json`);
    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath);
    }
  }

  private saveSession(session: Session): void {
    const sessionPath = path.join(SESSIONS_DIR, `${session.id}.json`);
    try {
      fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2), { mode: 0o600 });
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  getAllSessions(): Session[] {
    return Array.from(this.sessions.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
}
