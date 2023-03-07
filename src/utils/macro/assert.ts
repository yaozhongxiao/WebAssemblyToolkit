import { CompileError, RuntimeError} from "../../wainterp/errors";

export function assert(cond: boolean, ...msg: string[]) {
  if (!cond) {
    console.error(...msg);
    let errmsg = "error: ".concat(...msg);
    throw new CompileError(errmsg);
  }
}

export function assertRuntimeError(cond: boolean, ...msg: string[]) {
  if (!cond) {
    console.error(...msg);
    let errmsg = "error: ".concat(...msg);
    throw new RuntimeError(errmsg);
  }
}
