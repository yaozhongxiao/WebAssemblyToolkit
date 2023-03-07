// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

type Sign =
  | "add"
  | "sub"
  | "div"
  | "div_s"
  | "div_u"
  | "mul"
  | "and"
  | "or"
  | "xor"
  | "~"
  | "min"
  | "max"
  | "copysign"
  | "rem_s"
  | "rem_u"
  | "shl"
  | "shr_s"
  | "shr_u"
  | "rotl"
  | "rotr";

import * as i32 from "../values/i32";
import * as i64 from "../values/i64";
import * as f32 from "../values/f32";
import * as f64 from "../values/f64";

function binop(
  { value: value1 }: StackLocal,
  { value: value2 }: StackLocal,
  sign: Sign,
  createValue: (arg: any) => StackLocal
): StackLocal {
  switch (sign) {
    case "add":
      return createValue(value1.add(value2));

    case "sub":
      return createValue(value1.sub(value2));

    case "mul":
      return createValue(value1.mul(value2));

    case "div_s":
      return createValue(value1.div_s(value2));

    case "div_u":
      return createValue(value1.div_u(value2));

    case "rem_s":
      return createValue(value1.rem_s(value2));

    case "rem_u":
      return createValue(value1.rem_u(value2));

    case "shl":
      return createValue(value1.shl(value2));

    case "shr_s":
      return createValue(value1.shr_s(value2));

    case "shr_u":
      return createValue(value1.shr_u(value2));

    case "rotl":
      return createValue(value1.rotl(value2));

    case "rotr":
      return createValue(value1.rotr(value2));

    case "div":
      return createValue(value1.div(value2));

    case "and":
      return createValue(value1.and(value2));

    case "or":
      return createValue(value1.or(value2));

    case "xor":
      return createValue(value1.xor(value2));

    case "min":
      return createValue(value1.min(value2));

    case "max":
      return createValue(value1.max(value2));

    case "copysign":
      return createValue(value1.copysign(value2));
  }

  throw new Error("Unsupported binop: " + sign);
}

export function binopi32(
  value1: StackLocal,
  value2: StackLocal,
  sign: Sign
): StackLocal {
  return binop(value1, value2, sign, i32.createValue);
}

export function binopi64(
  value1: StackLocal,
  value2: StackLocal,
  sign: Sign
): StackLocal {
  return binop(value1, value2, sign, i64.createValue);
}

export function binopf32(
  value1: StackLocal,
  value2: StackLocal,
  sign: Sign
): StackLocal {
  return binop(value1, value2, sign, f32.createValue);
}

export function binopf64(
  value1: StackLocal,
  value2: StackLocal,
  sign: Sign
): StackLocal {
  return binop(value1, value2, sign, f64.createValue);
}
