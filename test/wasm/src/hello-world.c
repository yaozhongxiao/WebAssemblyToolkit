// Copyright (c) 2023. All rights reserved.

#include "utils.h"

WASM_IMPORT("env", "printstr") int printstr(char*);

WASM_EXPORT("iadd") int iadd(int a, int b) {
  return a + b;
}

WASM_EXPORT("main") int hello(int option) {
  if(option == 1) {
    printstr("hello world!");
  } else {
    printstr("see you again!");
  }
  return iadd(option, 100);
}