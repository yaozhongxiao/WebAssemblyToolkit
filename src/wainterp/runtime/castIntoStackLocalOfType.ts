// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

import { RuntimeError } from "../errors";
import * as i32 from "./values/i32";
import * as i64 from "./values/i64";
import * as f32 from "./values/f32";
import * as f64 from "./values/f64";

export function castIntoStackLocalOfType(
  type: string,
  v: any,
  nan: boolean = false,
  inf: boolean = false
): StackLocal {
  const castFn = {
    i32: i32.createValueFromAST,
    i64: i64.createValueFromAST,
    f32: f32.createValueFromAST,
    f64: f64.createValueFromAST,
  };

  if (nan === true) {
    castFn.f32 = f32.createNanFromAST;
    castFn.f64 = f64.createNanFromAST;
  }

  if (inf === true) {
    castFn.f32 = f32.createInfFromAST;
    castFn.f64 = f64.createInfFromAST;
  }

  if (typeof castFn[type] === "undefined") {
    throw new RuntimeError(
      "Cannot cast: unsupported type " + JSON.stringify(type)
    );
  }

  return castFn[type](v);
}
