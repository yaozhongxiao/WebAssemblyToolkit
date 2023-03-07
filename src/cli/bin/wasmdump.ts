#!/usr/bin/env node

import { decode } from "../../wasm-parser/parser";
import { readFileSync } from "fs";

function toArrayBuffer(buf:Buffer) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

const filename = process.argv[2];

if (typeof filename === "undefined") {
  throw new Error("Missing file");
}

const decoderOpts = {
  dump: true,
  ignoreCodeSection: false,
  errorOnUnknownSection: false
};

if (process.argv.indexOf("--ignore-code-section") !== -1) {
  decoderOpts.ignoreCodeSection = true;
}

if (process.argv.indexOf("--error-on-unknown-section") !== -1) {
  decoderOpts.errorOnUnknownSection = true;
}

const buff = toArrayBuffer(readFileSync(filename, null));

decode(buff, decoderOpts);
