// Copyright (c) 2023 Webassembly Toolkit. All rights reserved.

import { traverse } from "../ast/ast";

import { CompiledModule } from "./compile/module";
import { RuntimeError } from "./errors";
import { type Memory } from "./runtime/values/memory"
import { createStore } from "./runtime/store";
import importObjectUtils from "./runtime/env";
import * as modulevalue from "./runtime/values/module";

import { createHostfunc, executeStackFrameAndGetResult } from "./runtime/host-func";
import { createStackFrame } from "./runtime/stackframe";
import { assertRuntimeError } from "../utils/macro/assert";

export { type Memory } from "./runtime/values/memory";
export const kStart: string = "_start";

export class Instance {
  exports: { [key: string]: InstType };

  _store: Store;
  _moduleInstance: ModuleInstance;

  /**
   * Map id to external elements or callable functions
   */
  _externalElements: any;

  constructor(module: CompiledModule, importObject: ImportObject) {
    if (module instanceof CompiledModule === false) {
      throw new TypeError(
        "module must be of type WebAssembly.Module, " +
        typeof module +
        " given."
      );
    }

    this._externalElements = {};
    this.exports = {};

    /**
     * Create Module's default memory store
     */
    this._store = createStore();

    /**
     * Pass internal options
     */
    let internalInstanceOptions: InternalInstanceOptions = {
      checkForI64InSignature: true,
      returnStackLocal: false,
    };

    if (typeof importObject.__internalInstanceOptions === "object") {
      internalInstanceOptions = importObject.__internalInstanceOptions;
    }

    /**
     * importObject.
     */
    if (typeof importObject === "object") {
      importObjectUtils.walk(importObject, (key, key2, value) => {
        if (typeof this._externalElements[key] !== "object") {
          this._externalElements[key] = {};
        }

        this._externalElements[key][key2] = value;
      });
    }

    const moduleNode = getModuleFromProgram(module._ast);

    if (moduleNode === null || moduleNode === undefined) {
      throw new RuntimeError("Module not found");
    }

    const moduleInstance : ModuleInstance = modulevalue.createInstance(
      module._ir.funcTable,

      this._store,

      // $ts-ignore (replace $ with @): 
      // that's the correct type but Flow fails to get it
      moduleNode,

      this._externalElements
    );

    moduleInstance.exports.forEach((exportinst) => {
      if (exportinst.value.type === "Func") {
        this.exports[exportinst.name] = createHostfunc(
          module._ir,
          moduleInstance,
          exportinst,
          this._store,
          internalInstanceOptions
        );

        return;
      }

      if (exportinst.value.type === "Global") {
        const globalinst = this._store.get(exportinst.value.addr);

        if (globalinst == null) {
          throw new RuntimeError("Global instance has not been instantiated");
        }

        if (internalInstanceOptions.returnStackLocal === true) {
          this.exports[exportinst.name] = globalinst;
        } else {
          this.exports[exportinst.name] = globalinst.value.toNumber();
        }

        return;
      }

      if (exportinst.value.type === "Memory") {
        const memoryinst = this._store.get(exportinst.value.addr);

        if (memoryinst == null) {
          throw new RuntimeError("Memory instance has not been instantiated");
        }

        this.exports[exportinst.name] = memoryinst;

        return;
      }

      if (exportinst.value.type === "Table") {
        const tableinst = this._store.get(exportinst.value.addr);

        if (tableinst == null) {
          throw new RuntimeError("Table instance has not been instantiated");
        }

        this.exports[exportinst.name] = tableinst;

        return;
      }

      throw new Error("Unknown export type: " + exportinst.value.type);
    });

    this._moduleInstance = moduleInstance;

    const startFunc = module._ir.funcTable.find((x: IRFunc) => x.name === kStart);

    if (startFunc != null) {
      this.executeStartFunc(module._ir, startFunc.startAt);
    }
  }

  executeStartFunc(ir: IR, offset: number) {
    // FIXME(): func params? do we need this here? it's a validation.
    const params: Array<StackLocal> = [];

    const stackFrame = createStackFrame(
      params,
      this._moduleInstance,
      this._store
    );

    // Ignore the result
    executeStackFrameAndGetResult(
      ir,
      offset,
      stackFrame,
      /* returnStackLocal */ true
    );
  }

  getMemory(index: number): Memory {
    assertRuntimeError(index < this._moduleInstance.memaddrs.length,
      `getMemory with index ${index} out of the bound
      ${this._moduleInstance.memaddrs.length}`);
    const memAddr = this._moduleInstance.memaddrs[index];
    return this._store.get(memAddr);
  }
}

function getModuleFromProgram(ast: Program): Module | undefined {
  let module: Module | undefined = undefined;

  traverse(ast, {
    Module({ node }: NodePath<Module>) {
      module = node;
    },
  });

  return module;
}
