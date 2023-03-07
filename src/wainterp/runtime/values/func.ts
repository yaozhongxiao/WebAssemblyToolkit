// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

import { RuntimeError } from "../../errors";
import { assert } from "../../../utils/macro/assert";

export function createInstance(
  atOffset: number,
  n: Func,
  fromModule: ModuleInstance
): FuncInstance {
  assert(typeof atOffset === "number");

  // [param*, result*]
  const type : Functype = [[], []];

  if (n.signature.type !== "Signature") {
    throw new RuntimeError(
      "Function signatures must be denormalised before execution"
    );
  }

  const signature = n.signature as Signature;
  signature.params.forEach((param) => {
    type[0].push(param.valtype);
  });

  signature.results.forEach((result) => {
    type[1].push(result);
  });

  const code = n.body;

  return {
    index: atOffset,
    type,
    code,
    module: fromModule,
    isExternal: false,
  };
}

// module.exports = {
//   createInstance,
// };
