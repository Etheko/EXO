import { TerminalProgram, ProgramContext, OutputLine } from "./ProgramTypes";

const HelpProgram: TerminalProgram = {
  id: "info",
  displayName: "Info",
  aliases: ["info", "help", "?"],
  clear: false,
  run: async (_args: string[], context: ProgramContext) => {
    const lines: OutputLine[] = [
      "Available commands:",
      "  enhance <n>     – set ASCII art width (10-100)",
      "  info            – display this message",
      "  nuke            – clear the screen",
      "  undo            – go back to previous program",
      "  know            – list technologies alphabetically",
      "  exo             – restart the console intro",
    ].map((t) => ({ id: context.getNextId(), text: t }));

    context.appendLines(lines);
  },
};

export default HelpProgram; 