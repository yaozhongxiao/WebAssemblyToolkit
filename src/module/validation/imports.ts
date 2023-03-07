// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

import { traverse } from "../../ast/ast";

/**
 * Determine if a sequence of instructions form a constant expression
 *
 * See https://webassembly.github.io/spec/core/multipage/valid/instructions.html#valid-constant
 */
export default function (
  ast: Program /*, moduleContext: Object */
): Array<string> {
  const errors : Array<string> = [];

  traverse(ast, {
    ModuleImport({ node } : any) {
      const { mutability } = node.descr;

      if (mutability === "var") {
        errors.push("mutable globals cannot be imported");
      }
    },
  });

  return errors;
}
