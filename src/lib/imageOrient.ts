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

function renderVariant(
  img: HTMLImageElement,
  targetW: number,
  targetH: number,
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
): Promise<OrientedVariants> {
  const img = await loadImage(source);
  const [portraitBlob, landscapeBlob] = await Promise.all([
    renderVariant(img, PORTRAIT_W, PORTRAIT_H),
    renderVariant(img, LANDSCAPE_W, LANDSCAPE_H),
  ]);
  return { portraitBlob, landscapeBlob };
}
