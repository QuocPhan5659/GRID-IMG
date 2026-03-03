export interface GridCell {
  id: number;
  image: File | null;
  previewUrl: string | null;
}

export interface CollageConfig {
  images?: File[];
  background: "gray-black" | "brown-black" | "white";
  prompt?: string;
  model?: string;
  userApiKey?: string;
  heroImageIndex?: number;
  title?: string;
  logo: File | null;
  layoutStyle?: "grid" | "masonry" | "cinematic" | "minimal";
  outputQuality?: "standard" | "high";
  showImageNames?: boolean;
  cells?: GridCell[];
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
