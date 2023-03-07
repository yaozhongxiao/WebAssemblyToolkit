// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

import { assertRuntimeError } from "../../utils/macro/assert";

import Long from "../../utils/long/long";
import { Memory } from "../runtime/values/memory";
import { RuntimeError } from "../errors";

import { binopi32, binopi64, binopf32, binopf64 } from "./instruction/binop";
import { unopi32, unopi64, unopf32, unopf64 } from "./instruction/unop";
import { castIntoStackLocalOfType } from "../runtime/castIntoStackLocalOfType";

import * as i32 from "../runtime/values/i32";
import * as i64 from "../runtime/values/i64";
import * as f32 from "../runtime/values/f32";
import * as f64 from "../runtime/values/f64";
import * as label from "../runtime/values/label";
import { createTrap } from "./signals";
import { compare } from "./instruction/comparison";
import { createChildStackFrame } from "./stackframe"

export function executeStackFrame(
  { program }: IR,
  offset: number,
  firstFrame: StackFrame
): StackLocal {
  assertRuntimeError(typeof program === "object");

  const callStack: Array<StackFrame> = [firstFrame];

  const offsets = Object.keys(program);
  let pc = offsets.indexOf(String(offset));

  let framepointer: number = 0;

  function trace(msg: string) {
    console.error(String("  ").repeat(framepointer) + `  -> ${msg}`);
  }

  function getLocalByIndex(frame: StackFrame, index: number) {
    const local = frame.locals[index];

    if (typeof local === "undefined") {
      throw newRuntimeError(
        "Assertion error: no local value at index " + index
      );
    }
    frame.values.push(local);
  }

  function setLocalByIndex(frame: StackFrame, index: number, value: StackLocal) {
    assertRuntimeError(typeof index === "number");
    frame.locals[index] = value;
  }

  function pushResult(frame: StackFrame, res?: StackLocal) {
    if (typeof res === "undefined") {
      return;
    }
    frame.values.push(res);
  }

  function popArrayOfValTypes(frame: StackFrame, types: Array<Valtype>): any {
    assertNItemsOnStack(frame, types.length);

    return types.map((type) => {
      return pop1OfType(frame, type);
    });
  }

  function valueTypeEq(l: string, r: string): boolean {
    // compatibility with our parser
    if (l === "u32") {
      l = "i32";
    }
    if (l === "u64") {
      l = "i64";
    }

    if (r === "u32") {
      r = "i32";
    }
    if (r === "u64") {
      r = "i64";
    }
    return l === r;
  }

  function pop1OfType(frame: StackFrame, type: Valtype): any {
    assertNItemsOnStack(frame, 1);

    const v = frame.values.pop();
    if (v && typeof type === "string" && valueTypeEq(v.type, type) === false) {
      throw newRuntimeError(
        "Internal failure: expected value of type " +
        type +
        " on top of the stack, type given: " +
        v.type
      );
    }

    return v;
  }

  function pop1(frame: StackFrame): any {
    assertNItemsOnStack(frame, 1);

    return frame.values.pop();
  }

  function pop2(frame: StackFrame, type1: Valtype, type2: Valtype): [any, any] {
    assertNItemsOnStack(frame, 2);

    const c2 = frame.values.pop();
    const c1 = frame.values.pop();

    if (c2 && valueTypeEq(c2.type, type2) === false) {
      throw newRuntimeError(
        "Internal failure: expected c2 value of type " +
        type2 +
        " on top of the stack, given type: " +
        c2.type
      );
    }

    if (c1 && valueTypeEq(c1.type, type1) === false) {
      throw newRuntimeError(
        "Internal failure: expected c1 value of type " +
        type1 +
        " on top of the stack, given type: " +
        c1.type
      );
    }

    return [c1, c2];
  }

  function getMemoryOffset(frame: StackFrame, instruction: Instruction) {
    const namedArgsInstr = instruction as any;
    if (namedArgsInstr.namedArgs && namedArgsInstr.namedArgs.offset) {
      // $ts-ignore (replace $ with @)
      const offset = namedArgsInstr.namedArgs.offset.value;
      if (offset < 0) {
        throw newRuntimeError("offset must be positive");
      }
      if (offset > 0xffffffff) {
        throw newRuntimeError(
          "offset must be less than or equal to 0xffffffff"
        );
      }
      return offset;
    } else {
      return 0;
    }
  }

  function getMemory(frame: StackFrame): Memory {
    if (frame.originatingModule.memaddrs.length !== 1) {
      throw newRuntimeError("unknown memory");
    }
    const memAddr = frame.originatingModule.memaddrs[0];
    return frame.store.get(memAddr);
  }

  function newRuntimeError(msg: string) {
    return new RuntimeError(msg);
  }

  function getActiveStackFrame(): StackFrame {
    assertRuntimeError(framepointer > -1, "call stack underflow");

    const frame = callStack[framepointer];
    assertRuntimeError(frame !== undefined, "no frame at " + framepointer);

    return frame;
  }

  function assertNItemsOnStack(frame: StackFrame, n: number): void {
    if (frame.values.length < n) {
      throw new RuntimeError(
        "Assertion error: expected " + JSON.stringify(n)
        + " on the stack, found " + frame.values.length
      );
    }
  }

  function POP_LABEL(frame: StackFrame): void {
    // 3. Assert: due to validation, the label L is now on the top of the stack.
    // 4. Pop the label from the stack.
    let found = false;

    const index = frame.values.slice(0).reverse().findIndex(({ type }) => type === "label");
    // some expression like inittializer don't have labels currently, so this is
    // guarantee to fail
    // assertRuntimeError(index !== -1, "POP_LABEL: label not found")

    if (index !== -1) {
      const initialOrderIndex = frame.values.length - 1 - index;
      trace("exiting block " + frame.values[initialOrderIndex].value);
      frame.values.splice(initialOrderIndex, 1);
    }
  }

  function GOTO(labelOffset: number): void {
    pc = offsets.indexOf(String(labelOffset));
  }

  function RETURN(): any {
    const activeFrame = getActiveStackFrame();
    if (activeFrame.values.length > 0) {
      return pop1(activeFrame);
    } else {
      return;
    }
  }

  function PUSH_NEW_STACK_FRAME(pc: number, funcIndex: number): void {
    const activeFrame = getActiveStackFrame();

    // 2. Assert: due to validation, F.module.funcaddrs[x] exists.
    const funcaddr = activeFrame.originatingModule.funcaddrs[funcIndex];
    if (typeof funcaddr === "undefined") {
      throw newRuntimeError(
        `No function was found in module at address ${funcIndex}`
      );
    }
    // 3. Let a be the function address F.module.funcaddrs[x]
    const childFn: FuncInstance = activeFrame.store.get(funcaddr);
    if (typeof childFn !== "object") {
      throw newRuntimeError(
        `Cannot call function at address ${funcaddr}: not a function`
      );
    }
    // 4. Invoke the function instance at address a
    // FIXME(): assert that res has type of resultType
    const [argTypes, resultType] = childFn.type;

    const args = popArrayOfValTypes(activeFrame, argTypes);
    assertRuntimeError(childFn.isExternal == false);
    const newStackFrame = createChildStackFrame(activeFrame, pc, args);

    // move active frame
    framepointer++;
    if (framepointer >= 300) {
      throw new RuntimeError("Maximum call stack depth reached");
    }
    // Push the frame on top of the stack
    callStack[framepointer] = newStackFrame;
  }

  function POP_STACK_FRAME(): void {
    const activeFrame = getActiveStackFrame();
    // pass the result of the previous call into the new active fame
    let res;
    if (activeFrame.values.length > 0) {
      res = pop1(activeFrame);
    }
    // Pop active frame from the stack
    callStack.pop();
    framepointer--;

    const newStackFrame = getActiveStackFrame();
    if (res !== undefined && newStackFrame !== undefined) {
      pushResult(newStackFrame, res);
    }
  }

  while (true) {
    const frame = getActiveStackFrame();
    const instruction: Instruction = program[parseInt(offsets[pc])];

    assertRuntimeError(
      instruction !== undefined,
      `no instruction at pc ${pc} in frame ${framepointer}`
    );

    // $ts-ignore (replace $ with @)
    trace(`${instruction.type}(${instruction.id || ""})`);

    if (typeof frame.trace === "function") {
      frame.trace(framepointer, pc, instruction, frame);
    }

    pc++;

    switch (instruction.type) {
      // @ts-ignore (replace $ with @)
      case "InternalEndAndReturn": {
        if (frame.returnAddress !== -1) {
          pc = frame.returnAddress; // raw goto
          POP_STACK_FRAME();
          break;
        } else {
          return RETURN();
        }
      }

      // @ts-ignore (replace $ with @)
      case "InternalGoto": {
        const { target } = instruction;
        GOTO(target);
        break;
      }

      // @ts-ignore (replace $ with @)
      case "InternalCallExtern": {
        const { target }: InternalCallExtern = instruction;

        // 2. Assert: due to validation, F.module.funcaddrs[x] exists.
        const funcaddr = frame.originatingModule.funcaddrs[target];

        if (typeof funcaddr === "undefined") {
          throw newRuntimeError(
            `No function was found in module at address ${target}`
          );
        }

        // 3. Let a be the function address F.module.funcaddrs[x]
        const subroutine: FuncInstance = frame.store.get(funcaddr);

        if (typeof subroutine !== "object") {
          throw newRuntimeError(
            `Cannot call function at address ${funcaddr}: not a function`
          );
        }

        // 4. Invoke the function instance at address a
        // FIXME(): assert that res has type of resultType
        const [argTypes, resultType] = subroutine.type;

        const args = popArrayOfValTypes(frame, argTypes);
        assertRuntimeError(subroutine.isExternal);

        const res = (subroutine.code as Function)(args.map((arg: any) => arg.value));
        if (typeof res !== "undefined") {
          const resArray = Array.isArray(res) ? res : [res];
          assertRuntimeError(resArray.length === resultType.length,
            "Assertion error: expected " + resultType.length + "returns"
            + " found " + resArray.length + " instead for " + JSON.stringify(funcaddr));

          resArray.forEach((element, index) => {
            pushResult(frame, castIntoStackLocalOfType(resultType[index], resArray[index]));
          });
        }
        break;
      }
    }

    switch (instruction.id) {
      case "const": {
        // https://webassembly.github.io/spec/core/exec/instructions.html#exec-const
        // @ts-ignore (replace $ with @)
        const n = instruction.args[0];
        if (typeof n === "undefined") {
          throw newRuntimeError("const requires one argument, none given.");
        }
        if (
          n.type !== "NumberLiteral" &&
          n.type !== "LongNumberLiteral" &&
          n.type !== "FloatLiteral"
        ) {
          throw newRuntimeError("const: unsupported value of type: " + n.type);
        }

        pushResult(
          frame,
          // @ts-ignore (replace $ with @)
          castIntoStackLocalOfType(instruction.object, n.value)
        );
        break;
      }

      /**
       * Control Instructions
       *
       * https://webassembly.github.io/spec/core/exec/instructions.html#control-instructions
       */
      case "nop": {
        // Do nothing
        // https://webassembly.github.io/spec/core/exec/instructions.html#exec-nop
        break;
      }

      case "drop": {
        // https://webassembly.github.io/spec/core/exec/instructions.html#exec-drop

        // 1. Assert: due to validation, a value is on the top of the stack.
        assertNItemsOnStack(frame, 1);
        // 2. Pop the value valval from the stack.
        pop1(frame);

        break;
      }

      case "call": {
        // FIXME(): check spec compliancy
        // @ts-ignore (replace $ with @)
        const offset: number = instruction.index.value;
        const index: number = (instruction as CallInstruction).numeric?.value as number;
        PUSH_NEW_STACK_FRAME(pc, index);
        // $ts-ignore (replace $ with @)
        GOTO(offset);
        break;
      }

      case "end": {
        POP_LABEL(frame);
        break;
      }

      case "loop":
      case "block": {
        // https://webassembly.github.io/spec/core/exec/instructions.html#blocks
        // FIXME(): check spec compliancy

        const block = instruction;
        // 2. Enter the block instr∗ with label
        frame.labels.push({
          value: block,
          arity: 0,
          // @ts-ignore (replace $ with @)
          id: block.label,
        });

        // @ts-ignore (replace $ with @)
        pushResult(frame, label.createValue(block.label.value));
        // @ts-ignore (replace $ with @)
        trace("entering block " + block.label.value);
        break;
      }

      case "br": {
        // FIXME(): check spec compliancy
        // @ts-ignore (replace $ with @)
        const label = instruction.args[0];
        // $ts-ignore (replace $ with @)
        GOTO(label.value);
        break;
      }

      case "br_if": {
        // @ts-ignore (replace $ with @)
        const label = instruction.args[0];

        // 1. Assert: due to validation, a value of type i32 is on the top of the stack.
        // 2. Pop the value ci32.const c from the stack.
        const c = pop1OfType(frame, "i32");

        if (c.value.eqz().isTrue() === false) {
          // 3. If c is non-zero, then
          // 3. a. Execute the instruction (br l).
          // $ts-ignore (replace $ with @)
          GOTO(label.value);
        } else {
          // 4. Else:
          // 4. a. Do nothing.
        }
        break;
      }

      /**
       * Administrative Instructions
       *
       * https://webassembly.github.io/spec/core/exec/runtime.html#administrative-instructions
       */
      case "unreachable":
      // https://webassembly.github.io/spec/core/exec/instructions.html#exec-unreachable
      case "trap": {
        // signalling abrupt termination
        // https://webassembly.github.io/spec/core/exec/runtime.html#syntax-trap
        throw createTrap();
      }

      case "local": {
        // @ts-ignore (replace $ with @)
        const [valtype] = instruction.args;
        if (valtype.name === "i64") {
          const init = castIntoStackLocalOfType(valtype.name, new Long(0, 0));
          frame.locals.push(init);
        } else {
          // $ts-ignore (replace $ with @)
          const init = castIntoStackLocalOfType(valtype.name, 0);
          frame.locals.push(init);
        }
        // $ts-ignore (replace $ with @)
        trace("debug: new local " + valtype.name);
        break;
      }

      /**
       * Memory Instructions
       *
       * https://webassembly.github.io/spec/core/exec/instructions.html#memory-instructions
       */
      case "get_local": {
        // https://webassembly.github.io/spec/core/exec/instructions.html#exec-get-local
        // @ts-ignore (replace $ with @)
        const index = instruction.args[0];

        if (typeof index === "undefined") {
          throw newRuntimeError("get_local requires one argument, none given.");
        }

        if (index.type === "NumberLiteral" || index.type === "FloatLiteral") {
          getLocalByIndex(frame, index.value);
        } else {
          throw newRuntimeError(
            "get_local: unsupported index of type: " + index.type
          );
        }
        break;
      }

      case "set_local": {
        // https://webassembly.github.io/spec/core/exec/instructions.html#exec-set-local
        // @ts-ignore (replace $ with @)
        const index = instruction.args[0];

        if (index.type === "NumberLiteral") {
          // WASM

          // 4. Pop the value val from the stack
          const val = pop1(frame);

          // 5. Replace F.locals[x] with the value val
          setLocalByIndex(frame, index.value, val);
        } else {
          throw newRuntimeError(
            "set_local: unsupported index of type: " + index.type
          );
        }

        break;
      }

      case "tee_local": {
        // https://webassembly.github.io/spec/core/exec/instructions.html#exec-tee-local
        // @ts-ignore (replace $ with @)
        const index = instruction.args[0];

        if (index.type === "NumberLiteral") {
          // 1. Assert: due to validation, a value is on the top of the stack.
          // 2. Pop the value val from the stack.
          const val = pop1(frame);

          // 3. Push the value valval to the stack.
          pushResult(frame, val);

          // 4. Push the value valval to the stack.
          pushResult(frame, val);

          // 5. Execute the instruction (set_local x).
          // 5. 4. Pop the value val from the stack
          const val2 = pop1(frame);

          // 5. 5. Replace F.locals[x] with the value val
          setLocalByIndex(frame, index.value, val2);
        } else {
          throw newRuntimeError(
            "tee_local: unsupported index of type: " + index.type
          );
        }

        break;
      }

      case "set_global": {
        // https://webassembly.github.io/spec/core/exec/instructions.html#exec-set-global
        // @ts-ignore (replace $ with @)
        const index = instruction.args[0];

        // 2. Assert: due to validation, F.module.globaladdrs[x] exists.
        // $ts-ignore (replace $ with @)
        const globaladdr = frame.originatingModule.globaladdrs[index.value];

        if (typeof globaladdr === "undefined") {
          // $ts-ignore (replace $ with @)
          throw newRuntimeError(`Global address ${index.value} not found`);
        }

        // 4. Assert: due to validation, S.globals[a] exists.
        const globalinst = frame.store.get(globaladdr);

        if (typeof globalinst !== "object") {
          throw newRuntimeError(
            `Unexpected data for global at ${globaladdr.toString()}`
          );
        }

        // 7. Pop the value val from the stack.
        const val = pop1(frame);

        // 8. Replace glob.value with the value val.
        globalinst.value = val.value;

        frame.store.set(globaladdr, globalinst);

        break;
      }

      case "get_global": {
        // https://webassembly.github.io/spec/core/exec/instructions.html#exec-get-global
        // @ts-ignore (replace $ with @)
        const index = instruction.args[0];

        // 2. Assert: due to validation, F.module.globaladdrs[x] exists.
        // $ts-ignore (replace $ with @)
        const globaladdr = frame.originatingModule.globaladdrs[index.value];

        if (typeof globaladdr === "undefined") {
          throw newRuntimeError(
            // $ts-ignore (replace $ with @)
            `Unknown global at index: ${index.value.toString()}`
          );
        }

        // 4. Assert: due to validation, S.globals[a] exists.
        const globalinst = frame.store.get(globaladdr);

        if (typeof globalinst !== "object") {
          throw newRuntimeError(
            `Unexpected data for global at ${globaladdr.toString()}`
          );
        }

        // 7. Pop the value val from the stack.
        pushResult(frame, globalinst);

        break;
      }

      /**
       * Memory operations
       */

      // https://webassembly.github.io/spec/core/exec/instructions.html#exec-storen
      case "store":
      case "store8":
      case "store16":
      case "store32": {
        // @ts-ignore (replace $ with @)
        const { id, object } = instruction;

        const memory = getMemory(frame);

        // $ts-ignore (replace $ with @)
        const [c1, c2] = pop2(frame, "i32", object);
        const ptr = c1.value.toNumber() + getMemoryOffset(frame, instruction);
        let valueBuffer = c2.value.toByteArray();

        switch (id) {
          case "store":
            break;
          case "store8":
            valueBuffer = valueBuffer.slice(0, 1);
            break;
          case "store16":
            valueBuffer = valueBuffer.slice(0, 2);
            break;
          case "store32":
            valueBuffer = valueBuffer.slice(0, 4);
            break;

          default:
            throw newRuntimeError("illegal operation: " + id);
        }

        if (ptr + valueBuffer.length > memory.buffer.byteLength) {
          throw newRuntimeError("memory access out of bounds");
        }

        const memoryBuffer = new Uint8Array(memory.buffer);

        // load / store use little-endian order
        for (let ptrOffset = 0; ptrOffset < valueBuffer.length; ptrOffset++) {
          memoryBuffer[ptr + ptrOffset] = valueBuffer[ptrOffset];
        }

        break;
      }

      // https://webassembly.github.io/spec/core/exec/instructions.html#and
      case "load":
      case "load16_s":
      case "load16_u":
      case "load8_s":
      case "load8_u":
      case "load32_s":
      case "load32_u": {
        // @ts-ignore (replace $ with @)
        const { id, object } = instruction;

        const memory = getMemory(frame);

        const ptr =
          pop1OfType(frame, "i32").value.toNumber() +
          getMemoryOffset(frame, instruction);

        // for i32 / i64 ops, handle extended load
        let extend = 0;
        // for i64 values, increase the bitshift by 4 bytes
        const extendOffset = object === "i32" ? 0 : 32;
        let signed = false;
        switch (id) {
          case "load16_s":
            extend = 16 + extendOffset;
            signed = true;
            break;
          case "load16_u":
            extend = 16 + extendOffset;
            signed = false;
            break;
          case "load8_s":
            extend = 24 + extendOffset;
            signed = true;
            break;
          case "load8_u":
            extend = 24 + extendOffset;
            signed = false;
            break;
          case "load32_u":
            extend = 0 + extendOffset;
            signed = false;
            break;
          case "load32_s":
            extend = 0 + extendOffset;
            signed = true;
            break;
        }

        // check for memory access out of bounds
        switch (object) {
          case "u32":
          case "i32":
          case "f32": {
            if (ptr + 4 > memory.buffer.byteLength) {
              throw newRuntimeError("memory access out of bounds");
            }
            break;
          }
          case "i64":
          case "f64": {
            if (ptr + 8 > memory.buffer.byteLength) {
              throw newRuntimeError("memory access out of bounds");
            }
            break;
          }

          default:
            // $ts-ignore (replace $ with @)
            throw new RuntimeError("Unsupported " + object + " load");
        }

        switch (object) {
          case "i32":
          case "u32":
            pushResult(
              frame,
              i32.createValueFromArrayBuffer(memory.buffer, ptr, extend, signed)
            );
            break;
          case "i64":
            pushResult(
              frame,
              i64.createValueFromArrayBuffer(memory.buffer, ptr, extend, signed)
            );
            break;
          case "f32":
            pushResult(
              frame,
              f32.createValueFromArrayBuffer(memory.buffer, ptr)
            );
            break;
          case "f64":
            pushResult(
              frame,
              f64.createValueFromArrayBuffer(memory.buffer, ptr)
            );
            break;

          default:
            throw new RuntimeError("Unsupported " + object + " load");
        }

        break;
      }

      /**
       * Binary operations
       */
      case "add":
      case "mul":
      case "sub":
      /**
       * There are two seperated operation for both signed and unsigned integer,
       * but since the host environment will handle that, we don't have too :)
       */
      case "div_s":
      case "div_u":
      case "rem_s":
      case "rem_u":
      case "shl":
      case "shr_s":
      case "shr_u":
      case "rotl":
      case "rotr":
      case "div":
      case "min":
      case "max":
      case "copysign":
      case "or":
      case "xor":
      case "and": {
        let binopFn;
        // @ts-ignore (replace $ with @)
        switch (instruction.object) {
          case "i32":
            binopFn = binopi32;
            break;
          case "i64":
            binopFn = binopi64;
            break;
          case "f32":
            binopFn = binopf32;
            break;
          case "f64":
            binopFn = binopf64;
            break;
          default:
            throw createTrap(
              "Unsupported operation " +
              instruction.id +
              " on " +
              // @ts-ignore (replace $ with @)
              instruction.object
            );
        }
        // @ts-ignore (replace $ with @)
        const [c1, c2] = pop2(frame, instruction.object, instruction.object);
        pushResult(frame, binopFn(c1, c2, instruction.id));

        break;
      }

      /**
       * Comparison operations
       */
      case "eq":
      case "ne":
      case "lt_s":
      case "lt_u":
      case "le_s":
      case "le_u":
      case "gt":
      case "gt_s":
      case "gt_u":
      case "ge_s":
      case "ge_u": {
        // @ts-ignore (replace $ with @)
        const [c1, c2] = pop2(frame, instruction.object, instruction.object);
        // $ts-ignore (replace $ with @)
        pushResult(frame, compare(c1, c2, instruction.id));

        break;
      }

      /**
       * Unary operations
       */
      case "abs":
      case "neg":
      case "clz":
      case "ctz":
      case "popcnt":
      case "eqz":
      case "reinterpret/f32":
      case "reinterpret/f64": {
        let unopFn;

        // for conversion operations, the operand type appears after the forward-slash
        // e.g. with i32.reinterpret/f32, the oprand is f32, and the resultant is i32
        const opType =
          instruction.id.indexOf("/") !== -1
            ? // $ts-ignore (replace $ with @)
            instruction.id.split("/")[1]
            : // @ts-ignore (replace $ with @)
            instruction.object;

        switch (opType) {
          case "i32":
            unopFn = unopi32;
            break;
          case "i64":
            unopFn = unopi64;
            break;
          case "f32":
            unopFn = unopf32;
            break;
          case "f64":
            unopFn = unopf64;
            break;
          default:
            throw createTrap(
              // $ts-ignore (replace $ with @)
              "Unsupported operation " + instruction.id + " on " + opType
            );
        }

        const c = pop1OfType(frame, opType);

        // $ts-ignore (replace $ with @)
        pushResult(frame, unopFn(c, instruction.id));

        break;
      }

      case "return": {
        if (frame.returnAddress !== -1) {
          pc = frame.returnAddress; // raw goto
          POP_STACK_FRAME();
        }
        return RETURN();
      }
    }
  }
}
