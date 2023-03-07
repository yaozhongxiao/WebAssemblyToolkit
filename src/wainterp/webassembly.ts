// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

// const { parse } = require("@webassemblyjs/wast-parser");
import { decode } from "../wasm-parser/parser";

import { Instance } from "./instance";
import { Memory } from "./runtime/values/memory";
import { TableInstance as Table } from "./runtime/values/table";

import { RuntimeError, CompileError, LinkError } from "./errors";
import { checkEndianness } from "../utils/checker/endianness";
import { createCompiledModule, CompiledModule } from "./compile/module";

const interpDecodeOpts = {
  dump: false,
  ignoreCodeSection: false,
  ignoreDataSection: false,
  ignoreCustomNameSection: true,
};

const WebAssembly = {
  instantiate(
    buff: ArrayBuffer,
    importObject: ImportObject
  ): Promise<InstansitatedInstanceAndModule> {
    return new Promise((resolve, reject) => {
      if (checkEndianness() === false) {
        return reject(
          new RuntimeError("expected the system to be little-endian")
        );
      }

      if (buff instanceof ArrayBuffer === false &&
        buff instanceof Uint8Array === false) {
        return reject(
          "Module must be either an ArrayBuffer or an Uint8Array (BufferSource), " +
          typeof buff +
          " given."
        );
      }
      // parse module
      const ast : Program = decode(buff, interpDecodeOpts);
      // compile module
      const module : CompiledModule = createCompiledModule(ast);
      // instantiate module
      const instance  : Instance = new Instance(module, importObject);

      // binding instance to importObject for export access
      importObject["instance"] = instance;

      resolve({
        // $ts-ignore (replace $ with @)
        instance,
        module,
      });
    });
  },

  compile(buff: ArrayBuffer): Promise<CompiledModule> {
    return new Promise((resolve) => {
      const ast : Program = decode(buff, interpDecodeOpts);

      resolve(createCompiledModule(ast));
    });
  },

  validate(buff: ArrayBuffer): boolean {
    try {
      createCompiledModule(decode(buff, interpDecodeOpts));
      return true;
    } catch (e) {
      return false;
    }
  },

  Instance,
  CompiledModule,
  Memory,
  Table,
  RuntimeError,
  LinkError,
  CompileError,
};

export default WebAssembly;