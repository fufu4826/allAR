"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { SAKON_DEM } from "./data/sakonDem";
import { SAKON_BOUNDARY_GEO } from "./data/sakonBoundary";
import type { MapLandmark } from "./data/landmarksData";
import { MAJOR_HIGHWAYS, SECONDARY_HIGHWAYS, type RoadDefinition } from "./data/roadsData";

// Terrain textures. The satellite one is only downloaded when the visitor switches to it.
const CARTOON_TEXTURE_URL = "/map3d/sakon_satellite_cartoon.webp";
const SATELLITE_TEXTURE_URL = "/map3d/sakon_satellite_s2.webp";

// Projection Constants
const SAKON_CENTER_LON = 103.84395;
const SAKON_CENTER_LAT = 17.43057;
const SCALE_LON = 42.0;
const SCALE_LAT = 44.02;

const TEX_LON_MIN = 103.0078125;
const TEX_LON_MAX = 104.765625;
const TEX_LAT_MIN = 16.6361918783976;
const TEX_LAT_MAX = 18.6462451426706;

function latToMercator(latDeg: number): number {
  const latRad = (latDeg * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + latRad / 2));
}
const MERC_MIN = latToMercator(TEX_LAT_MIN);
const MERC_MAX = latToMercator(TEX_LAT_MAX);

const ELEV_BASE = 145.0;
const ELEV_SCALE = 0.0045;

function getTerrainElev(x: number, z: number): { meters: number; y: number } {
  const lon = x / SCALE_LON + SAKON_CENTER_LON;
  const lat = -z / SCALE_LAT + SAKON_CENTER_LAT;
  const rawElev = SAKON_DEM.getElevationAtLonLat(lon, lat);
  const diff = Math.max(0.0, rawElev - ELEV_BASE);
  return {
    meters: rawElev,
    y: Math.max(0.03, diff * ELEV_SCALE),
  };
}

function isInsideBoundary(px: number, pz: number): boolean {
  const py = -pz;
  let inside = false;
  const n = SAKON_BOUNDARY_GEO.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = SAKON_BOUNDARY_GEO[i][0];
    const yi = SAKON_BOUNDARY_GEO[i][1];
    const xj = SAKON_BOUNDARY_GEO[j][0];
    const yj = SAKON_BOUNDARY_GEO[j][1];
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Dispose every geometry, material and texture under an object. */
function disposeObject(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (!material) return;
    for (const mat of Array.isArray(material) ? material : [material]) {
      for (const value of Object.values(mat)) {
        if (value instanceof THREE.Texture) value.dispose();
      }
      mat.dispose();
    }
  });
}

// Sakon Nakhon 5 Landmarks Overview Pivot
const DEFAULT_TARGET = new THREE.Vector3(12.5, 0.1, 5.0);
const DEFAULT_CAM_POS = new THREE.Vector3(12.5, 76.0, 38.0);

/** Overview camera for a viewport aspect ratio. On portrait screens (phones) the horizontal field
 *  of view is narrow, so aim nearer the province centre (x ≈ 0) and pull back far enough for the
 *  province width (about ±25 units, plus a margin) to fit across the screen. */
const PORTRAIT_TARGET = new THREE.Vector3(4.0, 0.1, 3.0);
function overviewView(aspect: number): { target: THREE.Vector3; position: THREE.Vector3 } {
  if (aspect >= 1) return { target: DEFAULT_TARGET.clone(), position: DEFAULT_CAM_POS.clone() };
  const offset = DEFAULT_CAM_POS.clone().sub(DEFAULT_TARGET);
  const halfH = Math.atan(Math.tan(THREE.MathUtils.degToRad(38 / 2)) * aspect);
  const needed = 29 / Math.tan(halfH);
  const factor = Math.min(2.2, Math.max(1, needed / offset.length()));
  return { target: PORTRAIT_TARGET.clone(), position: PORTRAIT_TARGET.clone().add(offset.multiplyScalar(factor)) };
}

interface CameraAnimState {
  startTime: number;
  duration: number;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  startTarget: THREE.Vector3;
  targetLookAt: THREE.Vector3;
}

export interface Sakon3DMapCanvasProps {
  landmarks: MapLandmark[];
  selectedId?: string | null;
  onSelectLandmark?: (id: string) => void;
  className?: string;
}

export default function Sakon3DMapCanvas({ landmarks, selectedId, onSelectLandmark, className }: Sakon3DMapCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const landmarksRef = useRef<MapLandmark[]>(landmarks);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const [roadsVisible, setRoadsVisible] = useState<boolean>(true);
  const [texMode, setTexMode] = useState<"cartoon" | "satellite">("cartoon");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // References for camera tweening
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animStateRef = useRef<CameraAnimState | null>(null);
  const roadGroupRef = useRef<THREE.Group | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const cartoonTextureRef = useRef<THREE.Texture | null>(null);
  const satelliteTextureRef = useRef<THREE.Texture | null>(null);

  // Direct DOM references for 0-delay hardware-accelerated pins & compass
  const badgeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dotRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const compassNeedleRef = useRef<HTMLDivElement | null>(null);
  const compassLabelRef = useRef<HTMLSpanElement | null>(null);
  const selectedIdRef = useRef<string | null | undefined>(selectedId);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    landmarksRef.current = landmarks;
  }, [landmarks]);

  // Smooth fly to landmark with cubic ease-out
  const flyTo = useCallback((landmark: MapLandmark | null) => {
    if (!controlsRef.current || !cameraRef.current) return;
    const controls = controlsRef.current;
    const camera = cameraRef.current;

    let targetLookAt: THREE.Vector3;
    let targetPos: THREE.Vector3;

    if (!landmark) {
      const view = overviewView(camera.aspect);
      targetLookAt = view.target;
      targetPos = view.position;
    } else {
      const x = (landmark.lon - SAKON_CENTER_LON) * SCALE_LON + (landmark.modelConfig.offset?.x || 0);
      const z = -(landmark.lat - SAKON_CENTER_LAT) * SCALE_LAT + (landmark.modelConfig.offset?.z || 0);
      const elev = getTerrainElev(x, z);

      targetLookAt = new THREE.Vector3(x, elev.y + 0.6, z);
      targetPos = new THREE.Vector3(x, elev.y + 6.0, z + 7.5);
    }

    animStateRef.current = {
      startTime: performance.now(),
      duration: 650,
      startPos: camera.position.clone(),
      targetPos,
      startTarget: controls.target.clone(),
      targetLookAt,
    };
  }, []);

  const lastFlyIdRef = useRef<string | null>(null);

  // Synchronize when selectedId prop changes without redundant triggers
  useEffect(() => {
    if (selectedId) {
      if (lastFlyIdRef.current !== selectedId) {
        lastFlyIdRef.current = selectedId;
        const found = landmarksRef.current.find((lm) => lm.id === selectedId);
        if (found) {
          flyTo(found);
        }
      }
    } else {
      if (lastFlyIdRef.current !== null) {
        lastFlyIdRef.current = null;
        flyTo(null);
      }
    }
  }, [selectedId, flyTo]);

  const handleSelect = (item: MapLandmark) => {
    if (onSelectLandmark) {
      onSelectLandmark(item.id);
    }
  };

  const handleResetCamera = useCallback(() => {
    if (onSelectLandmark) {
      onSelectLandmark("");
    }
    flyTo(null);
  }, [flyTo, onSelectLandmark]);

  const handleToggleRoads = useCallback(() => {
    setRoadsVisible((prev) => {
      const next = !prev;
      if (roadGroupRef.current) roadGroupRef.current.visible = next;
      return next;
    });
  }, []);

  const handleToggleTexture = useCallback(() => {
    setTexMode((prev) => {
      const next = prev === "cartoon" ? "satellite" : "cartoon";
      if (terrainMeshRef.current && (terrainMeshRef.current.material as THREE.MeshStandardMaterial)) {
        const mat = terrainMeshRef.current.material as THREE.MeshStandardMaterial;
        if (next === "satellite" && !satelliteTextureRef.current) {
          const renderer = rendererRef.current;
          satelliteTextureRef.current = new THREE.TextureLoader().load(SATELLITE_TEXTURE_URL, (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            if (renderer) tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
            tex.generateMipmaps = true;
            tex.needsUpdate = true;
          });
        }
        mat.map = next === "cartoon" ? cartoonTextureRef.current : satelliteTextureRef.current;
        mat.needsUpdate = true;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 580;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    const initialView = overviewView(width / height);
    camera.position.copy(initialView.position);
    cameraRef.current = camera;

    // Phones and tablets: no shadows, no MSAA, lower pixel ratio, to keep mid-range devices smooth.
    const lowPower = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;

    const renderer = new THREE.WebGLRenderer({
      antialias: !lowPower,
      alpha: true,
      powerPreference: lowPower ? "default" : "high-performance",
    });
    rendererRef.current = renderer;
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.5 : 2));
    renderer.shadowMap.enabled = !lowPower;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.copy(initialView.target);
    controls.minDistance = 2.0;
    controls.maxDistance = 180.0;
    controls.maxPolarAngle = Math.PI / 2 - 0.08;
    controlsRef.current = controls;

    // Immediately stop auto-animation on user touch/scroll/drag so user has 100% free control!
    const cancelAnim = () => {
      animStateRef.current = null;
    };
    controls.addEventListener("start", cancelAnim);
    renderer.domElement.addEventListener("wheel", cancelAnim, { passive: true });
    renderer.domElement.addEventListener("pointerdown", cancelAnim, { passive: true });
    renderer.domElement.addEventListener("touchstart", cancelAnim, { passive: true });

    // 2. Natural Atmospheric Lighting
    const ambientLight = new THREE.AmbientLight(0xfffaf0, 0.52);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xf0fdf4, 0x453826, 0.48);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 0.88);
    dirLight.position.set(40, 85, 35);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.0003;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xbae6fd, 0.25);
    fillLight.position.set(-45, 30, -35);
    scene.add(fillLight);

    const provinceGroup = new THREE.Group();
    scene.add(provinceGroup);

    // 3. Textures
    const textureLoader = new THREE.TextureLoader();
    const cartoonTex = textureLoader.load(CARTOON_TEXTURE_URL, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
      tex.generateMipmaps = true;
      if (terrainMeshRef.current) (terrainMeshRef.current.material as THREE.MeshStandardMaterial).needsUpdate = true;
    });
    cartoonTextureRef.current = cartoonTex;

    const satMaterial = new THREE.MeshStandardMaterial({
      map: cartoonTex,
      roughness: 0.65,
      metalness: 0.0,
    });

    const sideEarthMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d1708,
      roughness: 0.95,
      flatShading: true,
    });

    // 4. Generate Topographic Surface Mesh
    const SLAB_DEPTH = 3.6;
    const TOTAL_HEIGHT = SLAB_DEPTH;

    let bMinX = 999,
      bMaxX = -999,
      bMinY = 999,
      bMaxY = -999;
    for (let i = 0; i < SAKON_BOUNDARY_GEO.length; i++) {
      const pt = SAKON_BOUNDARY_GEO[i];
      if (pt[0] < bMinX) bMinX = pt[0];
      if (pt[0] > bMaxX) bMaxX = pt[0];
      if (pt[1] < bMinY) bMinY = pt[1];
      if (pt[1] > bMaxY) bMaxY = pt[1];
    }
    const gridMinX = bMinX - 0.2;
    const gridMaxX = bMaxX + 0.2;
    const gridMinZ = -bMaxY - 0.2;
    const gridMaxZ = -bMinY + 0.2;

    const GRID_NX = 120;
    const GRID_NZ = 140;
    const stepX = (gridMaxX - gridMinX) / GRID_NX;
    const stepZ = (gridMaxZ - gridMinZ) / GRID_NZ;

    const terrainPositions: number[] = [];
    const terrainUvs: number[] = [];
    const terrainIndices: number[] = [];
    const vertexGrid: number[][] = [];

    function getUV(x: number, z: number): [number, number] {
      const lon = x / SCALE_LON + SAKON_CENTER_LON;
      const lat = -z / SCALE_LAT + SAKON_CENTER_LAT;
      const u = (lon - TEX_LON_MIN) / (TEX_LON_MAX - TEX_LON_MIN);
      const v = (latToMercator(lat) - MERC_MIN) / (MERC_MAX - MERC_MIN);
      return [Math.max(0, Math.min(1, u)), Math.max(0, Math.min(1, v))];
    }

    let vertCount = 0;
    for (let iz = 0; iz <= GRID_NZ; iz++) {
      vertexGrid[iz] = [];
      const z = gridMinZ + iz * stepZ;
      for (let ix = 0; ix <= GRID_NX; ix++) {
        const x = gridMinX + ix * stepX;
        const inside = isInsideBoundary(x, z);
        if (inside) {
          const elev = getTerrainElev(x, z);
          terrainPositions.push(x, elev.y, z);
          const [u, v] = getUV(x, z);
          terrainUvs.push(u, v);
          vertexGrid[iz][ix] = vertCount++;
        } else {
          vertexGrid[iz][ix] = -1;
        }
      }
    }

    for (let iz = 0; iz < GRID_NZ; iz++) {
      for (let ix = 0; ix < GRID_NX; ix++) {
        const i00 = vertexGrid[iz][ix];
        const i10 = vertexGrid[iz][ix + 1];
        const i01 = vertexGrid[iz + 1][ix];
        const i11 = vertexGrid[iz + 1][ix + 1];

        if (i00 >= 0 && i10 >= 0 && i01 >= 0 && i11 >= 0) {
          terrainIndices.push(i00, i01, i10);
          terrainIndices.push(i10, i01, i11);
        } else {
          if (i00 >= 0 && i01 >= 0 && i10 >= 0) terrainIndices.push(i00, i01, i10);
          else if (i10 >= 0 && i01 >= 0 && i11 >= 0) terrainIndices.push(i10, i01, i11);
          else if (i00 >= 0 && i10 >= 0 && i11 >= 0) terrainIndices.push(i00, i11, i10);
          else if (i00 >= 0 && i01 >= 0 && i11 >= 0) terrainIndices.push(i00, i01, i11);
        }
      }
    }

    const terrainGeo = new THREE.BufferGeometry();
    terrainGeo.setAttribute("position", new THREE.Float32BufferAttribute(terrainPositions, 3));
    terrainGeo.setAttribute("uv", new THREE.Float32BufferAttribute(terrainUvs, 2));
    terrainGeo.setIndex(terrainIndices);
    terrainGeo.computeVertexNormals();

    const terrainMesh = new THREE.Mesh(terrainGeo, satMaterial);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    provinceGroup.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // 5. Side Skirt Walls
    const skirtPositions: number[] = [];
    const skirtUvs: number[] = [];
    const skirtIndices: number[] = [];
    let skirtVertCount = 0;
    const bLen = SAKON_BOUNDARY_GEO.length;

    for (let i = 0; i < bLen; i++) {
      const nextIdx = (i + 1) % bLen;
      const x1 = SAKON_BOUNDARY_GEO[i][0];
      const z1 = -SAKON_BOUNDARY_GEO[i][1];
      const x2 = SAKON_BOUNDARY_GEO[nextIdx][0];
      const z2 = -SAKON_BOUNDARY_GEO[nextIdx][1];

      const y1 = getTerrainElev(x1, z1).y;
      const y2 = getTerrainElev(x2, z2).y;
      const yBottom = -TOTAL_HEIGHT;

      skirtPositions.push(x1, y1, z1, x1, yBottom, z1, x2, y2, z2, x2, yBottom, z2);

      const u1 = (i / bLen) * 12;
      const u2 = ((i + 1) / bLen) * 12;
      skirtUvs.push(u1, 1, u1, 0, u2, 1, u2, 0);

      const base = skirtVertCount;
      skirtIndices.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
      skirtVertCount += 4;
    }

    const skirtGeo = new THREE.BufferGeometry();
    skirtGeo.setAttribute("position", new THREE.Float32BufferAttribute(skirtPositions, 3));
    skirtGeo.setAttribute("uv", new THREE.Float32BufferAttribute(skirtUvs, 2));
    skirtGeo.setIndex(skirtIndices);
    skirtGeo.computeVertexNormals();

    const skirtMesh = new THREE.Mesh(skirtGeo, sideEarthMaterial);
    skirtMesh.receiveShadow = true;
    skirtMesh.castShadow = true;
    provinceGroup.add(skirtMesh);

    // 6. Pedestal
    const sakonShape2D = new THREE.Shape();
    sakonShape2D.moveTo(SAKON_BOUNDARY_GEO[0][0], SAKON_BOUNDARY_GEO[0][1]);
    for (let i = 1; i < bLen; i++) {
      sakonShape2D.lineTo(SAKON_BOUNDARY_GEO[i][0], SAKON_BOUNDARY_GEO[i][1]);
    }
    const pedestalGeo = new THREE.ExtrudeGeometry(sakonShape2D, { depth: 0.8, bevelEnabled: false });
    const pedestalMesh = new THREE.Mesh(
      pedestalGeo,
      new THREE.MeshStandardMaterial({ color: 0x050914, roughness: 0.95, flatShading: true })
    );
    pedestalMesh.rotation.x = -Math.PI / 2;
    pedestalMesh.position.set(0, -TOTAL_HEIGHT - 0.8, 0);
    pedestalMesh.scale.set(1.025, 1.025, 1.0);
    provinceGroup.add(pedestalMesh);

    // 7. Glowing Blue Boundary Outline
    const outlinePoints3D: THREE.Vector3[] = [];
    for (let i = 0; i < bLen; i++) {
      const bx = SAKON_BOUNDARY_GEO[i][0];
      const bz = -SAKON_BOUNDARY_GEO[i][1];
      const by = getTerrainElev(bx, bz).y + 0.06;
      outlinePoints3D.push(new THREE.Vector3(bx, by, bz));
    }
    outlinePoints3D.push(outlinePoints3D[0]);
    const outlineGeo3D = new THREE.BufferGeometry().setFromPoints(outlinePoints3D);
    const outlineMat3D = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 2.5,
      transparent: true,
      opacity: 0.85,
    });
    const provinceOutline = new THREE.Line(outlineGeo3D, outlineMat3D);
    provinceGroup.add(provinceOutline);

    // 8. Road Ribbons (Highways)
    const roadGroup = new THREE.Group();
    roadGroupRef.current = roadGroup;

    function createRoadRibbon(road: RoadDefinition): THREE.Group {
      const gpsPoints = road.points;
      if (!gpsPoints || gpsPoints.length < 2) return new THREE.Group();

      const pts2D = gpsPoints.map((p) => {
        const rx = (p[0] - SAKON_CENTER_LON) * SCALE_LON;
        const rz = -(p[1] - SAKON_CENTER_LAT) * SCALE_LAT;
        return new THREE.Vector2(rx, rz);
      });

      const curve = new THREE.SplineCurve(pts2D);
      const numPts = Math.max(30, (pts2D.length - 1) * 16);
      const rawSampled = curve.getPoints(numPts);

      const runs: THREE.Vector2[][] = [];
      let currentRun: THREE.Vector2[] = [];
      for (let i = 0; i < rawSampled.length; i++) {
        const p = rawSampled[i];
        if (isInsideBoundary(p.x, p.y)) {
          currentRun.push(p);
        } else {
          if (currentRun.length >= 2) runs.push(currentRun);
          currentRun = [];
        }
      }
      if (currentRun.length >= 2) runs.push(currentRun);

      const group = new THREE.Group();
      const halfW = road.width * 0.5;

      runs.forEach((sampled) => {
        const positions: number[] = [];
        const indices: number[] = [];

        for (let i = 0; i < sampled.length; i++) {
          const p = sampled[i];
          let tangent: THREE.Vector2;
          if (i === 0) tangent = sampled[1].clone().sub(p).normalize();
          else if (i === sampled.length - 1) tangent = p.clone().sub(sampled[i - 1]).normalize();
          else tangent = sampled[i + 1].clone().sub(sampled[i - 1]).normalize();

          const nx = -tangent.y;
          const nz = tangent.x;

          const lx = p.x + nx * halfW;
          const lz = p.y + nz * halfW;
          const ly = getTerrainElev(lx, lz).y + 0.08;

          const rx = p.x - nx * halfW;
          const rz = p.y - nz * halfW;
          const ry = getTerrainElev(rx, rz).y + 0.08;

          positions.push(lx, ly, lz, rx, ry, rz);

          if (i < sampled.length - 1) {
            const idx = i * 2;
            indices.push(idx, idx + 1, idx + 2, idx + 1, idx + 3, idx + 2);
          }
        }

        const geom = new THREE.BufferGeometry();
        geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        geom.setIndex(indices);
        geom.computeVertexNormals();

        const mat = new THREE.MeshBasicMaterial({
          color: road.color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: road.opacity,
          depthWrite: false,
        });

        const ribbonMesh = new THREE.Mesh(geom, mat);
        ribbonMesh.renderOrder = 4;
        group.add(ribbonMesh);

        if (road.hasCenterLine) {
          const linePts: THREE.Vector3[] = [];
          for (let i = 0; i < sampled.length; i += 2) {
            const p = sampled[i];
            const cy = getTerrainElev(p.x, p.y).y + 0.1;
            linePts.push(new THREE.Vector3(p.x, cy, p.y));
          }
          if (linePts.length >= 2) {
            const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
            const lineMat = new THREE.LineBasicMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0.8,
              depthWrite: false,
            });
            const cLine = new THREE.Line(lineGeo, lineMat);
            cLine.renderOrder = 5;
            group.add(cLine);
          }
        }
      });

      return group;
    }

    MAJOR_HIGHWAYS.forEach((r) => roadGroup.add(createRoadRibbon(r)));
    SECONDARY_HIGHWAYS.forEach((r) => roadGroup.add(createRoadRibbon(r)));
    provinceGroup.add(roadGroup);

    // 9. Load 5 GLB Models with Authentic Placement
    // Map models are meshopt-compressed (scripts/optimize-media.mjs), so the loader needs the decoder.
    const gltfLoader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const sceneLandmarks = landmarksRef.current;
    const modelCount = sceneLandmarks.filter((lm) => lm.modelUrl).length;
    let loadedCount = 0;
    let disposed = false;
    if (modelCount === 0) setIsLoading(false);

    sceneLandmarks.forEach((landmark) => {
      const x = (landmark.lon - SAKON_CENTER_LON) * SCALE_LON + (landmark.modelConfig.offset?.x || 0);
      const z = -(landmark.lat - SAKON_CENTER_LAT) * SCALE_LAT + (landmark.modelConfig.offset?.z || 0);
      const elev = getTerrainElev(x, z);

      const landmarkGroup = new THREE.Group();
      landmarkGroup.position.set(x, elev.y + (landmark.modelConfig.offset?.y || 0.05), z);

      provinceGroup.add(landmarkGroup);
      if (!landmark.modelUrl) return;

      gltfLoader.load(
        landmark.modelUrl,
        (gltf) => {
          const model = gltf.scene;
          if (disposed) {
            disposeObject(model);
            return;
          }
          const s = landmark.modelConfig.scale || 2.0;
          model.scale.set(s, s, s);
          if (landmark.modelConfig.rotationY) model.rotation.y = landmark.modelConfig.rotationY;

          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const m = child as THREE.Mesh;
              m.castShadow = true;
              m.receiveShadow = true;
              if (m.material) {
                const mat = m.material as THREE.MeshStandardMaterial;
                mat.side = THREE.DoubleSide;
                if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
              }
            }
          });

          // Special Cross and Bethlehem Star for Tha Rae Cathedral
          if (landmark.id === "tharae") {
            const crossGroup = new THREE.Group();
            const crossMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.1 });
            const goldAccentMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.6 });

            const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.025, 0.045), crossMat);
            pedestal.position.set(0, 0.012, 0);
            crossGroup.add(pedestal);

            const verticalBeam = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.28, 0.022), crossMat);
            verticalBeam.position.set(0, 0.14, 0);
            verticalBeam.castShadow = true;
            crossGroup.add(verticalBeam);

            const horizontalBeam = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.022, 0.022), crossMat);
            horizontalBeam.position.set(0, 0.2, 0);
            horizontalBeam.castShadow = true;
            crossGroup.add(horizontalBeam);

            const centerHalo = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.005, 8, 24), goldAccentMat);
            centerHalo.position.set(0, 0.2, 0);
            crossGroup.add(centerHalo);

            const starMesh = new THREE.Mesh(
              new THREE.OctahedronGeometry(0.075, 0),
              new THREE.MeshBasicMaterial({ color: 0xfef08a })
            );
            starMesh.position.set(0, 0.33, 0);
            crossGroup.add(starMesh);

            const starLight = new THREE.PointLight(0xfef08a, 1.0, 5);
            starLight.position.set(0, 0.33, 0);
            crossGroup.add(starLight);

            crossGroup.position.set(0.007, 0.694, 0.409);
            model.add(crossGroup);
          }

          landmarkGroup.add(model);
          loadedCount++;
          if (loadedCount >= modelCount) {
            setIsLoading(false);
          }
        },
        undefined,
        (err) => {
          console.warn("Failed to load model: " + landmark.modelUrl, err);
          loadedCount++;
          if (!disposed && loadedCount >= modelCount) setIsLoading(false);
        }
      );
    });

    // 10. Animation & Render Loop
    let reqId = 0;
    const tempV = new THREE.Vector3();
    const labelWidths: Record<string, number> = {};
    const labelHeights: Record<string, number> = {};
    const compactWidths: Record<string, number> = {};
    type LabelRect = { id: string; left: number; top: number; w: number; h: number; z: number; selected: boolean };
    const labelRects: LabelRect[] = [];
    const camDir = new THREE.Vector3();

    // Stop rendering while the tab is hidden or the map is scrolled off-screen (saves battery on phones).
    let tabVisible = document.visibilityState === "visible";
    let onScreen = true;
    let running = false;

    const animate = () => {
      if (!tabVisible || !onScreen) {
        running = false;
        return;
      }
      running = true;
      reqId = requestAnimationFrame(animate);

      // 1. Time-based Camera fly-to animation (Smooth cubic ease-out)
      const anim = animStateRef.current;
      if (anim) {
        const elapsed = performance.now() - anim.startTime;
        const progress = Math.min(1.0, elapsed / anim.duration);
        const ease = 1 - Math.pow(1 - progress, 3);

        camera.position.lerpVectors(anim.startPos, anim.targetPos, ease);
        controls.target.lerpVectors(anim.startTarget, anim.targetLookAt, ease);

        if (progress >= 1.0) {
          animStateRef.current = null;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      // 2. Hardware-accelerated zero-delay pin projections (0ms delay)
      const currentWidth = container.clientWidth || 800;
      const currentHeight = container.clientHeight || 580;

      for (let i = 0; i < sceneLandmarks.length; i++) {
        const lm = sceneLandmarks[i];
        const exactX = (lm.lon - SAKON_CENTER_LON) * SCALE_LON;
        const exactZ = -(lm.lat - SAKON_CENTER_LAT) * SCALE_LAT;
        const exactElev = getTerrainElev(exactX, exactZ);

        // Ground pin dot at exact GPS coordinate on terrain
        tempV.set(exactX, exactElev.y + 0.15, exactZ);
        tempV.applyMatrix4(provinceGroup.matrixWorld);
        tempV.project(camera);
        const dotX = (tempV.x * 0.5 + 0.5) * currentWidth;
        const dotY = (-(tempV.y * 0.5) + 0.5) * currentHeight;
        const dotVisible = tempV.z <= 1.0;

        // Floating label badge above 3D model
        const px = exactX + (lm.modelConfig.offset?.x || 0);
        const pz = exactZ + (lm.modelConfig.offset?.z || 0);
        const elev = getTerrainElev(px, pz);

        tempV.set(px, elev.y + 1.15, pz);
        tempV.applyMatrix4(provinceGroup.matrixWorld);
        tempV.project(camera);

        const screenX = (tempV.x * 0.5 + 0.5) * currentWidth + (lm.labelOffset2D?.x || 0);
        const screenY = (-(tempV.y * 0.5) + 0.5) * currentHeight + (lm.labelOffset2D?.y || 0);
        const visible = tempV.z <= 1.0;
        const zIndex = Math.round((2.0 - tempV.z) * 35);
        const isSelected = selectedIdRef.current === lm.id;

        const badgeEl = badgeRefs.current[lm.id];
        if (badgeEl) {
          if (!visible) {
            badgeEl.style.display = "none";
          } else {
            badgeEl.style.display = "block";
            const anchor = lm.pinAnchor || "center";
            const anchorFrac = anchor === "left" ? 0.12 : anchor === "right" ? 0.88 : 0.5;
            // Keep the label inside the canvas on narrow screens. Width is measured once (text never changes).
            let labelWidth = labelWidths[lm.id];
            if (!labelWidth && badgeEl.dataset.compact !== "1") {
              labelWidth = badgeEl.offsetWidth;
              if (labelWidth) labelWidths[lm.id] = labelWidth;
            }
            let labelHeight = labelHeights[lm.id];
            if (!labelHeight) {
              labelHeight = badgeEl.offsetHeight;
              if (labelHeight) labelHeights[lm.id] = labelHeight;
            }
            const margin = 6;
            // A label whose full name would run past the left/right edge shrinks to its icon only
            // (the selected one always keeps its name). data-compact is not React-managed, so a
            // re-render never resets it.
            const fullLeft = screenX - labelWidth * anchorFrac;
            const compact = !isSelected && (fullLeft < margin || fullLeft + labelWidth > currentWidth - margin);
            if ((badgeEl.dataset.compact === "1") !== compact) badgeEl.dataset.compact = compact ? "1" : "";
            if (compact) {
              let iconWidth = compactWidths[lm.id];
              if (!iconWidth) {
                iconWidth = badgeEl.offsetWidth;
                if (iconWidth) compactWidths[lm.id] = iconWidth;
              }
              labelWidth = iconWidth || labelWidth;
            }
            const left = Math.min(
              Math.max(screenX - labelWidth * anchorFrac, margin),
              Math.max(margin, currentWidth - labelWidth - margin),
            );
            // Placed after the loop, once every label's position is known (collision avoidance).
            labelRects.push({ id: lm.id, left, top: screenY - labelHeight, w: labelWidth, h: labelHeight, z: zIndex, selected: isSelected });
          }
        }

        const dotEl = dotRefs.current[lm.id];
        if (dotEl) {
          if (!dotVisible) {
            dotEl.style.display = "none";
          } else {
            dotEl.style.display = "block";
            dotEl.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
            dotEl.style.zIndex = `${isSelected ? 150 : 15}`;
          }
        }
      }

      // 2b. Keep labels from covering each other (matters on phones, where the sites sit close
      // together on screen). Selected and nearer labels keep their spot; others move up or down
      // in steps until they are clear. The ground dot always stays at the real GPS position.
      labelRects.sort((a, b) => Number(b.selected) - Number(a.selected) || b.z - a.z);
      const placedRects: LabelRect[] = [];
      for (const r of labelRects) {
        const step = r.h + 4;
        const tries = [0, -step, step, -2 * step, 2 * step, -3 * step, 3 * step];
        let top = r.top;
        for (const dy of tries) {
          const t = r.top + dy;
          // Stay clear of the top buttons (3D/2D switch, fullscreen) and the bottom layer bar.
          if (t < 52 || t + r.h > currentHeight - 58) continue;
          const hit = placedRects.some(
            (p) => r.left < p.left + p.w + 4 && r.left + r.w + 4 > p.left && t < p.top + p.h + 2 && t + r.h + 2 > p.top,
          );
          if (!hit) {
            top = t;
            break;
          }
        }
        placedRects.push({ ...r, top });
        const el = badgeRefs.current[r.id];
        if (el) {
          el.style.transform = `translate3d(${r.left}px, ${top + r.h}px, 0) translate(0, -100%) scale(${r.selected ? 1.1 : 1.0})`;
          el.style.zIndex = `${r.selected ? 200 : r.z}`;
        }
      }
      labelRects.length = 0;

      // 3. Update Compass Heading with 0 delay (via direct DOM)
      camera.getWorldDirection(camDir);
      const headingAngleRad = Math.atan2(camDir.x, -camDir.z);
      const headingAngleDeg = (headingAngleRad * 180) / Math.PI;

      if (compassNeedleRef.current) {
        compassNeedleRef.current.style.transform = `rotate(${-headingAngleDeg}deg)`;
      }

      const normDeg = (headingAngleDeg + 360) % 360;
      let label = "ทิศเหนือ (N)";
      if (normDeg > 337.5 || normDeg <= 22.5) label = "ทิศเหนือ (N)";
      else if (normDeg > 22.5 && normDeg <= 67.5) label = "ต.อ.เฉียงเหนือ (NE)";
      else if (normDeg > 67.5 && normDeg <= 112.5) label = "ทิศตะวันออก (E)";
      else if (normDeg > 112.5 && normDeg <= 157.5) label = "ต.อ.เฉียงใต้ (SE)";
      else if (normDeg > 157.5 && normDeg <= 202.5) label = "ทิศใต้ (S)";
      else if (normDeg > 202.5 && normDeg <= 247.5) label = "ต.ต.เฉียงใต้ (SW)";
      else if (normDeg > 247.5 && normDeg <= 292.5) label = "ทิศตะวันตก (W)";
      else if (normDeg > 292.5 && normDeg <= 337.5) label = "ต.ต.เฉียงเหนือ (NW)";

      if (compassLabelRef.current && compassLabelRef.current.textContent !== label) {
        compassLabelRef.current.textContent = label;
      }
    };

    const resume = () => {
      if (!running && tabVisible && onScreen) animate();
    };
    const handleVisibility = () => {
      tabVisible = document.visibilityState === "visible";
      resume();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      resume();
    });
    observer.observe(container);

    animate();

    // If mounted with an already-selected landmark (e.g., switching from 2D to 3D mode), fly to it
    if (selectedIdRef.current) {
      const initialLm = sceneLandmarks.find((lm) => lm.id === selectedIdRef.current);
      if (initialLm) {
        lastFlyIdRef.current = initialLm.id;
        flyTo(initialLm);
      }
    }

    // 11. Responsive Resize
    const handleResize = () => {
      if (!container) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
      // Label sizes depend on the screen width (smaller pills on phones): measure them again.
      for (const cache of [labelWidths, labelHeights, compactWidths]) {
        for (const key of Object.keys(cache)) delete cache[key];
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(reqId);
      running = false;
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("resize", handleResize);
      controls.removeEventListener("start", cancelAnim);
      if (renderer.domElement) {
        renderer.domElement.removeEventListener("wheel", cancelAnim);
        renderer.domElement.removeEventListener("pointerdown", cancelAnim);
        renderer.domElement.removeEventListener("touchstart", cancelAnim);
      }
      // Free GPU memory: geometries, materials and textures are not released by renderer.dispose().
      controls.dispose();
      disposeObject(scene);
      cartoonTex.dispose();
      satelliteTextureRef.current?.dispose();
      satelliteTextureRef.current = null;
      renderer.dispose();
      renderer.forceContextLoss();
      rendererRef.current = null;
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [flyTo]);

  return (
    <div
      className={`relative w-full ${className || "h-[620px]"} select-none font-sans`}
      style={{
        background: "radial-gradient(ellipse at 50% 44%, #263850 0%, #142033 65%, #0c1422 100%)",
      }}
    >
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md text-white">
          <div className="w-11 h-11 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3 shadow-lg shadow-amber-500/20"></div>
          <span className="text-sm font-medium tracking-wide">กำลังโหลดโมเดล 3D และภูมิประเทศสกลนคร…</span>
        </div>
      )}

      {/* 2D Markers Overlay */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {/* Real Ground Position Dots (Direct GPU translate3d with 0ms delay) */}
        {landmarks.map((lm) => {
          return (
            <div
              key={`dot-${lm.id}`}
              ref={(el) => {
                dotRefs.current[lm.id] = el;
              }}
              className="absolute top-0 left-0 pointer-events-none will-change-transform"
              style={{ display: "none" }}
            >
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white bg-amber-500 shadow-md animate-ping opacity-75"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 absolute top-0.5 left-0.5 shadow-sm"></div>
            </div>
          );
        })}

        {/* Floating Label Badges (Direct GPU translate3d with 0ms delay, rock-solid lock) */}
        {landmarks.map((item) => {
          const isSelected = selectedId === item.id;
          const anchor = item.pinAnchor || "center";
          const alignClass =
            anchor === "left"
              ? "items-start pl-2"
              : anchor === "right"
              ? "items-end pr-2"
              : "items-center";

          return (
            <div
              key={`pin-${item.id}`}
              ref={(el) => {
                badgeRefs.current[item.id] = el;
              }}
              className="absolute top-0 left-0 pointer-events-auto cursor-pointer will-change-transform"
              style={{ display: "none" }}
              onClick={() => handleSelect(item)}
            >
              <div
                className={`group flex flex-col ${alignClass} ${
                  isSelected ? "scale-105" : "hover:scale-105"
                } transition-transform duration-150`}
              >
                <div className={`mw-pin-pill ${isSelected ? "active" : ""}`}>
                  <span className="mw-pin-icon">
                    <i className={item.faIcon}></i>
                  </span>
                  <span className="mw-pin-text">{item.shortName}</span>
                </div>
                <div className="w-2.5 h-2.5 bg-white border-r border-b border-slate-200 rotate-45 -mt-1 shadow-sm"></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top-Left Compass Pill */}
      <div className="mw-top-left">
        <div className="mw-compass-pill">
          <div
            ref={compassNeedleRef}
            className="w-5 h-5 flex items-center justify-center will-change-transform"
          >
            <i className="fa-solid fa-compass text-brand text-base"></i>
          </div>
          <span ref={compassLabelRef}>ทิศเหนือ (N)</span>
        </div>
      </div>

      {/* Satellite imagery credit (CC BY 4.0 requires attribution) */}
      {texMode === "satellite" && (
        <a
          href="https://s2maps.eu"
          target="_blank"
          rel="noopener noreferrer"
          className="mw-sat-credit absolute bottom-1 left-2 z-30 rounded bg-black/55 px-2 py-0.5 text-[10px] leading-tight text-white/90"
        >
          ภาพดาวเทียม: Sentinel-2 cloudless 2016 โดย EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2016) · CC BY 4.0
        </a>
      )}

      {/* Bottom-Right Compact 3D Layer Controls */}
      <div className="mw-layer-bar">
        <button
          type="button"
          onClick={handleToggleRoads}
          className={`mw-layer-btn ${roadsVisible ? "active" : ""}`}
        >
          <i className="fa-solid fa-route"></i>
          <span>ทางหลวง</span>
        </button>

        <button
          type="button"
          onClick={handleToggleTexture}
          className="mw-layer-btn"
        >
          <i className="fa-solid fa-layer-group text-brand"></i>
          <span>{texMode === "cartoon" ? "ภาพการ์ตูน" : "ภาพดาวเทียม"}</span>
        </button>

        <button
          type="button"
          onClick={handleResetCamera}
          title="รีเซ็ตมุมมองภาพรวมสกลนคร"
          className="mw-layer-btn"
        >
          <i className="fa-solid fa-rotate-left"></i>
          <span>มุมมองรวม</span>
        </button>
      </div>
    </div>
  );
}
