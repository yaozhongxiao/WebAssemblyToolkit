// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

export function getSectionForNode(n: Node): SectionName {
  switch (n.type) {
    case "ModuleImport":
      return "import";

    case "CallInstruction":
    case "CallIndirectInstruction":
    case "Func":
    case "Instr":
      return "code";

    case "ModuleExport":
      return "export";

    case "Start":
      return "start";

    case "TypeInstruction":
      return "type";

    case "IndexInFuncSection":
      return "func";

    case "Global":
      return "global";

    // No section
    default:
      return "unknown";
  }
}
