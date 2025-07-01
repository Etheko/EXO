export interface OutputLine {
  id: number;
  text: string;
  isInitLine?: boolean;
  technology?: any; // Keep generic to avoid circular dependency
  isAsciiLine?: boolean;
  html?: string;
  linkUrl?: string;
  isBackLine?: boolean;
}

export interface ProgramContext {
  /** Append new lines to current output (keeps existing content) */
  appendLines: (lines: OutputLine[]) => void;
  /** Replace current output entirely */
  setOutput: (lines: OutputLine[]) => void;
  /** Utility to clear output */
  clearOutput: () => void;
  /** Current ASCII width */
  asciiWidth: number;
  /** Setter for ASCII width */
  setAsciiWidth: (w: number) => void;
  /** Enable/disable prompt (used for animations) */
  setPromptEnabled: (enabled: boolean) => void;
  /** Execute another command programmatically */
  executeCommand: (cmd: string) => Promise<void>;
  /** Track first technologies run */
  technologiesExecutedOnce: boolean;
  /** Mark technologies as executed */
  markTechnologiesExecuted: () => void;
  /** Generate a globally unique id for output lines */
  getNextId: () => number;
}

export interface TerminalProgram {
  /** Unique identifier */
  id: string;
  /** Human-friendly name for display in back line */
  displayName?: string;
  /** Command aliases */
  aliases: string[];
  /** Should clear the terminal before running? */
  clear: boolean;
  /** Program entry point */
  run: (args: string[], context: ProgramContext) => Promise<void>;
} 