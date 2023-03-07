// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

import { sign } from "crypto";
import {
  traverse,
  identifier,
  func,
  program as tProgram,
} from "../../ast";

import { flatten } from "../flattern/ast-flatten";
import { IRModule, kStart } from "./ir-module";
import { signature } from "../../ast";
import { assert } from "../../../utils/macro/assert";

// create the ".text" code section and relocate the call
// and br target index.
export function toIR(ast: Program): IR {
  const program: {
    [key: number]: Instruction,
  } = {};

  const funcTable: Array<IRFunc> = [];

  // flatten the ast first
  // only need for webassembly test format(wast)
  // becuase binary format is in flatten mode
  // TODO(): do it in a single pass?
  flatten(ast);

  const module = new IRModule(ast);

  traverse(ast, {
    Start({ node }: NodePath<Start>) {
      const { name, startAt } = module.emitStartFunc(
        parseInt(node.index.value as string)
      );

      funcTable.push({ name, startAt });
    },

    Func(funcPath: NodePath<Func>) {
      module.beginFuncBody(funcPath.node);

      traverse(funcPath.node, {
        Instruction(path: NodePath<Instruction>) {
          module.onFuncInstruction(path.node);
        },
      });

      const { name, instructions, startAt } = module.finalizeFunc(
        funcPath.node
      );

      funcTable.push({ name, startAt });

      assert(instructions !== undefined, "instructions must be defined!");
      instructions!.forEach((instruction:IRNode) => {
        program[instruction.offset] = instruction.node as Instruction;
      });
    },
  });

  return {
    // $ts-ignore (replace $ with @)
    funcTable,
    program,
  };
}

export function listOfInstructionsToIr(instrs: Array<Instruction>): IR {
  const program = {};
  const funcTable: Array<IRFunc> = [];

  const module = new IRModule(tProgram([]));
  const fakeFunc = func(identifier("main"), signature([],[]), instrs, false);

  module.beginFuncBody(fakeFunc);

  instrs.forEach((i) => module.onFuncInstruction(i));

  const { name, instructions, startAt } = module.finalizeFunc(fakeFunc);

  funcTable.push({ name, startAt });

  assert(instructions !== undefined, "instructions must be defined!");
  instructions!.forEach((instruction:any) => {
    program[instruction.offset] = instruction.node;
  });

  return {
    // $ts-ignore (replace $ with @)
    funcTable,
    program,
  };
}

export * from "./ir-printer";
