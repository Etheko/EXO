import { TerminalProgram, ProgramContext, OutputLine } from "./ProgramTypes";
import type { Technology } from "../../../types/Technology";

interface Options {
  technology: Technology;
}

export function createDeleteTechnologyProgram(opts: Options): TerminalProgram {
  const { technology: tech } = opts;
  return {
    id: `delete-tech-${tech.id ?? tech.name}`,
    displayName: `Delete ${tech.name}`,
    aliases: [],
    clear: true,
    technology: tech,
    run: async (_args: string[], context: ProgramContext) => {
      if (!context.isAdmin) {
        context.appendLines([
          { id: context.getNextId(), text: "Unauthorized. Admins only.", severity: "error" },
        ]);
        return;
      }

      context.startDeleteSession?.(tech);

      const lines: OutputLine[] = [
        { id: context.getNextId(), text: `Are you sure you want to DELETE '${tech.name}'?` },
        { id: context.getNextId(), text: "This action is irreversible.", severity: "warning" },
        { id: context.getNextId(), text: "" },
        { id: context.getNextId(), text: "YES", isEditLine: true, technology: tech, action: 'delete-yes', severity: 'error' },
        { id: context.getNextId(), text: "NO", isEditLine: true, technology: tech, action: 'delete-no' },
        { id: context.getNextId(), text: "" },
        { id: context.getNextId(), text: "(Alternatively, type 'y' or 'n' then Enter.)" },
      ];
      context.appendLines(lines);
    },
  };
} 