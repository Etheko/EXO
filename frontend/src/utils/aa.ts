import aalib from "aalib.js";
import { DEFAULT_ASCII_WIDTH } from "../config";

/**
 * Convert an image URL to ASCII art lines using aalib.js.
 * By default it returns plain text (monochrome). If `colored` is true it
 * returns HTML fragments with inline <span style="color:#rrggbb"> chars.
 */
export async function convertImageToAscii(
  url: string,
  options: { width?: number; height?: number; colored?: boolean } = {}
): Promise<string[]> {
  const asciiWidth = options.width ?? DEFAULT_ASCII_WIDTH;
  const colored = options.colored ?? true;

  // Load image first to get dimensions and composite transparency over white
  const img: HTMLImageElement = await new Promise((res, rej) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = url;
  });

  // Create canvas with white background + logo on top to remove alpha issues
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff"; // white background
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  const dataUrl = canvas.toDataURL("image/png");

  // Adjust height to compensate for character aspect ratio
  const CHAR_ASPECT = 0.55; // width / height of monospace char approx
  const asciiHeight = options.height ?? Math.max(1, Math.round(asciiWidth * (canvas.height / canvas.width) * CHAR_ASPECT));

  return new Promise<string[]>((resolve, reject) => {
    let collected: string[] | null = null;

    aalib.read.image
      .fromURL(dataUrl)
      .map(aalib.aa({ width: asciiWidth, height: asciiHeight, colored }))
      .map(
        aalib.render.html({
          tagName: "pre",
          fontFamily: "monospace",
          fontSize: 7,
          background: "transparent",
          color: "#FFFFFF",
        })
      )
      .subscribe({
        next: (el: HTMLElement) => {
          if (colored) {
            // Preserve HTML (innerHTML keeps <span> color styling, <br> tags represent newlines)
            // Split by <br>, or by newline if no <br> found
            const html = el.innerHTML;
            const splitter = html.includes("<br>") ? "<br>" : "\n";
            collected = html
              .split(splitter)
              .map((l) => (l === "" ? "&nbsp;" : l));
          } else {
            const txt = el.textContent ?? "";
            collected = txt.split("\n");
          }
        },
        error: (err: unknown) => reject(err),
        complete: () => {
          if (!collected) {
            reject(new Error("Failed to generate ASCII art"));
          } else {
            resolve(collected);
          }
        },
      });
  });
} 