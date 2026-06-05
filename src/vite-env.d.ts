/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_MODE: 'mobile' | 'pc' | undefined
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
