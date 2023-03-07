// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

import { kStart } from "./ir-module";
import { isTypeOf } from "../../utils";

function printInstruction(instruction: Instruction): string {
  let out = "";

  if (typeof instruction.type === "string") {
    // @ts-ignore
    if (instruction.type === "InternalEndAndReturn") {
      out += "_end_and_return";
    }

    // @ts-ignore
    if (instruction.type === "InternalBrUnless") {
      out += "_br_unless";
      out += " " + (instruction as InternalBrUnless).target;
    }

    // @ts-ignore
    if (instruction.type === "InternalGoto") {
      out += "_goto";
      out += " " + (instruction as InternalGoto).target;
    }

    // @ts-ignore
    if (instruction.type === "InternalCallExtern") {
      out += "_extern_call";
      out += " " + (instruction as InternalCallExtern).target;
    }
  }

  if (typeof (instruction as any).object === "string") {
    out += (instruction as any).object;
    out += ".";
  }

  if (typeof instruction.id === "string") {
    out += instruction.id;
  }

  if ((instruction as any).args !== undefined) {
    // $ts-ignore (replace $ with @)
    (instruction as any).args.forEach((arg:any) => {
      out += " ";
      // $ts-ignore (replace $ with @)
      out += arg.value;
    });
  }

  if (typeof (instruction as any).index === "object") {
    // $ts-ignore (replace $ with @)
    out += " @" + String((instruction as any).index.value);
  }

  return out;
}

export function dumpIR(ir: IR): string {
  let out = "";

  out += "Func table:\n";

  ir.funcTable.forEach((func: IRFunc) => {
    if (func.name === kStart) {
      out += "__start" + " at " + func.startAt + "\n";
      return;
    }

    out += func.name + " at " + func.startAt + "\n";
  });

  out += "\n";

  for (const offset in ir.program) {
    out += offset + " | ";
    out += printInstruction(ir.program[parseInt(offset)]);
    out += "\n";
  }

  return out;
}
