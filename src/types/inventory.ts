export type RackId = 1 | 2;
export type TierNumber = 1 | 2 | 3 | 4 | 5; // 1 = trên cùng, 5 = dưới cùng
export type ColumnNumber = 1 | 2 | 3 | 4 | 5 | 6; // 1 = trái, 6 = phải
export type DepthPosition = 'FRONT' | 'BACK'; // FRONT = TRƯỚC (Outer), BACK = SAU (Inner)

export interface PackageItem {
  id: string;
  customerName: string;
  totalAmount: number; // VNĐ
  startDate: string; // YYYY-MM-DD
  updatedAt: string;
}

export interface SlotCoordinates {
  rack: RackId;
  tier: TierNumber;
  col: ColumnNumber;
  depth: DepthPosition;
}

export interface CellCoordinates {
  rack: RackId;
  tier: TierNumber;
  col: ColumnNumber;
}

export type SlotKey = `${RackId}-${TierNumber}-${ColumnNumber}-${DepthPosition}`;
export type InventoryMap = Record<string, PackageItem>;

export type CameraPreset = 'angled' | 'front' | 'top';

export interface SearchMatch {
  slotKey: SlotKey;
  coords: SlotCoordinates;
  item: PackageItem;
  coordinateLabel: string;
  score: number;
}
