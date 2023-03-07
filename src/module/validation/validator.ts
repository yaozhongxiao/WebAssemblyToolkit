// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

import importOrderValidate from "./import-order";
import isConst from "./is-const";
import typeChecker from "./type-checker";
import imports from "./imports";
import duplicatedExports from "./duplicated-exports";
import { moduleContextFromModuleAST } from "../../ast/ast";

export default function validateAST(ast: Program) {
  const errors = getValidationErrors(ast);

  if (errors.length !== 0) {
    const errorMessage = "Validation errors:\n" + errors.join("\n");

    throw new Error(errorMessage);
  }
}

export function getValidationErrors(ast: Program): Array<string> {
  const errors : Array<any> = [];

  let modules : Array<any> = [];

  // @ts-ignore
  if (ast.type === "Module") {
    modules = [ast];
  }

  // $ts-ignore (replace $ with @)
  if (ast.type === "Program") {
    modules = ast.body.filter(({ type }) => type === "Module");
  }

  modules.forEach((m) => {
    const moduleContext = moduleContextFromModuleAST(m);

    // $ts-ignore (replace $ with @)
    errors.push(...imports(ast, /* moduleContext */));
    errors.push(...isConst(ast, moduleContext));
    errors.push(...importOrderValidate(ast));
    errors.push(...typeChecker(ast, /* moduleContext */));
    errors.push(...duplicatedExports(ast));
  });

  return errors;
}

export { getType, typeEq } from "./type-inference";
export { isConst };

export const stack = typeChecker;
