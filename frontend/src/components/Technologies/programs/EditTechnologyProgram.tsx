import { TerminalProgram, ProgramContext, OutputLine } from "./ProgramTypes";
import type { Technology } from "../../../types/Technology";

interface Options {
  technology: Technology;
  isCreate?: boolean;
}

export function createEditTechnologyProgram(opts: Options): TerminalProgram {
  const { technology: tech, isCreate = false } = opts;

  return {
    id: `tech-edit-${tech.id ?? tech.name}`,
    displayName: isCreate ? `Creating Technology` : `Editing ${tech.name}`,
    aliases: ['edit'],
    clear: true,
    technology: tech,
    run: async (args: string[], context: ProgramContext) => {
      const { appendLines, getNextId } = context;

      if (!context.isAdmin) {
        appendLines([{ id: getNextId(), text: "Unauthorized. This command is for admins only.", severity: "error" }]);
        return;
      }

      // Build menu lines depending on mode
      const header = isCreate ? 'Fill in the new technology fields:' : `What would you like to edit for ${tech.name}?`;

      const lines: OutputLine[] = [
        { id: getNextId(), text: header },
        { id: getNextId(), text: " " },
        // Each of these lines, when clicked, should trigger a sub-program or input mode.
        { 
          id: getNextId(), 
          text: isCreate ? `Set Name${tech.name ? ' ✓' : ''}` : "Edit Name", 
          isEditLine: true, 
          technology: tech, 
          action: 'edit-name',
          severity: isCreate && tech.name ? 'success' : undefined
        },
        { 
          id: getNextId(), 
          text: isCreate ? `Set Description${tech.description ? ' ✓' : ''}` : "Edit Description", 
          isEditLine: true, 
          technology: tech, 
          action: 'edit-description',
          severity: isCreate && tech.description ? 'success' : undefined
        },
        { 
          id: getNextId(), 
          text: isCreate ? `Set Link${tech.link ? ' ✓' : ''}` : "Edit Link", 
          isEditLine: true, 
          technology: tech, 
          action: 'edit-link',
          severity: isCreate && tech.link ? 'success' : undefined
        },
        { 
          id: getNextId(), 
          text: isCreate ? `Set Category${tech.category ? ' ✓' : ''}` : "Edit Category", 
          isEditLine: true, 
          technology: tech, 
          action: 'edit-category',
          severity: isCreate && tech.category ? 'success' : undefined
        },
        { 
          id: getNextId(), 
          text: isCreate ? `Set Icon${tech.iconString ? ' ✓' : ''}` : "Change Icon", 
          isEditLine: true, 
          technology: tech, 
          action: 'edit-icon',
          severity: isCreate && tech.iconString ? 'success' : undefined
        },
        { id: getNextId(), text: " " },
        ...(isCreate
          ? [
              { id: getNextId(), text: "Save New Technology", isEditLine: true, technology: tech, action: 'create-save' },
              { id: getNextId(), text: "Cancel", isEditLine: true, technology: tech, action: 'create-cancel' },
            ]
          : [{ id: getNextId(), text: "DELETE Technology", isEditLine: true, technology: tech, action: 'delete', severity: 'error' as const }]),
      ];

      appendLines(lines);
    },
  };
} 