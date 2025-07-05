import { TerminalProgram, ProgramContext, OutputLine } from "./ProgramTypes";
import type { Technology } from "../../../types/Technology";
import TechnologyService from "../../../services/TechnologyService";
import { convertImageToAscii } from "../../../utils/aa";

interface Options {
  technology: Technology;
  isCreate?: boolean;
}

export function createIconEditProgram(opts: Options): TerminalProgram {
  const { technology: tech, isCreate = false } = opts;

  return {
    id: `icon-edit-${tech.id ?? tech.name}`,
    displayName: isCreate ? `Set Icon` : `Edit Icon`,
    aliases: [],
    clear: true,
    technology: tech,
    run: async (_args: string[], context: ProgramContext) => {
      if (!context.isAdmin) {
        context.appendLines([{ id: context.getNextId(), text: "Unauthorized", severity: "error" }]);
        return;
      }

      // Render current icon ASCII
      const asciiLines: OutputLine[] = [];
      if (tech.id) {
        try {
          const iconUrl = TechnologyService.getIconUrl(tech.id);
          const ascii = await convertImageToAscii(iconUrl, { colored: true, width: context.asciiWidth });
          asciiLines.push(
            ...ascii.map((html) => ({ id: context.getNextId(), text: html.replace(/<[^>]+>/g, ''), html, isAsciiLine: true }))
          );
        } catch (err) {
          // ignore errors
        }
      }

      const lines: OutputLine[] = [
        ...asciiLines,
        { id: context.getNextId(), text: "\u00A0" },
        { id: context.getNextId(), text: isCreate ? "Upload icon" : "Upload new icon", isEditLine: true, technology: tech, action: 'upload-icon' },
      ];
      context.appendLines(lines);
    },
  };
} 