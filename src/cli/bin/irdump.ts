#!/usr/bin/env node

// Copyright (c) 2023 Webassembly Toolkit. All rights reserved.

import WebAssembly from "../../wainterp/webassembly";
import { debug } from "../../utils/logging/log";
import fs from "fs";
import { type Instance, type Memory } from "../../wainterp/instance";
import { dumpIR } from "../../ast/transform/ast-to-ir/ir-printer";

function toArrayBuffer(buf: Buffer) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

const filename = process.argv[2];
const entrypoint = process.argv[3];

if (typeof filename === "undefined") {
  throw new Error("Missing file");
}

debug("Loading ...");

const buff = toArrayBuffer(fs.readFileSync(filename, null));

const importObject = {
  env: {
    print: function (...args: any[]) {
      console.log(`[printf] ...${args}`);
    },
    printstr: function (pointer: number) {
      const inst: Instance = importObject["instance"];
      if (inst !== undefined) {
        const memory: Memory = inst.getMemory(0);
        const i8array: Int8Array = new Int8Array(memory.buffer, pointer);
        const strlen = i8array.indexOf(0, 0);
        const str = Buffer.from(i8array.slice(0, strlen)).toString()
        console.log(`[printstr] ${str}`);
      } else {
        console.log(`[printstr pointer] ${pointer}`);
      }
    },
  },
  __internalInstanceOptions: {
    checkForI64InSignature: false,
    returnStackLocal: true,
  }
};

WebAssembly.instantiate(buff, importObject)
  .then(({ module }: InstansitatedInstanceAndModule) => {
    dumpIR(module._ir);
  })
  .catch((err: Error) => {
    throw err;
  });

process.on("unhandledRejection", (error) => {
  throw error;
});
