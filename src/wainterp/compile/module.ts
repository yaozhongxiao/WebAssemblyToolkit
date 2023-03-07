// Copyright (c) 2023 Webassembly Toolkit. All rights reserved.

import { transform as wastIdentifierToIndex } from "../../ast/transform/wast-identifier-to-index";
import { transform as denormalizeTypeReferences } from "../../ast/transform/denormalize-type-references";

import * as t from "../../ast/ast";
import { toIR } from "../../ast/transform/ast-to-ir/ir-gen";
import validateAST from "../../module/validation/validator";
import { debug } from "../../utils/logging/log";

export class CompiledModule {
  _ast: Program;
  _ir: IR;

  exports: Array<CompiledModuleExportDescr>;
  imports: Array<CompiledModuleImportDescr>;

  constructor(
    ir: IR,
    ast: Program,
    exports: Array<CompiledModuleExportDescr>,
    imports: Array<CompiledModuleImportDescr>
  ) {
    this._ir = ir;
    this._ast = ast;

    this.exports = exports;
    this.imports = imports;
  }
}

export function createCompiledModule(ast: Program): CompiledModule {
  const exports: Array<CompiledModuleExportDescr> = [];
  const imports: Array<CompiledModuleImportDescr>= [];

  // Do compile-time ast manipulation in order to remove WAST
  // semantics during execution

  // FIXME(): uncomment to support wast execution
  // denormalizeTypeReferences(ast);
  // wastIdentifierToIndex(ast);

  validateAST(ast);

  t.traverse(ast, {
    ModuleExport({ node }: NodePath<ModuleExport>) {
      if (node.descr.exportType === "Func") {
        exports.push({
          name: node.name,
          kind: "function",
        });
      }
    },
  });

  /**
   * Compile
   */
  debug("Compile ...")

  // code relocation and linearize especially for
  // control instruction as label, br, etc.
  const ir = toIR(ast);

  return new CompiledModule(ir, ast, exports, imports);
}
