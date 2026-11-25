import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { CAMERA_PRESETS } from '../constants/rackLayout';

export interface CameraCommand {
  id: number;
  position: [number, number, number];
  target: [number, number, number];
}

interface CameraRigProps {
  cameraCommand: CameraCommand | null;
}

export function CameraRig({ cameraCommand }: CameraRigProps) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const isAnimatingRef = useRef(false);
  const goalPosRef = useRef(new THREE.Vector3(...CAMERA_PRESETS.angled.position));
  const goalTargetRef = useRef(new THREE.Vector3(...CAMERA_PRESETS.angled.target));

  useEffect(() => {
    if (!cameraCommand) return;
    goalPosRef.current.set(...cameraCommand.position);
    goalTargetRef.current.set(...cameraCommand.target);
    isAnimatingRef.current = true;
  }, [cameraCommand]);

  useFrame((_, delta) => {
    if (!isAnimatingRef.current || !controlsRef.current) return;

    const lambda = 6.5;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, goalPosRef.current.x, lambda, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, goalPosRef.current.y, lambda, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, goalPosRef.current.z, lambda, delta);

    const tgt = controlsRef.current.target;
    tgt.x = THREE.MathUtils.damp(tgt.x, goalTargetRef.current.x, lambda, delta);
    tgt.y = THREE.MathUtils.damp(tgt.y, goalTargetRef.current.y, lambda, delta);
    tgt.z = THREE.MathUtils.damp(tgt.z, goalTargetRef.current.z, lambda, delta);

    controlsRef.current.update();

    if (
      camera.position.distanceTo(goalPosRef.current) < 0.008 &&
      tgt.distanceTo(goalTargetRef.current) < 0.008
    ) {
      camera.position.copy(goalPosRef.current);
      tgt.copy(goalTargetRef.current);
      controlsRef.current.update();
      isAnimatingRef.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      target={CAMERA_PRESETS.angled.target}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.75}
      zoomSpeed={0.9}
      panSpeed={0.75}
      minDistance={0.65}
      maxDistance={7.2}
      minPolarAngle={0.12}
      maxPolarAngle={Math.PI * 0.492}
      minAzimuthAngle={-Math.PI * 0.47}
      maxAzimuthAngle={Math.PI * 0.47}
      onStart={() => {
        // Yield immediately if user grabs camera manually
        isAnimatingRef.current = false;
      }}
    />
  );
}
