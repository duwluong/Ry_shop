import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';
import {
  CAMERA_PRESETS,
  COLUMN_NUMBERS,
  DEPTH_POSITIONS,
  RACK_IDS,
  TIER_NUMBERS,
} from '../constants/rackLayout';
import type {
  CellCoordinates,
  InventoryMap,
  SlotCoordinates,
  SlotKey,
} from '../types/inventory';
import { makeSlotKey } from '../utils/inventoryUtils';
import { CameraRig, type CameraCommand } from './CameraRig';
import { RoomEnvironment } from './RoomEnvironment';
import { SlotUnit } from './SlotUnit';
import { VHoleRack } from './VHoleRack';

interface WarehouseCanvasProps {
  inventory: InventoryMap;
  selectedCell: CellCoordinates | null;
  highlightedKeys: Set<string>;
  focusedMatchKey: SlotKey | null;
  cameraCommand: CameraCommand | null;
  xrayMode: boolean;
  showLabels: boolean;
  rack1Occupied: number;
  rack2Occupied: number;
  onSelectSlot: (coords: SlotCoordinates) => void;
  onHoverSlot: (coords: SlotCoordinates | null) => void;
}

export function WarehouseCanvas({
  inventory,
  selectedCell,
  highlightedKeys,
  focusedMatchKey,
  cameraCommand,
  xrayMode,
  showLabels,
  rack1Occupied,
  rack2Occupied,
  onSelectSlot,
  onHoverSlot,
}: WarehouseCanvasProps) {
  const allSlots = useMemo(() => {
    const list: Array<{ key: SlotKey; coords: SlotCoordinates }> = [];
    for (const rack of RACK_IDS) {
      for (const tier of TIER_NUMBERS) {
        for (const col of COLUMN_NUMBERS) {
          for (const depth of DEPTH_POSITIONS) {
            list.push({
              key: makeSlotKey(rack, tier, col, depth),
              coords: { rack, tier, col, depth },
            });
          }
        }
      }
    }
    return list;
  }, []);

  const isSearchActive = highlightedKeys.size > 0;

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{
        position: CAMERA_PRESETS.angled.position,
        fov: 42,
        near: 0.1,
        far: 40,
      }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      className="h-full w-full touch-none"
    >
      <color attach="background" args={['#eae6de']} />
      <fog attach="fog" args={['#eae6de', 7.5, 16]} />

      <RoomEnvironment />

      {/* 2 Side-by-Side 5-Tier V-Hole Steel Racks */}
      <VHoleRack rackId={1} xrayMode={xrayMode} occupiedCount={rack1Occupied} />
      <VHoleRack rackId={2} xrayMode={xrayMode} occupiedCount={rack2Occupied} />

      {/* All 120 Package / Empty Wireframe Slots */}
      <group>
        {allSlots.map(({ key, coords }) => {
          const isCellSelected =
            selectedCell !== null &&
            selectedCell.rack === coords.rack &&
            selectedCell.tier === coords.tier &&
            selectedCell.col === coords.col;

          return (
            <SlotUnit
              key={key}
              coords={coords}
              item={inventory[key]}
              isCellSelected={isCellSelected}
              isHighlighted={highlightedKeys.has(key)}
              isFocusedMatch={focusedMatchKey === key}
              isSearchActive={isSearchActive}
              showLabels={showLabels}
              onSelectSlot={onSelectSlot}
              onHoverSlot={onHoverSlot}
            />
          );
        })}
      </group>

      <CameraRig cameraCommand={cameraCommand} />
    </Canvas>
  );
}
