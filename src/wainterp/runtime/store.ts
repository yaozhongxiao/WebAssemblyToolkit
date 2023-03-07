// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

export const NULL = 0x0;

// Allocates memory addresses within the _store
// https://webassembly.github.io/spec/core/exec/modules.html#alloc
export function createStore(): Store {
  // https://webassembly.github.io/spec/core/exec/runtime.html#_store
  const _store: Array<InstType> = [];
  let index : number = 0;

  function malloc(size: number): Addr {
    index += size;

    return {
      index,
      size,
    };
  }

  function get(p: Addr): InstType {
    return _store[p.index];
  }

  function set(p: Addr, value: InstType) {
    _store[p.index] = value;
  }

  function free(p: Addr) {
    _store[p.index] = NULL;
  }

  return {
    _store,
    malloc,
    free,
    get,
    set,
  };
}
