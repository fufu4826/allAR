"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { SAKON_DEM } from "./data/sakonDem";
import { SAKON_BOUNDARY_GEO } from "./data/sakonBoundary";
import { SAKON_LANDMARKS_3D, type Landmark3DItem } from "./data/landmarksData";
import { MAJOR_HIGHWAYS, SECONDARY_HIGHWAYS, type RoadDefinition } from "./data/roadsData";

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

// Sakon Nakhon 5 Landmarks Overview Pivot
const DEFAULT_TARGET = new THREE.Vector3(12.5, 0.1, 5.0);
const DEFAULT_CAM_POS = new THREE.Vector3(12.5, 76.0, 38.0);

interface CameraAnimState {
  startTime: number;
  duration: number;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  startTarget: THREE.Vector3;
  targetLookAt: THREE.Vector3;
}

export interface Sakon3DMapCanvasProps {
  selectedId?: string | null;
  onSelectLandmark?: (id: string) => void;
  className?: string;
}

export default function Sakon3DMapCanvas({ selectedId, onSelectLandmark, className }: Sakon3DMapCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);

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
  const googleTextureRef = useRef<THREE.Texture | null>(null);

  // Direct DOM references for 0-delay hardware-accelerated pins & compass
  const badgeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dotRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const compassNeedleRef = useRef<HTMLDivElement | null>(null);
  const compassLabelRef = useRef<HTMLSpanElement | null>(null);
  const selectedIdRef = useRef<string | null | undefined>(selectedId);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // Smooth fly to landmark with cubic ease-out
  const flyTo = useCallback((landmark: Landmark3DItem | null) => {
    if (!controlsRef.current || !cameraRef.current) return;
    const controls = controlsRef.current;
    const camera = cameraRef.current;

    let targetLookAt: THREE.Vector3;
    let targetPos: THREE.Vector3;

    if (!landmark) {
      targetLookAt = DEFAULT_TARGET.clone();
      targetPos = DEFAULT_CAM_POS.clone();
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
        const found = SAKON_LANDMARKS_3D.find((lm) => lm.id === selectedId);
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

  const handleSelect = (item: Landmark3DItem) => {
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
        mat.map = next === "cartoon" ? cartoonTextureRef.current : googleTextureRef.current;
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
    scene.background = new THREE.Color(0x080e1a);
    scene.fog = new THREE.FogExp2(0x080e1a, 0.0075);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.copy(DEFAULT_CAM_POS);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.copy(DEFAULT_TARGET);
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
    const cartoonTex = textureLoader.load("/map3d/sakon_satellite_cartoon.webp", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
      tex.generateMipmaps = true;
      if (terrainMeshRef.current) (terrainMeshRef.current.material as THREE.MeshStandardMaterial).needsUpdate = true;
    });
    cartoonTextureRef.current = cartoonTex;

    const googleTex = textureLoader.load("/map3d/sakon_satellite_google.webp", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
      tex.generateMipmaps = true;
    });
    googleTextureRef.current = googleTex;

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
    const gltfLoader = new GLTFLoader();
    let loadedCount = 0;

    SAKON_LANDMARKS_3D.forEach((landmark) => {
      const x = (landmark.lon - SAKON_CENTER_LON) * SCALE_LON + (landmark.modelConfig.offset?.x || 0);
      const z = -(landmark.lat - SAKON_CENTER_LAT) * SCALE_LAT + (landmark.modelConfig.offset?.z || 0);
      const elev = getTerrainElev(x, z);

      const landmarkGroup = new THREE.Group();
      landmarkGroup.position.set(x, elev.y + (landmark.modelConfig.offset?.y || 0.05), z);

      gltfLoader.load(
        landmark.modelUrl,
        (gltf) => {
          const model = gltf.scene;
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
          if (loadedCount >= SAKON_LANDMARKS_3D.length) {
            setIsLoading(false);
          }
        },
        undefined,
        (err) => {
          console.warn("Failed to load model: " + landmark.modelUrl, err);
          loadedCount++;
          if (loadedCount >= SAKON_LANDMARKS_3D.length) setIsLoading(false);
        }
      );

      provinceGroup.add(landmarkGroup);
    });

    // 10. Animation & Render Loop
    let reqId = 0;
    const tempV = new THREE.Vector3();
    const camDir = new THREE.Vector3();

    const animate = () => {
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

      for (let i = 0; i < SAKON_LANDMARKS_3D.length; i++) {
        const lm = SAKON_LANDMARKS_3D[i];
        const px = (lm.lon - SAKON_CENTER_LON) * SCALE_LON + (lm.modelConfig.offset?.x || 0);
        const pz = -(lm.lat - SAKON_CENTER_LAT) * SCALE_LAT + (lm.modelConfig.offset?.z || 0);
        const elev = getTerrainElev(px, pz);

        tempV.set(px, elev.y + 2.15, pz);
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
            const anchorTransform =
              anchor === "left"
                ? "translate(-12%, -100%)"
                : anchor === "right"
                ? "translate(-88%, -100%)"
                : "translate(-50%, -100%)";
            badgeEl.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) ${anchorTransform} scale(${isSelected ? 1.10 : 1.0})`;
            badgeEl.style.zIndex = `${isSelected ? 200 : zIndex}`;
          }
        }

        const dotEl = dotRefs.current[lm.id];
        if (dotEl) {
          if (!visible) {
            dotEl.style.display = "none";
          } else {
            dotEl.style.display = "block";
            dotEl.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) translate(-50%, -50%)`;
            dotEl.style.zIndex = `${isSelected ? 150 : 15}`;
          }
        }
      }

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

    animate();

    // 11. Responsive Resize
    const handleResize = () => {
      if (!container) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener("resize", handleResize);
      controls.removeEventListener("start", cancelAnim);
      if (renderer.domElement) {
        renderer.domElement.removeEventListener("wheel", cancelAnim);
        renderer.domElement.removeEventListener("pointerdown", cancelAnim);
        renderer.domElement.removeEventListener("touchstart", cancelAnim);
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className={`relative w-full ${className || "h-[620px]"} select-none bg-slate-950 font-sans`}>
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
        {SAKON_LANDMARKS_3D.map((lm) => {
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
        {SAKON_LANDMARKS_3D.map((item) => {
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
                <div
                  className={`px-3 py-1.5 rounded-full shadow-lg border backdrop-blur-md flex items-center gap-1.5 transition-colors ${
                    isSelected
                      ? "bg-white text-slate-900 border-brand ring-2 ring-brand shadow-orange-500/40"
                      : "bg-white/98 text-slate-800 border-slate-200 hover:border-brand shadow-md"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      isSelected ? "bg-brand text-white" : "bg-orange-100 text-maroon-700"
                    }`}
                  >
                    {item.number}
                  </span>
                  <i className={`${item.faIcon} text-xs text-brand`}></i>
                  <span className="text-xs font-bold whitespace-nowrap">{item.shortName}</span>
                </div>
                <div className="w-2.5 h-2.5 bg-white border-r border-b border-slate-200 rotate-45 -mt-1 shadow-sm"></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between gap-3 pointer-events-none">
        {/* Compass Widget (Direct GPU transform with 0ms delay) */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl px-3.5 py-2 shadow-lg flex items-center gap-3 text-slate-800">
          <div
            ref={compassNeedleRef}
            className="w-7 h-7 flex items-center justify-center will-change-transform"
          >
            <i className="fa-solid fa-compass text-brand text-xl"></i>
          </div>
          <div className="text-left">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block leading-none mb-1">
              ทิศทางกล้อง
            </span>
            <span ref={compassLabelRef} className="text-xs font-bold text-slate-800 block leading-none">
              ทิศเหนือ (N)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Roads Toggle */}
          <button
            type="button"
            onClick={handleToggleRoads}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border shadow-md transition flex items-center gap-2 ${
              roadsVisible
                ? "bg-brand text-white border-brand shadow-orange-500/25"
                : "bg-white/95 text-slate-700 border-slate-200 hover:border-orange-300 hover:text-brand"
            }`}
          >
            <i className="fa-solid fa-route"></i>
            <span className="hidden sm:inline">ทางหลวง</span>
          </button>

          {/* Texture Switcher */}
          <button
            type="button"
            onClick={handleToggleTexture}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/95 text-slate-700 border border-slate-200 hover:border-orange-300 hover:text-brand shadow-md transition flex items-center gap-2"
          >
            <i className="fa-solid fa-layer-group text-brand"></i>
            <span className="hidden sm:inline">{texMode === "cartoon" ? "การ์ตูน 3D" : "ดาวเทียม"}</span>
          </button>

          {/* Reset Camera */}
          <button
            type="button"
            onClick={handleResetCamera}
            title="รีเซ็ตมุมมอง 75° ภาพรวมสกลนคร"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/95 text-slate-700 border border-slate-200 hover:border-orange-300 hover:text-brand shadow-md transition flex items-center gap-2"
          >
            <i className="fa-solid fa-rotate-left"></i>
            <span className="hidden sm:inline">รีเซ็ตมุมมอง</span>
          </button>
        </div>
      </div>
    </div>
  );
}
