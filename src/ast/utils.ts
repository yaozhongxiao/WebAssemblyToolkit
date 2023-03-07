
import { signatures } from "./signatures";
import { traverse } from "./traverse";
import constants from "../module/binary-module";
import { getSectionForNode } from "../module/section";
import { assert } from "../utils/macro/assert";

export function isTypeOf(t: string) {
  return (n: Node) => n.type === t;
}

export function assertTypeOf(t: string) {
  return (n: Node) => assert(n.type === t);
}

export function isAnonymous(ident: Identifier): boolean {
  return ident.raw === "";
}

export function getSectionMetadata(
  ast: Node,
  name: SectionName
): SectionMetadata | undefined {
  let section: SectionMetadata | undefined = undefined;

  traverse(ast, {
    SectionMetadata({ node }: NodePath<SectionMetadata>) {
      if (node.section === name) {
        section = node;
      }
    },
  });

  return section;
}

export function getSectionMetadatas(
  ast: Node,
  name: SectionName
): Array<SectionMetadata> {
  const sections: Array<SectionMetadata> = [];

  traverse(ast, {
    SectionMetadata({ node }: NodePath<SectionMetadata>) {
      if (node.section === name) {
        sections.push(node);
      }
    },
  });

  return sections;
}

export function sortSectionMetadata(m: Module) {
  if (m.metadata == null || m.metadata == undefined) {
    console.warn("sortSectionMetadata: no metadata to sort");
    return;
  }

  m.metadata.sections.sort((a, b) => {
    const aId = constants.sections[a.section];
    const bId = constants.sections[b.section];

    if (typeof aId !== "number" || typeof bId !== "number") {
      throw new Error("Section id not found");
    }

    return aId - bId;
  });
}

export function orderedInsertNode(m: Module, n: Node) {
  assertHasLoc(n);

  let didInsert = false;

  if (n.type === "ModuleExport") {
    m.fields.push(n);
    return;
  }

  m.fields = m.fields.reduce((acc: Array<any>, field) => {
    let fieldEndCol = Infinity;

    if (field.loc != null || field.loc != undefined) {
      // ensures that "field.loc.end!"
      fieldEndCol = field.loc.end!.column;
    }

    // assertHasLoc ensures that
    if (didInsert === false && n.loc!.start.column < fieldEndCol) {
      didInsert = true;
      acc.push(n);
    }

    acc.push(field);

    return acc;
  }, []);

  // Handles empty modules or n is the last element
  if (didInsert === false) {
    m.fields.push(n);
  }
}

export function assertHasLoc(n: Node) {
  if (
    n.loc == null ||
    n.loc.start == null ||
    n.loc.end == null ||
    n.loc == undefined ||
    n.loc.start == undefined ||
    n.loc.end == undefined
  ) {
    throw new Error(
      `Internal failure: node (${JSON.stringify(
        n.type
      )}) has no location information`
    );
  }
}

export function getEndOfSection(s: SectionMetadata): number {
  assertHasLoc(s.size);

  return (
    s.startOffset +
    s.size.value +
    (s.size.loc!.end!.column - s.size.loc!.start.column)
  );
}

export function shiftLoc(node: Node, delta: number) {
  assertHasLoc(node);

  node.loc!.start.column += delta;

  node.loc!.end!.column += delta;
}

export function shiftSection(
  ast: Program,
  node: SectionMetadata,
  delta: number
) {
  if (node.type !== "SectionMetadata") {
    throw new Error("Can not shift node " + JSON.stringify(node.type));
  }

  node.startOffset += delta;

  if (typeof node.size.loc === "object") {
    shiftLoc(node.size, delta);
  }

  // Custom sections doesn't have vectorOfSize
  if (
    typeof node.vectorOfSize === "object" &&
    typeof node.vectorOfSize.loc === "object"
  ) {
    shiftLoc(node.vectorOfSize, delta);
  }

  const sectionName = node.section;

  // shift node locations within that section
  traverse(ast, {
    Node({ node }: any) {
      const section = getSectionForNode(node);

      if (section === sectionName && typeof node.loc === "object") {
        shiftLoc(node, delta);
      }
    },
  });
}

// inputs for Opcode ?
export function signatureForOpcode(object: string, name: string): SignatureMap {
  let opcodeName = name;
  if (object !== undefined && object !== "") {
    opcodeName = object + "." + name;
  }
  const sign = signatures[opcodeName];
  if (sign == undefined) {
    // TODO: Uncomment this when br_table and others has been done
    throw new Error("Invalid opcode: " + opcodeName);
    return [object, object];
  }

  return sign[0];
}

export function getUniqueNameGenerator(): (param: string) => string {
  const inc = {};
  return function (prefix: string = "temp"): string {
    if (!(prefix in inc)) {
      inc[prefix] = 0;
    } else {
      inc[prefix] = inc[prefix] + 1;
    }
    return prefix + "_" + inc[prefix];
  };
}

export function getStartByteOffset(n: Node): number {
  if (typeof n.loc === "undefined" || typeof n.loc.start === "undefined") {
    throw new Error(
      "Can not get byte offset without loc informations, node: " + String(n.type)
    );
  }

  return n.loc.start.column;
}

export function getEndByteOffset(n: Node): number {
  if (typeof n.loc === "undefined" || typeof n.loc.end === "undefined") {
    throw new Error(
      "Can not get byte offset without loc informations, node: " + n.type
    );
  }

  return n.loc.end.column;
}

export function getFunctionBeginingByteOffset(n: Func): number {
  assert(n.body.length > 0);

  const [firstInstruction] = n.body;

  return getStartByteOffset(firstInstruction);
}

export function getEndBlockByteOffset(n: Block): number {
  assert(
    (n.type !== "Func" && n.instr.length > 0) ||
      (n.type === "Func" && n.body.length > 0)
  );

  let lastInstruction;

  if (n.type !== "Func" && n.instr) {
    lastInstruction = n.instr[n.instr.length - 1];
  }

  if (n.type === "Func" && n.body) {
    lastInstruction = n.body[n.body.length - 1];
  }

  assert(typeof lastInstruction === "object");

  return getStartByteOffset(lastInstruction as Node);
}

export function getStartBlockByteOffset(n: Block): number {
  assert(
    (n.type !== "Func" && n.instr.length > 0) ||
      (n.type === "Func" && n.body.length > 0)
  );

  let fistInstruction;

  if (n.type !== "Func" && n.instr) {
    [fistInstruction] = n.instr;
  }

  if (n.type === "Func" && n.body) {
    [fistInstruction] = n.body;
  }

  assert(typeof fistInstruction === "object");

  return getStartByteOffset(fistInstruction as Node);
}
