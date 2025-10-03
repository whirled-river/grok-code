import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

export interface FileToolPermissions {
  readPaths: string[];
  writePaths: string[];
  allowExec: boolean;
}

export class FileTools {
  private permissions: FileToolPermissions;

  constructor(permissions: FileToolPermissions) {
    this.permissions = permissions;
  }

  private isPathAllowed(filePath: string, allowedPaths: string[]): boolean {
    const normalizedPath = path.resolve(filePath);

    // Check if the path is allowed by checking if it starts with any allowed path
    return allowedPaths.some(allowedPath => {
      const normalizedAllowed = path.resolve(allowedPath);
      return normalizedPath.startsWith(normalizedAllowed);
    });
  }

  async readFile(filePath: string): Promise<string> {
    if (!this.isPathAllowed(filePath, this.permissions.readPaths)) {
      throw new Error(`Permission denied: Cannot read from path ${filePath}`);
    }

    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error: any) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    if (!this.isPathAllowed(filePath, this.permissions.writePaths)) {
      throw new Error(`Permission denied: Cannot write to path ${filePath}`);
    }

    try {
      // Create directory if it doesn't exist
      const dir = path.dirname(filePath);
      fs.mkdirSync(dir, { recursive: true });

      fs.writeFileSync(filePath, content, 'utf-8');
    } catch (error: any) {
      throw new Error(`Failed to write file ${filePath}: ${error.message}`);
    }
  }

  async listDirectory(dirPath: string): Promise<string[]> {
    if (!this.isPathAllowed(dirPath, this.permissions.readPaths)) {
      throw new Error(`Permission denied: Cannot list directory ${dirPath}`);
    }

    try {
      return fs.readdirSync(dirPath);
    } catch (error: any) {
      throw new Error(`Failed to list directory ${dirPath}: ${error.message}`);
    }
  }

  async getFileInfo(filePath: string): Promise<fs.Stats> {
    if (!this.isPathAllowed(filePath, this.permissions.readPaths)) {
      throw new Error(`Permission denied: Cannot access file ${filePath}`);
    }

    try {
      return fs.statSync(filePath);
    } catch (error: any) {
      throw new Error(`Failed to get file info ${filePath}: ${error.message}`);
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    if (!this.isPathAllowed(filePath, this.permissions.readPaths)) {
      return false; // Treat as if it doesn't exist for security
    }

    try {
      return fs.existsSync(filePath);
    } catch (error) {
      return false;
    }
  }

  // Safe file operation that checks if write is destructive
  async safeWriteFile(filePath: string, content: string): Promise<{ success: boolean; backupCreated?: string }> {
    if (!this.isPathAllowed(filePath, this.permissions.writePaths)) {
      throw new Error(`Permission denied: Cannot write to path ${filePath}`);
    }

    try {
      const exists = fs.existsSync(filePath);

      if (exists) {
        // Create backup
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
        fs.writeFileSync(filePath, content, 'utf-8');
        return { success: true, backupCreated: backupPath };
      } else {
        fs.writeFileSync(filePath, content, 'utf-8');
        return { success: true };
      }
    } catch (error: any) {
      throw new Error(`Failed to write file safely ${filePath}: ${error.message}`);
    }
  }

  getPermissions(): FileToolPermissions {
    return { ...this.permissions };
  }

  updatePermissions(newPermissions: Partial<FileToolPermissions>): void {
    this.permissions = {
      ...this.permissions,
      ...newPermissions,
      readPaths: newPermissions.readPaths || this.permissions.readPaths,
      writePaths: newPermissions.writePaths || this.permissions.writePaths,
      allowExec: newPermissions.allowExec ?? this.permissions.allowExec
    };
  }
}

// Default safe permissions
export function getDefaultPermissions(): FileToolPermissions {
  return {
    readPaths: [homedir(), '.'].map(p => path.resolve(p)),
    writePaths: [path.join(homedir(), 'tmp'), '/tmp'].map(p => path.resolve(p)),
    allowExec: false
  };
}
