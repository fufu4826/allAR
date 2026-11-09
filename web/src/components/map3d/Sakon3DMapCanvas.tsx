"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { SAKON_DEM } from "./data/sakonDem";
import { SAKON_BOUNDARY_GEO } from "./data/sakonBoundary";
import { MUANG_BOUNDARY_GEO } from "./data/muangBoundary";
import type { MapLandmark } from "./data/landmarksData";
import SiteIcon from "@/components/SiteIcon";
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

// อำเภอเมืองสกลนคร stands on a raised plateau this much above the rest of the province.
const MUANG_LIFT = 0.9;

function insidePolygon(poly: [number, number][], px: number, pz: number): boolean {
  const py = -pz;
  let inside = false;
  const n = poly.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function isInsideBoundary(px: number, pz: number): boolean {
  return insidePolygon(SAKON_BOUNDARY_GEO, px, pz);
}

function isInsideMuang(px: number, pz: number): boolean {
  return insidePolygon(MUANG_BOUNDARY_GEO, px, pz);
}

/** Ground height from the DEM alone, without the Muang plateau. */
function getBaseElev(x: number, z: number): { meters: number; y: number } {
  const lon = x / SCALE_LON + SAKON_CENTER_LON;
  const lat = -z / SCALE_LAT + SAKON_CENTER_LAT;
  const rawElev = SAKON_DEM.getElevationAtLonLat(lon, lat);
  const diff = Math.max(0.0, rawElev - ELEV_BASE);
  return {
    meters: rawElev,
    y: Math.max(0.03, diff * ELEV_SCALE),
  };
}

/** Ground height as shown: inside อำเภอเมือง it includes the plateau lift, so roads, models and
 *  pins there sit on top of it. */
function getTerrainElev(x: number, z: number): { meters: number; y: number } {
  const base = getBaseElev(x, z);
  return isInsideMuang(x, z) ? { meters: base.meters, y: base.y + MUANG_LIFT } : base;
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

// The map turns around สี่แยกบ้านธาตุ (แยกบ้านธาตุนาเวง, Highway 22 x 241, 17.19184 N 104.09542 E):
// visitors can only turn it left/right and cannot pan it away. The tilt is locked: 55 degrees above
// the ground in the overview, 20 degrees when zoomed in on a learning site.
const PIVOT_LON = 104.09542;
const PIVOT_LAT = 17.19184;
const OVERVIEW_POLAR = THREE.MathUtils.degToRad(90 - 55);
const SITE_POLAR = THREE.MathUtils.degToRad(90 - 20);
const OVERVIEW_DISTANCE = 96;

function pivotTarget(): THREE.Vector3 {
  const x = (PIVOT_LON - SAKON_CENTER_LON) * SCALE_LON;
  const z = -(PIVOT_LAT - SAKON_CENTER_LAT) * SCALE_LAT;
  return new THREE.Vector3(x, getTerrainElev(x, z).y, z);
}

/** Camera position at the locked tilt, `distance` away from `target`, facing `azimuth`. */
function cameraAt(target: THREE.Vector3, distance: number, azimuth = 0, polar = OVERVIEW_POLAR): THREE.Vector3 {
  return target.clone().add(new THREE.Vector3().setFromSphericalCoords(distance, polar, azimuth));
}

// อำเภอเมืองสกลนคร around the pivot (from muangBoundary.ts): about 7 units west, 10 east,
// 9 north and 8 south. The start view fits this, rounded up so the site labels have room.
const MUANG_HALF_WIDTH = 10.5;
const MUANG_HALF_DEPTH = 9;

/** Start view (also used when a site is closed or "มุมองค์รวม" is pressed): อำเภอเมือง fills the
 *  canvas, centred on สี่แยกบ้านธาตุ. The distance is whichever of width and depth needs more room
 *  for this viewport's aspect ratio, so phones (portrait) pull back further than desktops. */
function overviewView(aspect: number, azimuth = 0): { target: THREE.Vector3; position: THREE.Vector3 } {
  const target = pivotTarget();
  const tanHalfV = Math.tan(THREE.MathUtils.degToRad(38 / 2));
  const tanHalfH = tanHalfV * aspect;
  // Seen at 55 degrees above the ground, depth on the ground is foreshortened by sin(55).
  const depthOnScreen = MUANG_HALF_DEPTH * Math.sin(Math.PI / 2 - OVERVIEW_POLAR);
  // Generous: the near (south) side looks wider than the far side in perspective.
  const margin = 1.45;
  const distance = Math.min(OVERVIEW_DISTANCE * 2.6, margin * Math.max(MUANG_HALF_WIDTH / tanHalfH, depthOnScreen / tanHalfV));
  return { target, position: cameraAt(target, distance, azimuth) };
}

interface CameraAnimState {
  startTime: number;
  duration: number;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  startTarget: THREE.Vector3;
  targetLookAt: THREE.Vector3;
  /** Tilt (polar angle) to lock once the flight ends. */
  polar: number;
}

export interface Sakon3DMapCanvasProps {
  landmarks: MapLandmark[];
  selectedId?: string | null;
  onSelectLandmark?: (id: string) => void;
  className?: string;
  /** Holder for the selected site's card. The scene moves it every frame to the selected label,
   *  so the card grows out of the label and follows it; the label itself is hidden meanwhile. */
  cardAnchorRef?: React.RefObject<HTMLDivElement | null>;
}

export default function Sakon3DMapCanvas({ landmarks, selectedId, onSelectLandmark, className, cardAnchorRef }: Sakon3DMapCanvasProps) {
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

  // The render loop is set up once, so it reads the card holder through a ref.
  const cardAnchorHolder = useRef(cardAnchorRef);
  useEffect(() => {
    cardAnchorHolder.current = cardAnchorRef;
  }, [cardAnchorRef]);

  // Smooth fly to landmark with cubic ease-out
  const flyTo = useCallback((landmark: MapLandmark | null) => {
    if (!controlsRef.current || !cameraRef.current) return;
    const controls = controlsRef.current;
    const camera = cameraRef.current;

    let targetLookAt: THREE.Vector3;
    let targetPos: THREE.Vector3;

    const azimuth = controls.getAzimuthalAngle();
    if (!landmark) {
      const view = overviewView(camera.aspect, azimuth);
      targetLookAt = view.target;
      targetPos = view.position;
    } else {
      const x = (landmark.lon - SAKON_CENTER_LON) * SCALE_LON + (landmark.modelConfig.offset?.x || 0);
      const z = -(landmark.lat - SAKON_CENTER_LAT) * SCALE_LAT + (landmark.modelConfig.offset?.z || 0);
      const elev = getTerrainElev(x, z);

      // Aim above the model so it sits low on the screen, leaving room for the site's card above it.
      // Portrait screens (phones) need a bit more room, the card is taller there relative to the map.
      const distance = 13;
      const lift = distance * Math.tan(THREE.MathUtils.degToRad(38 / 2)) * (camera.aspect < 1 ? 0.66 : 0.6);
      targetLookAt = new THREE.Vector3(x, elev.y + 0.6 + lift, z);
      targetPos = cameraAt(targetLookAt, distance, azimuth, SITE_POLAR);
    }

    const polar = landmark ? SITE_POLAR : OVERVIEW_POLAR;
    // Free the tilt for the flight; it is locked again (to `polar`) when the flight ends.
    controls.minPolarAngle = Math.min(polar, controls.getPolarAngle());
    controls.maxPolarAngle = Math.max(polar, controls.getPolarAngle());
    animStateRef.current = {
      polar,
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
    // Turn left/right only: the tilt is locked and the map cannot be dragged away from the pivot.
    controls.minPolarAngle = OVERVIEW_POLAR;
    controls.maxPolarAngle = OVERVIEW_POLAR;
    controls.enablePan = false;
    controlsRef.current = controls;

    // Immediately stop auto-animation on user touch/scroll/drag so user has 100% free control!
    const lockTilt = (polar: number) => {
      controls.minPolarAngle = polar;
      controls.maxPolarAngle = polar;
    };
    const cancelAnim = () => {
      // Stopped mid-flight: keep the tilt the flight was heading for.
      if (animStateRef.current) lockTilt(animStateRef.current.polar);
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
          const elev = getBaseElev(x, z);
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

      const y1 = getBaseElev(x1, z1).y;
      const y2 = getBaseElev(x2, z2).y;
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

    // 5b. อำเภอเมืองสกลนคร plateau: its own terrain surface lifted by MUANG_LIFT, walls down to the
    // ground around it and an orange outline on top. The grid points inside the district are added
    // to the triangulation (as one-point holes) so the top keeps the DEM relief.
    {
      const ring = MUANG_BOUNDARY_GEO.map(([x, y]) => new THREE.Vector2(x, -y));
      if (THREE.ShapeUtils.isClockWise(ring)) ring.reverse();
      // Top surface on the same grid as the terrain: whole cells inside the district become two
      // triangles; cells the boundary crosses are clipped to the district (Sutherland-Hodgman) and
      // triangulated, so the plateau edge follows the real boundary without stretched slivers.
      let mMinX = Infinity, mMaxX = -Infinity, mMinZ = Infinity, mMaxZ = -Infinity;
      for (const p of ring) {
        mMinX = Math.min(mMinX, p.x); mMaxX = Math.max(mMaxX, p.x);
        mMinZ = Math.min(mMinZ, p.y); mMaxZ = Math.max(mMaxZ, p.y);
      }
      const topPos: number[] = [];
      const topUv: number[] = [];
      const topIdx: number[] = [];
      const gridVert = new Map<string, number>();
      const addVert = (x: number, z: number): number => {
        topPos.push(x, getBaseElev(x, z).y + MUANG_LIFT, z);
        const [u, v] = getUV(x, z);
        topUv.push(u, v);
        return topPos.length / 3 - 1;
      };
      const gridIndex = (ix: number, iz: number): number => {
        const key = `${ix},${iz}`;
        let idx = gridVert.get(key);
        if (idx === undefined) {
          idx = addVert(gridMinX + ix * stepX, gridMinZ + iz * stepZ);
          gridVert.set(key, idx);
        }
        return idx;
      };
      const clip = (poly: THREE.Vector2[], inside: (p: THREE.Vector2) => boolean, cut: (a: THREE.Vector2, b: THREE.Vector2) => THREE.Vector2) => {
        const out: THREE.Vector2[] = [];
        for (let i = 0; i < poly.length; i++) {
          const cur = poly[i];
          const prev = poly[(i + poly.length - 1) % poly.length];
          const curIn = inside(cur);
          const prevIn = inside(prev);
          if (curIn) {
            if (!prevIn) out.push(cut(prev, cur));
            out.push(cur);
          } else if (prevIn) {
            out.push(cut(prev, cur));
          }
        }
        return out;
      };
      const atX = (x: number) => (a: THREE.Vector2, b: THREE.Vector2) =>
        new THREE.Vector2(x, a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x));
      const atZ = (z: number) => (a: THREE.Vector2, b: THREE.Vector2) =>
        new THREE.Vector2(a.x + ((b.x - a.x) * (z - a.y)) / (b.y - a.y), z);
      const ix0 = Math.max(0, Math.floor((mMinX - gridMinX) / stepX));
      const ix1 = Math.min(GRID_NX - 1, Math.ceil((mMaxX - gridMinX) / stepX));
      const iz0 = Math.max(0, Math.floor((mMinZ - gridMinZ) / stepZ));
      const iz1 = Math.min(GRID_NZ - 1, Math.ceil((mMaxZ - gridMinZ) / stepZ));
      for (let iz = iz0; iz <= iz1; iz++) {
        const z0 = gridMinZ + iz * stepZ;
        const z1 = z0 + stepZ;
        for (let ix = ix0; ix <= ix1; ix++) {
          const x0 = gridMinX + ix * stepX;
          const x1 = x0 + stepX;
          const corners = [isInsideMuang(x0, z0), isInsideMuang(x1, z0), isInsideMuang(x0, z1), isInsideMuang(x1, z1)];
          const crossed = ring.some((p, i) => {
            const q = ring[(i + 1) % ring.length];
            return Math.max(p.x, q.x) >= x0 && Math.min(p.x, q.x) <= x1 && Math.max(p.y, q.y) >= z0 && Math.min(p.y, q.y) <= z1;
          });
          if (!crossed) {
            if (corners.every(Boolean)) {
              const i00 = gridIndex(ix, iz), i10 = gridIndex(ix + 1, iz), i01 = gridIndex(ix, iz + 1), i11 = gridIndex(ix + 1, iz + 1);
              topIdx.push(i00, i01, i10, i10, i01, i11);
            }
            continue;
          }
          let poly = ring;
          poly = clip(poly, (p) => p.x >= x0, atX(x0));
          if (poly.length) poly = clip(poly, (p) => p.x <= x1, atX(x1));
          if (poly.length) poly = clip(poly, (p) => p.y >= z0, atZ(z0));
          if (poly.length) poly = clip(poly, (p) => p.y <= z1, atZ(z1));
          if (poly.length < 3) continue;
          const tris = THREE.ShapeUtils.triangulateShape(poly, []);
          const base = poly.map((p) => addVert(p.x, p.y));
          for (const t of tris) topIdx.push(base[t[0]], base[t[2]], base[t[1]]);
        }
      }
      const topGeo = new THREE.BufferGeometry();
      topGeo.setAttribute("position", new THREE.Float32BufferAttribute(topPos, 3));
      topGeo.setAttribute("uv", new THREE.Float32BufferAttribute(topUv, 2));
      topGeo.setIndex(topIdx);
      topGeo.computeVertexNormals();
      const topMesh = new THREE.Mesh(topGeo, satMaterial);
      topMesh.receiveShadow = true;
      topMesh.castShadow = true;
      provinceGroup.add(topMesh);

      const wallPos: number[] = [];
      const wallIdx: number[] = [];
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i];
        const b = ring[(i + 1) % ring.length];
        const ya = getBaseElev(a.x, a.y).y;
        const yb = getBaseElev(b.x, b.y).y;
        const k = wallPos.length / 3;
        wallPos.push(a.x, ya + MUANG_LIFT, a.y, a.x, ya - 0.05, a.y, b.x, yb + MUANG_LIFT, b.y, b.x, yb - 0.05, b.y);
        wallIdx.push(k, k + 1, k + 2, k + 2, k + 1, k + 3);
      }
      const wallGeo = new THREE.BufferGeometry();
      wallGeo.setAttribute("position", new THREE.Float32BufferAttribute(wallPos, 3));
      wallGeo.setIndex(wallIdx);
      wallGeo.computeVertexNormals();
      const wallMesh = new THREE.Mesh(
        wallGeo,
        new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.8, side: THREE.DoubleSide })
      );
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      provinceGroup.add(wallMesh);

      // A tube rather than a line: WebGL draws lines 1px wide, too thin to see from the overview.
      const edge = ring.map((p) => new THREE.Vector3(p.x, getBaseElev(p.x, p.y).y + MUANG_LIFT + 0.03, p.y));
      const edgeCurve = new THREE.CatmullRomCurve3(edge, true, "centripetal");
      const edgeMesh = new THREE.Mesh(
        new THREE.TubeGeometry(edgeCurve, edge.length * 2, 0.11, 6, true),
        new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xf97316, emissiveIntensity: 0.6, roughness: 0.5 })
      );
      provinceGroup.add(edgeMesh);
    }

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
    let selectedAnchor: { x: number; y: number } | null = null;
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
          lockTilt(anim.polar);
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
            // Near an edge the full label first slides inward. It shrinks to its icon only when the
            // slide would leave it no longer above its own point on the map, or when it is wider than
            // the canvas (the selected one always keeps its name). data-compact is not React-managed,
            // so a re-render never resets it.
            const naturalLeft = screenX - labelWidth * anchorFrac;
            const slidLeft = Math.min(Math.max(naturalLeft, margin), Math.max(margin, currentWidth - labelWidth - margin));
            const slid = Math.abs(slidLeft - naturalLeft) > 0.5;
            const compact =
              !isSelected &&
              (labelWidth > currentWidth - margin * 2 ||
                (slid && (screenX < slidLeft + 6 || screenX > slidLeft + labelWidth - 6)));
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
          // The selected label turns into the card (see cardAnchorRef), so hide it while the card is open.
          const hide = r.selected && !!cardAnchorHolder.current?.current?.firstElementChild;
          if ((el.style.visibility === "hidden") !== hide) el.style.visibility = hide ? "hidden" : "";
        }
        if (r.selected) selectedAnchor = { x: r.left + r.w / 2, y: top + r.h };
      }
      labelRects.length = 0;

      // 2c. Card of the selected site: its bottom-centre sits where the label was, kept inside the map.
      const anchorEl = cardAnchorHolder.current?.current;
      if (anchorEl) {
        const card = anchorEl.firstElementChild as HTMLElement | null;
        if (!selectedAnchor || !card) {
          if (anchorEl.style.display !== "none") anchorEl.style.display = "none";
        } else {
          anchorEl.style.display = "block";
          const half = card.offsetWidth / 2;
          const x = Math.min(Math.max(selectedAnchor.x, half + 8), Math.max(half + 8, currentWidth - half - 8));
          const y = Math.max(selectedAnchor.y, card.offsetHeight + 58);
          anchorEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
      }
      selectedAnchor = null;

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
                    <SiteIcon slug={item.slug} />
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
