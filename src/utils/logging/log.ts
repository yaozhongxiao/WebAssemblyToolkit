// Copyright (c) 2023 Webassembly Toolkit. All rights reserved.

export function debug(...msg: Array<string>) {
  console.debug(...msg);
}

export function log(...msg: Array<string>) {
  console.debug(...msg);
}

export function info(...msg: Array<string>) {
  console.log(...msg);
}

export function warn(...msg: Array<string>) {
  console.warn(...msg);
}

export function error(...msg: Array<string>) {
  console.error(...msg);
}

export function trace(...msg: Array<string>) {
  console.error(...msg);
}
