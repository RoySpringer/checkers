#!/usr/bin/env node

import esbuildServe from "esbuild-serve";

esbuildServe(
  {
    logLevel: "info",
    entryPoints: ["src/ts/index.ts"],
    bundle: true,
    outfile: "dist/index.js",
  },
  { root: ".", port: 4001 }
);
