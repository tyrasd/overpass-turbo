/// <reference types="vitest" />
import {defineConfig} from "vite";
import inject from "@rollup/plugin-inject";
import pegjs from "rollup-plugin-pegjs";

import {readFileSync} from "fs";
import {resolve} from "path";
import {execSync} from "child_process";

const GIT_VERSION = JSON.stringify(
  execSync("git log -1 --format=%cd --date=short", {encoding: "utf-8"}).trim() +
    "/" +
    execSync("git describe --always", {encoding: "utf-8"}).trim()
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
export default defineConfig(() => {
  return {
    base: "./",
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
        $: "jquery",
        jQuery: "jquery"
      }),
      pegjs()
    ],
    // https://vitest.dev/config/
    test: {
      environment: "happy-dom",
      include: "tests/test*.js"
    }
  };
});
