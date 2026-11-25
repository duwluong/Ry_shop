import type {
  CameraPreset,
  ColumnNumber,
  DepthPosition,
  RackId,
  SlotCoordinates,
  TierNumber,
} from '../types/inventory';

export const RACK_IDS: RackId[] = [1, 2];
export const TIER_NUMBERS: TierNumber[] = [1, 2, 3, 4, 5]; // 1 = top, 5 = bottom
export const COLUMN_NUMBERS: ColumnNumber[] = [1, 2, 3, 4, 5, 6]; // 1 = left, 6 = right
export const DEPTH_POSITIONS: DepthPosition[] = ['FRONT', 'BACK'];

export const TOTAL_CELLS = 60;
export const TOTAL_SLOTS = 120;

// Physical dimensions in meters (1 unit = 1m)
export const RACK_WIDTH = 1.56;
export const RACK_HEIGHT = 1.86;
export const RACK_DEPTH = 0.58;
export const RACK_GAP = 0.025;

export const POST_SIZE = 0.042;
export const POST_THICKNESS = 0.0045;
export const TRAY_THICKNESS = 0.032;

// Inner clear span across 6 bays
export const INNER_WIDTH = RACK_WIDTH - POST_SIZE * 2;
export const COL_WIDTH = INNER_WIDTH / 6;

// Top surface Y of each of the 5 trays (Tầng 1 on top tray -> Tầng 5 on bottom tray)
export const TIER_TOP_Y: Record<TierNumber, number> = {
  1: 1.86,
  2: 1.43,
  3: 1.0,
  4: 0.57,
  5: 0.14,
};

// Z centers inside each rack (rack center at z = 0)
export const DEPTH_Z: Record<DepthPosition, number> = {
  FRONT: 0.138, // Outer half (TRƯỚC)
  BACK: -0.138, // Inner half against wall (SAU)
};

// Package & wireframe dimensions
export const SLOT_BOX_WIDTH = 0.194;
export const SLOT_BOX_DEPTH = 0.21;
export const FRONT_PKG_HEIGHT = 0.15;
export const BACK_PKG_HEIGHT = 0.168;

export function getRackCenterX(rack: RackId): number {
  const offset = RACK_WIDTH / 2 + RACK_GAP / 2;
  return rack === 1 ? -offset : offset;
}

export function getColCenterX(rack: RackId, col: ColumnNumber): number {
  const rackX = getRackCenterX(rack);
  const leftInnerEdge = rackX - INNER_WIDTH / 2;
  return leftInnerEdge + (col - 0.5) * COL_WIDTH;
}

export function getSlotWorldPosition(coords: SlotCoordinates): [number, number, number] {
  const x = getColCenterX(coords.rack, coords.col);
  const y = TIER_TOP_Y[coords.tier];
  const z = DEPTH_Z[coords.depth];
  return [x, y, z];
}

export const CAMERA_PRESETS: Record<
  CameraPreset,
  { label: string; position: [number, number, number]; target: [number, number, number] }
> = {
  angled: {
    label: 'Nghiêng 45°',
    position: [2.62, 1.86, 3.88],
    target: [0, 1.06, -0.02],
  },
  front: {
    label: 'Chính diện',
    position: [0, 1.24, 4.45],
    target: [0, 1.06, 0],
  },
  top: {
    label: 'Trên xuống',
    position: [0, 4.45, 2.08],
    target: [0, 0.94, -0.04],
  },
};

export function getFocusCameraForSlot(coords: SlotCoordinates): {
  position: [number, number, number];
  target: [number, number, number];
} {
  const [sx, sy, sz] = getSlotWorldPosition(coords);
  const pkgHeight = coords.depth === 'FRONT' ? FRONT_PKG_HEIGHT : BACK_PKG_HEIGHT;
  const targetY = sy + pkgHeight * 0.72;

  // Slightly angle horizontally toward center so even BACK slots peek past FRONT slots
  const angleSign = coords.rack === 1 ? 1 : -1;
  const dx = coords.depth === 'BACK' ? angleSign * 0.52 : angleSign * 0.3;
  const dy = coords.depth === 'BACK' ? 0.38 : 0.24;
  const dz = coords.depth === 'BACK' ? 1.28 : 1.15;

  return {
    target: [sx, targetY, sz],
    position: [sx + dx, Math.max(0.36, targetY + dy), sz + dz],
  };
}
