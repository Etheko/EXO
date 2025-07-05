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

    if (context.isAdmin) {
      lines.push(
        ...[
          { id: context.getNextId(), text: " " },
          { id: context.getNextId(), text: "Admin Commands:" },
          { id: context.getNextId(), text: "  edit            – show edit menu for current technology" },
          { id: context.getNextId(), text: "  edit <field>     – directly edit a field (name, description, link, icon)" },
          { id: context.getNextId(), text: "  delete           – delete the current technology" },
          { id: context.getNextId(), text: "  add             – create a new technology" },
        ]
      );
    }

    context.appendLines(lines);
  },
};

export default HelpProgram; 