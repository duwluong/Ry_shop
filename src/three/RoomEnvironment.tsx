import { getWoodFloorTexture } from './sharedGeometries';

export function RoomEnvironment() {
  const woodTexture = getWoodFloorTexture();

  return (
    <group>
      {/* Warm boutique/shop ambient and directional studio lights */}
      <ambientLight intensity={0.8} color="#fffbf5" />
      <hemisphereLight args={['#f8fafc', '#d6c3b0', 0.56]} />

      {/* Main key directional light casting soft rack & parcel shadows */}
      <directionalLight
        position={[3.4, 5.2, 4.2]}
        intensity={1.25}
        color="#fffdf8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-near={0.5}
        shadow-camera-far={15}
        shadow-camera-left={-3.2}
        shadow-camera-right={3.2}
        shadow-camera-top={3.2}
        shadow-camera-bottom={-1.0}
      />

      {/* Fill light from opposite front angle so INNER/SAU packages inside shelves stay well-lit */}
      <directionalLight position={[-3.2, 2.4, 3.6]} intensity={0.55} color="#eef6ff" />
      <directionalLight position={[0, 1.5, 4.0]} intensity={0.34} color="#ffffff" />

      {/* Laminate Wood Floor (matching reference photo) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.8]} receiveShadow>
        <planeGeometry args={[12, 9]} />
        <meshStandardMaterial map={woodTexture} roughness={0.72} metalness={0.04} />
      </mesh>

      {/* Clean Off-White Back Wall */}
      <mesh position={[0, 1.9, -0.355]} receiveShadow>
        <planeGeometry args={[12, 4.2]} />
        <meshStandardMaterial color="#f1efe9" roughness={0.92} metalness={0.0} />
      </mesh>

      {/* Brown Wood Baseboard / Len chân tường */}
      <mesh position={[0, 0.045, -0.348]} receiveShadow>
        <boxGeometry args={[12, 0.09, 0.015]} />
        <meshStandardMaterial color="#6d472b" roughness={0.65} metalness={0.05} />
      </mesh>
    </group>
  );
}
