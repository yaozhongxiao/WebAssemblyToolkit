// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

import * as decoder from "./decoder";
import * as t from "../ast/ast";

/**
 * TODO(): I added initial props, but we should rather fix
 * https://github.com/xtuc/webassemblyjs/issues/405
 */

const defaultDecoderOpts = {
  dump: false,
  ignoreCodeSection: false,
  ignoreDataSection: false,
  ignoreCustomNameSection: false,
};

// traverses the AST, locating function name metadata, which is then
// used to update index-based identifiers with function names
function restoreFunctionNames(ast : Node) {
  const functionNames : Array<any> = [];

  t.traverse(ast, {
    FunctionNameMetadata({ node } : {node : FunctionNameMetadata}) {
      functionNames.push({
        name: node.value,
        index: node.index,
      });
    },
  });

  if (functionNames.length === 0) {
    return;
  }

  t.traverse(ast, {
    Func({ node }: NodePath<Func>) {
      // $ts-ignore (replace $ with @)
      const nodeName: Identifier = node.name as Identifier;
      const indexBasedFunctionName = nodeName.value;
      const index = Number(indexBasedFunctionName.replace("func_", ""));
      const functionName = functionNames.find((f) => f.index === index);
      if (functionName) {
        const oldValue = nodeName.value;

        nodeName.value = functionName.name;
        // $ts-ignore (replace $ with @)
        nodeName.numeric = oldValue;

        // $ts-ignore (replace $ with @)
        delete nodeName.raw;
      }
    },

    // Also update the reference in the export
    ModuleExport({ node }: NodePath<ModuleExport>) {
      if (node.descr.exportType === "Func") {
        // $ts-ignore (replace $ with @)
        const nodeName: NumberLiteral = node.descr.id as NumberLiteral;
        const index = nodeName.value;
        const functionName = functionNames.find((f) => f.index === index);

        if (functionName) {
          node.descr.id = t.identifier(functionName.name);
        }
      }
    },

    ModuleImport({ node }: NodePath<ModuleImport>) {
      if (node.descr.type === "FuncImportDescr") {
        // $ts-ignore (replace $ with @)
        const indexBasedFunctionName: string = node.descr.id.value;
        const index = Number(indexBasedFunctionName.replace("func_", ""));
        const functionName = functionNames.find((f) => f.index === index);

        if (functionName) {
          // $ts-ignore (replace $ with @)
          node.descr.id = t.identifier(functionName.name);
        }
      }
    },

    CallInstruction(nodePath: NodePath<CallInstruction>) {
      const node = nodePath.node;
      const index = node.index.value;
      const functionName = functionNames.find((f) => f.index === index);
      if (functionName) {
        const oldValue : Index = node.index;

        node.index = t.identifier(functionName.name);
        node.numeric = oldValue;

        // $ts-ignore (replace $ with @)
        delete (node as any).raw;
      }
    },
  });
}

function restoreLocalNames(ast:Node) {
  const localNames: Array<{ name: string, localIndex: number, functionIndex: number }> = [];

  t.traverse(ast, {
    LocalNameMetadata({ node } : {node : LocalNameMetadata}) {
      localNames.push({
        name: node.value,
        localIndex: node.localIndex,
        functionIndex: node.functionIndex,
      });
    },
  });

  if (localNames.length === 0) {
    return;
  }

  t.traverse(ast, {
    Func({ node }: NodePath<Func>) {
      const signature = node.signature;
      if (signature.type !== "Signature") {
        return;
      }

      // $ts-ignore (replace $ with @)
      const nodeName: Identifier = node.name as Identifier;
      const indexBasedFunctionName = nodeName.value;
      const functionIndex = Number(indexBasedFunctionName.replace("func_", ""));
      signature.params.forEach((param, paramIndex) => {
        const paramName = localNames.find(
          (f) =>
            f.localIndex === paramIndex && f.functionIndex === functionIndex
        );
        if (paramName && paramName.name !== "") {
          param.id = paramName.name;
        }
      });
    },
  });
}

function restoreModuleName(ast : Node) {
  t.traverse(ast, {
    ModuleNameMetadata(moduleNameMetadataPath: NodePath<ModuleNameMetadata>) {
      // update module
      t.traverse(ast, {
        Module({ node }: NodePath<Module>) {
          let name : string | undefined = moduleNameMetadataPath.node.value;

          // compatiblity with wast-parser
          if (name === "") {
            name = undefined;
          }

          node.id = name;
        },
      });
    },
  });
}

export function decode(buf: ArrayBuffer, customOpts: Object): Program {
  const opts: DecoderOpts = Object.assign({}, defaultDecoderOpts, customOpts);
  const ast = decoder.decode(buf, opts);

  if (opts.ignoreCustomNameSection === false) {
    restoreFunctionNames(ast);
    restoreLocalNames(ast);
    restoreModuleName(ast);
  }

  return ast;
}
