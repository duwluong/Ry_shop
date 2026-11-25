import * as THREE from 'three';
import {
  COLUMN_NUMBERS,
  FRONT_PKG_HEIGHT,
  SLOT_BOX_DEPTH,
  SLOT_BOX_WIDTH,
  TIER_NUMBERS,
} from '../constants/rackLayout';
import {
  createBadgeTexture,
  createShelfDeckTexture,
  createVPostTexture,
  createWoodFloorTexture,
} from './proceduralTextures';

let cachedVPostTex: THREE.CanvasTexture | null = null;
let cachedShelfDeckTex: THREE.CanvasTexture | null = null;
let cachedWoodFloorTex: THREE.CanvasTexture | null = null;
let cachedColTexs: THREE.CanvasTexture[] | null = null;
let cachedTierTexs: THREE.CanvasTexture[] | null = null;

export function getVPostTexture(): THREE.CanvasTexture {
  if (!cachedVPostTex) cachedVPostTex = createVPostTexture();
  return cachedVPostTex;
}

export function getShelfDeckTexture(): THREE.CanvasTexture {
  if (!cachedShelfDeckTex) cachedShelfDeckTex = createShelfDeckTexture();
  return cachedShelfDeckTex;
}

export function getWoodFloorTexture(): THREE.CanvasTexture {
  if (!cachedWoodFloorTex) cachedWoodFloorTex = createWoodFloorTexture();
  return cachedWoodFloorTex;
}

export function getColBadgeTextures(): THREE.CanvasTexture[] {
  if (!cachedColTexs) {
    cachedColTexs = COLUMN_NUMBERS.map((col) =>
      createBadgeTexture(`Ô ${col}`, {
        bg: '#f8fafc',
        border: '#94a3b8',
        color: '#0f172a',
        width: 112,
        height: 52,
        fontSize: 26,
      })
    );
  }
  return cachedColTexs;
}

export function getTierBadgeTextures(): THREE.CanvasTexture[] {
  if (!cachedTierTexs) {
    cachedTierTexs = TIER_NUMBERS.map((tier) =>
      createBadgeTexture(`Tầng ${tier}`, {
        bg: '#1e293b',
        border: '#64748b',
        color: '#f8fafc',
        width: 156,
        height: 54,
        fontSize: 24,
      })
    );
  }
  return cachedTierTexs;
}

/**
 * Builds a single folded garment layer (width ~0.175, height = 1.0 normalized, depth ~0.184)
 * with soft pillowed folded fabric edges, subtle corner rounding, and gentle cloth ripple.
 */
function buildFoldedGarmentGeometry(): THREE.BufferGeometry {
  const w = SLOT_BOX_WIDTH * 0.91;
  const d = SLOT_BOX_DEPTH * 0.87;
  const geo = new THREE.BoxGeometry(w, 1, d, 12, 4, 12);
  const pos = geo.attributes.position;

  const hw = w / 2;
  const hd = d / 2;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i); // in [-0.5, 0.5]
    let z = pos.getZ(i);

    const nx = x / hw; // [-1, 1]
    const nz = z / hd; // [-1, 1]
    const ny = y * 2;  // [-1, 1]

    // 1. Soft squircle corner rounding for natural folded fabric footprint
    const ax = Math.abs(nx);
    const az = Math.abs(nz);
    const superR = Math.pow(Math.pow(ax, 3.8) + Math.pow(az, 3.8), 1 / 3.8);
    if (superR > 1.0) {
      const shrink = 1.0 / superR;
      x *= shrink;
      z *= shrink;
    }

    // 2. Pillowed folded cloth edge profile: pinch outer perimeter slightly toward middle
    //    so stacked layers form natural creases between garments
    const edgeFactor = Math.max(ax * ax, az * az);
    const pinch = 1 - 0.34 * Math.pow(edgeFactor, 1.8);
    // Keep front folded spine slightly fuller (U-fold look)
    const frontSpineBoost = nz > 0.65 ? 0.08 * (nz - 0.65) : 0;
    y = y * (pinch + frontSpineBoost);

    // 3. Very subtle center cushion puff + fabric fold wave
    const centerDome = (1 - ax * ax) * (1 - az * az) * 0.075;
    const ripple = Math.sin(nx * 4.5 + nz * 2.2) * 0.022 * (1 - Math.abs(ny) * 0.3);
    if (ny > 0) y += centerDome + ripple;
    if (ny < 0) y -= centerDome * 0.35;

    // Normalize Y bottom to 0 so layers stack flush from y = 0..1
    pos.setXYZ(i, x, y + 0.5, z);
  }

  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const h = bb.max.y - bb.min.y;
  geo.translate(0, -bb.min.y, 0);
  geo.scale(1, 1 / h, 1);
  geo.computeVertexNormals();
  return geo;
}

export const SHARED_GARMENT_LAYER_GEO = buildFoldedGarmentGeometry();

// Slender ribbon/twine strap wrapping around the stack (unit height 1 for vertical sides)
export const SHARED_RIBBON_TOP_GEO = new THREE.BoxGeometry(0.026, 0.004, SLOT_BOX_DEPTH * 0.91);
export const SHARED_RIBBON_SIDE_GEO = new THREE.BoxGeometry(0.026, 1.0, 0.004);
export const SHARED_RIBBON_CROSS_GEO = new THREE.BoxGeometry(SLOT_BOX_WIDTH * 0.94, 0.0035, 0.024);

// Small boutique paper hang-tag ("tem nhỏ") resting on top of the ribbon
export const SHARED_BOUTIQUE_TAG_GEO = new THREE.BoxGeometry(0.056, 0.003, 0.036);
export const SHARED_TAG_DOT_GEO = new THREE.CylinderGeometry(0.0045, 0.0045, 0.004, 10);

export const SHARED_HIT_BOX_GEO = new THREE.BoxGeometry(
  SLOT_BOX_WIDTH,
  FRONT_PKG_HEIGHT,
  SLOT_BOX_DEPTH
);

export const SHARED_EMPTY_EDGES_GEO = new THREE.EdgesGeometry(
  new THREE.BoxGeometry(SLOT_BOX_WIDTH * 0.92, 1, SLOT_BOX_DEPTH * 0.88)
);

export const SHARED_HIGHLIGHT_EDGES_GEO = new THREE.EdgesGeometry(
  new THREE.BoxGeometry(SLOT_BOX_WIDTH * 1.02, 1.08, SLOT_BOX_DEPTH * 0.98)
);
