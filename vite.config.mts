import {execSync} from "child_process";
import {cpSync, readFileSync} from "fs";
import {resolve} from "path";

import inject from "@rollup/plugin-inject";
import peggy from "peggy";
/// <reference types="vitest" />
import {type Plugin, defineConfig, createFilter, lazyPlugins} from "vite-plus";

process.env.VITE_GIT_VERSION = `${execSync(
  "git log -1 --format=%cd --date=short",
  {encoding: "utf-8"}
).trim()}/${execSync("git describe --always", {encoding: "utf-8"}).trim()}`;

const dependencies = JSON.parse(
  readFileSync("package.json", {encoding: "utf-8"})
)["dependencies"];

process.env.VITE_APP_DEPENDENCIES = Object.keys(dependencies)
  .map((dependency) =>
    JSON.parse(
      readFileSync(`node_modules/${dependency}/package.json`, {
        encoding: "utf8"
      })
    )
  )
  .map(
    ({name, version, license}) =>
      `<a href="https://www.npmjs.com/package/${name}/v/${version}">${name}</a> ${version} (${license})`
  )
  .join(", ");

// https://vitejs.dev/config/
export default defineConfig(() => ({
  base: "./",
  optimizeDeps: {
    exclude: ["leaflet"]
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      input: [
        resolve(__dirname, "index.html"),
        resolve(__dirname, "land.html"),
        resolve(__dirname, "map.html")
      ]
    }
  },
  plugins: lazyPlugins(() => [
    inject({
      exclude: /(css|pegjs)$/,
      $: "jquery",
      jQuery: "jquery"
    }),
    peggyPlugin(),
    copyIconsPlugin()
  ]),
  // https://vitest.dev/config/
  test: {
    environment: "happy-dom",
    include: ["tests/test*.ts"]
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true
    }
  },
  fmt: {
    bracketSpacing: false,
    experimentalSortImports: {},
    trailingComma: "none" as const,
    printWidth: 80,
    ignorePatterns: ["build/", "data/", "dist/", "locales/"]
  },
  staged: {
    "**/*": "vp fmt --no-error-on-unmatched-pattern --write"
  }
}));

// The icons are referenced at runtime by MapCSS `icon-image` URLs only,
// hence they are copied verbatim instead of being bundled.
function copyIconsPlugin(): Plugin {
  return {
    name: "copy-icons",
    apply: "build",
    writeBundle(options) {
      cpSync(resolve(__dirname, "icons"), resolve(options.dir!, "icons"), {
        recursive: true
      });
    }
  };
}

function peggyPlugin(options: peggy.ParserBuildOptions = {}): Plugin {
  return {
    name: "peggy",
    transform(grammar, id) {
      const {include = ["*.pegjs", "**/*.pegjs"], exclude} = options;
      const filter = createFilter(include, exclude);
      if (!filter(id)) return null;
      const code = peggy.generate(grammar, {output: "source", ...options});
      return {
        code: `export default ${code};`,
        map: {mappings: ""}
      };
    }
  };
}
