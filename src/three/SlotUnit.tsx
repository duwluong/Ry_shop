import { Html } from '@react-three/drei';
import { type ThreeEvent, useFrame } from '@react-three/fiber';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  BACK_PKG_HEIGHT,
  FRONT_PKG_HEIGHT,
  getSlotWorldPosition,
  SLOT_BOX_DEPTH,
  SLOT_BOX_WIDTH,
} from '../constants/rackLayout';
import type { PackageItem, SlotCoordinates } from '../types/inventory';
import {
  formatCurrencyVND,
  formatDateVN,
  formatSlotCoordinate,
  getDepthLabel,
} from '../utils/inventoryUtils';
import { createPackageLabelTexture } from './proceduralTextures';
import {
  SHARED_BOUTIQUE_TAG_GEO,
  SHARED_EMPTY_EDGES_GEO,
  SHARED_GARMENT_LAYER_GEO,
  SHARED_HIGHLIGHT_EDGES_GEO,
  SHARED_HIT_BOX_GEO,
  SHARED_RIBBON_CROSS_GEO,
  SHARED_RIBBON_SIDE_GEO,
  SHARED_RIBBON_TOP_GEO,
  SHARED_TAG_DOT_GEO,
} from './sharedGeometries';

interface SlotUnitProps {
  coords: SlotCoordinates;
  item?: PackageItem;
  isCellSelected: boolean;
  isHighlighted: boolean;
  isFocusedMatch: boolean;
  isSearchActive: boolean;
  showLabels: boolean;
  onSelectSlot: (coords: SlotCoordinates) => void;
  onHoverSlot: (coords: SlotCoordinates | null) => void;
}

// Color palettes for layered folded garments
// TRƯỚC: Xanh dương pastel / Xanh denim
const FRONT_GARMENT_PALETTE = ['#466b99', '#8ecae6', '#5d8ac2', '#bae6fd'];
// SAU: Vàng kem / Cam đất ấm
const BACK_GARMENT_PALETTE = ['#c4693a', '#fde68a', '#e38a4b', '#fef3c7'];

const FRONT_DIMMED_PALETTE = ['#93a6bd', '#b4c5d6', '#9fb3c8', '#c6d4e1'];
const BACK_DIMMED_PALETTE = ['#c4aa96', '#d8cbbd', '#cbb6a4', '#dfd5c8'];

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

interface LayerSpec {
  yBase: number;
  height: number;
  scaleX: number;
  scaleZ: number;
  yaw: number;
  colorIndex: number;
}

export const SlotUnit = memo(function SlotUnit({
  coords,
  item,
  isCellSelected,
  isHighlighted,
  isFocusedMatch,
  isSearchActive,
  showLabels,
  onSelectSlot,
  onHoverSlot,
}: SlotUnitProps) {
  const [hovered, setHovered] = useState(false);
  const [labelTex, setLabelTex] = useState<THREE.CanvasTexture | null>(null);

  const layerMatRefs = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  const highlightEdgeMatRef = useRef<THREE.LineBasicMaterial>(null);
  const beaconRef = useRef<THREE.Mesh>(null);
  const groupScaleRef = useRef<THREE.Group>(null);

  const [wx, wy, wz] = useMemo(() => getSlotWorldPosition(coords), [coords]);
  const isFront = coords.depth === 'FRONT';
  const baseHeight = isFront ? FRONT_PKG_HEIGHT : BACK_PKG_HEIGHT;

  // Build 3 or 4 stacked folded clothing layers deterministically from item
  const { layers, totalStackHeight, stackYaw, ribbonOffset } = useMemo(() => {
    if (!item) {
      return {
        layers: [] as LayerSpec[],
        totalStackHeight: baseHeight,
        stackYaw: 0,
        ribbonOffset: 0,
      };
    }

    const r = hashSeed(`${item.id}_${item.customerName}`);
    const layerCount = r > 0.38 ? 4 : 3;
    const totalH = baseHeight * (0.94 + r * 0.14);
    const avgLayerH = totalH / layerCount;

    const specs: LayerSpec[] = [];
    let currentY = 0;
    for (let i = 0; i < layerCount; i++) {
      const subSeed = hashSeed(`${item.customerName}_L${i}`);
      const h = avgLayerH * (0.9 + subSeed * 0.2);
      // Slight tapering upward like neatly stacked shirts/jeans
      const topTaper = 1 - i * 0.022;
      specs.push({
        yBase: currentY,
        height: h,
        scaleX: topTaper * (0.95 + subSeed * 0.07),
        scaleZ: topTaper * (0.95 + ((subSeed * 7) % 1) * 0.07),
        yaw: (subSeed - 0.5) * 0.085,
        colorIndex: (i + Math.floor(r * 4)) % 4,
      });
      currentY += h * 0.96; // tiny overlap so layers sit snugly together
    }

    return {
      layers: specs,
      totalStackHeight: currentY,
      stackYaw: (r - 0.5) * 0.06,
      ribbonOffset: (r - 0.5) * 0.018,
    };
  }, [item, baseHeight]);

  // Create & cleanly dispose CanvasTexture for floating customer name billboard
  useEffect(() => {
    if (!item) {
      setLabelTex(null);
      return;
    }
    const tex = createPackageLabelTexture(item.customerName, coords.depth, isHighlighted);
    setLabelTex(tex);
    return () => {
      tex.dispose();
    };
  }, [item?.customerName, coords.depth, isHighlighted, Boolean(item)]);

  const isDimmed = isSearchActive && !isHighlighted;

  // Animate pulsing glow on search match & smooth hover/focus scale
  useFrame(({ clock }, delta) => {
    if (isHighlighted) {
      const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 5.8);
      for (const mat of layerMatRefs.current) {
        if (mat) mat.emissiveIntensity = 0.36 + pulse * 0.85;
      }
      if (highlightEdgeMatRef.current) {
        highlightEdgeMatRef.current.opacity = 0.55 + pulse * 0.45;
      }
      if (beaconRef.current) {
        beaconRef.current.position.y = totalStackHeight + 0.21 + pulse * 0.045;
        beaconRef.current.rotation.y += delta * 2.2;
      }
    } else {
      const targetEmissive = hovered || isCellSelected ? 0.22 : 0.03;
      for (const mat of layerMatRefs.current) {
        if (mat && mat.emissiveIntensity !== targetEmissive) {
          mat.emissiveIntensity = targetEmissive;
        }
      }
    }

    if (groupScaleRef.current) {
      const targetScale = hovered || isFocusedMatch ? 1.045 : isCellSelected ? 1.02 : 1.0;
      const s = THREE.MathUtils.damp(groupScaleRef.current.scale.x, targetScale, 10, delta);
      groupScaleRef.current.scale.set(s, s, s);
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
    onHoverSlot(coords);
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'auto';
    onHoverSlot(null);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 5) return; // Ignore orbit drag releases
    onSelectSlot(coords);
  };

  const palette = isDimmed
    ? isFront
      ? FRONT_DIMMED_PALETTE
      : BACK_DIMMED_PALETTE
    : isFront
      ? FRONT_GARMENT_PALETTE
      : BACK_GARMENT_PALETTE;

  const ribbonColor = isDimmed ? '#cbd5e1' : isFront ? '#f8fafc' : '#fff7ed';
  const tagColor = isDimmed ? '#e2e8f0' : '#fffdf7';
  const tagAccentColor = isFront ? '#0284c7' : '#d97706';

  const emissiveColor = isHighlighted
    ? '#facc15'
    : isFront
      ? '#0284c7'
      : '#ea580c';

  const labelY = isFront ? totalStackHeight + 0.048 : totalStackHeight + 0.128;
  const halfRibbonD = SLOT_BOX_DEPTH * 0.445;

  return (
    <group position={[wx, wy, wz]}>
      {/* Invisible reliable raycast hit volume */}
      <mesh
        geometry={SHARED_HIT_BOX_GEO}
        position={[0, FRONT_PKG_HEIGHT / 2, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {item ? (
        <group ref={groupScaleRef} rotation={[0, stackYaw, 0]}>
          {/* 3-4 Folded Garment Layers */}
          {layers.map((layer, idx) => (
            <mesh
              key={idx}
              geometry={SHARED_GARMENT_LAYER_GEO}
              position={[0, layer.yBase, 0]}
              scale={[layer.scaleX, layer.height, layer.scaleZ]}
              rotation={[0, layer.yaw, 0]}
              castShadow={!isDimmed}
              receiveShadow
            >
              <meshStandardMaterial
                ref={(el) => {
                  layerMatRefs.current[idx] = el;
                }}
                color={palette[layer.colorIndex]}
                emissive={emissiveColor}
                emissiveIntensity={
                  isHighlighted ? 0.65 : hovered || isCellSelected ? 0.22 : 0.03
                }
                roughness={0.86} // Soft cotton/fabric matte finish
                metalness={0.02}
                transparent={isDimmed}
                opacity={isDimmed ? 0.2 : 1}
                depthWrite={!isDimmed}
              />
            </mesh>
          ))}

          {/* Fabric Ribbon / Strap Band tied around the stack */}
          <group position={[ribbonOffset, 0, 0]}>
            {/* Top horizontal ribbon strap */}
            <mesh
              geometry={SHARED_RIBBON_TOP_GEO}
              position={[0, totalStackHeight + 0.002, 0]}
              castShadow={!isDimmed}
            >
              <meshStandardMaterial
                color={ribbonColor}
                roughness={0.68}
                transparent={isDimmed}
                opacity={isDimmed ? 0.2 : 0.96}
                depthWrite={!isDimmed}
              />
            </mesh>

            {/* Cross ribbon strap */}
            <mesh
              geometry={SHARED_RIBBON_CROSS_GEO}
              position={[-ribbonOffset, totalStackHeight + 0.001, 0]}
            >
              <meshStandardMaterial
                color={ribbonColor}
                roughness={0.68}
                transparent={isDimmed}
                opacity={isDimmed ? 0.2 : 0.95}
                depthWrite={!isDimmed}
              />
            </mesh>

            {/* Front vertical ribbon band */}
            <mesh
              geometry={SHARED_RIBBON_SIDE_GEO}
              position={[0, totalStackHeight / 2, halfRibbonD]}
              scale={[1, totalStackHeight, 1]}
            >
              <meshStandardMaterial
                color={ribbonColor}
                roughness={0.68}
                transparent={isDimmed}
                opacity={isDimmed ? 0.2 : 0.96}
                depthWrite={!isDimmed}
              />
            </mesh>

            {/* Back vertical ribbon band */}
            <mesh
              geometry={SHARED_RIBBON_SIDE_GEO}
              position={[0, totalStackHeight / 2, -halfRibbonD]}
              scale={[1, totalStackHeight, 1]}
            >
              <meshStandardMaterial
                color={ribbonColor}
                roughness={0.68}
                transparent={isDimmed}
                opacity={isDimmed ? 0.2 : 0.96}
                depthWrite={!isDimmed}
              />
            </mesh>

            {/* Small tilted paper hang-tag ("tem nhỏ") tucked into the ribbon */}
            <group
              position={[0.026, totalStackHeight + 0.0055, 0.025]}
              rotation={[0, -0.35, 0]}
            >
              <mesh geometry={SHARED_BOUTIQUE_TAG_GEO}>
                <meshStandardMaterial
                  color={tagColor}
                  roughness={0.7}
                  transparent={isDimmed}
                  opacity={isDimmed ? 0.2 : 0.98}
                  depthWrite={!isDimmed}
                />
              </mesh>
              <mesh
                geometry={SHARED_TAG_DOT_GEO}
                position={[-0.018, 0.001, 0]}
              >
                <meshStandardMaterial
                  color={tagAccentColor}
                  roughness={0.45}
                  transparent={isDimmed}
                  opacity={isDimmed ? 0.2 : 1}
                  depthWrite={!isDimmed}
                />
              </mesh>
            </group>
          </group>

          {/* Glowing / Selected Wireframe Outline */}
          {(isHighlighted || hovered || isCellSelected) && (
            <lineSegments
              geometry={SHARED_HIGHLIGHT_EDGES_GEO}
              position={[0, totalStackHeight * 0.5, 0]}
              scale={[1, totalStackHeight, 1]}
            >
              <lineBasicMaterial
                ref={highlightEdgeMatRef}
                color={
                  isHighlighted
                    ? '#fde047'
                    : isFront
                      ? '#0284c7'
                      : '#ea580c'
                }
                transparent
                opacity={isHighlighted ? 0.95 : 0.85}
              />
            </lineSegments>
          )}

          {/* Bobbing Beacon Arrow for focused search match */}
          {isHighlighted && (
            <mesh
              ref={beaconRef}
              position={[0, totalStackHeight + 0.22, 0]}
              rotation={[Math.PI, 0, 0]}
            >
              <coneGeometry args={[0.028, 0.058, 4]} />
              <meshStandardMaterial
                color="#fde047"
                emissive="#f59e0b"
                emissiveIntensity={0.85}
                roughness={0.25}
              />
            </mesh>
          )}

          {/* Floating Billboard Customer Name Tag */}
          {labelTex && (showLabels || isHighlighted || hovered || isCellSelected) && (
            <sprite
              position={[0, labelY, 0]}
              scale={[isHighlighted ? 0.27 : 0.225, isHighlighted ? 0.07 : 0.058, 1]}
              renderOrder={isHighlighted ? 10 : isFront ? 2 : 3}
            >
              <spriteMaterial
                map={labelTex}
                transparent
                opacity={isDimmed ? 0.14 : 0.97}
                depthTest={!isHighlighted}
              />
            </sprite>
          )}

          {/* Rich HTML Popover ONLY on hovered slot showing the 3 core fields */}
          {hovered && (
            <Html
              position={[0, labelY + 0.075, 0]}
              center
              style={{ pointerEvents: 'none' }}
              zIndexRange={[10, 0]}
            >
              <div className="min-w-[195px] max-w-[240px] rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 text-left shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-extrabold text-slate-900">
                    {item.customerName}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isFront
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {getDepthLabel(coords.depth)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                  <span className="font-extrabold text-emerald-700">
                    {formatCurrencyVND(item.totalAmount)}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">
                    Từ {formatDateVN(item.startDate)}
                  </span>
                </div>
                <div className="mt-1.5 border-t border-slate-100 pt-1 text-[10px] font-semibold text-slate-500">
                  {formatSlotCoordinate(coords)}
                </div>
              </div>
            </Html>
          )}
        </group>
      ) : (
        /* Empty Slot Subtle Wireframe */
        <group>
          <lineSegments
            geometry={SHARED_EMPTY_EDGES_GEO}
            position={[0, baseHeight * 0.45, 0]}
            scale={[1, baseHeight * 0.9, 1]}
          >
            <lineBasicMaterial
              color={
                hovered || isCellSelected
                  ? isFront
                    ? '#0284c7'
                    : '#ea580c'
                  : isFront
                    ? '#64748b'
                    : '#94a3b8'
              }
              transparent
              opacity={
                hovered || isCellSelected
                  ? 0.85
                  : isDimmed
                    ? 0.06
                    : isFront
                      ? 0.24
                      : 0.18
              }
            />
          </lineSegments>

          {(hovered || isCellSelected) && (
            <mesh position={[0, baseHeight * 0.45, 0]}>
              <boxGeometry args={[SLOT_BOX_WIDTH * 0.9, baseHeight * 0.9, SLOT_BOX_DEPTH * 0.86]} />
              <meshBasicMaterial
                color={isFront ? '#38bdf8' : '#fb923c'}
                transparent
                opacity={hovered ? 0.16 : 0.09}
                depthWrite={false}
              />
            </mesh>
          )}

          {hovered && (
            <Html
              position={[0, baseHeight + 0.05, 0]}
              center
              style={{ pointerEvents: 'none' }}
              zIndexRange={[10, 0]}
            >
              <div className="whitespace-nowrap rounded-lg border border-slate-200 bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-lg backdrop-blur">
                <span
                  className={`mr-1.5 inline-block h-2 w-2 rounded-full ${
                    isFront ? 'bg-sky-500' : 'bg-orange-500'
                  }`}
                />
                {formatSlotCoordinate(coords)} •{' '}
                <span className="text-emerald-600">Trống (Bấm để dồn đơn)</span>
              </div>
            </Html>
          )}
        </group>
      )}
    </group>
  );
});
