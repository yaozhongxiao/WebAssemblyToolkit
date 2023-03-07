import {
  traverse,
  isInstruction,
  isSignature,
  isNumberLiteral,
  moduleContextFromModuleAST
} from "../../ast/ast";

import {
  type ModuleContext,
} from "../../ast/transform/ast-module-to-module-context";

import { assert } from "../../utils/macro/assert";
import getType from "./type-checker/get-type";
import { ANY, POLYMORPHIC } from "./type-checker/types";

function createTypeChecker() {
  const errors : Array<string> = [];
  let stopFuncCheck = false;

  // current function name is injected during the traversal
  let currentFuncName : string;

  function onError(msg:string, index: any) {
    msg += " at " + (currentFuncName || "unknown");

    if (typeof index === "number") {
      msg += ":" + index;
    }

    msg += ".";

    errors.push(msg);
  }

  function checkTypes(a:any, b:any, index:any) {
    if (a === ANY && b) {
      return;
    }

    if (b === ANY && a) {
      return;
    }

    // the type u32 is equal to i32
    if (a === "u32") a = "i32";
    if (b === "u32") b = "i32";

    // the type u64 is equal to i64
    if (a === "u64") a = "i64";
    if (b === "u64") b = "i64";

    if (a !== b) {
      onError(`Expected type ${a} but got ${b || "none"}`, index);
      stopFuncCheck = true;
    }
  }

  function isEmptyStack(stack:any) {
    // Polymorphic types are allowed in empty stack
    return stack.filter((t:any) => t !== POLYMORPHIC).length === 0;
  }

  function checkStacks(expectedStack:any, actualStack:any) {
    assert(expectedStack !== undefined);
    assert(actualStack !== undefined);

    if (actualStack !== false) {
      let j = actualStack.length - 1;
      for (let i = 0; i < expectedStack.length; ++i) {
        const expected = expectedStack[i];
        const actual = actualStack[j];

        if (actual === POLYMORPHIC || stopFuncCheck) {
          return;
        }

        checkTypes(expected, actual, undefined);
        --j;
      }

      // There are still types left on the resulting stack
      if (!isEmptyStack(actualStack.slice(0, j + 1))) {
        onError(
          `Stack contains additional type ${actualStack.slice(0, j + 1)}`, undefined
        );
      }
    }
  }

  function applyInstruction(moduleContext:ModuleContext, stack:any, instruction:any, index:any) {
    // Return was called or a type error has occured, skip everything
    if (stack === false || stack.return) {
      return stack;
    }

    // Workaround for node.args which sometimes does not contain instructions (i32.const, call)
    if (isInstruction(instruction) === false) {
      return stack;
    }

    // Recursively evaluate all nested instructions
    if (instruction.args) {
      stack = instruction.args.reduce(
        applyInstruction.bind(null, moduleContext),
        stack
      );
    }

    if (instruction.instrArgs) {
      stack = instruction.instrArgs.reduce(
        applyInstruction.bind(null, moduleContext),
        stack
      );
    }

    if (instruction.intrs) {
      stack = instruction.intrs.reduce(
        applyInstruction.bind(null, moduleContext),
        stack
      );
    }

    const type = getType(moduleContext, stack, instruction);

    if (type.error) {
      onError(type.error, index);

      return false;
    }

    // Structured control flow
    // Update context
    // Run on empty stack
    if (
      instruction.type === "BlockInstruction" ||
      instruction.type === "LoopInstruction"
    ) {
      moduleContext.addLabel(type.result);

      const newStack = instruction.instr.reduce(
        applyInstruction.bind(null, moduleContext),
        []
      );

      if (!stopFuncCheck) {
        checkStacks(type.result, newStack);
      }

      stack = [...stack, ...type.result];

      moduleContext.popLabel();
    } else if (instruction.type === "IfInstruction") {
      moduleContext.addLabel(type.result);

      // Condition can be nested as well
      if (instruction.test) {
        stack = instruction.test.reduce(
          applyInstruction.bind(null, moduleContext),
          stack
        );
      }

      let actual;
      for (let i = 0; i < type.args.length; ++i) {
        const argType = type.args[i];

        if (stack[stack.length - 1] === POLYMORPHIC || stopFuncCheck) {
          return false;
        }

        actual = stack.pop();
        checkTypes(argType, actual, index);
      }

      const stackConsequent = instruction.consequent.reduce(
        applyInstruction.bind(null, moduleContext),
        []
      );

      const stackAlternate = instruction.alternate.reduce(
        applyInstruction.bind(null, moduleContext),
        []
      );

      let i = 0;
      let j = 0;
      let compareLengths = true;
      while (i < stackConsequent.length && j < stackAlternate.length) {
        if (
          stackConsequent[i] === POLYMORPHIC ||
          stackAlternate[j] === POLYMORPHIC
        ) {
          compareLengths = false;
          break;
        }

        checkTypes(stackConsequent[i], stackAlternate[j], index);
        ++i;
        ++j;
      }

      while (compareLengths && i < stackConsequent.length) {
        if (stackConsequent[i] === POLYMORPHIC) {
          compareLengths = false;
        }
        ++i;
      }

      while (compareLengths && j < stackConsequent.length) {
        if (stackConsequent[j] === POLYMORPHIC) {
          compareLengths = false;
        }
        ++j;
      }

      if (compareLengths && stackConsequent.length !== stackAlternate.length) {
        onError(
          `Type mismatch in if, got ${stackConsequent} and ${stackAlternate}`,
          index
        );
      }

      checkStacks(type.result, stackConsequent);

      moduleContext.popLabel();

      stack = type.result;
    } else {
      if (stack === false) {
        return false;
      }

      let actual;
      for (let i = 0; i < type.args.length; ++i) {
        const argType = type.args[i];

        if (stack[stack.length - 1] === POLYMORPHIC || stopFuncCheck) {
          return false;
        }

        actual = stack.pop();
        checkTypes(argType, actual, index);
      }

      stack = [...stack, ...type.result];
    }

    return stack;
  }

  return {
    getErrors() {
      return errors;
    },

    addError(msg:any) {
      errors.push(msg);
    },

    setStopFuncCheck(state:any) {
      stopFuncCheck = state;
    },

    getStopFuncCheck() {
      return stopFuncCheck;
    },

    setCurrentFuncName(name:any) {
      currentFuncName = name;
    },

    applyInstruction,
    checkStacks,
  };
}

export default function validate(ast:any) {
  if (!ast.body || !ast.body[0] || !ast.body[0].fields) {
    return [];
  }

  // Module context
  const moduleContext = moduleContextFromModuleAST(ast.body[0]);
  const typeChecker = createTypeChecker();

  // Simulate stack types throughout all function bodies

  traverse(ast, {
    Func({ node } : any) {
      typeChecker.setStopFuncCheck(false);
      typeChecker.setCurrentFuncName(node.name.value);

      // resolve signature
      let signature;
      {
        // signature might be a reference to a type
        if (isSignature(node.signature)) {
          signature = node.signature;
        } else {
          assert(isNumberLiteral(node.signature));

          const typeId = node.signature.value;
          assert(moduleContext.hasType(typeId));

          signature = moduleContext.getType(typeId);
        }
      }

      const expectedResult = signature.results;

      moduleContext.newContext(node.name.value, expectedResult);

      // Parameters are local variables
      signature.params.forEach((p:FuncParam) => moduleContext.addLocal(p.valtype));

      const resultingStack = node.body.reduce(
        typeChecker.applyInstruction.bind(null, moduleContext),
        []
      );

      if (typeChecker.getStopFuncCheck()) {
        return typeChecker.getErrors();
      }

      // Compare the two stacks
      typeChecker.checkStacks(expectedResult, resultingStack);
    },
  });

  return typeChecker.getErrors();
}
