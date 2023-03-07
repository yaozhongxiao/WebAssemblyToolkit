// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

import { traverse } from "../../ast/ast";

function duplicatedExports(name: string): string {
  return `duplicate export name "${name}"`;
}

export default function validate(ast: Program): Array<string> {
  const errors : Array<string> = [];

  const seenExports = {};

  traverse(ast, {
    ModuleExport(path: NodePath<ModuleExport>) {
      const { name } = path.node;

      if (seenExports[name] !== undefined) {
        return errors.push(duplicatedExports(name));
      }

      seenExports[name] = true;
    },
  });

  return errors;
}
