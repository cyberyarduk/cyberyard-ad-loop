// Generates portrait (1080x1920) and landscape (1920x1080) variants from an
// uploaded image. The source is contained inside the canvas, with a blurred
// version of the same image used as the background to fill any letterboxing.
// This way an uploaded menu photo looks great on both a phone and a TV.

export interface OrientedVariants {
  portraitBlob: Blob;
  landscapeBlob: Blob;
}

const PORTRAIT_W = 1080;
const PORTRAIT_H = 1920;
const LANDSCAPE_W = 1920;
const LANDSCAPE_H = 1080;

function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const isString = typeof source === "string";
    const url = isString ? source : URL.createObjectURL(source);
    const img = new Image();
    if (isString) img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!isString) URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      if (!isString) URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

export interface OverlayOptions {
  text?: string;
  subtext?: string;
  position?: "top" | "middle" | "bottom";
  color?: string; // text color
  background?: "none" | "dark" | "light" | "accent";
}

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  opts: OverlayOptions,
) {
  const text = (opts.text || "").trim();
  const subtext = (opts.subtext || "").trim();
  if (!text && !subtext) return;

  const position = opts.position || "bottom";
  const color = opts.color || "#ffffff";
  const bg = opts.background || "dark";

  const titleSize = Math.round(W * 0.075);
  const subSize = Math.round(W * 0.04);
  const padX = Math.round(W * 0.06);
  const gap = Math.round(titleSize * 0.25);
  const blockH =
    (text ? titleSize : 0) + (text && subtext ? gap : 0) + (subtext ? subSize : 0);
  const bandPad = Math.round(titleSize * 0.6);
  const bandH = blockH + bandPad * 2;

  let bandY: number;
  if (position === "top") bandY = Math.round(H * 0.06);
  else if (position === "middle") bandY = Math.round((H - bandH) / 2);
  else bandY = H - bandH - Math.round(H * 0.06);

  // Background band
  if (bg !== "none") {
    if (bg === "dark") ctx.fillStyle = "rgba(0,0,0,0.55)";
    else if (bg === "light") ctx.fillStyle = "rgba(255,255,255,0.78)";
    else ctx.fillStyle = "rgba(220,38,38,0.85)"; // accent red
    ctx.fillRect(0, bandY, W, bandH);
  }

  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.shadowColor = bg === "none" ? "rgba(0,0,0,0.7)" : "transparent";
  ctx.shadowBlur = bg === "none" ? 12 : 0;

  let y = bandY + bandPad;
  if (text) {
    ctx.font = `800 ${titleSize}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(text, W / 2, y, W - padX * 2);
    y += titleSize + gap;
  }
  if (subtext) {
    ctx.font = `500 ${subSize}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(subtext, W / 2, y, W - padX * 2);
  }
  ctx.shadowBlur = 0;
}

function renderVariant(
  img: HTMLImageElement,
  targetW: number,
  targetH: number,
  overlay?: OverlayOptions,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // 1. Blurred cover background
  const coverScale = Math.max(targetW / img.width, targetH / img.height);
  const coverW = img.width * coverScale;
  const coverH = img.height * coverScale;
  const coverX = (targetW - coverW) / 2;
  const coverY = (targetH - coverH) / 2;

  ctx.filter = "blur(40px) brightness(0.7)";
  ctx.drawImage(img, coverX, coverY, coverW, coverH);
  ctx.filter = "none";

  // 2. Contained foreground (full image visible, no crop)
  const containScale = Math.min(targetW / img.width, targetH / img.height);
  const containW = img.width * containScale;
  const containH = img.height * containScale;
  const containX = (targetW - containW) / 2;
  const containY = (targetH - containH) / 2;
  ctx.drawImage(img, containX, containY, containW, containH);

  // 3. Optional text overlay
  if (overlay) drawOverlay(ctx, targetW, targetH, overlay);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      0.9,
    );
  });
}

export async function generateOrientedVariants(
  source: File | Blob | string,
  overlay?: OverlayOptions,
): Promise<OrientedVariants> {
  const img = await loadImage(source);
  const [portraitBlob, landscapeBlob] = await Promise.all([
    renderVariant(img, PORTRAIT_W, PORTRAIT_H, overlay),
    renderVariant(img, LANDSCAPE_W, LANDSCAPE_H, overlay),
  ]);
  return { portraitBlob, landscapeBlob };
}
