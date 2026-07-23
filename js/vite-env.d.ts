/// <reference types="vite/client" />

/** Values vite.config.mts puts into process.env for vite to expose here. */
interface ImportMetaEnv {
  /** The date and `git describe` of the commit the app was built from. */
  readonly VITE_GIT_VERSION: string;
  /** The app's dependencies and their licences, as an HTML fragment. */
  readonly VITE_APP_DEPENDENCIES: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
