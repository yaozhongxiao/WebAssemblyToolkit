
// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

import { assert } from "../../utils/macro/assert";

import * as t  from "../../ast/ast";
import { RuntimeError } from "../errors";
import { castIntoStackLocalOfType } from "./castIntoStackLocalOfType";
import { executeStackFrame } from "./executor";
import { createStackFrame } from "./stackframe";
import { ExecutionHasBeenTrapped } from "./signals";
import { trace } from "../../utils/logging/log";

export function createHostfunc(
  ir: IR,
  moduleinst: ModuleInstance,
  exportinst: ExportInstance,
  store: Store,
  { checkForI64InSignature, returnStackLocal }: InternalInstanceOptions
): Hostfunc {
  return function hostfunc(...args : Array<any>): any {

    const exportinstAddr = exportinst.value.addr;
    /**
     * Find callable in instantiated function in the module funcaddrs
     */
    const hasModuleInstantiatedFunc =
      moduleinst.funcaddrs.indexOf(exportinstAddr);

    if (hasModuleInstantiatedFunc === -1) {
      throw new RuntimeError(
        `Function at addr ${exportinstAddr.index} has not been initialized in the module.` +
          "Probably an internal failure"
      );
    }

    const funcinst : FuncInstance = store.get(exportinstAddr);
    if (funcinst === null) {
      throw new RuntimeError(
        `Function was not found at addr ${exportinstAddr.index}`
      );
    }

    const funcinstArgs : Array<Valtype> = funcinst.type[0];
    if (checkForI64InSignature === true) {
      const funcinstResults = funcinst.type[1];

      /**
       * If the signature contains an i64 (as argument or result), the host
       * function immediately throws a TypeError when called.
       */
      const funcinstArgsHasi64 = funcinstArgs.indexOf("i64") !== -1;
      const funcinstResultsHasi64 = funcinstResults.indexOf("i64") !== -1;

      if (funcinstArgsHasi64 === true || funcinstResultsHasi64 === true) {
        throw new TypeError(
          "Can not call this function from JavaScript: " + "i64 in signature."
        );
      }
    }

    /**
     * Check number of argument passed vs the function arity
     */
    if (args.length !== funcinstArgs.length) {
      throw new RuntimeError(
        `Function ${exportinstAddr.index} called with ${args.length} arguments but ` +
          funcinst.type[0].length +
          " expected"
      );
    }

    const argsWithType : Array<StackLocal> = args.map((value: any, i: number): StackLocal =>
      castIntoStackLocalOfType(funcinstArgs[i], value)
    );

    const stackFrame:StackFrame = createStackFrame(
      argsWithType,
      funcinst.module as ModuleInstance,
      store
    );

    // push func's params into stackFrame locals
    stackFrame.locals.push(...argsWithType);

    // 2. Enter the block instr∗ with label
    // stackFrame.values.push(label.createValue(exportinst.name));

    stackFrame.labels.push({
      value: funcinst,
      arity: funcinstArgs.length,
      id: t.identifier(exportinst.name),
    });

    // trace("host invoking " + exportinst.name);
    trace(`-> ${exportinst.name}(${args}):`);
    assert(funcinst.index !== undefined);
    return executeStackFrameAndGetResult(
      ir,
      funcinst.index as number, /* funcinst.atOffset */
      stackFrame,
      returnStackLocal
    );
  };
}

export function executeStackFrameAndGetResult(
  ir: IR,
  offset: number,
  stackFrame: StackFrame,
  returnStackLocal: boolean
): any {
  try {
    const res : StackLocal = executeStackFrame(ir, offset, stackFrame);
    if (returnStackLocal === true) {
      return res;
    }

    if (res != null && res.value != null) {
      assert(res.type !== "label");
      return res.value.toNumber();
    }
  } catch (e: any) {
    if (e instanceof ExecutionHasBeenTrapped) {
      throw e;
    } else {
      const err = new RuntimeError(e.message);
      err.stack = e.stack;
      throw err;
    }
  }
}
