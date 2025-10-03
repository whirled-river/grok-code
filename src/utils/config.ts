import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { homedir } from 'os';

const CONFIG_DIR = path.join(homedir(), '.grok-code');
const API_KEY_FILE = path.join(CONFIG_DIR, 'api_key.enc');

class SimpleCrypto {
  private key: Buffer;

  constructor() {
    // Create a machine-specific key derived from hostname + username
    const seed = process.env.USER || 'anonymous';
    this.key = crypto.pbkdf2Sync(seed, 'grok-code-salt-2024', 100000, 32, 'sha256');
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedData: string): string {
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

export function saveApiKey(apiKey: string): void {
  const crypto = new SimpleCrypto();
  const encrypted = crypto.encrypt(apiKey);

  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { mode: 0o700 });
  }

  fs.writeFileSync(API_KEY_FILE, encrypted, { mode: 0o600 });
}

export function loadApiKey(): string | null {
  if (!fs.existsSync(API_KEY_FILE)) {
    return null;
  }

  try {
    const encrypted = fs.readFileSync(API_KEY_FILE, 'utf8');
    const crypto = new SimpleCrypto();
    return crypto.decrypt(encrypted);
  } catch (error) {
    return null;
  }
}

export async function getApiKey(): Promise<string> {
  // Priority: 1. Environment variable, 2. Saved key, 3. Prompt user

  const envKey = process.env.GROK_API_KEY;
  if (envKey) {
    return envKey;
  }

  const storedKey = loadApiKey();
  if (storedKey) {
    return storedKey;
  }

  // If no key found, exit with instructions
  console.error('\nNo Grok API key found!');
  console.error('Set your API key in one of these ways:');
  console.error('1. Environment variable: export GROK_API_KEY="your-key"');
  console.error('2. Or use the interactive setup: bun run setup');
  process.exit(1);
}

export function hasApiKey(): boolean {
  return Boolean(process.env.GROK_API_KEY || loadApiKey());
}
