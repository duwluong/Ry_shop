import { RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CameraControlsBar } from './components/CameraControlsBar';
import { CellDrawer } from './components/CellDrawer';
import { TopBar } from './components/TopBar';
import {
  CAMERA_PRESETS,
  getFocusCameraForSlot,
} from './constants/rackLayout';
import type { CameraCommand } from './three/CameraRig';
import { WarehouseCanvas } from './three/WarehouseCanvas';
import type {
  CameraPreset,
  CellCoordinates,
  DepthPosition,
  InventoryMap,
  SlotCoordinates,
  SlotKey,
} from './types/inventory';
import {
  computeStats,
  formatCurrencyVND,
  formatSlotCoordinate,
  LEGACY_STORAGE_KEY,
  makeSlotKey,
  searchInventory,
  STORAGE_INIT_KEY,
  STORAGE_KEY,
  validateAndSanitizeInventory,
} from './utils/inventoryUtils';
import { createSampleInventory } from './utils/sampleData';

interface ToastState {
  id: number;
  message: string;
  undoSnapshot?: InventoryMap;
}

function loadInitialInventory(): InventoryMap {
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY);
    const initializedV2 = localStorage.getItem(STORAGE_INIT_KEY);
    if (rawV2 !== null) {
      const parsed = validateAndSanitizeInventory(JSON.parse(rawV2));
      if (parsed) return parsed;
    }

    // Migrate any user-entered items from v1 if present, enriching legacy sample seeds with v2 sample values
    const rawV1 = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (rawV1 !== null && !initializedV2) {
      const parsedV1 = JSON.parse(rawV1) as Record<string, Record<string, unknown>>;
      const sampleV2 = createSampleInventory();
      const migrated = validateAndSanitizeInventory(parsedV1) ?? {};
      for (const [key, item] of Object.entries(migrated)) {
        if (item.id.startsWith('sample_') && sampleV2[key]) {
          migrated[key] = sampleV2[key];
        }
      }
      localStorage.setItem(STORAGE_INIT_KEY, '1');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }

    if (!initializedV2) {
      const sample = createSampleInventory();
      localStorage.setItem(STORAGE_INIT_KEY, '1');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
      return sample;
    }
  } catch {
    // Fallback gracefully
  }
  return {};
}

export function App() {
  const [inventory, setInventory] = useState<InventoryMap>(loadInitialInventory);
  const [selectedCell, setSelectedCell] = useState<CellCoordinates | null>(null);
  const [focusedDepth, setFocusedDepth] = useState<DepthPosition>('FRONT');
  const [hoveredSlot, setHoveredSlot] = useState<SlotCoordinates | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [manualFocusedKey, setManualFocusedKey] = useState<SlotKey | null>(null);

  const [activePreset, setActivePreset] = useState<CameraPreset | null>('angled');
  const [xrayMode, setXrayMode] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);

  const camCmdIdRef = useRef(1);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const lastZoomedQueryRef = useRef<string>('');

  // Persist every inventory update to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
      localStorage.setItem(STORAGE_INIT_KEY, '1');
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [inventory]);

  const showToast = useCallback((message: string, undoSnapshot?: InventoryMap) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast({ id: Date.now(), message, undoSnapshot });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 6000);
  }, []);

  const issueCameraCommand = useCallback(
    (
      position: [number, number, number],
      target: [number, number, number],
      preset: CameraPreset | null
    ) => {
      camCmdIdRef.current += 1;
      setActivePreset(preset);
      setCameraCommand({ id: camCmdIdRef.current, position, target });
    },
    []
  );

  const focusCameraOnSlot = useCallback(
    (coords: SlotCoordinates) => {
      const { position, target } = getFocusCameraForSlot(coords);
      issueCameraCommand(position, target, null);
    },
    [issueCameraCommand]
  );

  const searchMatches = useMemo(
    () => searchInventory(inventory, searchQuery),
    [inventory, searchQuery]
  );

  useEffect(() => {
    setActiveMatchIndex(0);
  }, [searchQuery]);

  // Smooth zoom automatically when search query finds matching stack(s)
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      lastZoomedQueryRef.current = '';
      return;
    }
    if (searchMatches.length === 0) return;
    if (lastZoomedQueryRef.current === q) return;

    const timer = window.setTimeout(() => {
      const top = searchMatches[0];
      if (top) {
        lastZoomedQueryRef.current = q;
        focusCameraOnSlot(top.coords);
      }
    }, 220);
    return () => window.clearTimeout(timer);
  }, [searchQuery, searchMatches, focusCameraOnSlot]);

  const highlightedKeys = useMemo(() => {
    const set = new Set<string>();
    if (searchQuery.trim() && searchMatches.length > 0) {
      for (const m of searchMatches) set.add(m.slotKey);
    } else if (manualFocusedKey && inventory[manualFocusedKey]) {
      set.add(manualFocusedKey);
    }
    return set;
  }, [searchQuery, searchMatches, manualFocusedKey, inventory]);

  const focusedMatchKey: SlotKey | null = useMemo(() => {
    if (searchQuery.trim() && searchMatches.length > 0) {
      return searchMatches[activeMatchIndex]?.slotKey ?? searchMatches[0]?.slotKey ?? null;
    }
    if (manualFocusedKey && inventory[manualFocusedKey]) {
      return manualFocusedKey;
    }
    return null;
  }, [searchQuery, searchMatches, activeMatchIndex, manualFocusedKey, inventory]);

  const stats = useMemo(() => computeStats(inventory), [inventory]);

  const handleSelectPreset = (preset: CameraPreset) => {
    setManualFocusedKey(null);
    const p = CAMERA_PRESETS[preset];
    issueCameraCommand(p.position, p.target, preset);
    setXrayMode(preset === 'top');
  };

  const handleSelectSlotOnRack = useCallback((coords: SlotCoordinates) => {
    setManualFocusedKey(null);
    setSelectedCell({ rack: coords.rack, tier: coords.tier, col: coords.col });
    setFocusedDepth(coords.depth);
  }, []);

  const handleSelectSearchMatch = (index: number, openDrawer = false) => {
    const match = searchMatches[index];
    if (!match) return;
    setActiveMatchIndex(index);
    focusCameraOnSlot(match.coords);
    if (openDrawer) {
      setSelectedCell({
        rack: match.coords.rack,
        tier: match.coords.tier,
        col: match.coords.col,
      });
      setFocusedDepth(match.coords.depth);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveMatchIndex(0);
    setManualFocusedKey(null);
    const p = CAMERA_PRESETS.angled;
    issueCameraCommand(p.position, p.target, 'angled');
  };

  const handleSaveSlot = (
    depth: DepthPosition,
    data: { customerName: string; totalAmount: number; startDate: string }
  ) => {
    if (!selectedCell) return;
    const key = makeSlotKey(selectedCell.rack, selectedCell.tier, selectedCell.col, depth);
    const isReplacing = Boolean(inventory[key]);
    setInventory((prev) => ({
      ...prev,
      [key]: {
        id: prev[key]?.id ?? `pkg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        customerName: data.customerName,
        totalAmount: data.totalAmount,
        startDate: data.startDate,
        updatedAt: new Date().toISOString(),
      },
    }));
    showToast(
      isReplacing
        ? `Đã cập nhật: ${data.customerName} (${formatCurrencyVND(data.totalAmount)})`
        : `Đã xếp đơn ${data.customerName} (${formatCurrencyVND(data.totalAmount)}) vào ${formatSlotCoordinate({
            ...selectedCell,
            depth,
          })}`
    );
  };

  const handleDeliverSlot = (coords: SlotCoordinates) => {
    const key = makeSlotKey(coords.rack, coords.tier, coords.col, coords.depth);
    const existing = inventory[key];
    if (!existing) return;

    const snapshot = { ...inventory };
    setInventory((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    showToast(
      `Đã giao đơn ${existing.customerName} (${formatCurrencyVND(existing.totalAmount)})`,
      snapshot
    );
  };

  const handleDeliverFrontAndPullBack = () => {
    if (!selectedCell) return;
    const frontKey = makeSlotKey(
      selectedCell.rack,
      selectedCell.tier,
      selectedCell.col,
      'FRONT'
    );
    const backKey = makeSlotKey(
      selectedCell.rack,
      selectedCell.tier,
      selectedCell.col,
      'BACK'
    );
    const frontItem = inventory[frontKey];
    const backItem = inventory[backKey];
    if (!frontItem || !backItem) return;

    const snapshot = { ...inventory };
    setInventory((prev) => {
      const next = { ...prev };
      next[frontKey] = {
        ...backItem,
        updatedAt: new Date().toISOString(),
      };
      delete next[backKey];
      return next;
    });
    setFocusedDepth('FRONT');
    showToast(
      `Đã giao ${frontItem.customerName} & đẩy ${backItem.customerName} lên TRƯỚC`,
      snapshot
    );
  };

  const handlePullBackToFront = () => {
    if (!selectedCell) return;
    const frontKey = makeSlotKey(
      selectedCell.rack,
      selectedCell.tier,
      selectedCell.col,
      'FRONT'
    );
    const backKey = makeSlotKey(
      selectedCell.rack,
      selectedCell.tier,
      selectedCell.col,
      'BACK'
    );
    const backItem = inventory[backKey];
    if (!backItem || inventory[frontKey]) return;

    const snapshot = { ...inventory };
    setInventory((prev) => {
      const next = { ...prev };
      next[frontKey] = {
        ...backItem,
        updatedAt: new Date().toISOString(),
      };
      delete next[backKey];
      return next;
    });
    setFocusedDepth('FRONT');
    showToast(`Đã đẩy ${backItem.customerName} lên vị trí TRƯỚC`, snapshot);
  };

  const handleExportJson = () => {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      totalPackages: stats.occupied,
      inventory,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const datePart = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `kho-don-don-${datePart}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Đã xuất file sao lưu (${stats.occupied} chồng đồ)`);
  };

  const handleImportJson = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const validated = validateAndSanitizeInventory(parsed);
      if (!validated) {
        showToast('File JSON không đúng định dạng sao lưu kệ hàng.');
        return;
      }
      const snapshot = { ...inventory };
      setInventory(validated);
      setSelectedCell(null);
      setSearchQuery('');
      setManualFocusedKey(null);
      showToast(
        `Đã khôi phục ${Object.keys(validated).length} chồng đồ từ file sao lưu`,
        snapshot
      );
    } catch {
      showToast('Không thể đọc file JSON. Vui lòng kiểm tra lại file.');
    }
  };

  const frontItem = selectedCell
    ? inventory[makeSlotKey(selectedCell.rack, selectedCell.tier, selectedCell.col, 'FRONT')]
    : undefined;
  const backItem = selectedCell
    ? inventory[makeSlotKey(selectedCell.rack, selectedCell.tier, selectedCell.col, 'BACK')]
    : undefined;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#eae6de]">
      {/* Interactive 3D Warehouse Viewport */}
      <WarehouseCanvas
        inventory={inventory}
        selectedCell={selectedCell}
        highlightedKeys={highlightedKeys}
        focusedMatchKey={focusedMatchKey}
        cameraCommand={cameraCommand}
        xrayMode={xrayMode}
        showLabels={showLabels}
        rack1Occupied={stats.rack1Occupied}
        rack2Occupied={stats.rack2Occupied}
        onSelectSlot={handleSelectSlotOnRack}
        onHoverSlot={setHoveredSlot}
      />

      {/* Streamlined Top Bar */}
      <TopBar
        stats={stats}
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setManualFocusedKey(null);
        }}
        matches={searchMatches}
        activeMatchIndex={activeMatchIndex}
        onSelectMatch={handleSelectSearchMatch}
        onClearSearch={handleClearSearch}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
      />

      {/* Bottom Camera Presets & Color Legend */}
      <CameraControlsBar
        activePreset={activePreset}
        xrayMode={xrayMode}
        showLabels={showLabels}
        hoveredSlot={hoveredSlot}
        onSelectPreset={handleSelectPreset}
        onToggleXray={() => setXrayMode((v) => !v)}
        onToggleLabels={() => setShowLabels((v) => !v)}
      />

      {/* 3-Field Cell Drawer / Mobile Bottom Sheet */}
      <CellDrawer
        selectedCell={selectedCell}
        focusedDepth={focusedDepth}
        frontItem={frontItem}
        backItem={backItem}
        onClose={() => setSelectedCell(null)}
        onChangeCell={(cell) => {
          setSelectedCell(cell);
          focusCameraOnSlot({ ...cell, depth: focusedDepth });
        }}
        onFocus3DCell={(coords) => {
          setFocusedDepth(coords.depth);
          setManualFocusedKey(
            makeSlotKey(coords.rack, coords.tier, coords.col, coords.depth)
          );
          focusCameraOnSlot(coords);
        }}
        onSaveSlot={handleSaveSlot}
        onDeliverSlot={(depth) => {
          if (!selectedCell) return;
          handleDeliverSlot({ ...selectedCell, depth });
        }}
        onDeliverFrontAndPullBack={handleDeliverFrontAndPullBack}
        onPullBackToFront={handlePullBackToFront}
      />

      {/* Floating Feedback / Undo Toast */}
      {toast && (
        <div className="pointer-events-auto fixed bottom-24 left-1/2 z-50 flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/95 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl backdrop-blur-md">
          <span className="truncate">{toast.message}</span>
          {toast.undoSnapshot && (
            <button
              type="button"
              onClick={() => {
                setInventory(toast.undoSnapshot!);
                setToast(null);
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-400 px-2.5 py-1 text-[11px] font-extrabold text-slate-950 hover:bg-amber-300"
            >
              <RotateCcw className="h-3 w-3" />
              Hoàn tác
            </button>
          )}
          <button
            type="button"
            onClick={() => setToast(null)}
            className="shrink-0 text-slate-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
