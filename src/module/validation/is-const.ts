// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

import { traverse } from "../../ast/ast";

/**
 * Determine if a sequence of instructions form a constant expression
 *
 * See https://webassembly.github.io/spec/core/multipage/valid/instructions.html#valid-constant
 */
export default function isConst(
  ast: Program,
  moduleContext: any
): Array<string> {
  function isConstInstruction(instr:any): boolean {
    if (instr.id === "const") {
      return true;
    }

    if (instr.id === "get_global") {
      const index = instr.args[0].value;
      return !moduleContext.isMutableGlobal(index);
    }

    if (instr.id === "end") {
      return true;
    }

    return false;
  }

  const errors : Array<string>= [];

  traverse(ast, {
    Global(path: any) {
      const isValid = path.node.init.reduce(
        (acc:boolean, instr:any) => acc && isConstInstruction(instr),
        true
      );

      if (!isValid) {
        errors.push(
          "constant expression required: initializer expression cannot reference mutable global"
        );
      }

      // check type
      // FIXME(): this is a quick fix but should ideally go through our
      // stacky type checker
      if (path.node.init.length > 0) {
        const type = path.node.globalType.valtype;
        const initType = path.node.init[0].object;

        if (initType && type !== initType) {
          errors.push("type mismatch in global initializer");
        }
      }
    },
  });

  return errors;
}
