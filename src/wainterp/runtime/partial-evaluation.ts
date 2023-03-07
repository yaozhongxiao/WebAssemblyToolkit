// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

import { listOfInstructionsToIr } from "../../ast/transform/ast-to-ir/ir-gen";
import { assert } from "../../utils/macro/assert";

import * as t from "../../ast/ast";

import { executeStackFrame } from "./executor";
import { createStackFrame } from "./stackframe";
import * as modulevalue from "./values/module";
import { RuntimeError } from "../errors";

export function evaluate(
  store: Store,
  code: Array<Instruction>
): StackLocal {

  const ir : IR = listOfInstructionsToIr(code);

  // Create an empty module instance for the context
  const moduleInstance = modulevalue.createInstance(
    ir.funcTable,
    store,
    t.module(undefined, [])
  );

  const stackFrame = createStackFrame([], moduleInstance, store);

  const main : IRFunc | undefined = ir.funcTable.find((f: IRFunc) => f.name === "main");
  if (typeof main !== "object") {
    assert(typeof main === "object");
    throw new RuntimeError("can not find main functions");
  }

  return executeStackFrame(ir, main.startAt, stackFrame);
}
