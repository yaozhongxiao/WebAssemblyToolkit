// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

const type = "label";

export function createValue(value: string): StackLocal {
  return {
    type,
    value,
  };
}
