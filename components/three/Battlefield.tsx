'use client';

import { useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdaptiveDpr, PerformanceMonitor, Preload, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { fbm, ridged } from '@/lib/noise';
import { getPointer } from '@/lib/pointer';

/**
 * The hero battlefield.
 *
 * Everything here is generated in code — terrain from fBm, aircraft from
 * primitives, smoke from a canvas-drawn sprite texture. No model or texture
 * downloads, so the hero paints as soon as the bundle does.
 *
 * Budget: one directional light with a 1024 shadow map, ~14 draw calls, and a
 * DPR ceiling of 1.75 that PerformanceMonitor drops further on weak GPUs.
 */

type Props = {
  /** 0 → 1 scroll progress through the pinned hero, written by GSAP. */
  progress: RefObject<number>;
  quality?: 'high' | 'low';
};

/* -------------------------------------------------------------------------- */
/* Terrain                                                                    */
/* -------------------------------------------------------------------------- */

function Terrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(900, 900, 150, 150);
    const position = geo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(position.count * 3);

    const scorched = new THREE.Color('#1a1512');
    const dirt = new THREE.Color('#2e2a22');
    const grass = new THREE.Color('#2b3526');
    const rock = new THREE.Color('#3b3f42');

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);

      // Broad landform + fine detail. The rim rises so the horizon reads as
      // a valley rather than an infinite plane.
      const rim = Math.max(0, (Math.hypot(x, y) - 210) / 300);
      const h =
        fbm(x * 0.0055, y * 0.0055, 5) * 22 +
        fbm(x * 0.021, y * 0.021, 3) * 4.2 +
        rim * rim * 70;

      position.setZ(i, h);

      // Vertex colouring stands in for a splat map.
      const slope = Math.abs(fbm(x * 0.03, y * 0.03, 2));
      const colour = grass.clone();
      colour.lerp(dirt, THREE.MathUtils.clamp(slope * 1.6, 0, 1));
      colour.lerp(rock, THREE.MathUtils.clamp((h - 16) / 44, 0, 1));
      // Burn scars near the centre of the valley.
      const burn = THREE.MathUtils.clamp(1 - Math.hypot(x + 40, y - 30) / 150, 0, 1);
      colour.lerp(scorched, burn * 0.75);

      colors[i * 3] = colour.r;
      colors[i * 3 + 1] = colour.g;
      colors[i * 3 + 2] = colour.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -26, 0]} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.96} metalness={0.02} dithering />
    </mesh>
  );
}

/** Distant ridgeline — a flat ridged-noise silhouette, nearly black. */
function Ridgeline({ distance, height, tint }: { distance: number; height: number; tint: string }) {
  const geometry = useMemo(() => {
    const segments = 220;
    const width = 2400;
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -width / 2 + t * width;
      const h = ridged(t * 6.5 + distance * 0.01, distance * 0.37, 4) * height;
      shape.lineTo(x, h);
    }
    shape.lineTo(width / 2, -400);
    shape.lineTo(-width / 2, -400);
    shape.closePath();

    return new THREE.ShapeGeometry(shape);
  }, [distance, height]);

  return (
    <mesh geometry={geometry} position={[0, -34, -distance]}>
      <meshBasicMaterial color={tint} fog={false} transparent opacity={0.96} />
    </mesh>
  );
}

/* -------------------------------------------------------------------------- */
/* Aircraft                                                                   */
/* -------------------------------------------------------------------------- */

function Helicopter({
  radius,
  height,
  speed,
  phase,
  scale = 1,
}: {
  radius: number;
  height: number;
  speed: number;
  phase: number;
  scale?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const mainRotor = useRef<THREE.Mesh>(null);
  const tailRotor = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime * speed + phase;
    const g = group.current;
    if (g) {
      // Orbit with a lazy bob and a bank into the turn.
      g.position.set(Math.cos(t) * radius, height + Math.sin(t * 2.3) * 3.5, Math.sin(t) * radius);
      g.rotation.y = -t + Math.PI / 2;
      g.rotation.z = Math.sin(t) * 0.06 - 0.16;
      g.rotation.x = Math.sin(t * 1.7) * 0.03;
    }
    // Rotors spin on their own clock so they read as fast even at low FPS.
    if (mainRotor.current) mainRotor.current.rotation.y += delta * 44;
    if (tailRotor.current) tailRotor.current.rotation.x += delta * 62;
    if (light.current) {
      light.current.intensity = 5 + Math.sin(state.clock.elapsedTime * 9 + phase) * 4.5;
    }
  });

  return (
    <group ref={group} scale={scale}>
      {/* Fuselage */}
      <mesh castShadow>
        <capsuleGeometry args={[1.5, 4.2, 4, 12]} />
        <meshStandardMaterial color="#1c2126" roughness={0.72} metalness={0.55} />
      </mesh>
      {/* Cockpit glass */}
      <mesh position={[2.6, 0.3, 0]}>
        <sphereGeometry args={[1.35, 14, 12]} />
        <meshStandardMaterial
          color="#0a1218"
          roughness={0.12}
          metalness={0.9}
          envMapIntensity={1.6}
        />
      </mesh>
      {/* Tail boom */}
      <mesh position={[-4.4, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.34, 0.6, 5.2, 8]} />
        <meshStandardMaterial color="#1c2126" roughness={0.72} metalness={0.5} />
      </mesh>
      {/* Vertical stabiliser */}
      <mesh position={[-6.7, 1.3, 0]}>
        <boxGeometry args={[1.5, 2.1, 0.18]} />
        <meshStandardMaterial color="#171b1f" roughness={0.8} />
      </mesh>
      {/* Skids */}
      {[-1.1, 1.1].map((z) => (
        <mesh key={z} position={[0, -2, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.12, 0.12, 5, 6]} />
          <meshStandardMaterial color="#0f1214" roughness={0.9} />
        </mesh>
      ))}
      {/* Rotor mast */}
      <mesh position={[0, 1.9, 0]}>
        <cylinderGeometry args={[0.22, 0.3, 1.1, 8]} />
        <meshStandardMaterial color="#2a3136" metalness={0.8} roughness={0.4} />
      </mesh>
      {/* Main rotor disc — a translucent blurred disc reads better than blades */}
      <mesh ref={mainRotor} position={[0, 2.5, 0]}>
        <cylinderGeometry args={[8.4, 8.4, 0.06, 24]} />
        <meshBasicMaterial color="#0c1013" transparent opacity={0.24} side={THREE.DoubleSide} />
      </mesh>
      {[0, Math.PI / 2].map((r) => (
        <mesh key={r} position={[0, 2.52, 0]} rotation={[0, r, 0]}>
          <boxGeometry args={[16.4, 0.07, 0.62]} />
          <meshStandardMaterial color="#14181b" roughness={0.85} />
        </mesh>
      ))}
      {/* Tail rotor */}
      <mesh ref={tailRotor} position={[-6.8, 1.3, 0.28]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.5, 1.5, 0.05, 16]} />
        <meshBasicMaterial color="#0c1013" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      {/* Anti-collision beacon */}
      <pointLight ref={light} position={[0, -2.2, 0]} color="#ff1f3d" intensity={6} distance={40} />
      <mesh position={[0, -2.2, 0]}>
        <sphereGeometry args={[0.28, 8, 8]} />
        <meshBasicMaterial color="#ff2b44" />
      </mesh>
      {/* Searchlight cone */}
      <mesh position={[2.2, -1.6, 0]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[2.6, 16, 12, 1, true]} />
        <meshBasicMaterial
          color="#ffd7a0"
          transparent
          opacity={0.045}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/** The supply plane — a slow, high, unhurried crossing of the sky. */
function SupplyPlane() {
  const group = useRef<THREE.Group>(null);
  const trailA = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    // Loops every ~54 s across the full width of the sky.
    const t = ((state.clock.elapsedTime * 9) % 900) - 450;
    g.position.set(t, 118 + Math.sin(state.clock.elapsedTime * 0.4) * 3, -260);
    g.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
    if (trailA.current) {
      const m = trailA.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.1 + Math.sin(state.clock.elapsedTime * 1.4) * 0.03;
    }
  });

  return (
    <group ref={group} rotation={[0, Math.PI / 2, 0]} scale={2.1}>
      {/* Fuselage */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[1.5, 11, 4, 10]} />
        <meshStandardMaterial color="#20262b" roughness={0.7} metalness={0.4} />
      </mesh>
      {/* Wing */}
      <mesh position={[0, 0.7, 0.5]}>
        <boxGeometry args={[22, 0.34, 3]} />
        <meshStandardMaterial color="#1a1f23" roughness={0.75} metalness={0.35} />
      </mesh>
      {/* Engines */}
      {[-6.5, -3.4, 3.4, 6.5].map((x) => (
        <mesh key={x} position={[x, 0.35, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.5, 0.44, 2.4, 8]} />
          <meshStandardMaterial color="#12161a" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
      {/* Tail */}
      <mesh position={[0, 2.1, -6.2]}>
        <boxGeometry args={[0.3, 3.6, 2.4]} />
        <meshStandardMaterial color="#1a1f23" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.5, -6.4]}>
        <boxGeometry args={[8.5, 0.26, 1.9]} />
        <meshStandardMaterial color="#1a1f23" roughness={0.8} />
      </mesh>
      {/* Contrails */}
      {[-5, 5].map((x, i) => (
        <mesh key={x} ref={i === 0 ? trailA : undefined} position={[x, 0.35, -16]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.34, 1.5, 30, 8, 1, true]} />
          <meshBasicMaterial color="#c8d4dc" transparent opacity={0.11} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Fire + smoke                                                               */
/* -------------------------------------------------------------------------- */

/** Procedural soft-particle sprite — a radial falloff drawn once into a canvas. */
function useSmokeTexture() {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const grd = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grd.addColorStop(0, 'rgba(255,255,255,0.85)');
    grd.addColorStop(0.4, 'rgba(255,255,255,0.28)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);

    // Break up the perfect circle so plumes don't look like bokeh.
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 22; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 18 + Math.random() * 44;
      ctx.beginPath();
      ctx.arc(size / 2 + Math.cos(a) * r, size / 2 + Math.sin(a) * r, 6 + Math.random() * 14, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
}

/** A rising, expanding column of billboarded smoke puffs. */
function SmokeColumn({
  position,
  count = 26,
  tint = '#5b6167',
  spread = 6,
  rise = 34,
  speed = 0.5,
}: {
  position: [number, number, number];
  count?: number;
  tint?: string;
  spread?: number;
  rise?: number;
  speed?: number;
}) {
  const texture = useSmokeTexture();
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        offset: (i / count) * rise,
        angle: (i * 2.399) % (Math.PI * 2),
        radius: 0.5 + ((i * 37) % 100) / 100 * spread,
        scale: 5 + ((i * 61) % 100) / 100 * 9,
        drift: 0.4 + ((i * 17) % 100) / 100,
        spin: (((i * 29) % 100) / 100 - 0.5) * 0.4,
      })),
    [count, rise, spread],
  );

  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const t = state.clock.elapsedTime * speed;

    seeds.forEach((s, i) => {
      // Each puff cycles from ground to `rise`, then wraps.
      const life = (t * s.drift + s.offset) % rise;
      const k = life / rise;
      const wobble = Math.sin(t * 0.8 + s.angle * 3) * 2.4;

      dummy.position.set(
        Math.cos(s.angle) * s.radius * (1 + k * 2.2) + wobble,
        life,
        Math.sin(s.angle) * s.radius * (1 + k * 2.2),
      );
      // Grow and fade as it rises — the classic smoke read.
      const scale = s.scale * (0.35 + k * 1.7);
      dummy.scale.setScalar(scale);
      dummy.rotation.z = t * s.spin + s.angle;
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  if (!texture) return null;

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} position={position}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        color={tint}
        transparent
        opacity={0.16}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </instancedMesh>
  );
}

/** Burning wreckage: a flickering light plus an additive flame billboard. */
function Fire({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const light = useRef<THREE.PointLight>(null);
  const flame = useRef<THREE.Mesh>(null);
  const texture = useSmokeTexture();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Layered sines approximate the irregular flicker of a real fire.
    const flicker =
      0.62 + Math.sin(t * 11) * 0.16 + Math.sin(t * 23.7) * 0.11 + Math.sin(t * 4.3) * 0.11;
    if (light.current) light.current.intensity = 180 * flicker * scale;
    if (flame.current) {
      flame.current.scale.set(scale * (7 + flicker * 2), scale * (10 + flicker * 4), 1);
      (flame.current.material as THREE.MeshBasicMaterial).opacity = 0.4 * flicker;
    }
  });

  return (
    <group position={position}>
      <pointLight ref={light} color="#ff7a22" intensity={180} distance={130} decay={2} />
      {texture ? (
        <mesh ref={flame} position={[0, 5, 0]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={texture}
            color="#ff8a2e"
            transparent
            opacity={0.4}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ) : null}
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Camera                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Scroll-controlled cinematic camera.
 *
 * `progress` is written by ScrollTrigger on the pinned hero. The camera flies
 * a keyframed path through it, and the mouse adds a small parallax offset on
 * top — damped, so the frame never feels twitchy.
 */
function CameraRig({ progress }: { progress: RefObject<number> }) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  const current = useMemo(() => new THREE.Vector3(0, 12, 110), []);
  const lookAt = useMemo(() => new THREE.Vector3(0, 6, 0), []);
  const lookCurrent = useMemo(() => new THREE.Vector3(0, 6, 0), []);

  // Keyframed dolly: pull back and up, then push in low and fast.
  const path = useMemo(
    () => [
      { p: new THREE.Vector3(0, 10, 118), l: new THREE.Vector3(0, 14, 0) },
      { p: new THREE.Vector3(-46, 26, 86), l: new THREE.Vector3(10, 10, -30) },
      { p: new THREE.Vector3(38, 16, 52), l: new THREE.Vector3(-14, 22, -60) },
      { p: new THREE.Vector3(6, 6, 18), l: new THREE.Vector3(0, 30, -120) },
    ],
    [],
  );

  useFrame((state, delta) => {
    const t = THREE.MathUtils.clamp(progress.current ?? 0, 0, 1);

    // Piecewise interpolation between keyframes with a smootherstep blend.
    const segments = path.length - 1;
    const scaled = t * segments;
    const index = Math.min(Math.floor(scaled), segments - 1);
    const local = THREE.MathUtils.smoothstep(scaled - index, 0, 1);

    target.lerpVectors(path[index].p, path[index + 1].p, local);
    lookAt.lerpVectors(path[index].l, path[index + 1].l, local);

    // Mouse parallax + a permanent low-amplitude handheld drift.
    const pointer = getPointer();
    const time = state.clock.elapsedTime;
    target.x += pointer.sx * 9 + Math.sin(time * 0.31) * 1.4;
    target.y += -pointer.sy * 5 + Math.sin(time * 0.47) * 0.9;

    // Frame-rate independent damping — critical for consistent feel at 60/120Hz.
    const k = 1 - Math.pow(0.0016, delta);
    current.lerp(target, k);
    lookCurrent.lerp(lookAt, k);

    camera.position.copy(current);
    camera.lookAt(lookCurrent);
  });

  return null;
}

/* -------------------------------------------------------------------------- */
/* Scene                                                                      */
/* -------------------------------------------------------------------------- */

function Scene({ progress, quality }: Props) {
  const low = quality === 'low';

  return (
    <>
      {/* Dense fog is what sells the scale — and it lets the terrain end
          without ever showing an edge. */}
      <fogExp2 attach="fog" args={['#0a0c10', 0.0042]} />
      <color attach="background" args={['#05070a']} />

      {/* Key light: a low, warm sun raking across the valley */}
      <directionalLight
        position={[-120, 70, -90]}
        intensity={2.1}
        color="#ffb066"
        castShadow={!low}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={400}
        shadow-camera-left={-180}
        shadow-camera-right={180}
        shadow-camera-top={180}
        shadow-camera-bottom={-180}
        shadow-bias={-0.0008}
      />
      {/* Fill: cold skylight from the opposite side */}
      <directionalLight position={[90, 40, 120]} intensity={0.5} color="#4d7fa8" />
      <ambientLight intensity={0.22} color="#2a3742" />
      {/* Warm bounce from the fires */}
      <hemisphereLight args={['#3a2a1c', '#0a0c10', 0.5]} />

      <Terrain />

      <Ridgeline distance={420} height={70} tint="#141a20" />
      <Ridgeline distance={620} height={110} tint="#0f151b" />
      <Ridgeline distance={840} height={150} tint="#0b1015" />

      <SupplyPlane />

      <Helicopter radius={130} height={54} speed={0.16} phase={0} scale={1.15} />
      <Helicopter radius={190} height={72} speed={0.11} phase={2.4} scale={0.85} />
      {!low && <Helicopter radius={92} height={40} speed={0.22} phase={4.1} scale={0.6} />}

      <Fire position={[-58, -22, -46]} scale={1.25} />
      <Fire position={[74, -20, -104]} scale={0.95} />
      {!low && <Fire position={[18, -24, 22]} scale={0.6} />}

      <SmokeColumn position={[-58, -20, -46]} count={low ? 14 : 28} tint="#4a5158" rise={46} />
      <SmokeColumn position={[74, -18, -104]} count={low ? 12 : 22} tint="#3f464c" rise={58} speed={0.34} />
      {!low && (
        <SmokeColumn position={[18, -22, 22]} count={16} tint="#565d64" rise={30} speed={0.7} spread={4} />
      )}

      {/* Floating dust and ash — drei's Sparkles is a single shader draw call */}
      <Sparkles
        count={low ? 90 : 260}
        scale={[300, 90, 300]}
        position={[0, 20, 0]}
        size={2.4}
        speed={0.24}
        opacity={0.42}
        color="#d8c3a0"
      />
      <Sparkles
        count={low ? 40 : 110}
        scale={[180, 60, 180]}
        position={[-30, 8, -20]}
        size={5}
        speed={0.5}
        opacity={0.5}
        color="#ff8a3c"
      />

      <CameraRig progress={progress} />
      <Preload all />
    </>
  );
}

export default function Battlefield({ progress, quality = 'high' }: Props) {
  const dprCap = useRef(quality === 'low' ? 1.25 : 1.75);

  return (
    <Canvas
      className="!absolute inset-0"
      shadows={quality === 'high'}
      dpr={[1, dprCap.current]}
      gl={{
        antialias: false, // FXAA-free; the grain overlay hides aliasing anyway
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
        depth: true,
      }}
      camera={{ fov: 46, near: 0.6, far: 2200, position: [0, 12, 118] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
      }}
    >
      {/* Drop DPR before dropping frames when the GPU can't keep up. */}
      <PerformanceMonitor
        onDecline={() => {
          dprCap.current = 1;
        }}
      />
      <AdaptiveDpr pixelated={false} />
      <Scene progress={progress} quality={quality} />
    </Canvas>
  );
}
