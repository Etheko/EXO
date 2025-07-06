import { TerminalProgram, ProgramContext, OutputLine } from "./ProgramTypes";
import type { Technology } from "../../../types/Technology";
import TechnologyService from "../../../services/TechnologyService";

interface Options {
  technology: Technology;
  isCreate?: boolean;
}

export function createCategoryEditProgram(opts: Options): TerminalProgram {
  const { technology: tech, isCreate = false } = opts;

  return {
    id: `category-edit-${tech.id ?? tech.name}`,
    displayName: isCreate ? `Set Category` : `Edit Category`,
    aliases: [],
    clear: true,
    technology: tech,
    run: async (_args: string[], context: ProgramContext) => {
      if (!context.isAdmin) {
        context.appendLines([{ id: context.getNextId(), text: "Unauthorized", severity: "error" }]);
        return;
      }

      // Start a session to capture raw text input for a new category
      context.startFieldEditSession?.(tech, 'category');

      try {
        // Fetch all existing categories
        const categories = await TechnologyService.getAllCategories();
        
        const lines: OutputLine[] = [
          { id: context.getNextId(), text: isCreate ? "Choose a category for the new technology:" : `Current category: ${tech.category || '<empty>'}` },
          { id: context.getNextId(), text: " " },
          { id: context.getNextId(), text: "Available categories:" },
          { id: context.getNextId(), text: " " },
        ];

        // Add existing categories as clickable options
        categories.forEach((category, index) => {
          lines.push({
            id: context.getNextId(),
            text: `${index + 1}. ${category}`,
            isEditLine: true,
            technology: tech,
            action: `select-category-${category}`,
          });
        });

        lines.push(
          { id: context.getNextId(), text: " " },
          { id: context.getNextId(), text: "Or type a new category name and press Enter." },
          { id: context.getNextId(), text: "Type 'cancel' to abort." },
        );

        context.appendLines(lines);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        context.appendLines([
          { id: context.getNextId(), text: "Error: Unable to fetch categories", severity: "error" },
          { id: context.getNextId(), text: "Type a category name and press Enter, or 'cancel' to abort." },
        ]);
      }
    },
  };
} 