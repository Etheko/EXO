import { TerminalProgram, ProgramContext } from "./ProgramTypes";
import initSequence from "../InitializationSequence.txt?raw";

// Utility sleep helper (duplicate to avoid shared dependency)
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ExoProgram: TerminalProgram = {
  id: "exo",
  displayName: "EXO Intro",
  aliases: ["exo"],
  clear: true,
  run: async (_args: string[], context: ProgramContext) => {
    // Clear existing output first
    context.clearOutput();
    context.setPromptEnabled(false);

    const linesSrc = initSequence.split(/\r?\n/);
    for (const line of linesSrc) {
      const rendered = line.trim() === "" ? "\u00A0" : line;
      context.appendLines([{ id: context.getNextId(), text: rendered, isInitLine: true }]);
      await sleep(80);
    }

    context.setPromptEnabled(true);

    // Animation finished – prompt re-enabled, no automatic command.
  },
};

export default ExoProgram; 