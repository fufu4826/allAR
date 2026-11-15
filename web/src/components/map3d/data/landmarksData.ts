/**
 * 3D placement for each learning site on the map.
 * Names, coordinates, taglines and item counts come from the database (admin can edit them);
 * this file only holds what the 3D scene needs: model file, scale/rotation and label nudges.
 */

export interface Landmark3DConfig {
  modelUrl?: string;
  modelConfig: {
    scale: number;
    rotationY?: number;
    offset?: { x: number; y: number; z: number };
  };
  pinAnchor?: "center" | "left" | "right"; // 2D map only
  /** Short name on the map pin, so the five labels do not crowd each other. */
  mapLabel?: string;
  /** Picture on the site's map card and list row: the same one as the site page's banner. Sites
   *  whose banner is a fixed theme image (community.css) name it here; the others use the cover
   *  photo set in the admin, which is also their banner. */
  banner?: string;
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
  /** Picture on the site's card and list row: its page banner (null: the site's icon instead). */
  cover: string | null;
}

const DEFAULT_CONFIG: Landmark3DConfig = {
  modelConfig: { scale: 2.0 },
  pinAnchor: "center",
};

export const LANDMARK_3D_CONFIG: Record<string, Landmark3DConfig> = {
  tharae: {
    mapLabel: "ท่าแร่",
    modelUrl: "/map3d/models/tharae.glb",
    modelConfig: { scale: 2.2, rotationY: Math.PI * 0.85, offset: { x: 0, y: 0.05, z: 0 } },
    pinAnchor: "center",
  },
  watklang: {
    banner: "/brand/watklang-banner.webp",
    mapLabel: "วัดกลางฯ",
    modelUrl: "/map3d/models/watklang.glb",
    modelConfig: { scale: 1.45, rotationY: Math.PI * 0.35, offset: { x: 0.35, y: 0.05, z: 0.45 } },
    pinAnchor: "left",
  },
  watnuea: {
    banner: "/brand/watnuea-real-banner.webp",
    mapLabel: "วัดมหาพรหมฯ",
    modelUrl: "/map3d/models/watnuea.glb",
    modelConfig: { scale: 1.25, rotationY: Math.PI * 0.25, offset: { x: -0.22, y: 0.05, z: -0.45 } },
    pinAnchor: "right",
  },
  nonhom: {
    banner: "/brand/nonhom-banner.webp",
    mapLabel: "บ้านโนนหอม",
    modelUrl: "/map3d/models/nonhom.glb",
    modelConfig: { scale: 1.25, rotationY: Math.PI * 0.15, offset: { x: 0, y: 0.05, z: 0 } },
    pinAnchor: "left",
  },
  phuphan: {
    mapLabel: "ศูนย์ภูพาน",
    modelUrl: "/map3d/models/phuphan.glb",
    // The centre's coordinates fall just outside the อำเภอเมือง boundary used for the raised
    // plateau, so the model is nudged north-west onto it.
    modelConfig: { scale: 2.5, rotationY: Math.PI * 0.1, offset: { x: -0.55, y: 0.05, z: -0.95 } },
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
  cover?: string | null;
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
      cover: LANDMARK_3D_CONFIG[c.slug]?.banner ?? c.cover ?? null,
    };
  });
}
