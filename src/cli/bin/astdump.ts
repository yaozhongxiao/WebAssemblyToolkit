#!/usr/bin/env node

import { decode } from "../../wasm-parser/parser";

import * as astprinter from "./astprinter";
import { readFileSync } from "fs";

function toArrayBuffer(buf: Buffer) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

const filename = process.argv[2];

if (typeof filename === "undefined") {
  throw new Error("Missing file");
}

const dumpDecodeOpts = {
  dump: false,
  ignoreCodeSection: false,
  ignoreDataSection: false,
  ignoreCustomNameSection: false,
};

const buff = toArrayBuffer(readFileSync(filename, null));
const ast : Program = decode(buff, dumpDecodeOpts);

astprinter.print(ast);
// dump the whole ast tree
// console.log(JSON.stringify(ast, null, 2));
