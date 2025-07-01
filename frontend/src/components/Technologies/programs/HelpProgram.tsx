import { TerminalProgram, ProgramContext, OutputLine } from "./ProgramTypes";

const HelpProgram: TerminalProgram = {
  id: "help",
  displayName: "Help",
  aliases: ["help", "?"],
  clear: false,
  run: async (_args: string[], context: ProgramContext) => {
    const lines: OutputLine[] = [
      "Available commands:",
      "  help            – display this message",
      "  clear           – clear the screen",
      "  technologies    – list technologies alphabetically",
      "  resolution <n>  – set ASCII art width (10-100)",
      "  exo             – restart the console intro",
      "  back            – go back to previous program",
    ].map((t) => ({ id: context.getNextId(), text: t }));

    context.appendLines(lines);
  },
};

export default HelpProgram; 