// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

import { isIdentifier, traverse } from "../../ast/ast";
import * as t from "../../ast/ast";
import { debug } from "../../utils/logging/log";
import { toNamespacedPath } from "path";

let i = 0;

function generateUniqueId() {
  i++;

  return "unknown_" + i;
}

export function print(ast: Node) {
  const out : {
    types : Array<TypeInstruction>,
    imports: Array<ModuleImport>,
    exports: Object,
    functions: Array<Func>,
    memories: Array<Memory>,
    globals: Array<GlobalType>,
    tables: Array<Table>
  } = {
    types : [],
    imports: [],
    exports: {},
    functions: [],
    memories: [],
    globals: [],
    tables: []
  };

  traverse(ast, {
    TypeInstruction({ node }: NodePath<TypeInstruction>) {
      out.types.push(node);
    },

    ModuleImport({ node }: NodePath<ModuleImport>) {
      out.imports.push(node);
    },

    ModuleExport({ node }: NodePath<ModuleExport>) {
      if (node.descr.exportType === "Func") {
        out.exports[node.descr.id.value] = node;
      }
    },

    Func({ node }: NodePath<Func>) {
      // if (!node.name || !isIdentifier(node.name)) {
      //   node.name = t.identifier(generateUniqueId());
      // }
      out.functions.push(node);
    },

    Memory({ node }: NodePath<Memory>) {
      if (!node.id || !isIdentifier(node.id)) {
        node.id = t.identifier(String(node.id?.value));
      }
      debug("memory " + JSON.stringify(node.id.value));
      out.memories.push(node);
    },

    Global({ node }: NodePath<Global>) {
      out.globals.push(node.globalType);
    },

    Table({ node }: NodePath<Table>) {
      out.tables.push(node);
    },
    
  });

  console.log(JSON.stringify(out, null, 4));
}
