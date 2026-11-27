declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly VITE_API_URL?: string;
  readonly VITE_MEDIA_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** Modèle d'URL de tuiles raster (https://…/{z}/{x}/{y}.png), obligatoire en production. */
  readonly VITE_MAP_TILES_URL?: string;
  readonly VITE_MAP_ATTRIBUTION?: string;
  /** Clé Gemini (lue depuis .env sans préfixe — voir envPrefix dans vite.config). */
  readonly GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
