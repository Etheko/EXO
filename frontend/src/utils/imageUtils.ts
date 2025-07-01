/**
 * Gets the dominant color from an image, avoiding pure black/white/transparent.
 * If the dominant color is too dark, it returns white.
 * @param imageUrl The URL of the image to process.
 * @returns A promise that resolves to a hex color string.
 */
export async function getDominantColor(imageUrl: string): Promise<string> {
  try {
    const img: HTMLImageElement = await new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "Anonymous";
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = imageUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return "#FFFFFF";

    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const colorCounts: { [color: string]: number } = {};
    let maxCount = 0;
    let dominantColor = "#FFFFFF"; // Default to white

    for (let i = 0; i < imageData.length; i += 4) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      const a = imageData[i + 3];

      // Skip transparent or near-transparent pixels
      if (a < 200) continue;

      // Skip pure white or pure black
      if ((r > 250 && g > 250 && b > 250) || (r < 5 && g < 5 && b < 5)) {
        continue;
      }

      const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      colorCounts[hex] = (colorCounts[hex] || 0) + 1;

      if (colorCounts[hex] > maxCount) {
        maxCount = colorCounts[hex];
        dominantColor = hex;
      }
    }

    // Check brightness: if too dark, default to white for readability
    const rgb = parseInt(dominantColor.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness < 70 ? "#FFFFFF" : dominantColor;
  } catch (error) {
    console.error("Failed to get dominant color:", error);
    return "#FFFFFF"; // Fallback on any error
  }
} 