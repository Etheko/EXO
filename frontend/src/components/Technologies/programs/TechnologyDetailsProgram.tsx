import { TerminalProgram, ProgramContext, OutputLine } from "./ProgramTypes";
import type { Technology } from "../../../types/Technology";
import TechnologyService from "../../../services/TechnologyService";
import { convertImageToAscii } from "../../../utils/aa";
import { getDominantColor } from "../../../utils/imageUtils";

interface Options {
  technology: Technology;
}

export function createTechnologyDetailsProgram(opts: Options): TerminalProgram {
  const { technology: tech } = opts;

  return {
    id: `tech-detail-${tech.id ?? tech.name}`,
    displayName: tech.name,
    aliases: [],
    clear: true,
    run: async (_args: string[], context: ProgramContext) => {
      const iconUrl = tech.id !== undefined ? TechnologyService.getIconUrl(tech.id) : "";

      const [asciiResult, colorResult] = await Promise.allSettled([
        iconUrl
          ? convertImageToAscii(iconUrl, {
              colored: true,
              width: context.asciiWidth,
            })
          : Promise.resolve([]),
        iconUrl ? getDominantColor(iconUrl) : Promise.resolve("#FFFFFF"),
      ]);

      const asciiLines = asciiResult.status === "fulfilled" ? asciiResult.value : [];
      const nameColor = colorResult.status === "fulfilled" ? colorResult.value : "#FFFFFF";

      const lines: OutputLine[] = [];

      // ASCII art
      if (asciiLines.length > 0) {
        lines.push(
          ...asciiLines.map((htmlStr) => ({
            id: context.getNextId(),
            text: htmlStr.replace(/<[^>]+>/g, ""),
            html: htmlStr,
            isAsciiLine: true,
          }))
        );
        lines.push({ id: context.getNextId(), text: "\u00A0" });
      }

      // Name line
      lines.push({
        id: context.getNextId(),
        text: tech.name,
        html: `<span style="color: ${nameColor}">${tech.name}</span>`,
      });
      lines.push({ id: context.getNextId(), text: "\u00A0" });

      // Description
      if (tech.description) {
        lines.push({ id: context.getNextId(), text: tech.description });
        lines.push({ id: context.getNextId(), text: "\u00A0" });
      }

      // Link
      if (tech.link) {
        lines.push({
          id: context.getNextId(),
          text: `Link: ${tech.link}`,
          html: `Link: <span class="link-url">${tech.link}</span>`,
          linkUrl: tech.link,
        });
      }

      context.appendLines(lines);
    },
  } as TerminalProgram;
} 