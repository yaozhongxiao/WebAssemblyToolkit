// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

import { getType, typeEq } from "../../../module/validation/validator";
import { evaluate } from "../partial-evaluation";
import { CompileError }  from "../../errors";

export function createInstance(
  store: Store,
  node: Global
): GlobalInstance {
  let value;
  const { valtype, mutability } = node.globalType;

  // None or multiple constant expressions in the initializer seems not possible
  // TODO(): find a specification reference for that
  // FIXME(): +1 because of the implicit end, change the order of validations
  if (node.init.length > 2 || node.init.length === 1) {
    throw new CompileError("type mismatch");
  }

  // Validate the type
  const resultInferedType = getType(node.init);

  if (
    resultInferedType != null &&
    typeEq([node.globalType.valtype], resultInferedType) === false
  ) {
    throw new CompileError("type mismatch");
  }

  const res = evaluate(store, node.init);

  if (res != null) {
    value = res.value;
  }

  return {
    type: valtype,
    mutability,
    value,
  };
}
