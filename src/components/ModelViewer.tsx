"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Center, useGLTF, Preload } from "@react-three/drei";
import { Group, Mesh, Vector3, MathUtils, Box3, MeshStandardMaterial, Color } from "three";

/**
 * Reusable 3D model viewer (react-three-fiber + drei) with a SIMPLE exploded
 * view.
 *
 * How it works (deliberately minimal):
 * - The model is wrapped in ONE group. <Center> puts its true centre at the
 *   group origin; OrbitControls rotates that whole group rigidly. So exploded
 *   parts keep their arrangement relative to the bike when you rotate — nothing
 *   slides around.
 * - Each part has a FIXED local explode offset (computed once). Parts simply
 *   lerp between base position and base+offset. No camera/projection math.
 * - Hover the bike → it explodes (after a short dwell). Pointer leaves the
 *   canvas → it reassembles. Hovering a part shows its name.
 *
 * Client-only: import via next/dynamic with { ssr: false }.
 */

const DRACO_PATH = "/draco/";
const WHEEL_RE = /rim|tyre|tire|wheel|disc|brake/i;
const HILITE = new Color("#8ecbff"); // hovered-part emissive tint
const IDLE_SCALE = 1.35; // bike is larger when assembled, eases to 1 when exploded

// Reused scratch vectors for resolving the explode direction from the camera.
const _camRight = new Vector3();
const _camUp = new Vector3();
const _tmp = new Vector3();

type PartInfo = {
  mesh: Mesh;
  basePos: Vector3;
  lateral: number; // signed sideways magnitude (− left / + right)
  fan: number; // signed vertical fan magnitude
  offset: Vector3; // resolved local-space displacement (set when explode starts)
  label: string;
  material: MeshStandardMaterial | null;
  baseEmissive: Color | null;
};

function buildParts(scene: Group): PartInfo[] {
  const box = new Box3().setFromObject(scene);
  const center = new Vector3();
  box.getCenter(center);
  const size = new Vector3();
  box.getSize(size);

  const meshes: Mesh[] = [];
  scene.traverse((o) => {
    const m = o as Mesh;
    if (m.isMesh) meshes.push(m);
  });

  // Biggest mesh = the body; it stays put as the core.
  let biggest = 0;
  let biggestCount = -1;
  meshes.forEach((m, i) => {
    const c = m.geometry?.getAttribute?.("position")?.count ?? 0;
    if (c > biggestCount) {
      biggestCount = c;
      biggest = i;
    }
  });

  // Even left/right split for the non-body parts. We store an abstract layout
  // (which side, how far out, vertical fan) and the ACTUAL world-space offset
  // direction is resolved at explode-time from the camera, so parts always
  // spread to the viewer's left/right regardless of the current view angle.
  const others = meshes.map((_, i) => i).filter((i) => i !== biggest);
  const sideDist = Math.max(size.x, size.z) * 0.55; // outward distance each side
  const colSpan = Math.max(size.x, size.z) * 0.85; // vertical fan extent

  return meshes.map((m, i) => {
    const isWheel = WHEEL_RE.test(m.name);
    const wp = new Vector3();
    m.getWorldPosition(wp);
    const fromCenter = wp.clone().sub(center);

    let lateral = 0; // −sideDist (left) … +sideDist (right)
    let fan = 0; // vertical fan position
    if (i !== biggest) {
      const rank = others.indexOf(i);
      const onLeft = rank % 2 === 0;
      const list = others.filter((_, n) => (n % 2 === 0) === onLeft);
      const pos = list.indexOf(i);
      const count = list.length;
      lateral = onLeft ? -sideDist : sideDist;
      fan = count <= 1 ? 0 : (pos / (count - 1) - 0.5) * colSpan;
    }

    let label: string;
    if (isWheel) label = fromCenter.x >= 0 ? "Front wheel" : "Rear wheel";
    else if (i === biggest) label = "Carbon body";
    else if (fromCenter.y > size.y * 0.12) label = "Upper fairing";
    else if (fromCenter.x >= 0) label = "Front cowl";
    else label = "Subframe";

    const material = (m.material as MeshStandardMaterial) ?? null;
    const baseEmissive = material?.emissive ? material.emissive.clone() : null;

    return {
      mesh: m,
      basePos: m.position.clone(),
      lateral,
      fan,
      offset: new Vector3(), // resolved at explode-time (see Model)
      label,
      material,
      baseEmissive,
    };
  });
}

function Model({
  src,
  exploded,
  hoveredMesh,
}: {
  src: string;
  exploded: boolean;
  hoveredMesh: React.MutableRefObject<Mesh | null>;
}) {
  const { scene } = useGLTF(src, DRACO_PATH);
  const { camera } = useThree();
  const parts = useMemo(() => buildParts(scene as Group), [scene]);
  const progress = useRef(0);
  const wasExploded = useRef(false);
  const groupRef = useRef<Group>(null);

  useFrame((_, dt) => {
    const k = 1 - Math.pow(0.0015, dt); // frame-rate-independent damping

    // Bike is larger when idle/assembled, eases down to base size when exploded
    // so the spread parts fit inside the canvas.
    if (groupRef.current) {
      const targetScale = exploded ? 1 : IDLE_SCALE;
      const gs = MathUtils.lerp(groupRef.current.scale.x, targetScale, k);
      groupRef.current.scale.setScalar(gs);
    }

    // When the explode STARTS, resolve each part's offset from the current view:
    // spread along the camera's RIGHT axis (screen-horizontal) and fan along the
    // camera's UP axis (screen-vertical). The model group has no rotation, so its
    // local space equals world space — captured once, the offsets stay rigid.
    if (exploded && !wasExploded.current) {
      camera.matrixWorld.extractBasis(_camRight, _camUp, _tmp);
      _camRight.y *= 0.25; // keep the sideways spread mostly horizontal
      _camRight.normalize();
      for (const part of parts) {
        part.offset.set(0, 0, 0).addScaledVector(_camRight, part.lateral).addScaledVector(_camUp, part.fan);
      }
    }
    wasExploded.current = exploded;

    progress.current = MathUtils.lerp(progress.current, exploded ? 1 : 0, k);
    const e = progress.current;

    for (const part of parts) {
      part.mesh.position.set(
        part.basePos.x + part.offset.x * e,
        part.basePos.y + part.offset.y * e,
        part.basePos.z + part.offset.z * e
      );

      // Highlight the hovered part.
      const isHovered = exploded && hoveredMesh.current === part.mesh;
      const s = MathUtils.lerp(part.mesh.scale.x, isHovered ? 1.06 : 1, k);
      part.mesh.scale.setScalar(s);
      if (part.material && part.baseEmissive) {
        const tgt = isHovered ? HILITE : part.baseEmissive;
        part.material.emissive.lerp(tgt, k);
        part.material.emissiveIntensity = MathUtils.lerp(
          part.material.emissiveIntensity ?? 0,
          isHovered ? 0.5 : 0,
          k
        );
      }
    }
  });

  return (
    <group ref={groupRef} scale={IDLE_SCALE}>
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  );
}

/** Letter-roll label — each character rolls up to reveal the part name. */
function PartLabel({ label, x, y }: { label: string; x: number; y: number }) {
  return (
    <div
      className="pointer-events-none fixed z-[60] -translate-x-1/2 -translate-y-[150%]"
      style={{ left: x, top: y }}
    >
      <div className="flex overflow-hidden rounded-pill border border-graphite-900 bg-ink-50 px-3 py-1.5 shadow-float">
        {label.split("").map((ch, i) => (
          <span
            key={`${label}-${i}`}
            className="inline-block animate-[rollUp_0.4s_cubic-bezier(0.22,1,0.36,1)_both] text-xs font-bold uppercase tracking-widest text-graphite-900"
            style={{ animationDelay: `${i * 28}ms`, whiteSpace: "pre" }}
          >
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
}

export type ModelViewerProps = {
  src: string;
  controls?: boolean;
  className?: string;
};

function Scene({
  src,
  exploded,
  hoveredMesh,
  onLabel,
}: {
  src: string;
  exploded: boolean;
  hoveredMesh: React.MutableRefObject<Mesh | null>;
  onLabel: (label: string | null, screen: { x: number; y: number } | null) => void;
}) {
  const { scene } = useGLTF(src, DRACO_PATH);
  const parts = useMemo(() => buildParts(scene as Group), [scene]);

  const groundY = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const sz = new Vector3();
    box.getSize(sz);
    return -sz.y / 2;
  }, [scene]);

  // Track which part the pointer is over (for the label), raycast-based.
  const over = (e: any) => {
    e.stopPropagation();
    hoveredMesh.current = e.object as Mesh;
    const part = parts.find((p) => p.mesh === e.object);
    onLabel(part?.label ?? null, { x: e.clientX, y: e.clientY });
  };
  const move = (e: any) => {
    if (hoveredMesh.current !== e.object) return;
    const part = parts.find((p) => p.mesh === e.object);
    if (part) onLabel(part.label, { x: e.clientX, y: e.clientY });
  };
  const out = (e: any) => {
    if (hoveredMesh.current === e.object) {
      hoveredMesh.current = null;
      onLabel(null, null);
    }
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 6, 5]} intensity={1.1} castShadow />
      <directionalLight position={[-5, 3, -4]} intensity={0.5} />
      <Environment preset="city" />

      <group onPointerOver={over} onPointerMove={move} onPointerOut={out}>
        <Model src={src} exploded={exploded} hoveredMesh={hoveredMesh} />
      </group>

      <ContactShadows position={[0, groundY, 0]} opacity={0.4} scale={6} blur={2.6} far={4} />
    </>
  );
}

export default function ModelViewer({ src, controls = true, className }: ModelViewerProps) {
  const reduce = useReducedMotion();
  const hoveredMesh = useRef<Mesh | null>(null);
  const [exploded, setExploded] = useState(false);
  const [partLabel, setPartLabel] = useState<string | null>(null);
  const [labelPos, setLabelPos] = useState<{ x: number; y: number } | null>(null);

  // Dwell ~150ms before exploding so a passing cursor doesn't trigger it.
  const dwell = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onCanvasEnter = () => {
    if (dwell.current) return;
    dwell.current = setTimeout(() => {
      dwell.current = null;
      setExploded(true);
    }, 150);
  };
  const onCanvasLeave = () => {
    if (dwell.current) {
      clearTimeout(dwell.current);
      dwell.current = null;
    }
    setExploded(false);
    hoveredMesh.current = null;
    setPartLabel(null);
    setLabelPos(null);
  };

  const onLabel = (label: string | null, screen: { x: number; y: number } | null) => {
    setPartLabel(label);
    setLabelPos(screen);
  };

  return (
    <>
      <Canvas
        className={className}
        shadows
        dpr={Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio : 1)}
        camera={{ position: [3.4, 1.3, 4.2], fov: 34 }}
        gl={{ antialias: true, preserveDrawingBuffer: false, alpha: true }}
        style={{ background: "transparent" }}
        onPointerEnter={onCanvasEnter}
        onPointerLeave={onCanvasLeave}
      >
        <Suspense fallback={null}>
          <Scene src={src} exploded={exploded} hoveredMesh={hoveredMesh} onLabel={onLabel} />
          <Preload all />
        </Suspense>
        {controls && (
          <OrbitControls
            makeDefault
            autoRotate={!exploded && !reduce}
            autoRotateSpeed={0.8}
            enablePan={false}
            target={[0, 0, 0]}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 1.9}
            enableZoom
            minDistance={3.5}
            maxDistance={14}
            enableDamping
            dampingFactor={0.08}
          />
        )}
      </Canvas>

      {exploded && partLabel && labelPos && (
        <PartLabel label={partLabel} x={labelPos.x} y={labelPos.y} />
      )}
    </>
  );
}

useGLTF.preload("/models/h2r.glb", DRACO_PATH);
