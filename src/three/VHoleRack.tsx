import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import {
  COLUMN_NUMBERS,
  getColCenterX,
  getRackCenterX,
  POST_SIZE,
  POST_THICKNESS,
  RACK_DEPTH,
  RACK_HEIGHT,
  RACK_WIDTH,
  TIER_NUMBERS,
  TIER_TOP_Y,
  TRAY_THICKNESS,
} from '../constants/rackLayout';
import type { RackId } from '../types/inventory';
import { createBadgeTexture } from './proceduralTextures';
import {
  getColBadgeTextures,
  getShelfDeckTexture,
  getTierBadgeTextures,
  getVPostTexture,
} from './sharedGeometries';

interface VHoleRackProps {
  rackId: RackId;
  xrayMode: boolean;
  occupiedCount: number;
}

const GUSSET_GEOMETRY = (() => {
  const shape = new THREE.Shape();
  const leg = 0.088;
  const arm = 0.022;
  shape.moveTo(0, 0);
  shape.lineTo(leg, 0);
  shape.lineTo(leg, arm);
  shape.lineTo(arm, leg);
  shape.lineTo(0, leg);
  shape.closePath();

  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.0035,
    bevelEnabled: true,
    bevelThickness: 0.0008,
    bevelSize: 0.0008,
    bevelSegments: 1,
  });
})();

/**
 * Models an authentic Vietnamese 5-tier slotted angle iron rack ("Kệ sắt V lỗ 5 tầng"):
 * - 4 corner slotted L-angle iron posts with punched V-holes
 * - 5 folded sheet-metal shelf trays (Tầng 1 top -> Tầng 5 bottom)
 * - Characteristic shiny galvanized silver corner gusset brackets ("ke góc kim loại") at top & bottom corners
 * - Plastic foot pads + clean column/rack identifiers
 */
export function VHoleRack({ rackId, xrayMode, occupiedCount }: VHoleRackProps) {
  const rackCenterX = getRackCenterX(rackId);

  const vPostTexture = getVPostTexture();
  const shelfDeckTexture = getShelfDeckTexture();
  const colTextures = getColBadgeTextures();
  const tierTextures = getTierBadgeTextures();

  const [rackHeaderTexture, setRackHeaderTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const tex = createBadgeTexture(`KỆ ${rackId}  •  ${occupiedCount}/60`, {
      bg: '#1e293b',
      border: '#475569',
      color: '#f8fafc',
      width: 300,
      height: 76,
      fontSize: 30,
    });
    setRackHeaderTexture(tex);
    return () => {
      tex.dispose();
    };
  }, [rackId, occupiedCount]);

  const halfW = RACK_WIDTH / 2;
  const halfD = RACK_DEPTH / 2;
  const postHalf = POST_SIZE / 2;
  const tHalf = POST_THICKNESS / 2;

  const corners: Array<{ xSign: -1 | 1; zSign: -1 | 1; key: string }> = [
    { xSign: -1, zSign: 1, key: 'FL' },
    { xSign: 1, zSign: 1, key: 'FR' },
    { xSign: -1, zSign: -1, key: 'BL' },
    { xSign: 1, zSign: -1, key: 'BR' },
  ];

  const postMatProps = useMemo(
    () => ({
      map: vPostTexture,
      color: '#dfe4ea',
      roughness: 0.44,
      metalness: 0.34,
    }),
    [vPostTexture]
  );

  return (
    <group position={[rackCenterX, 0, 0]}>
      {/* Rack Header Badge */}
      {rackHeaderTexture && (
        <sprite position={[0, RACK_HEIGHT + 0.34, 0]} scale={[0.56, 0.145, 1]}>
          <spriteMaterial map={rackHeaderTexture} transparent depthTest={false} />
        </sprite>
      )}

      {/* 4 Upright V-Hole Angle Iron Posts + Foot Pads + Top/Bottom Corner Gussets */}
      {corners.map(({ xSign, zSign, key }) => {
        const cornerX = xSign * halfW;
        const cornerZ = zSign * halfD;

        const xFlangePosX = cornerX - xSign * postHalf;
        const xFlangePosZ = cornerZ - zSign * tHalf;

        const zFlangePosX = cornerX - xSign * tHalf;
        const zFlangePosZ = cornerZ - zSign * postHalf;

        const gussetFaceZ = zSign > 0 ? cornerZ + 0.001 : cornerZ - 0.0045;
        const gussetTopY = RACK_HEIGHT;
        const gussetBotY = TIER_TOP_Y[5] - TRAY_THICKNESS;

        return (
          <group key={key}>
            {/* Front/Back facing flange */}
            <mesh
              position={[xFlangePosX, RACK_HEIGHT / 2, xFlangePosZ]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[POST_SIZE, RACK_HEIGHT, POST_THICKNESS]} />
              <meshStandardMaterial {...postMatProps} />
            </mesh>

            {/* Side facing flange */}
            <mesh
              position={[zFlangePosX, RACK_HEIGHT / 2, zFlangePosZ]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[POST_THICKNESS, RACK_HEIGHT, POST_SIZE]} />
              <meshStandardMaterial {...postMatProps} />
            </mesh>

            {/* Rubber/Plastic foot pad */}
            <mesh position={[cornerX - xSign * 0.02, 0.008, cornerZ - zSign * 0.02]} receiveShadow>
              <boxGeometry args={[0.046, 0.016, 0.046]} />
              <meshStandardMaterial color="#334155" roughness={0.85} metalness={0.1} />
            </mesh>

            {/* TOP corner gusset ("ke góc kim loại") */}
            <mesh
              geometry={GUSSET_GEOMETRY}
              position={[cornerX, gussetTopY, gussetFaceZ]}
              scale={[xSign < 0 ? 1 : -1, -1, 1]}
              castShadow
            >
              <meshStandardMaterial color="#dde3ea" roughness={0.24} metalness={0.86} />
            </mesh>
            {/* Hex bolt accents on top corner gusset */}
            <mesh
              position={[
                cornerX - xSign * 0.02,
                gussetTopY - 0.016,
                zSign > 0 ? gussetFaceZ + 0.005 : gussetFaceZ - 0.001,
              ]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.0045, 0.0045, 0.004, 6]} />
              <meshStandardMaterial color="#f1f5f9" roughness={0.2} metalness={0.92} />
            </mesh>
            <mesh
              position={[
                cornerX - xSign * 0.02,
                gussetTopY - 0.058,
                zSign > 0 ? gussetFaceZ + 0.005 : gussetFaceZ - 0.001,
              ]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.0045, 0.0045, 0.004, 6]} />
              <meshStandardMaterial color="#f1f5f9" roughness={0.2} metalness={0.92} />
            </mesh>

            {/* BOTTOM corner gusset ("ke góc kim loại") */}
            <mesh
              geometry={GUSSET_GEOMETRY}
              position={[cornerX, gussetBotY, gussetFaceZ]}
              scale={[xSign < 0 ? 1 : -1, 1, 1]}
              castShadow
            >
              <meshStandardMaterial color="#dde3ea" roughness={0.24} metalness={0.86} />
            </mesh>
            <mesh
              position={[
                cornerX - xSign * 0.02,
                gussetBotY + 0.016,
                zSign > 0 ? gussetFaceZ + 0.005 : gussetFaceZ - 0.001,
              ]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.0045, 0.0045, 0.004, 6]} />
              <meshStandardMaterial color="#f1f5f9" roughness={0.2} metalness={0.92} />
            </mesh>
          </group>
        );
      })}

      {/* 5 Metal Shelf Trays (Mâm tầng sắt V lỗ) */}
      {TIER_NUMBERS.map((tier) => {
        const topY = TIER_TOP_Y[tier];
        const trayW = RACK_WIDTH - 0.006;
        const trayD = RACK_DEPTH - 0.006;
        const flangeH = TRAY_THICKNESS;
        const flangeThick = 0.0045;
        const deckThick = 0.006;

        return (
          <group key={tier}>
            {/* Horizontal tray deck */}
            <mesh
              position={[0, topY - deckThick / 2, 0]}
              castShadow={!xrayMode}
              receiveShadow
            >
              <boxGeometry args={[trayW, deckThick, trayD]} />
              <meshStandardMaterial
                map={shelfDeckTexture}
                color={xrayMode ? '#cbd5e1' : '#e2e6eb'}
                roughness={0.38}
                metalness={0.34}
                transparent={xrayMode}
                opacity={xrayMode ? 0.22 : 1}
                depthWrite={!xrayMode}
              />
            </mesh>

            {/* Front folded tray lip */}
            <mesh
              position={[0, topY - flangeH / 2, halfD - flangeThick / 2 - 0.002]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[trayW, flangeH, flangeThick]} />
              <meshStandardMaterial
                color="#9aa2ac"
                roughness={0.4}
                metalness={0.36}
                transparent={xrayMode}
                opacity={xrayMode ? 0.48 : 1}
              />
            </mesh>

            {/* Back folded tray lip */}
            <mesh
              position={[0, topY - flangeH / 2, -halfD + flangeThick / 2 + 0.002]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[trayW, flangeH, flangeThick]} />
              <meshStandardMaterial
                color="#8c949f"
                roughness={0.42}
                metalness={0.36}
                transparent={xrayMode}
                opacity={xrayMode ? 0.35 : 1}
              />
            </mesh>

            {/* Left folded tray lip */}
            <mesh
              position={[-halfW + flangeThick / 2 + 0.002, topY - flangeH / 2, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[flangeThick, flangeH, trayD]} />
              <meshStandardMaterial
                color="#929aa5"
                roughness={0.42}
                metalness={0.36}
                transparent={xrayMode}
                opacity={xrayMode ? 0.4 : 1}
              />
            </mesh>

            {/* Right folded tray lip */}
            <mesh
              position={[halfW - flangeThick / 2 - 0.002, topY - flangeH / 2, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[flangeThick, flangeH, trayD]} />
              <meshStandardMaterial
                color="#929aa5"
                roughness={0.42}
                metalness={0.36}
                transparent={xrayMode}
                opacity={xrayMode ? 0.4 : 1}
              />
            </mesh>
          </group>
        );
      })}

      {/* Column markers ("Ô 1" .. "Ô 6") along bottom front rail */}
      {COLUMN_NUMBERS.map((col, idx) => {
        const localColX = getColCenterX(rackId, col) - rackCenterX;
        return (
          <sprite
            key={col}
            position={[localColX, 0.048, halfD + 0.014]}
            scale={[0.135, 0.062, 1]}
          >
            <spriteMaterial map={colTextures[idx]} transparent />
          </sprite>
        );
      })}

      {/* Tier labels ("Tầng 1" .. "Tầng 5") on outer flank of each rack */}
      {TIER_NUMBERS.map((tier, idx) => {
        const outerX = rackId === 1 ? -halfW - 0.12 : halfW + 0.12;
        return (
          <sprite
            key={tier}
            position={[outerX, TIER_TOP_Y[tier] + 0.08, 0.06]}
            scale={[0.22, 0.076, 1]}
          >
            <spriteMaterial map={tierTextures[idx]} transparent />
          </sprite>
        );
      })}
    </group>
  );
}
