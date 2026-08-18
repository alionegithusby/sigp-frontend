// Configuração — sistema a consumir exclusivamente o PocketBase (sem mock).
export const POCKETBASE_URL =
  import.meta.env.VITE_POCKETBASE_URL ||
  "https://sigp-pocketbase-database.up.railway.app";

export const APP_NAME = "SIGP";
export const APP_LONG_NAME = "Sistema Integrado de Gestão de Projectos";
export const ORG = "SONILS";
export const APP_VERSION = "1.0.0";
