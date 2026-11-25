import type { InventoryMap } from '../types/inventory';
import { makeSlotKey } from './inventoryUtils';

interface SampleSeed {
  rack: 1 | 2;
  tier: 1 | 2 | 3 | 4 | 5;
  col: 1 | 2 | 3 | 4 | 5 | 6;
  depth: 'FRONT' | 'BACK';
  customerName: string;
  totalAmount: number;
  startDate: string;
}

const SAMPLE_SEEDS: SampleSeed[] = [
  // KỆ 1 - Tầng 1
  { rack: 1, tier: 1, col: 1, depth: 'FRONT', customerName: 'Chị Ngọc Anh', totalAmount: 680000, startDate: '2026-11-22' },
  { rack: 1, tier: 1, col: 1, depth: 'BACK', customerName: 'Anh Minh Quân', totalAmount: 540000, startDate: '2026-11-20' },
  { rack: 1, tier: 1, col: 2, depth: 'FRONT', customerName: 'Bé Vy Shop', totalAmount: 920000, startDate: '2026-11-24' },
  { rack: 1, tier: 1, col: 4, depth: 'BACK', customerName: 'Cô Thu Hà', totalAmount: 1150000, startDate: '2026-11-19' },
  { rack: 1, tier: 1, col: 5, depth: 'FRONT', customerName: 'Chị Phương Thảo', totalAmount: 450000, startDate: '2026-11-23' },

  // KỆ 1 - Tầng 2
  { rack: 1, tier: 2, col: 1, depth: 'FRONT', customerName: 'Bạn Hoàng Long', totalAmount: 790000, startDate: '2026-11-23' },
  { rack: 1, tier: 2, col: 2, depth: 'FRONT', customerName: 'Chị Mai Lan', totalAmount: 620000, startDate: '2026-11-21' },
  { rack: 1, tier: 2, col: 2, depth: 'BACK', customerName: 'Anh Quốc Bảo', totalAmount: 840000, startDate: '2026-11-18' },
  { rack: 1, tier: 2, col: 4, depth: 'FRONT', customerName: 'Anh Tuấn Kiệt', totalAmount: 390000, startDate: '2026-11-24' },
  { rack: 1, tier: 2, col: 4, depth: 'BACK', customerName: 'Chị Linh', totalAmount: 750000, startDate: '2026-11-21' },
  { rack: 1, tier: 2, col: 6, depth: 'FRONT', customerName: 'Chị Thanh Trúc', totalAmount: 510000, startDate: '2026-11-25' },

  // KỆ 1 - Tầng 3
  { rack: 1, tier: 3, col: 1, depth: 'BACK', customerName: 'Anh Đức Thịnh', totalAmount: 650000, startDate: '2026-11-20' },
  { rack: 1, tier: 3, col: 2, depth: 'FRONT', customerName: 'Chị Bích Ngọc', totalAmount: 480000, startDate: '2026-11-22' },
  { rack: 1, tier: 3, col: 3, depth: 'FRONT', customerName: 'Em Khánh Huyền', totalAmount: 360000, startDate: '2026-11-24' },
  { rack: 1, tier: 3, col: 3, depth: 'BACK', customerName: 'Chị Mỹ Duyên', totalAmount: 580000, startDate: '2026-11-19' },
  { rack: 1, tier: 3, col: 5, depth: 'FRONT', customerName: 'Anh Gia Huy', totalAmount: 720000, startDate: '2026-11-23' },
  { rack: 1, tier: 3, col: 5, depth: 'BACK', customerName: 'Chị Hồng Nhung', totalAmount: 890000, startDate: '2026-11-18' },

  // KỆ 1 - Tầng 4
  { rack: 1, tier: 4, col: 1, depth: 'FRONT', customerName: 'Chị Thu Trang', totalAmount: 560000, startDate: '2026-11-22' },
  { rack: 1, tier: 4, col: 2, depth: 'BACK', customerName: 'Anh Hải Đăng', totalAmount: 950000, startDate: '2026-11-20' },
  { rack: 1, tier: 4, col: 4, depth: 'FRONT', customerName: 'Chị Kim Oanh', totalAmount: 1080000, startDate: '2026-11-25' },
  { rack: 1, tier: 4, col: 4, depth: 'BACK', customerName: 'Bạn Thảo Nhi', totalAmount: 420000, startDate: '2026-11-21' },
  { rack: 1, tier: 4, col: 6, depth: 'FRONT', customerName: 'Anh Trọng Nghĩa', totalAmount: 490000, startDate: '2026-11-23' },

  // KỆ 1 - Tầng 5
  { rack: 1, tier: 5, col: 2, depth: 'FRONT', customerName: 'Chị Diễm My', totalAmount: 830000, startDate: '2026-11-24' },
  { rack: 1, tier: 5, col: 3, depth: 'FRONT', customerName: 'Anh Thành Đạt', totalAmount: 640000, startDate: '2026-11-22' },
  { rack: 1, tier: 5, col: 3, depth: 'BACK', customerName: 'Chị Ánh Tuyết', totalAmount: 530000, startDate: '2026-11-19' },
  { rack: 1, tier: 5, col: 5, depth: 'BACK', customerName: 'Cô Minh Tâm', totalAmount: 770000, startDate: '2026-11-17' },

  // KỆ 2 - Tầng 1
  { rack: 2, tier: 1, col: 1, depth: 'FRONT', customerName: 'Chị Yến Nhi', totalAmount: 460000, startDate: '2026-11-24' },
  { rack: 2, tier: 1, col: 2, depth: 'BACK', customerName: 'Anh Hữu Phước', totalAmount: 690000, startDate: '2026-11-21' },
  { rack: 2, tier: 1, col: 3, depth: 'FRONT', customerName: 'Bạn Gia Hân', totalAmount: 380000, startDate: '2026-11-25' },
  { rack: 2, tier: 1, col: 3, depth: 'BACK', customerName: 'Chị Bảo Trâm', totalAmount: 550000, startDate: '2026-11-20' },
  { rack: 2, tier: 1, col: 5, depth: 'FRONT', customerName: 'Anh Việt Hoàng', totalAmount: 1420000, startDate: '2026-11-22' },

  // KỆ 2 - Tầng 2
  { rack: 2, tier: 2, col: 1, depth: 'FRONT', customerName: 'Chị Linh Đan', totalAmount: 960000, startDate: '2026-11-23' },
  { rack: 2, tier: 2, col: 1, depth: 'BACK', customerName: 'Anh Nhật Minh', totalAmount: 510000, startDate: '2026-11-19' },
  { rack: 2, tier: 2, col: 3, depth: 'FRONT', customerName: 'Chị Hoài An', totalAmount: 610000, startDate: '2026-11-24' },
  { rack: 2, tier: 2, col: 4, depth: 'BACK', customerName: 'Em Bảo Ngọc', totalAmount: 740000, startDate: '2026-11-21' },
  { rack: 2, tier: 2, col: 6, depth: 'FRONT', customerName: 'Anh Trung Kiên', totalAmount: 590000, startDate: '2026-11-25' },

  // KỆ 2 - Tầng 3
  { rack: 2, tier: 3, col: 2, depth: 'FRONT', customerName: 'Chị Kiều Trinh', totalAmount: 680000, startDate: '2026-11-23' },
  { rack: 2, tier: 3, col: 2, depth: 'BACK', customerName: 'Bạn Thanh Tú', totalAmount: 470000, startDate: '2026-11-20' },
  { rack: 2, tier: 3, col: 4, depth: 'FRONT', customerName: 'Chị Lan Hương', totalAmount: 430000, startDate: '2026-11-24' },
  { rack: 2, tier: 3, col: 5, depth: 'FRONT', customerName: 'Anh Tiến Dũng', totalAmount: 820000, startDate: '2026-11-22' },
  { rack: 2, tier: 3, col: 5, depth: 'BACK', customerName: 'Chị Quỳnh Anh', totalAmount: 990000, startDate: '2026-11-18' },

  // KỆ 2 - Tầng 4
  { rack: 2, tier: 4, col: 1, depth: 'BACK', customerName: 'Chị Thu Uyên', totalAmount: 540000, startDate: '2026-11-21' },
  { rack: 2, tier: 4, col: 3, depth: 'FRONT', customerName: 'Anh Công Thành', totalAmount: 410000, startDate: '2026-11-24' },
  { rack: 2, tier: 4, col: 3, depth: 'BACK', customerName: 'Chị Tường Vy', totalAmount: 630000, startDate: '2026-11-20' },
  { rack: 2, tier: 4, col: 6, depth: 'FRONT', customerName: 'Em Minh Thư', totalAmount: 350000, startDate: '2026-11-25' },

  // KỆ 2 - Tầng 5
  { rack: 2, tier: 5, col: 1, depth: 'FRONT', customerName: 'Chị Cẩm Tú', totalAmount: 520000, startDate: '2026-11-22' },
  { rack: 2, tier: 5, col: 4, depth: 'FRONT', customerName: 'Anh Hoàng Phúc', totalAmount: 780000, startDate: '2026-11-23' },
  { rack: 2, tier: 5, col: 4, depth: 'BACK', customerName: 'Chị Diệu Hiền', totalAmount: 490000, startDate: '2026-11-19' },
];

export function createSampleInventory(): InventoryMap {
  const now = new Date().toISOString();
  const map: InventoryMap = {};
  for (const seed of SAMPLE_SEEDS) {
    const key = makeSlotKey(seed.rack, seed.tier, seed.col, seed.depth);
    map[key] = {
      id: `sample_${key}`,
      customerName: seed.customerName,
      totalAmount: seed.totalAmount,
      startDate: seed.startDate,
      updatedAt: now,
    };
  }
  return map;
}
