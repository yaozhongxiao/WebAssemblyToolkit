// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

import { traverse } from "../../../ast/ast";
import { assert } from "../../../utils/macro/assert";
import { isIdentifier, isNumberLiteral } from "../../../ast/nodes";
import * as WebAssemblyMemory from "./memory";

import { RuntimeError, CompileError } from "../../errors";
import { TableInstance } from "./table";
import * as func from "./func";
import * as externvalue from "./extern";
import * as global from "./global";
import { i32 } from "./i32";
import { log } from "../../../utils/logging/log";
/**
 * Create Module's import instances
 *
 * > the indices of imports go before the first index of any definition
 * > contained in the module itself.
 * see https://webassembly.github.io/spec/core/syntax/modules.html#imports
 */
function instantiateImports(
  n: Module,
  store: Store,
  externalElements: Object,
  internals: Object,
  moduleInstance: ModuleInstance
) : void {
  function getExternalElementOrThrow(key: string, key2: string): any {
    if (
      typeof externalElements[key] === "undefined" ||
      typeof externalElements[key][key2] === "undefined"
    ) {
      throw new CompileError(`Unknown import ${key}.${key2}`);
    }

    return externalElements[key][key2];
  }

function handleFuncImport(node: ModuleImport, descr: FuncImportDescr) {
  const element = getExternalElementOrThrow(node.module, node.name);

  const params = descr.signature.params != null ? descr.signature.params : [];
  const results =
    descr.signature.results != null ? descr.signature.results : [];

  const func_params: Array<Valtype> = [];
  params.forEach((p:FuncParam) => func_params.push(p.valtype));

  const externFuncinstance : FuncInstance = externvalue.createFuncInstance(
    element,
    func_params,
    results
  );

  const externFuncinstanceAddr : Addr = store.malloc(
    1 /* sizeof externFuncinstance */
  );
  store.set(externFuncinstanceAddr, externFuncinstance);

  moduleInstance.funcaddrs.push(externFuncinstanceAddr);
}

function handleGlobalImport(node: ModuleImport, descr: GlobalType) {
  const element = getExternalElementOrThrow(node.module, node.name);

  const externglobalinstance : GlobalInstance = externvalue.createGlobalInstance(
    new i32(element),
    descr.valtype,
    descr.mutability
  );

  const addr : Addr = store.malloc(1 /* size of the globalinstance struct */);
  store.set(addr, externglobalinstance);

  moduleInstance.globaladdrs.push(addr);
}

function handleMemoryImport(node: ModuleImport) {
  const memoryinstance = getExternalElementOrThrow(node.module, node.name);

  const addr = store.malloc(1 /* size of the memoryinstance struct */);
  store.set(addr, memoryinstance);

  moduleInstance.memaddrs.push(addr);
}

function handleTableImport(node: ModuleImport) {
  const tableinstance = getExternalElementOrThrow(node.module, node.name);

  const addr = store.malloc(1 /* size of the tableinstance struct */);
  store.set(addr, tableinstance);

  moduleInstance.tableaddrs.push(addr);
}

  traverse(n, {
    ModuleImport({ node }: NodePath<ModuleImport>) {
      const node_desc_type = node.descr.type;
      switch (node.descr.type) {
        case "FuncImportDescr":
          return handleFuncImport(node, node.descr);
        case "GlobalType":
          return handleGlobalImport(node, node.descr);
        case "Memory":
          return handleMemoryImport(node);
        case "Table":
          return handleTableImport(node);
        default:
          throw new Error("Unsupported import of type: " + node_desc_type);
      }
    },
  });
}

/**
 * write data segments to linear memory
 */
function instantiateDataSections(
  n: Module,
  store: Store,
  moduleInstance: ModuleInstance
) {
  traverse(n, {
    Data({ node }: NodePath<Data>) {
      const memIndex = node.memoryIndex.value;
      const memoryAddr = moduleInstance.memaddrs[memIndex];
      const memory = store.get(memoryAddr);
      const buffer = new Uint8Array(memory.buffer);

      let offset: number;
      if (node.offset.id === "const") {
        const offsetInstruction: any = node.offset;
        const arg = (offsetInstruction.args[0] as any);
        offset = arg.value;
      } else if (node.offset.id === "get_global") {
        const offsetInstruction: any = node.offset;
        const globalIndex = (offsetInstruction.args[0] as any).value;
        const globalAddr = moduleInstance.globaladdrs[globalIndex];
        const globalInstance = store.get(globalAddr);
        offset = globalInstance.value.toNumber();
      } else {
        throw new RuntimeError(
          "data segment offsets can only be specified as constants or globals"
        );
      }

      for (let i = 0; i < node.init.values.length; i++) {
        buffer[i + offset] = node.init.values[i];
      }
    },
  });
}

/**
 * Create Module's internal elements instances
 */
function instantiateInternals(
  funcTable: Array<IRFunc>,
  n: Module,
  store: Store,
  internals: Object,
  moduleInstance: ModuleInstance
) {
  let funcIndex = 0;

  traverse(n, {
    Func({ node }: NodePath<Func>) {
      // Only instantiate/allocate our own functions
      if (node.isExternal === true) {
        return;
      }

      const atOffset = funcTable[funcIndex].startAt;

      const funcinstance : FuncInstance = func.createInstance(atOffset, node, moduleInstance);

      const addr = store.malloc(1 /* size of the funcinstance struct */);
      store.set(addr, funcinstance);

      moduleInstance.funcaddrs.push(addr);

      if (node.name != null) {
        if (node.name.type === "Identifier") {
          (internals as any).instantiatedFuncs[node.name.value] = { addr };
        }
      }

      funcIndex++;
    },

    Table({ node }: NodePath<Table>) {
      const initial = node.limits.min;
      const element = node.elementType;

      const tableinstance : TableInstance = new TableInstance({ initial, element });

      const addr = store.malloc(1 /* size of the tableinstance struct */);
      store.set(addr, tableinstance);

      moduleInstance.tableaddrs.push(addr);

      if (node.name != null) {
        if (node.name.type === "Identifier") {
          (internals as any).instantiatedTables[node.name.value] = { addr };
        }
      }
    },

    Elem({ node }: NodePath<Elem>) {
      let table;

      if (node.table.type === "NumberLiteral") {
        const addr = moduleInstance.tableaddrs[node.table.value];
        table = store.get(addr);
      }

      if (typeof table === "object") {
        // FIXME(): expose the function in a HostFunc
        table.push(function () {
          throw new Error("Unsupported operation");
        });
      } else {
        throw new CompileError("Unknown table");
      }
    },

    Memory({ node }: NodePath<Memory>) {
      // Module has already a memory instance (likely imported), skip this.
      if (moduleInstance.memaddrs.length !== 0) {
        return;
      }

      const { min, max } = node.limits;

      const memoryDescriptor: MemoryDescriptor = {
        initial: min,
      };

      if (typeof max === "number") {
        memoryDescriptor.maximum = max;
      }

      const memoryinstance = new WebAssemblyMemory.Memory(memoryDescriptor);

      const addr = store.malloc(1 /* size of the memoryinstance struct */);
      store.set(addr, memoryinstance);

      moduleInstance.memaddrs.push(addr);

      (internals as any).instantiatedMemories.push({ addr });
    },

    Global({ node }: NodePath<Global>) {
      const globalinstance = global.createInstance(store, node);

      const addr = store.malloc(1 /* size of the globalinstance struct */);
      store.set(addr, globalinstance);

      moduleInstance.globaladdrs.push(addr);

      (internals as any).instantiatedGlobals.push({
        addr,
        type: node.globalType,
      });
    },
  });
}

/**
  * write element to table
 */
function instantiateElemSections(
  n: Module,
  store: Store,
  moduleInstance: ModuleInstance
) {
  traverse(n, {
    Elem({ node }: NodePath<Elem>) {
      let table = undefined;
      if (node.table.type === "NumberLiteral") {
        const addr = moduleInstance.tableaddrs[node.table.value];
        table = store.get(addr);
      }
      /* element to init table */
      if (typeof table === "object") {
        const { offset, funcs } = node;
        funcs.forEach((func) => {
          table.push(moduleInstance.funcaddrs[func.value]);
        });
      } else {
        throw new CompileError("Unknown table");
      }
    },
  }
  );
}

/**
 * Create Module's exports instances
 *
 * The `internals` argument reference already instantiated elements
 */
function instantiateExports(
  n: Module,
  store: Store,
  internals: Object,
  moduleInstance: ModuleInstance
) {
  // FIXME(): move to validation error
  function assertNotAlreadyExported(str:string) {
    const moduleInstanceExport = moduleInstance.exports.find(
      ({ name }) => name === str
    );

    if (moduleInstanceExport !== undefined) {
      throw new CompileError("duplicate export name");
    }
  }

function createModuleExport(
  node: ModuleExport,
  // FIXME(): instantiatedItemArray should be removed in favor of
  // instanceArray which avoid the duplicated array
  instantiatedItemArray : Array<any>,
  instanceArray : Array<Addr>,
  validate: (obj : Object) => void
): void  {
  if (isIdentifier(node.descr.id) === true) {
    const instantiatedItem = instantiatedItemArray[node.descr.id.value];

    validate(instantiatedItem);

    assertNotAlreadyExported(node.name);

    moduleInstance.exports.push({
      name: node.name,
      value: {
        type: node.descr.exportType,
        addr: instantiatedItem.addr,
      },
    });
  } else if (isNumberLiteral(node.descr.id) === true) {
    const instantiatedItem = {
      addr: instanceArray[node.descr.id.value],
    };
    assert(instantiatedItem !== undefined);

    validate(instantiatedItem);

    assertNotAlreadyExported(node.name);

    moduleInstance.exports.push({
      name: node.name,
      value: {
        type: node.descr.exportType,
        addr: instantiatedItem.addr,
      },
    });
  } else {
    throw new CompileError(
      "Module exports must be referenced via an Identifier"
    );
  }
}

  traverse(n, {
    ModuleExport({ node }: NodePath<ModuleExport>) {
      switch (node.descr.exportType) {
        case "Func": {
          createModuleExport(
            node,
            (internals as any).instantiatedFuncs,
            moduleInstance.funcaddrs,
            (instantiatedFunc) => {
              assert(
                instantiatedFunc !== undefined,
                `Function ${node.name} has been exported but was not instantiated`
              );
            }
          );
          break;
        }

        case "Global": {
          createModuleExport(
            node,
            (internals as any).instantiatedGlobals,
            moduleInstance.globaladdrs,
            (instantiatedGlobal) => {
              assert(
                instantiatedGlobal !== undefined,
                `Global ${node.name} has been exported but was not instantiated`
              );

              const global = store.get((instantiatedGlobal as any).addr);
              assert(global !== undefined);

              if (global.mutability === "var") {
                // https://github.com/WebAssembly/mutable-global/blob/master/proposals/mutable-global/Overview.md
                log("export mutable globals!")
                // throw new CompileError("Mutable globals cannot be exported");
              }
            }
          );
          break;
        }

        case "Table": {
          createModuleExport(
            node,
            (internals as any).instantiatedTables,
            moduleInstance.tableaddrs,
            (instantiatedTable) => {
              assert(
                instantiatedTable !== undefined,
                `Table ${node.name} has been exported but was not instantiated`
              );
            }
          );
          break;
        }

        case "Memory": {
          createModuleExport(
            node,
            (internals as any).instantiatedMemories,
            moduleInstance.memaddrs,
            (instantiatedMemory) => {
              assert(
                instantiatedMemory !== undefined,
                `Memory ${node.name} has been exported but was not instantiated`
              );
            }
          );
          break;
        }

        default: {
          throw new CompileError("unknown export: " + node.descr.exportType);
        }
      }
    },
  });
}

export function createInstance(
  funcTable: Array<IRFunc>,
  store: Store,
  module: Module,
  externalElements: any = {}
): ModuleInstance {
  // Keep a ref to the module instance
  const moduleInstance = {
    types: [],
    funcaddrs: [],
    tableaddrs: [],
    memaddrs: [],
    globaladdrs: [],
    exports: [],
  };

  /**
   * Keep the function that were instantiated and re-use their addr in
   * the export wrapper
   */
  const instantiatedInternals = {
    instantiatedFuncs: {},
    instantiatedGlobals: [],
    instantiatedTables: {},
    instantiatedMemories: [],
  };

  instantiateImports(
    module,
    store,
    externalElements,
    instantiatedInternals,
    moduleInstance
  );

  instantiateInternals(
    funcTable,
    module,
    store,
    instantiatedInternals,
    moduleInstance
  );

  instantiateDataSections(module, store, moduleInstance);

  instantiateExports(module, store, instantiatedInternals, moduleInstance);

  return moduleInstance;
}
