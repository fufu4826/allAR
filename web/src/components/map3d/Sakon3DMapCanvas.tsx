"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
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

// Nong Han rotation pivot center
const NONGHAN_LON = 104.1951;
const NONGHAN_LAT = 17.1896;
const NH_PIVOT_X = (NONGHAN_LON - SAKON_CENTER_LON) * SCALE_LON;
const NH_PIVOT_Z = -(NONGHAN_LAT - SAKON_CENTER_LAT) * SCALE_LAT;
const NH_PIVOT_Y = 0.1;

const DEFAULT_TARGET = new THREE.Vector3(NH_PIVOT_X, NH_PIVOT_Y, NH_PIVOT_Z);
const DEFAULT_CAM_POS = new THREE.Vector3(NH_PIVOT_X, NH_PIVOT_Y + 88.0, NH_PIVOT_Z + 23.5);

interface ProjectedPin {
  item: Landmark3DItem;
  x: number;
  y: number;
  visible: boolean;
  zIndex: number;
}

export default function Sakon3DMapCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [selectedLandmark, setSelectedLandmark] = useState<Landmark3DItem | null>(null);
  const [projectedPins, setProjectedPins] = useState<ProjectedPin[]>([]);
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [compassDir, setCompassDir] = useState<string>("เหนือ (N)");
  const [roadsVisible, setRoadsVisible] = useState<boolean>(true);
  const [texMode, setTexMode] = useState<"cartoon" | "satellite">("cartoon");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // References for camera tweening
  const cameraTargetRef = useRef<THREE.Vector3>(DEFAULT_TARGET.clone());
  const cameraPosRef = useRef<THREE.Vector3>(DEFAULT_CAM_POS.clone());
  const isAnimatingRef = useRef<boolean>(false);
  const controlsRef = useRef<OrbitControls | null>(null);
  const roadGroupRef = useRef<THREE.Group | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const cartoonTextureRef = useRef<THREE.Texture | null>(null);
  const googleTextureRef = useRef<THREE.Texture | null>(null);

  // Smooth fly to landmark
  const flyTo = useCallback((landmark: Landmark3DItem | null) => {
    if (!landmark) {
      cameraTargetRef.current.copy(DEFAULT_TARGET);
      cameraPosRef.current.copy(DEFAULT_CAM_POS);
      isAnimatingRef.current = true;
      return;
    }
    const x = (landmark.lon - SAKON_CENTER_LON) * SCALE_LON + (landmark.sideOffset?.x || 0);
    const z = -(landmark.lat - SAKON_CENTER_LAT) * SCALE_LAT + (landmark.sideOffset?.z || 0);
    const elev = getTerrainElev(x, z);

    cameraTargetRef.current.set(x, elev.y + 0.3, z);
    cameraPosRef.current.set(x, elev.y + 4.8, z + 4.2);
    isAnimatingRef.current = true;
  }, []);

  const handleSelectLandmark = useCallback(
    (item: Landmark3DItem) => {
      setSelectedLandmark(item);
      flyTo(item);
    },
    [flyTo]
  );

  const handleResetCamera = useCallback(() => {
    setSelectedLandmark(null);
    flyTo(null);
  }, [flyTo]);

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
    const height = container.clientHeight || 550;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1120);
    scene.fog = new THREE.FogExp2(0x0b1120, 0.0075);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.copy(DEFAULT_CAM_POS);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.copy(DEFAULT_TARGET);
    controls.minDistance = 12;
    controls.maxDistance = 150;
    controls.maxPolarAngle = Math.PI / 2 - 0.08;
    controlsRef.current = controls;

    // 2. Natural Lighting
    const ambientLight = new THREE.AmbientLight(0xfffaf0, 0.48);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xf0fdf4, 0x453826, 0.45);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 0.82);
    dirLight.position.set(40, 85, 35);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.0003;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xbae6fd, 0.22);
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
      color: 0x451a03,
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

    // 5. Geological Side Skirt Walls
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

    // 6. Base Pedestal
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

    // 9. Load 5 GLB Models
    const gltfLoader = new GLTFLoader();
    let loadedCount = 0;

    SAKON_LANDMARKS_3D.forEach((landmark) => {
      const x = (landmark.lon - SAKON_CENTER_LON) * SCALE_LON + (landmark.sideOffset?.x || 0);
      const z = -(landmark.lat - SAKON_CENTER_LAT) * SCALE_LAT + (landmark.sideOffset?.z || 0);
      const elev = getTerrainElev(x, z);

      const landmarkGroup = new THREE.Group();
      landmarkGroup.position.set(x, elev.y, z);

      gltfLoader.load(
        landmark.modelUrl,
        (gltf) => {
          const model = gltf.scene;
          const s = landmark.modelConfig.scale || 2.0;
          model.scale.set(s, s, s);
          if (landmark.modelConfig.rotationY) model.rotation.y = landmark.modelConfig.rotationY;
          if (landmark.modelConfig.offset) {
            model.position.set(
              landmark.modelConfig.offset.x || 0,
              landmark.modelConfig.offset.y || 0,
              landmark.modelConfig.offset.z || 0
            );
          }

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

          // Special Cross and Bethlehem Star for Tha Rae
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

      // Camera interpolation (Smooth Fly-to)
      if (isAnimatingRef.current) {
        controls.target.lerp(cameraTargetRef.current, 0.08);
        camera.position.lerp(cameraPosRef.current, 0.08);
        if (camera.position.distanceTo(cameraPosRef.current) < 0.04) {
          isAnimatingRef.current = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      // Project pins onto 2D screen coordinates
      const currentWidth = container.clientWidth || 800;
      const currentHeight = container.clientHeight || 550;

      const updatedPins: ProjectedPin[] = SAKON_LANDMARKS_3D.map((lm) => {
        const px = (lm.lon - SAKON_CENTER_LON) * SCALE_LON + (lm.sideOffset?.x || 0);
        const pz = -(lm.lat - SAKON_CENTER_LAT) * SCALE_LAT + (lm.sideOffset?.z || 0);
        const elev = getTerrainElev(px, pz);

        tempV.set(px, elev.y + 2.35, pz);
        tempV.applyMatrix4(provinceGroup.matrixWorld);
        tempV.project(camera);

        const screenX = (tempV.x * 0.5 + 0.5) * currentWidth;
        const screenY = (-(tempV.y * 0.5) + 0.5) * currentHeight;
        const visible = tempV.z <= 1.0;
        const zIndex = Math.round((2.0 - tempV.z) * 35);

        return {
          item: lm,
          x: screenX,
          y: screenY,
          visible,
          zIndex,
        };
      });

      setProjectedPins(updatedPins);

      // Update Compass Heading
      camera.getWorldDirection(camDir);
      const headingAngleRad = Math.atan2(camDir.x, -camDir.z);
      const headingAngleDeg = (headingAngleRad * 180) / Math.PI;
      setCompassHeading(-headingAngleDeg);

      const normDeg = (headingAngleDeg + 360) % 360;
      let label = "เหนือ (N)";
      if (normDeg > 337.5 || normDeg <= 22.5) label = "ทิศเหนือ (N)";
      else if (normDeg > 22.5 && normDeg <= 67.5) label = "ต.อ.เฉียงเหนือ (NE)";
      else if (normDeg > 67.5 && normDeg <= 112.5) label = "ทิศตะวันออก (E)";
      else if (normDeg > 112.5 && normDeg <= 157.5) label = "ต.อ.เฉียงใต้ (SE)";
      else if (normDeg > 157.5 && normDeg <= 202.5) label = "ทิศใต้ (S)";
      else if (normDeg > 202.5 && normDeg <= 247.5) label = "ต.ต.เฉียงใต้ (SW)";
      else if (normDeg > 247.5 && normDeg <= 292.5) label = "ทิศตะวันตก (W)";
      else if (normDeg > 292.5 && normDeg <= 337.5) label = "ต.ต.เฉียงเหนือ (NW)";
      setCompassDir(label);
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
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[580px] md:h-[640px] rounded-2xl overflow-hidden select-none bg-slate-950 font-sans shadow-xl">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm text-white">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <span className="text-sm font-medium tracking-wide">กำลังโหลดแผนที่ภูมิประเทศและโมเดล 3D สกลนคร…</span>
        </div>
      )}

      {/* 2D Markers Overlay */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {projectedPins.map((pin) => {
          if (!pin.visible) return null;
          const isSelected = selectedLandmark?.id === pin.item.id;
          return (
            <div
              key={pin.item.id}
              className="absolute pointer-events-auto cursor-pointer transition-transform duration-200"
              style={{
                left: `${pin.x}px`,
                top: `${pin.y}px`,
                transform: `translate(-50%, -100%) scale(${isSelected ? 1.08 : 1.0})`,
                zIndex: isSelected ? 200 : pin.zIndex,
              }}
              onClick={() => handleSelectLandmark(pin.item)}
            >
              <div
                className={`group flex flex-col items-center ${
                  isSelected ? "scale-105" : "hover:scale-105"
                } transition-all duration-200`}
              >
                <div
                  className={`px-3 py-1.5 rounded-full shadow-lg border backdrop-blur-md flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? "bg-white text-slate-900 border-amber-500 ring-2 ring-amber-500 shadow-amber-500/30"
                      : "bg-white/95 text-slate-800 border-slate-200 hover:border-amber-400"
                  }`}
                >
                  <span className="text-sm">{pin.item.badgeIcon}</span>
                  <span className="text-xs font-bold whitespace-nowrap">{pin.item.shortName}</span>
                </div>
                <div className="w-2.5 h-2.5 bg-slate-900 rotate-45 -mt-1 shadow-md"></div>
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-0.5 animate-pulse"></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Floating Controls */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
        {/* Compass Widget */}
        <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-2.5 text-white">
          <div
            className="w-6 h-6 flex items-center justify-center transition-transform duration-200"
            style={{ transform: `rotate(${compassHeading}deg)` }}
          >
            <i className="fa-solid fa-compass text-amber-400 text-lg"></i>
          </div>
          <div className="text-[11px] leading-tight">
            <span className="text-slate-400 block text-[9px]">ทิศทางกล้อง</span>
            <span className="font-semibold">{compassDir}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Roads Toggle */}
          <button
            type="button"
            onClick={handleToggleRoads}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border shadow-md transition flex items-center gap-1.5 ${
              roadsVisible
                ? "bg-amber-500 text-white border-amber-400 shadow-amber-500/20"
                : "bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800"
            }`}
          >
            <i className="fa-solid fa-route"></i>
            <span className="hidden sm:inline">โครงข่ายทางหลวง</span>
          </button>

          {/* Texture Switcher */}
          <button
            type="button"
            onClick={handleToggleTexture}
            className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-900/80 text-slate-300 border border-slate-700 hover:bg-slate-800 shadow-md transition flex items-center gap-1.5"
          >
            <i className="fa-solid fa-layer-group text-sky-400"></i>
            <span className="hidden sm:inline">{texMode === "cartoon" ? "การ์ตูน 3D" : "ภาพถ่ายดาวเทียม"}</span>
          </button>

          {/* Reset Camera */}
          <button
            type="button"
            onClick={handleResetCamera}
            title="รีเซ็ตมุมมอง 75° ภาพรวมสกลนคร"
            className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-900/80 text-slate-300 border border-slate-700 hover:bg-slate-800 shadow-md transition flex items-center gap-1.5"
          >
            <i className="fa-solid fa-rotate-left"></i>
            <span className="hidden sm:inline">มุมมองภาพรวม</span>
          </button>
        </div>
      </div>

      {/* Selected Landmark Info Card Overlay (Fly-in from Top-Right on Desktop, Bottom on Mobile) */}
      {selectedLandmark && (
        <div className="absolute top-14 right-3 z-30 w-80 max-w-[calc(100%-24px)] bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-200/90 text-slate-800 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl p-1.5 bg-amber-50 rounded-xl border border-amber-200">
                {selectedLandmark.badgeIcon}
              </span>
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${selectedLandmark.categoryClass}`}>
                  {selectedLandmark.category}
                </span>
                <h4 className="text-sm font-bold text-slate-900 leading-tight mt-0.5">{selectedLandmark.name}</h4>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedLandmark(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <p className="text-xs text-slate-600 line-clamp-3 mb-3">{selectedLandmark.desc}</p>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <a
              href={selectedLandmark.gmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <i className="fa-solid fa-location-arrow text-[10px]"></i> แผนที่จริง
            </a>
            <Link
              href={`/c/${selectedLandmark.slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand text-white text-xs font-semibold shadow hover:bg-brand-dark transition"
            >
              <span>ชมวัตถุ 3D ชุมชน</span>
              <i className="fa-solid fa-arrow-right text-[10px]"></i>
            </Link>
          </div>
        </div>
      )}

      {/* Bottom Horizontal Scrollable Landmark Carousel */}
      <div className="absolute bottom-3 left-3 right-3 z-30 pointer-events-auto">
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-2xl p-2 shadow-2xl flex items-center gap-1.5">
          {/* Scroll Left Button */}
          <button
            type="button"
            onClick={() => {
              if (trackRef.current) trackRef.current.scrollBy({ left: -160, behavior: "smooth" });
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition shrink-0"
          >
            <i className="fa-solid fa-chevron-left text-xs"></i>
          </button>

          {/* Cards Track */}
          <div
            ref={trackRef}
            className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 flex-1"
            style={{ scrollbarWidth: "none" }}
          >
            {SAKON_LANDMARKS_3D.map((lm) => {
              const isSelected = selectedLandmark?.id === lm.id;
              return (
                <button
                  key={lm.id}
                  type="button"
                  onClick={() => handleSelectLandmark(lm)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition shrink-0 border ${
                    isSelected
                      ? "bg-amber-500/20 border-amber-400 text-white shadow-md ring-1 ring-amber-400"
                      : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-amber-400 shrink-0">
                    {lm.number}
                  </span>
                  <div className="leading-tight">
                    <span className="text-xs font-semibold block whitespace-nowrap">{lm.shortName}</span>
                    <span className="text-[10px] text-slate-400 block whitespace-nowrap">{lm.category}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Scroll Right Button */}
          <button
            type="button"
            onClick={() => {
              if (trackRef.current) trackRef.current.scrollBy({ left: 160, behavior: "smooth" });
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition shrink-0"
          >
            <i className="fa-solid fa-chevron-right text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
