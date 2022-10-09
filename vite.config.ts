/// <reference types="vitest" />
import {defineConfig} from "vite";
import commonjs from "@rollup/plugin-commonjs";
import inject from "@rollup/plugin-inject";
import pegjs from "rollup-plugin-pegjs";

import {resolve} from "path";
import {execSync} from "child_process";

const GIT_VERSION = JSON.stringify(
  execSync("git describe --always", {encoding: "utf-8"}).trim()
);

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    base: "./",
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, "index.html"),
          nested: resolve(__dirname, "map.html")
        }
      }
    },
    define: {
      GIT_VERSION
    },
    plugins: [
      commonjs({
        include: /canvg/
      }),
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
