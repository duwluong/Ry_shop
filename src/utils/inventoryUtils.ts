import {
  COLUMN_NUMBERS,
  DEPTH_POSITIONS,
  RACK_IDS,
  TIER_NUMBERS,
  TOTAL_SLOTS,
} from '../constants/rackLayout';
import type {
  CellCoordinates,
  ColumnNumber,
  DepthPosition,
  InventoryMap,
  RackId,
  SearchMatch,
  SlotCoordinates,
  SlotKey,
  TierNumber,
} from '../types/inventory';

export const STORAGE_KEY = 'rack3d_shop_inventory_v2';
export const LEGACY_STORAGE_KEY = 'rack3d_shop_inventory_v1';
export const STORAGE_INIT_KEY = 'rack3d_shop_initialized_v2';

export function getTodayISODate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatCurrencyVND(amount: number): string {
  const safe = Math.max(0, Math.round(Number.isFinite(amount) ? amount : 0));
  return `${safe.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}đ`;
}

export function formatThousandsInput(amount: number): string {
  const safe = Math.max(0, Math.round(Number.isFinite(amount) ? amount : 0));
  if (safe === 0) return '';
  return safe.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseCurrencyInput(raw: string): number {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return 0;
  const num = Number(digits);
  return Number.isFinite(num) ? Math.min(num, 999_999_999) : 0;
}

export function formatDateVN(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate || '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

export function makeSlotKey(
  rack: RackId,
  tier: TierNumber,
  col: ColumnNumber,
  depth: DepthPosition
): SlotKey {
  return `${rack}-${tier}-${col}-${depth}`;
}

export function parseSlotKey(key: string): SlotCoordinates | null {
  const parts = key.split('-');
  if (parts.length !== 4) return null;
  const rack = Number(parts[0]) as RackId;
  const tier = Number(parts[1]) as TierNumber;
  const col = Number(parts[2]) as ColumnNumber;
  const depth = parts[3] as DepthPosition;
  if (
    (rack !== 1 && rack !== 2) ||
    tier < 1 ||
    tier > 5 ||
    col < 1 ||
    col > 6 ||
    (depth !== 'FRONT' && depth !== 'BACK')
  ) {
    return null;
  }
  return { rack, tier, col, depth };
}

export function getDepthLabel(depth: DepthPosition): string {
  return depth === 'FRONT' ? 'TRƯỚC' : 'SAU';
}

export function formatSlotCoordinate(coords: SlotCoordinates): string {
  return `Kệ ${coords.rack} - Tầng ${coords.tier} - Ô ${coords.col} - Vị trí ${getDepthLabel(coords.depth)}`;
}

export function formatCellCoordinate(cell: CellCoordinates): string {
  return `Kệ ${cell.rack} - Tầng ${cell.tier} - Ô ${cell.col}`;
}

/**
 * Strips Vietnamese diacritics and normalizes whitespace & lowercase
 * so searching "linh" matches "Chị Linh", "nguyen" matches "Nguyễn", etc.
 */
export function normalizeVietnamese(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function searchInventory(inventory: InventoryMap, rawQuery: string): SearchMatch[] {
  const q = normalizeVietnamese(rawQuery);
  if (!q) return [];
  const tokens = q.split(' ').filter(Boolean);

  const matches: SearchMatch[] = [];

  for (const [key, item] of Object.entries(inventory)) {
    const coords = parseSlotKey(key);
    if (!coords) continue;

    const normName = normalizeVietnamese(item.customerName);
    const coordLabel = formatSlotCoordinate(coords);
    const normCoord = normalizeVietnamese(coordLabel);
    const compactCoord = `${coords.rack}-${coords.tier}-${coords.col}`;
    const dateVN = formatDateVN(item.startDate);

    const combined = `${normName} ${normCoord} ${compactCoord} ${dateVN}`;
    const matchesAllTokens = tokens.every((t) => combined.includes(t));
    if (!matchesAllTokens) continue;

    let score = 10;
    if (normName === q) score += 100;
    else if (normName.startsWith(q)) score += 65;
    else if (normName.includes(q)) score += 45;
    if (coords.depth === 'FRONT') score += 1;

    matches.push({
      slotKey: key as SlotKey,
      coords,
      item,
      coordinateLabel: coordLabel,
      score,
    });
  }

  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.coords.rack !== b.coords.rack) return a.coords.rack - b.coords.rack;
    if (a.coords.tier !== b.coords.tier) return a.coords.tier - b.coords.tier;
    if (a.coords.col !== b.coords.col) return a.coords.col - b.coords.col;
    return a.coords.depth === 'FRONT' ? -1 : 1;
  });

  return matches;
}

export interface InventoryStats {
  occupied: number;
  empty: number;
  total: number;
  frontOccupied: number;
  backOccupied: number;
  rack1Occupied: number;
  rack2Occupied: number;
  totalRevenue: number;
}

export function computeStats(inventory: InventoryMap): InventoryStats {
  let occupied = 0;
  let frontOccupied = 0;
  let backOccupied = 0;
  let rack1Occupied = 0;
  let rack2Occupied = 0;
  let totalRevenue = 0;

  for (const [key, item] of Object.entries(inventory)) {
    const coords = parseSlotKey(key);
    if (!coords) continue;
    occupied += 1;
    totalRevenue += item.totalAmount || 0;
    if (coords.depth === 'FRONT') frontOccupied += 1;
    else backOccupied += 1;
    if (coords.rack === 1) rack1Occupied += 1;
    else rack2Occupied += 1;
  }

  return {
    occupied,
    empty: TOTAL_SLOTS - occupied,
    total: TOTAL_SLOTS,
    frontOccupied,
    backOccupied,
    rack1Occupied,
    rack2Occupied,
    totalRevenue,
  };
}

export function validateAndSanitizeInventory(raw: unknown): InventoryMap | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const candidate =
    'inventory' in (raw as Record<string, unknown>) &&
    typeof (raw as Record<string, unknown>).inventory === 'object'
      ? ((raw as Record<string, unknown>).inventory as Record<string, unknown>)
      : (raw as Record<string, unknown>);

  const sanitized: InventoryMap = {};
  const today = getTodayISODate();

  for (const [key, value] of Object.entries(candidate)) {
    const coords = parseSlotKey(key);
    if (!coords || !value || typeof value !== 'object') continue;

    const v = value as Record<string, unknown>;
    const customerName = typeof v.customerName === 'string' ? v.customerName.trim() : '';
    if (!customerName) continue;

    const totalAmount =
      typeof v.totalAmount === 'number' && Number.isFinite(v.totalAmount)
        ? Math.max(0, Math.round(v.totalAmount))
        : 0;

    const startDate =
      typeof v.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.startDate)
        ? v.startDate
        : today;

    sanitized[makeSlotKey(coords.rack, coords.tier, coords.col, coords.depth)] = {
      id: typeof v.id === 'string' && v.id ? v.id : `pkg_${key}_${Date.now()}`,
      customerName,
      totalAmount,
      startDate,
      updatedAt:
        typeof v.updatedAt === 'string' && v.updatedAt
          ? v.updatedAt
          : new Date().toISOString(),
    };
  }

  return sanitized;
}

export function getAllSlotKeys(): SlotKey[] {
  const keys: SlotKey[] = [];
  for (const rack of RACK_IDS) {
    for (const tier of TIER_NUMBERS) {
      for (const col of COLUMN_NUMBERS) {
        for (const depth of DEPTH_POSITIONS) {
          keys.push(makeSlotKey(rack, tier, col, depth));
        }
      }
    }
  }
  return keys;
}
