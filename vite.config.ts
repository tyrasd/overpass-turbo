/// <reference types="vitest" />
import {type Plugin, defineConfig, createFilter} from "vite";
import vitePluginFaviconsInject from "vite-plugin-favicons-inject";
import inject from "@rollup/plugin-inject";
import {type ParserBuildOptions, generate} from "peggy";

import {readFileSync} from "fs";
import {resolve} from "path";
import {execSync} from "child_process";

const GIT_VERSION = JSON.stringify(
  `${execSync("git log -1 --format=%cd --date=short", {
    encoding: "utf-8"
  }).trim()}/${execSync("git describe --always", {encoding: "utf-8"}).trim()}`
);

const dependencies = JSON.parse(
  readFileSync("package.json", {encoding: "utf-8"})
)["dependencies"];
const APP_DEPENDENCIES = JSON.stringify(
  Object.keys(dependencies)
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
    .join(", ")
);

// https://vitejs.dev/config/
export default defineConfig(() => ({
  base: "./",
  optimizeDeps: {
    exclude: ["leaflet"]
  },
  build: {
    rollupOptions: {
      input: [
        resolve(__dirname, "index.html"),
        resolve(__dirname, "land.html"),
        resolve(__dirname, "map.html")
      ]
    }
  },
  define: {
    APP_DEPENDENCIES,
    GIT_VERSION
  },
  plugins: [
    inject({
      exclude: /(css|pegjs)$/,
      $: "jquery",
      jQuery: "jquery"
    }),
    peggy(),
    vitePluginFaviconsInject("./turbo.svg")
  ],
  // https://vitest.dev/config/
  test: {
    environment: "happy-dom",
    include: ["tests/test*.ts"]
  }
}));

function peggy(options: ParserBuildOptions = {}): Plugin {
  return {
    name: "peggy",
    transform(grammar, id) {
      const {include = ["*.pegjs", "**/*.pegjs"], exclude} = options;
      const filter = createFilter(include, exclude);
      if (!filter(id)) return null;
      const code = generate(grammar, {output: "source", ...options});
      return {
        code: `export default ${code};`,
        map: {mappings: ""}
      };
    }
  };
}
