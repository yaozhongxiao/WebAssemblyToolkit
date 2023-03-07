// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

export function createFuncInstance(
  func: Function,
  params: Array<Valtype>,
  results: Array<Valtype>
): FuncInstance {
  const type: Functype = [params, results];

  return {
    type,
    code: func,
    module: undefined,
    isExternal: true,
  };
}

export function createGlobalInstance(
  value: NumericOperations<any>,
  type: Valtype,
  mutability: Mutability
): GlobalInstance {
  return {
    type,
    mutability,
    value,
  };
}
