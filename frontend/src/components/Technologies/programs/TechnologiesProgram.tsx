import { TerminalProgram, ProgramContext, OutputLine } from "./ProgramTypes";
import TechnologyService from "../../../services/TechnologyService";
import type { Technology } from "../../../types/Technology";

const TechnologiesProgram: TerminalProgram = {
  id: "technologies",
  displayName: "Technologies",
  aliases: ["technologies", "tech", "technology"],
  clear: true,
  run: async (_args: string[], context: ProgramContext) => {
    try {
      const resp = await TechnologyService.getAllTechnologies(0, 100, "name", "asc");
      const sorted = [...resp.content].sort((a: Technology, b: Technology) => a.name.localeCompare(b.name));
      const techLines: OutputLine[] = sorted.map((tech: Technology) => ({
        id: context.getNextId(),
        text: `${tech.name}`,
        technology: tech,
      }));

      context.appendLines(techLines);
      // Ensure prompt reset handled in outer component.
    } catch (e) {
      console.error("Failed to fetch technologies", e);
      const errLine: OutputLine = { id: context.getNextId(), text: "Error: unable to fetch technologies" };
      context.appendLines([errLine]);
    }
  },
};

export default TechnologiesProgram; 