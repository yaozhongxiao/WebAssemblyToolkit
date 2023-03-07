// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

type SectionName =
| "custom"
| "type"
| "import"
| "func"
| "table"
| "memory"
| "global"
| "export"
| "start"
| "element"
| "code"
| "data"
| "unknown";

type ValRef = "externref" | "funcref"

// webassembly types
type Valtype = "i32" | "i64" | "f32" | "f64" | "u32" | "label";

type Mutability = "const" | "var";

// function

// export
type ExportDescrType = "Func" | "Table" | "Memory" | "Global";

// table
type TableElementType = "anyfunc"; // -> "funcref" | "externref"

// module definition
type WasmModule = {
  Magic: uint32,
  Version: uint32,
  TypeSec: Array<TypeInstruction>,
  ImportSec: Array<ModuleImport>,
  FuncSec: Array<Func>,
  TableSec: Array<Table>,
  MemSec: Array<Memory>,
  GlobalSec: Array<Global>,
  ExportSec: Array<ModuleExport>,
  StartFunc: Funcidx,
  ElemSec: Array<Elem>,
  CodeSec: Array<Array<Instruction>>,
  DataSec: Array<Data>
}