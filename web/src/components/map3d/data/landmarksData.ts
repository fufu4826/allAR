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
}

/** One picture in a site's slideshow on the map card. */
export type MapSlide = { id: string; name: string; image: string; href: string };

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
  slides: MapSlide[];
}

const DEFAULT_CONFIG: Landmark3DConfig = {
  modelConfig: { scale: 2.0 },
  pinAnchor: "center",
};

export const LANDMARK_3D_CONFIG: Record<string, Landmark3DConfig> = {
  tharae: {
    modelUrl: "/map3d/models/tharae.glb",
    modelConfig: { scale: 2.2, rotationY: Math.PI * 1.35, offset: { x: 1.08, y: 0.05, z: 0 } },
    pinAnchor: "center",
  },
  watklang: {
    modelUrl: "/map3d/models/watklang.glb",
    modelConfig: { scale: 1.45, rotationY: Math.PI * 0.35, offset: { x: 0.35, y: 0.05, z: 0.45 } },
    pinAnchor: "left",
  },
  watnuea: {
    modelUrl: "/map3d/models/watnuea.glb",
    modelConfig: { scale: 1.25, rotationY: Math.PI * 0.25, offset: { x: -0.22, y: 0.05, z: -0.45 } },
    pinAnchor: "right",
  },
  nonhom: {
    modelUrl: "/map3d/models/nonhom.glb",
    modelConfig: { scale: 1.25, rotationY: Math.PI * 0.15, offset: { x: 0, y: 0.05, z: 0 } },
    pinAnchor: "left",
  },
  phuphan: {
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
  slides?: MapSlide[];
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
      slides: c.slides ?? [],
    };
  });
}
