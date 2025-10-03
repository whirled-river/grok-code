import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function safeExecCommand(command: string): Promise<{success: boolean, output: string}> {
  try {
    const { stdout, stderr } = await execAsync(command);
    return { success: true, output: stdout + stderr };
  } catch (error: any) {
    return { success: false, output: error.message };
  }
}
