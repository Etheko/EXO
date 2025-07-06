import { TerminalProgram, ProgramContext, OutputLine } from "./ProgramTypes";
import TechnologyService from "../../../services/TechnologyService";
import type { Technology } from "../../../types/Technology";
import { createTechnologyDetailsProgram } from "./TechnologyDetailsProgram";

// Predefined palette (includes prompt green and deletion red)
const HEADER_COLORS = [
  "#00ff7f", // Prompt green
  "#ef4444", // Deletion red (tailwind red-500)
  "#58a6ff", // blue-ish (matches link color)
  "#eab308", // amber-500
  "#14b8a6", // teal-500
  "#c084fc", // violet-400
  "#f472b6", // pink-400
  "#a3e635", // lime-400
];

/** Deterministically assign a color based on a string using a simple hash. */
const getColorForCategory = (category: string): string => {
  if (!category) return HEADER_COLORS[0];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = (hash + category.charCodeAt(i)) % HEADER_COLORS.length;
  }
  return HEADER_COLORS[hash];
};

const TechnologiesProgram: TerminalProgram = {
  id: "know",
  displayName: "Know",
  aliases: ["know", "technologies", "tech", "technology"],
  clear: true,
  run: async (args: string[], context: ProgramContext) => {
    try {
      // Fetch a large enough page to include all technologies
      const resp = await TechnologyService.getAllTechnologies(0, 300, "name", "asc");

      // Flatten list sorted by category then name for deterministic enumeration
      const categoryMap: Record<string, Technology[]> = {};
      for (const tech of resp.content) {
        const cat = tech.category?.trim() || "Others";
        if (!categoryMap[cat]) categoryMap[cat] = [];
        categoryMap[cat].push(tech);
      }

      const sortedCategoryNames = Object.keys(categoryMap).sort((a, b) => a.localeCompare(b));

      // Build flattened ordered list for enumeration lookup
      const orderedTechs: Technology[] = [];
      for (const category of sortedCategoryNames) {
        orderedTechs.push(...categoryMap[category].sort((a, b) => a.name.localeCompare(b.name)));
      }

      // If command is technologies show <number>
      if (args.length >= 2 && args[0].toLowerCase() === "show") {
        const index = parseInt(args[1], 10);
        if (!isNaN(index) && index >= 1 && index <= orderedTechs.length) {
          const tech = orderedTechs[index - 1];
          const detailProgram = createTechnologyDetailsProgram({ technology: tech });
          await detailProgram.run([], context);
          return;
        }
        // Invalid number -> produce error line
        context.appendLines([
          { id: context.getNextId(), text: "Invalid technology number.", severity: "error" },
        ]);
        return;
      }

      const lines: OutputLine[] = [];

      // Intro lines
      lines.push({ id: context.getNextId(), text: "\u00A0" });
      lines.push({ id: context.getNextId(), text: "This is all the stuff I know how to use:" });
      lines.push({ id: context.getNextId(), text: "\u00A0" });

      const width = Math.max(30, context.asciiWidth); // ensure minimum width

      for (const category of sortedCategoryNames) {
        // Sort technologies inside category by name
        const techs = categoryMap[category].sort((a, b) => a.name.localeCompare(b.name));

        // Header line
        const separatorLen = Math.max(3, width - category.length - 1);
        const separator = "-".repeat(separatorLen);
        const color = getColorForCategory(category);

        const headerText = `${category} ${separator}`;
        const headerHtml = `<span style="color:${color};">${category}</span> <span style="color:rgba(255,255,255,0.4)">${separator}</span>`;

        lines.push({ id: context.getNextId(), text: headerText, html: headerHtml });

        // Technology lines with global incremental numbers
        techs.forEach((tech) => {
          const displayId = `${orderedTechs.indexOf(tech) + 1}.`;
          const lineText = `${displayId} ${tech.name}`;
          lines.push({ id: context.getNextId(), text: lineText, technology: tech });
        });

        // Empty line after each category
        lines.push({ id: context.getNextId(), text: "\u00A0" });
      }

      context.appendLines(lines);

      // Admin: add option to create technology
      if (context.isAdmin) {
        context.appendLines([
          { id: context.getNextId(), text: "\u00A0" },
          { id: context.getNextId(), text: "Reload List", isEditLine: true, action: 'reload-list' },
          { id: context.getNextId(), text: "Add New Technology", isEditLine: true, action: 'add-new-tech' },
        ]);
      }
    } catch (e) {
      console.error("Failed to fetch technologies", e);
      const errLine: OutputLine = {
        id: context.getNextId(),
        text: "Error: unable to fetch technologies",
        severity: "error",
      };
      context.appendLines([errLine]);
    }
  },
};

export default TechnologiesProgram; 