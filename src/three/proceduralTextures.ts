import * as THREE from 'three';
import type { DepthPosition } from '../types/inventory';

/**
 * Generates a realistic powder-coated gray V-hole slotted angle iron texture
 * with alternating oblong slots and round bolt holes.
 */
export function createVPostTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base light-medium slate-gray powder-coated steel ("xám ghi")
  ctx.fillStyle = '#9aa2ac';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle metallic micro-speckle
  for (let i = 0; i < 1800; i++) {
    const x = (i * 73) % canvas.width;
    const y = (i * 137) % canvas.height;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.05)';
    ctx.fillRect(x, y, 2, 2);
  }

  // Slight edge highlight to accentuate the angle bar flange
  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, 'rgba(255,255,255,0.14)');
  grad.addColorStop(0.15, 'rgba(255,255,255,0)');
  grad.addColorStop(0.85, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.16)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw repeating V-slot punched holes (8 cycles per texture tile)
  const cycles = 8;
  const step = canvas.height / cycles;

  for (let c = 0; c < cycles; c++) {
    const yCenter = c * step + step * 0.5;

    // Left/center oblong vertical slot
    const slotW = 22;
    const slotH = 38;
    const sx = 40;
    const sy = yCenter - slotH / 2;

    // Rim bevel highlight
    ctx.fillStyle = '#9ca3af';
    roundRect(ctx, sx - 2, sy - 2, slotW + 4, slotH + 4, 11);
    ctx.fill();

    // Punched hole dark interior
    ctx.fillStyle = '#232931';
    roundRect(ctx, sx, sy, slotW, slotH, 9);
    ctx.fill();

    // Right round bolt hole staggered
    const rx = 92;
    const ry = yCenter + step * 0.24;
    ctx.beginPath();
    ctx.arc(rx, ry, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#9ca3af';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(rx, ry, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#232931';
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 7);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/**
 * Generates brushed powder-coated gray steel texture for the shelf trays
 * with subtle 6-column divider markers.
 */
export function createShelfDeckTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#a3abb4';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle satin steel variation
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.08)');
  grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.06)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0.05)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Mid depth divider line separating BACK (SAU) & FRONT (TRƯỚC)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
  ctx.setLineDash([10, 8]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height * 0.5);
  ctx.lineTo(canvas.width, canvas.height * 0.5);
  ctx.stroke();
  ctx.setLineDash([]);

  // 6 bay column divider lines
  const colW = canvas.width / 6;
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.26)';
  ctx.lineWidth = 2;
  for (let i = 1; i < 6; i++) {
    const x = Math.round(i * colW);
    ctx.beginPath();
    ctx.moveTo(x, 6);
    ctx.lineTo(x, canvas.height - 6);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/**
 * Generates a warm oak wood plank floor texture matching the reference photo.
 */
export function createWoodFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#8d6647';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const plankRows = 4;
  const plankH = canvas.height / plankRows;

  for (let row = 0; row < plankRows; row++) {
    const y0 = row * plankH;
    const toneShift = (row % 2 === 0 ? 8 : -8);
    ctx.fillStyle = `rgb(${141 + toneShift}, ${102 + toneShift}, ${71 + toneShift})`;
    ctx.fillRect(0, y0, canvas.width, plankH);

    // Subtle wood grain streaks
    for (let g = 0; g < 26; g++) {
      const gy = y0 + (g / 26) * plankH;
      ctx.strokeStyle =
        g % 3 === 0 ? 'rgba(65, 39, 20, 0.14)' : 'rgba(205, 165, 125, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(
        canvas.width * 0.3,
        gy + ((g % 5) - 2) * 2,
        canvas.width * 0.7,
        gy - ((g % 4) - 1.5) * 2,
        canvas.width,
        gy
      );
      ctx.stroke();
    }

    // Plank seam
    ctx.strokeStyle = 'rgba(54, 33, 16, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.lineTo(canvas.width, y0);
    ctx.stroke();

    // Vertical end joint staggered per row
    const jointX = ((row * 190 + 110) % canvas.width);
    ctx.beginPath();
    ctx.moveTo(jointX, y0);
    ctx.lineTo(jointX, y0 + plankH);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 5);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/**
 * Generates crisp badge texture for rack headers (e.g., "KỆ 1", "KỆ 2")
 * and tier badges ("Tầng 1" .. "Tầng 5").
 */
export function createBadgeTexture(
  text: string,
  options: {
    bg?: string;
    border?: string;
    color?: string;
    width?: number;
    height?: number;
    fontSize?: number;
  } = {}
): THREE.CanvasTexture {
  const {
    bg = '#0f172a',
    border = '#334155',
    color = '#ffffff',
    width = 256,
    height = 76,
    fontSize = 34,
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  // Pill background
  ctx.fillStyle = bg;
  roundRect(ctx, 4, 4, width - 8, height - 8, (height - 8) / 2);
  ctx.fill();

  ctx.strokeStyle = border;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = `700 ${fontSize}px "Be Vietnam Pro", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2 + 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/**
 * Generates crisp floating customer name pill texture for 3D Sprite billboard.
 */
export function createPackageLabelTexture(
  customerName: string,
  depth: DepthPosition,
  isHighlighted: boolean
): THREE.CanvasTexture {
  const width = 340;
  const height = 88;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  const isFront = depth === 'FRONT';
  const accent = isFront ? '#0284c7' : '#ea580c';
  const badgeBg = isFront ? '#e0f2fe' : '#ffedd5';
  const badgeText = isFront ? 'T' : 'S';

  // Soft shadow
  ctx.save();
  ctx.shadowColor = isHighlighted
    ? isFront
      ? 'rgba(14, 165, 233, 0.55)'
      : 'rgba(249, 115, 22, 0.55)'
    : 'rgba(15, 23, 42, 0.24)';
  ctx.shadowBlur = isHighlighted ? 14 : 8;
  ctx.shadowOffsetY = 3;

  ctx.fillStyle = isHighlighted ? '#fffbeb' : '#ffffff';
  roundRect(ctx, 10, 10, width - 20, height - 20, 20);
  ctx.fill();
  ctx.restore();

  // Outer border
  ctx.strokeStyle = isHighlighted ? '#facc15' : accent;
  ctx.lineWidth = isHighlighted ? 5 : 3;
  roundRect(ctx, 10, 10, width - 20, height - 20, 20);
  ctx.stroke();

  // Left position badge pill ("T" or "S")
  ctx.fillStyle = badgeBg;
  roundRect(ctx, 20, 22, 42, 44, 12);
  ctx.fill();

  ctx.fillStyle = accent;
  ctx.font = '800 25px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, 41, 45);

  // Customer name text (truncated cleanly if long)
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 27px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const maxTextWidth = width - 92;
  let display = customerName.trim();
  if (ctx.measureText(display).width > maxTextWidth) {
    while (display.length > 2 && ctx.measureText(`${display}…`).width > maxTextWidth) {
      display = display.slice(0, -1);
    }
    display = `${display}…`;
  }
  ctx.fillText(display, 74, 45);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
