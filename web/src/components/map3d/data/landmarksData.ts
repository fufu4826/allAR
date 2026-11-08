/**
 * 3D placement for each learning site on the map.
 * Names, coordinates, taglines and item counts come from the database (admin can edit them);
 * this file only holds what the 3D scene needs: icon, model file, scale/rotation and label nudges.
 */

export interface Landmark3DConfig {
  faIcon: string;
  modelUrl?: string;
  modelConfig: {
    scale: number;
    rotationY?: number;
    offset?: { x: number; y: number; z: number };
  };
  labelOffset2D?: { x: number; y: number }; // screen offset so models stay at real GPS while labels don't collide
  pinAnchor?: "center" | "left" | "right";
}

/** A site on the map: database fields merged with its 3D config. */
export interface MapLandmark extends Landmark3DConfig {
  id: string; // community slug
  slug: string;
  name: string;
  shortName: string;
  englishName: string;
  desc: string;
  location: string;
  lat: number;
  lon: number;
  gmapsUrl: string;
  itemCount: number;
  placeholder: boolean;
}

const DEFAULT_CONFIG: Landmark3DConfig = {
  faIcon: "fa-solid fa-location-dot",
  modelConfig: { scale: 2.0 },
  pinAnchor: "center",
};

export const LANDMARK_3D_CONFIG: Record<string, Landmark3DConfig> = {
  tharae: {
    faIcon: "fa-solid fa-church",
    modelUrl: "/map3d/models/tharae.glb",
    modelConfig: { scale: 2.2, rotationY: Math.PI * 0.85, offset: { x: 0, y: 0.05, z: 0 } },
    labelOffset2D: { x: 0, y: -6 },
    pinAnchor: "center",
  },
  watklang: {
    faIcon: "fa-solid fa-place-of-worship",
    modelUrl: "/map3d/models/watklang.glb",
    modelConfig: { scale: 1.45, rotationY: Math.PI * 0.35, offset: { x: 0.35, y: 0.05, z: 0.45 } },
    labelOffset2D: { x: 16, y: 6 },
    pinAnchor: "left",
  },
  watnuea: {
    faIcon: "fa-solid fa-dharmachakra",
    modelUrl: "/map3d/models/watnuea.glb",
    modelConfig: { scale: 1.25, rotationY: Math.PI * 0.25, offset: { x: -0.22, y: 0.05, z: -0.45 } },
    labelOffset2D: { x: -16, y: -6 },
    pinAnchor: "right",
  },
  nonhom: {
    faIcon: "fa-solid fa-house-chimney-window",
    modelUrl: "/map3d/models/nonhom.glb",
    modelConfig: { scale: 1.25, rotationY: Math.PI * 0.15, offset: { x: 0, y: 0.05, z: 0 } },
    labelOffset2D: { x: 24, y: 12 },
    pinAnchor: "left",
  },
  phuphan: {
    faIcon: "fa-solid fa-mountain-sun",
    modelUrl: "/map3d/models/phuphan.glb",
    // The centre's coordinates fall just outside the อำเภอเมือง boundary used for the raised
    // plateau, so the model is nudged north-west onto it.
    modelConfig: { scale: 2.5, rotationY: Math.PI * 0.1, offset: { x: -0.55, y: 0.05, z: -0.95 } },
    labelOffset2D: { x: -24, y: -8 },
    pinAnchor: "right",
  },
};

export type MapCommunity = {
  slug: string;
  name: string;
  shortName: string;
  englishName?: string | null;
  tagline?: string | null;
  location: string;
  position: [number, number];
  itemCount: number;
  placeholder: boolean;
};

/** Merge database communities with their 3D config. Sites without a config still get a pin (no model). */
export function toMapLandmarks(communities: MapCommunity[]): MapLandmark[] {
  return communities.map((c) => {
    const [lat, lon] = c.position;
    return {
      ...DEFAULT_CONFIG,
      ...LANDMARK_3D_CONFIG[c.slug],
      id: c.slug,
      slug: c.slug,
      name: c.name,
      shortName: c.shortName,
      englishName: c.englishName ?? "",
      desc: c.tagline ?? "",
      location: c.location,
      lat,
      lon,
      gmapsUrl: `https://www.google.com/maps?q=${lat},${lon}`,
      itemCount: c.itemCount,
      placeholder: c.placeholder,
    };
  });
}
