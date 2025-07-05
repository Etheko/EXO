import { TerminalProgram, ProgramContext, OutputLine } from "./ProgramTypes";
import type { Technology } from "../../../types/Technology";

interface Options {
  technology: Technology;
  field: "name" | "description" | "link" | "icon";
}

export function createFieldEditProgram(opts: Options): TerminalProgram {
  const { technology: tech, field } = opts;
  const pretty = field.charAt(0).toUpperCase() + field.slice(1);

  return {
    id: `edit-field-${field}-${tech.id ?? tech.name}`,
    displayName: `Edit ${pretty}`,
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

      // Inform parent component that we're awaiting input for this field
      context.startFieldEditSession?.(tech, field);

      const lines: OutputLine[] = [
        { id: context.getNextId(), text: `${pretty} editing mode` },
        { id: context.getNextId(), text: " " },
        { id: context.getNextId(), text: `Current ${field}: ${field === 'icon' ? (tech.iconString ?? '<empty>') : (tech[field as keyof Technology] ?? '<empty>')}` },
        { id: context.getNextId(), text: " " },
        { id: context.getNextId(), text: `Type the new ${field} and press Enter to save.` },
        { id: context.getNextId(), text: "Or type 'cancel' to abort." },
      ];
      context.appendLines(lines);
    },
  };
} 