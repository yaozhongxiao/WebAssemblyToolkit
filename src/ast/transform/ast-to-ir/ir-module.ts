// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

import { assert } from "../../../utils/macro/assert";
import {
  getEndBlockByteOffset,
  getEndByteOffset,
  getFunctionBeginingByteOffset,
  getStartBlockByteOffset,
  getStartByteOffset,
  internalBrUnless,
  internalGoto,
  internalCallExtern,
  isBlock,
  isLoopInstruction,
  isCallInstruction,
  isFuncImportDescr,
  isIdentifier,
  isIfInstruction,
  isNumberLiteral,
  internalEndAndReturn,
  traverse,
  numberLiteral,
} from "../../ast";

// $ts-ignore (replace $ with @)
export const kStart: string = "_start";

/*
declare function LABEL_POP(): void;
declare function LABEL_PUSH(n: Node): void;

define(
  LABEL_POP,
  () => `
    this._labels.pop();
  `
);

define(
  LABEL_PUSH,
  (node) => `
    this._labels.push(${node});
  `
);
*/

/**
 * ModuleContext
 *
 * TODO(): refactor current implementation?
 */
type FuncContext = {
  funcs: Array<{ node?: Func, isImplemented: boolean }>,
};

function createContext(ast: Program): FuncContext {
  const context: FuncContext = {
    funcs: [],
  };

  traverse(ast, {
    ModuleImport(path: NodePath<ModuleImport>) {
      if (isFuncImportDescr(path.node.descr)) {
        context.funcs.push({
          isImplemented: false,
        });
      }
    },

    Func(path: NodePath<Func>) {
      context.funcs.push({
        isImplemented: true,
        node: path.node,
      });
    },
  });

  return context;
}

export class IRModule {
  _labels: Array<Node>;
  _program: Array<IRNode>;
  _currentFunc?: Func;
  _context: FuncContext; // function namespace

  constructor(ast: Program) {
    this._labels = [];
    this._program = [];
    this._currentFunc = undefined;
    // create the function namespace
    // and insert all the function in namespace
    this._context = createContext(ast);
  }

  LABEL_POP(): void {
    this._labels.pop();
  }

  LABEL_PUSH(node: Node): void {
    this._labels.push(node);
  }

  _emit(node: Node) {
    const offset = getStartByteOffset(node);

    this._program.push({ offset, node });
  }

  beginFuncBody(func: Func) {
    this._labels = [];
    this._program = [];
    this._currentFunc = func;

    this.LABEL_PUSH(func);
  }

  onFuncInstruction(node: Instruction) {
    if (isCallInstruction(node)) {
      const callNode: CallInstruction = node as CallInstruction;
      // $ts-ignore (replace $ with @): it's ensured by the node matcher
      assert(callNode.numeric !== null);

      let funcIndex = null;

      // $ts-ignore (replace $ with @): it's ensured by the node matcher
      if (isNumberLiteral(callNode.index)) {
        funcIndex = parseInt(callNode.index.value as string);
      }

      // $ts-ignore (replace $ with @): it's ensured by the node matcher
      if (isIdentifier(callNode.index)) {
        // $ts-ignore (replace $ with @): it's ensured by the node matcher
        funcIndex = parseInt(callNode.numeric!.value as string);
      }

      assert(funcIndex !== null);

      // $ts-ignore (replace $ with @): ensured by the assertion
      const funcInContext = this._context.funcs[funcIndex as number];
      assert(typeof funcInContext === "object");

      if (funcInContext.isImplemented === true) {
        const func: Func = funcInContext.node as Func;

        // transform module index into byte offset
        // $ts-ignore (replace $ with @)
        callNode.index.value = getFunctionBeginingByteOffset(func);
        callNode.numeric = numberLiteral(funcIndex as number, String("funcIndex"));

        this._emit(node);
      } else {
        const internalCallExternNode = internalCallExtern(funcIndex as number);
        internalCallExternNode.loc = node.loc;

        this._emit(internalCallExternNode);
      }

      return;
    }

    if (isBlock(node)) {
      this.LABEL_PUSH(node);
    }

    if (isLoopInstruction(node)) {
      this.LABEL_PUSH(node);
    }

    if (node.id === "br" || node.id === "br_if") {
      const brNode: any = node;
      // $ts-ignore (replace $ with @)
      const depth = brNode.args[0].value;
      // $ts-ignore (replace $ with @)
      const target = this._labels[this._labels.length - depth - 1];
      assert(typeof target === "object", `Label ${String(depth)} not found`);

      if (isLoopInstruction(target) && depth === 0) {
        // $ts-ignore (replace $ with @)
        brNode.args[0].value = getStartBlockByteOffset(target as LoopInstruction);
      } else {
        // $ts-ignore (replace $ with @)
        brNode.args[0].value = getEndBlockByteOffset(target as Block);
      }
    }

    if (isIfInstruction(node)) {
      const ifInstr: IfInstruction = node as IfInstruction;
      // $ts-ignore (replace $ with @)
      const alternateOffset = getStartByteOffset(ifInstr.alternate[0]);
      const internalBrUnlessNode = internalBrUnless(alternateOffset);
      internalBrUnlessNode.loc = node.loc;

      this._emit(internalBrUnlessNode);

      // $ts-ignore (replace $ with @)
      ifInstr.consequent.forEach((n) => this._emit(n));

      // Skipping the alternate once the consequent block has been executed.
      // We inject a goto at the offset of the else instruction
      //
      // TODO(): properly replace the else instruction instead, keep it in
      // the ast.
      const internalGotoNode = internalGoto(
        // $ts-ignore (replace $ with @)
        getEndByteOffset(ifInstr.alternate[ifInstr.alternate.length - 1])
      );

      internalGotoNode.loc = {
        start: {
          line: -1,
          // $ts-ignore (replace $ with @)
          column: ifInstr.alternate[0].loc!.start.column - 1,
        },
      };

      this._emit(internalGotoNode);

      // $ts-ignore (replace $ with @)
      ifInstr.alternate.forEach((n) => this._emit(n));

      return;
    }

    this._emit(node);
  }

  emitStartFunc(index: number): any {
    const funcInContext = this._context.funcs[index];
    assert(typeof funcInContext === "object");
    assert(funcInContext.isImplemented);

    const func: Func = funcInContext.node as Func;

    return {
      name: kStart,
      startAt: getFunctionBeginingByteOffset(func),
    };
  }

  finalizeFunc(func: Func): IRFunc {
    this.LABEL_POP();

    // transform the function body `end` into a return
    const lastInstruction = this._program[this._program.length - 1];

    const internalEndAndReturnNode = internalEndAndReturn();
    internalEndAndReturnNode.loc = lastInstruction.node.loc;

    // will be emited at the same location, basically replacing the lastInstruction
    this._emit(internalEndAndReturnNode);

    // clear current function from context
    this._currentFunc = undefined;

    assert(func.name !== undefined, "unknown func.name");
    return {
      name: func.name ? func.name.value as string : "unknwon",
      startAt: getFunctionBeginingByteOffset(func),
      instructions: this._program,
    };
  }
}
