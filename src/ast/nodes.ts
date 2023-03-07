
import {assert} from "../utils/macro/assert"
import { isTypeOf, assertTypeOf} from "./utils"

export *  from "./utils"

// function isTypeOf(t: string) {
//   return (n: Node) => n.type === t;
// }
// export function assertTypeOf(t: string) {
//   return (n: Node) => assert(n.type === t);
// }

export function module(
  id: string | undefined,
  fields: Array<Node>,
  metadata?: ModuleMetadata
): Module {
  if (id !== null && id !== undefined) {
    assert(
      typeof id === "string",
      "Argument id must be of type string, given: " + typeof id
    );
  }

  assert(typeof fields === "object" && typeof fields.length !== "undefined");

  const node: Module = {
    type: "Module",
    id,
    fields,
  };

  if (typeof metadata !== "undefined") {
    node.metadata = metadata;
  }

  return node;
}

export function moduleMetadata(
  sections: Array<SectionMetadata>,
  functionNames?: Array<FunctionNameMetadata>,
  localNames?: Array<LocalNameMetadata>,
  producers?: Array<ProducersSectionMetadata>
): ModuleMetadata {
  assert(
    typeof sections === "object" && typeof sections.length !== "undefined"
  );

  if (functionNames !== null && functionNames !== undefined) {
    assert(
      typeof functionNames === "object" &&
        typeof functionNames.length !== "undefined"
    );
  }

  if (localNames !== null && localNames !== undefined) {
    assert(
      typeof localNames === "object" && typeof localNames.length !== "undefined"
    );
  }

  if (producers !== null && producers !== undefined) {
    assert(
      typeof producers === "object" && typeof producers.length !== "undefined"
    );
  }

  const node: ModuleMetadata = {
    type: "ModuleMetadata",
    sections,
  };

  if (typeof functionNames !== "undefined" && functionNames.length > 0) {
    node.functionNames = functionNames;
  }

  if (typeof localNames !== "undefined" && localNames.length > 0) {
    node.localNames = localNames;
  }

  if (typeof producers !== "undefined" && producers.length > 0) {
    node.producers = producers;
  }

  return node;
}

export function moduleNameMetadata(value: string): ModuleNameMetadata {
  assert(
    typeof value === "string",
    "Argument value must be of type string, given: " + typeof value
  );

  const node: ModuleNameMetadata = {
    type: "ModuleNameMetadata",
    value,
  };

  return node;
}

export function functionNameMetadata(
  value: string,
  index: number
): FunctionNameMetadata {
  assert(
    typeof value === "string",
    "Argument value must be of type string, given: " + typeof value
  );
  assert(
    typeof index === "number",
    "Argument index must be of type number, given: " + typeof index
  );

  const node: FunctionNameMetadata = {
    type: "FunctionNameMetadata",
    value,
    index,
  };

  return node;
}

export function localNameMetadata(
  value: string,
  localIndex: number,
  functionIndex: number
): LocalNameMetadata {
  assert(
    typeof value === "string",
    "Argument value must be of type string, given: " + typeof value
  );
  assert(
    typeof localIndex === "number",
    "Argument localIndex must be of type number, given: " + typeof localIndex
  );
  assert(
    typeof functionIndex === "number",
    "Argument functionIndex must be of type number, given: " +
      typeof functionIndex
  );

  const node: LocalNameMetadata = {
    type: "LocalNameMetadata",
    value,
    localIndex,
    functionIndex,
  };

  return node;
}

export function binaryModule(id: string | undefined, blob: Array<string>): BinaryModule {
  if (id !== null && id !== undefined) {
    assert(
      typeof id === "string",
      "Argument id must be of type string, given: " + typeof id
    );
  }

  assert(typeof blob === "object" && typeof blob.length !== "undefined");

  const node: BinaryModule = {
    type: "BinaryModule",
    id,
    blob,
  };

  return node;
}

export function quoteModule(id: string | undefined, string: Array<string>): QuoteModule {
  if (id !== null && id !== undefined) {
    assert(
      typeof id === "string",
      "Argument id must be of type string, given: " + typeof id
    );
  }

  assert(typeof string === "object" && typeof string.length !== "undefined");

  const node: QuoteModule = {
    type: "QuoteModule",
    id,
    string,
  };

  return node;
}

export function sectionMetadata(
  section: SectionName,
  startOffset: number,
  size: NumberLiteral,
  vectorOfSize: NumberLiteral
): SectionMetadata {
  assert(
    typeof startOffset === "number",
    "Argument startOffset must be of type number, given: " + typeof startOffset
  );

  const node: SectionMetadata = {
    type: "SectionMetadata",
    section,
    startOffset,
    size,
    vectorOfSize,
  };

  return node;
}

export function producersSectionMetadata(
  producers: Array<ProducerMetadata>
): ProducersSectionMetadata {
  assert(
    typeof producers === "object" && typeof producers.length !== "undefined"
  );

  const node: ProducersSectionMetadata = {
    type: "ProducersSectionMetadata",
    producers,
  };

  return node;
}

export function producerMetadata(
  language: Array<ProducerMetadataVersionedName>,
  processedBy: Array<ProducerMetadataVersionedName>,
  sdk: Array<ProducerMetadataVersionedName>
): ProducerMetadata {
  assert(
    typeof language === "object" && typeof language.length !== "undefined"
  );

  assert(
    typeof processedBy === "object" && typeof processedBy.length !== "undefined"
  );

  assert(typeof sdk === "object" && typeof sdk.length !== "undefined");

  const node: ProducerMetadata = {
    type: "ProducerMetadata",
    language,
    processedBy,
    sdk,
  };

  return node;
}

export function producerMetadataVersionedName(
  name: string,
  version: string
): ProducerMetadataVersionedName {
  assert(
    typeof name === "string",
    "Argument name must be of type string, given: " + typeof name
  );
  assert(
    typeof version === "string",
    "Argument version must be of type string, given: " + typeof version
  );

  const node: ProducerMetadataVersionedName = {
    type: "ProducerMetadataVersionedName",
    name,
    version,
  };

  return node;
}

export function loopInstruction(
  label: Identifier | undefined,
  resulttype: Valtype | undefined,
  instr: Array<Instruction>
): LoopInstruction {
  assert(typeof instr === "object" && typeof instr.length !== "undefined");

  const node: LoopInstruction = {
    type: "LoopInstruction",
    id: "loop",
    label,
    resulttype,
    instr,
  };

  return node;
}

export function instr(
  id: string,
  object: Valtype | undefined,
  args: Array<Expression>,
  namedArgs?: Object
): Instr {
  assert(
    typeof id === "string",
    "Argument id must be of type string, given: " + typeof id
  );

  assert(typeof args === "object" && typeof args.length !== "undefined");

  const node: Instr = {
    type: "Instr",
    id,
    args,
  };

  if (typeof object !== "undefined") {
    node.object = object;
  }

  if (typeof namedArgs !== "undefined" && Object.keys(namedArgs).length !== 0) {
    node.namedArgs = namedArgs;
  }

  return node;
}

export function ifInstruction(
  testLabel: Identifier,
  test: Array<Instruction>,
  result: Valtype | undefined,
  consequent: Array<Instruction>,
  alternate: Array<Instruction>
): IfInstruction {
  assert(typeof test === "object" && typeof test.length !== "undefined");

  assert(
    typeof consequent === "object" && typeof consequent.length !== "undefined"
  );

  assert(
    typeof alternate === "object" && typeof alternate.length !== "undefined"
  );

  const node: IfInstruction = {
    type: "IfInstruction",
    id: "if",
    testLabel,
    test,
    result,
    consequent,
    alternate,
  };

  return node;
}

export function stringLiteral(value: string): StringLiteral {
  assert(
    typeof value === "string",
    "Argument value must be of type string, given: " + typeof value
  );

  const node: StringLiteral = {
    type: "StringLiteral",
    value,
  };

  return node;
}

export function numberLiteral(value: number, raw: string): NumberLiteral {
  assert(
    typeof value === "number",
    "Argument value must be of type number, given: " + typeof value
  );
  assert(
    typeof raw === "string",
    "Argument raw must be of type string, given: " + typeof raw
  );

  const node: NumberLiteral = {
    type: "NumberLiteral",
    value,
    raw,
  };

  return node;
}

export function longNumberLiteral(
  value: LongNumber,
  raw?: string
): LongNumberLiteral {
  assert(
    typeof raw === "string",
    "Argument raw must be of type string, given: " + typeof raw
  );

  const node: LongNumberLiteral = {
    type: "LongNumberLiteral",
    value,
    raw,
  };

  return node;
}

export function floatLiteral(
  value: number,
  nan?: boolean,
  inf?: boolean,
  raw?: string,
): FloatLiteral {
  assert(
    typeof value === "number",
    "Argument value must be of type number, given: " + typeof value
  );

  if (nan !== null && nan !== undefined) {
    assert(
      typeof nan === "boolean",
      "Argument nan must be of type boolean, given: " + typeof nan
    );
  }

  if (inf !== null && inf !== undefined) {
    assert(
      typeof inf === "boolean",
      "Argument inf must be of type boolean, given: " + typeof inf
    );
  }

  assert(
    typeof raw === "string",
    "Argument raw must be of type string, given: " + typeof raw
  );

  const node: FloatLiteral = {
    type: "FloatLiteral",
    value,
    raw,
  };

  if (nan === true) {
    node.nan = true;
  }

  if (inf === true) {
    node.inf = true;
  }

  return node;
}

export function elem(
  table: Index,
  offset: Array<Instruction>,
  funcs: Array<Index>
): Elem {
  assert(typeof offset === "object" && typeof offset.length !== "undefined");

  assert(typeof funcs === "object" && typeof funcs.length !== "undefined");

  const node: Elem = {
    type: "Elem",
    table,
    offset,
    funcs,
  };

  return node;
}

export function indexInFuncSection(index: Index): IndexInFuncSection {
  const node: IndexInFuncSection = {
    type: "IndexInFuncSection",
    index,
  };

  return node;
}

export function valtypeLiteral(name: Valtype): ValtypeLiteral {
  const node: ValtypeLiteral = {
    type: "ValtypeLiteral",
    name,
  };

  return node;
}

export function typeInstruction(
  id: Index | undefined,
  functype: Signature
): TypeInstruction {
  const node: TypeInstruction = {
    type: "TypeInstruction",
    id,
    functype,
  };

  return node;
}

export function start(index: Index): Start {
  const node: Start = {
    type: "Start",
    index,
  };

  return node;
}

export function globalType(
  valtype: Valtype,
  mutability: Mutability
): GlobalType {
  const node: GlobalType = {
    type: "GlobalType",
    valtype,
    mutability,
  };

  return node;
}

export function leadingComment(value: string): LeadingComment {
  assert(
    typeof value === "string",
    "Argument value must be of type string, given: " + typeof value
  );

  const node: LeadingComment = {
    type: "LeadingComment",
    value,
  };

  return node;
}

export function blockComment(value: string): BlockComment {
  assert(
    typeof value === "string",
    "Argument value must be of type string, given: " + typeof value
  );

  const node: BlockComment = {
    type: "BlockComment",
    value,
  };

  return node;
}

export function data(
  memoryIndex: Memidx,
  offset: Instruction,
  init: ByteArray
): Data {
  const node: Data = {
    type: "Data",
    memoryIndex,
    offset,
    init,
  };

  return node;
}

export function global(
  globalType: GlobalType,
  init: Array<Instruction>,
  name: Identifier | undefined
): Global {
  assert(typeof init === "object" && typeof init.length !== "undefined");

  const node: Global = {
    type: "Global",
    globalType,
    init,
    name,
  };

  return node;
}

export function table(
  elementType: TableElementType,
  limits: Limit,
  name: Identifier | undefined,
  elements?: Array<Index>
): Table {
  assert(
    limits.type === "Limit",
    "Argument limits must be of type Limit, given: " + limits.type
  );

  if (elements !== null && elements !== undefined) {
    assert(
      typeof elements === "object" && typeof elements.length !== "undefined"
    );
  }

  const node: Table = {
    type: "Table",
    elementType,
    limits,
    name,
  };

  if (typeof elements !== "undefined" && elements.length > 0) {
    node.elements = elements;
  }

  return node;
}

export function memory(limits: Limit, id: Index | undefined): Memory {
  const node: Memory = {
    type: "Memory",
    limits,
    id,
  };

  return node;
}

export function funcImportDescr(
  id: Identifier,
  signature: Signature,
  isExternal: boolean
): FuncImportDescr {
  const node: FuncImportDescr = {
    type: "FuncImportDescr",
    id,
    signature,
    isExternal
  };

  return node;
}

export function moduleImport(
  module: string,
  name: string,
  descr: ImportDescr
): ModuleImport {
  assert(
    typeof module === "string",
    "Argument module must be of type string, given: " + typeof module
  );
  assert(
    typeof name === "string",
    "Argument name must be of type string, given: " + typeof name
  );

  const node: ModuleImport = {
    type: "ModuleImport",
    module,
    name,
    descr,
  };

  return node;
}

export function moduleExportDescr(
  exportType: ExportDescrType,
  id: Index
): ModuleExportDescr {
  const node: ModuleExportDescr = {
    type: "ModuleExportDescr",
    exportType,
    id,
  };

  return node;
}

export function moduleExport(
  name: string,
  descr: ModuleExportDescr
): ModuleExport {
  assert(
    typeof name === "string",
    "Argument name must be of type string, given: " + typeof name
  );

  const node: ModuleExport = {
    type: "ModuleExport",
    name,
    descr,
  };

  return node;
}

export function limit(min: number, max?: number, shared?: boolean): Limit {
  assert(
    typeof min === "number",
    "Argument min must be of type number, given: " + typeof min
  );

  if (max !== null && max !== undefined) {
    assert(
      typeof max === "number",
      "Argument max must be of type number, given: " + typeof max
    );
  }

  if (shared !== null && shared !== undefined) {
    assert(
      typeof shared === "boolean",
      "Argument shared must be of type boolean, given: " + typeof shared
    );
  }

  const node: Limit = {
    type: "Limit",
    min,
  };

  if (typeof max !== "undefined") {
    node.max = max;
  }

  if (shared === true) {
    node.shared = true;
  }

  return node;
}

export function signature(
  params: Array<FuncParam>,
  results: Array<Valtype>
): Signature {
  assert(typeof params === "object" && typeof params.length !== "undefined");

  assert(typeof results === "object" && typeof results.length !== "undefined");

  const node: Signature = {
    type: "Signature",
    params,
    results,
  };

  return node;
}

export function program(body: Array<Module>): Program {
  assert(typeof body === "object" && typeof body.length !== "undefined");

  const node: Program = {
    type: "Program",
    body,
  };

  return node;
}

export function identifier(value: string, raw?: string): Identifier {
  assert(
    typeof value === "string",
    "Argument value must be of type string, given: " + typeof value
  );

  if (raw !== null && raw !== undefined) {
    assert(
      typeof raw === "string",
      "Argument raw must be of type string, given: " + typeof raw
    );
  }

  const node: Identifier = {
    type: "Identifier",
    value,
  };

  if (typeof raw !== "undefined") {
    node.raw = raw;
  }

  return node;
}

export function blockInstruction(
  label: Identifier | undefined,
  instr: Array<Instruction>,
  result: Valtype | undefined
): BlockInstruction {
  assert(typeof instr === "object" && typeof instr.length !== "undefined");

  const node: BlockInstruction = {
    type: "BlockInstruction",
    id: "block",
    label,
    instr,
    result,
  };

  return node;
}

export function callInstruction(
  index: Index,
  instrArgs?: Array<Expression>,
  numeric?: Index
): CallInstruction {
  if (instrArgs !== null && instrArgs !== undefined) {
    assert(
      typeof instrArgs === "object" && typeof instrArgs.length !== "undefined"
    );
  }

  const node: CallInstruction = {
    type: "CallInstruction",
    id: "call",
    index,
  };

  if (typeof instrArgs !== "undefined" && instrArgs.length > 0) {
    node.instrArgs = instrArgs;
  }

  if (typeof numeric !== "undefined") {
    node.numeric = numeric;
  }

  return node;
}

export function callIndirectInstruction(
  signature: SignatureOrTypeRef,
  intrs?: Array<Expression>
): CallIndirectInstruction {
  if (intrs !== null && intrs !== undefined) {
    assert(typeof intrs === "object" && typeof intrs.length !== "undefined");
  }

  const node: CallIndirectInstruction = {
    type: "CallIndirectInstruction",
    id: "call_indirect",
    signature,
  };

  if (typeof intrs !== "undefined" && intrs.length > 0) {
    node.intrs = intrs;
  }

  return node;
}

export function byteArray(values: Array<Byte>): ByteArray {
  assert(typeof values === "object" && typeof values.length !== "undefined");

  const node: ByteArray = {
    type: "ByteArray",
    values,
  };

  return node;
}

export function func(
  name: Index,
  signature: SignatureOrTypeRef,
  body: Array<Instruction>,
  isExternal: boolean,
  metadata?: FuncMetadata
): Func {
  assert(typeof body === "object" && typeof body.length !== "undefined");

  if (isExternal !== null && isExternal !== undefined) {
    assert(
      typeof isExternal === "boolean",
      "Argument isExternal must be of type boolean, given: " + typeof isExternal
    );
  }

  const node: Func = {
    type: "Func",
    name,
    signature,
    body,
    isExternal
  };

  if (isExternal === true) {
    node.isExternal = true;
  }

  if (typeof metadata !== "undefined") {
    node.metadata = metadata;
  }

  return node;
}

export function internalBrUnless(target: number): InternalBrUnless {
  assert(
    typeof target === "number",
    "Argument target must be of type number, given: " + typeof target
  );

  const node: InternalBrUnless = {
    type: "InternalBrUnless",
    target,
  };

  return node;
}

export function internalGoto(target: number): InternalGoto {
  assert(
    typeof target === "number",
    "Argument target must be of type number, given: " + typeof target
  );

  const node: InternalGoto = {
    type: "InternalGoto",
    target,
  };

  return node;
}

export function internalCallExtern(target: number): InternalCallExtern {
  assert(
    typeof target === "number",
    "Argument target must be of type number, given: " + typeof target
  );

  const node: InternalCallExtern = {
    type: "InternalCallExtern",
    target,
  };

  return node;
}

export function internalEndAndReturn(): InternalEndAndReturn {
  const node: InternalEndAndReturn = {
    type: "InternalEndAndReturn",
  };

  return node;
}

export const isModule: (n: Node) => boolean = isTypeOf("Module");

export const isModuleMetadata: (n: Node) => boolean =
  isTypeOf("ModuleMetadata");

export const isModuleNameMetadata: (n: Node) => boolean =
  isTypeOf("ModuleNameMetadata");

export const isFunctionNameMetadata: (n: Node) => boolean = isTypeOf(
  "FunctionNameMetadata"
);

export const isLocalNameMetadata: (n: Node) => boolean =
  isTypeOf("LocalNameMetadata");

export const isBinaryModule: (n: Node) => boolean = isTypeOf("BinaryModule");

export const isQuoteModule: (n: Node) => boolean = isTypeOf("QuoteModule");

export const isSectionMetadata: (n: Node) => boolean =
  isTypeOf("SectionMetadata");

export const isProducersSectionMetadata: (n: Node) => boolean = isTypeOf(
  "ProducersSectionMetadata"
);

export const isProducerMetadata: (n: Node) => boolean =
  isTypeOf("ProducerMetadata");

export const isProducerMetadataVersionedName: (n: Node) => boolean = isTypeOf(
  "ProducerMetadataVersionedName"
);

export const isLoopInstruction: (n: Node) => boolean =
  isTypeOf("LoopInstruction");

export const isInstr: (n: Node) => boolean = isTypeOf("Instr");

export const isIfInstruction: (n: Node) => boolean = isTypeOf("IfInstruction");

export const isStringLiteral: (n: Node) => boolean = isTypeOf("StringLiteral");

export const isNumberLiteral: (n: Node) => boolean = isTypeOf("NumberLiteral");

export const isLongNumberLiteral: (n: Node) => boolean =
  isTypeOf("LongNumberLiteral");

export const isFloatLiteral: (n: Node) => boolean = isTypeOf("FloatLiteral");

export const isElem: (n: Node) => boolean = isTypeOf("Elem");

export const isIndexInFuncSection: (n: Node) => boolean =
  isTypeOf("IndexInFuncSection");

export const isValtypeLiteral: (n: Node) => boolean =
  isTypeOf("ValtypeLiteral");

export const isTypeInstruction: (n: Node) => boolean =
  isTypeOf("TypeInstruction");

export const isStart: (n: Node) => boolean = isTypeOf("Start");

export const isGlobalType: (n: Node) => boolean = isTypeOf("GlobalType");

export const isLeadingComment: (n: Node) => boolean =
  isTypeOf("LeadingComment");

export const isBlockComment: (n: Node) => boolean = isTypeOf("BlockComment");

export const isData: (n: Node) => boolean = isTypeOf("Data");

export const isGlobal: (n: Node) => boolean = isTypeOf("Global");

export const isTable: (n: Node) => boolean = isTypeOf("Table");

export const isMemory: (n: Node) => boolean = isTypeOf("Memory");

export const isFuncImportDescr: (n: Node) => boolean =
  isTypeOf("FuncImportDescr");

export const isModuleImport: (n: Node) => boolean = isTypeOf("ModuleImport");

export const isModuleExportDescr: (n: Node) => boolean =
  isTypeOf("ModuleExportDescr");

export const isModuleExport: (n: Node) => boolean = isTypeOf("ModuleExport");

export const isLimit: (n: Node) => boolean = isTypeOf("Limit");

export const isSignature: (n: Node) => boolean = isTypeOf("Signature");

export const isProgram: (n: Node) => boolean = isTypeOf("Program");

export const isIdentifier: (n: Node) => boolean = isTypeOf("Identifier");

export const isBlockInstruction: (n: Node) => boolean =
  isTypeOf("BlockInstruction");

export const isCallInstruction: (n: Node) => boolean =
  isTypeOf("CallInstruction");

export const isCallIndirectInstruction: (n: Node) => boolean = isTypeOf(
  "CallIndirectInstruction"
);

export const isByteArray: (n: Node) => boolean = isTypeOf("ByteArray");

export const isFunc: (n: Node) => boolean = isTypeOf("Func");

export const isInternalBrUnless: (n: Node) => boolean =
  isTypeOf("InternalBrUnless");

export const isInternalGoto: (n: Node) => boolean = isTypeOf("InternalGoto");

export const isInternalCallExtern: (n: Node) => boolean =
  isTypeOf("InternalCallExtern");

export const isInternalEndAndReturn: (n: Node) => boolean = isTypeOf(
  "InternalEndAndReturn"
);

export const isNode = (node: Node): boolean =>
  isModule(node) ||
  isModuleMetadata(node) ||
  isModuleNameMetadata(node) ||
  isFunctionNameMetadata(node) ||
  isLocalNameMetadata(node) ||
  isBinaryModule(node) ||
  isQuoteModule(node) ||
  isSectionMetadata(node) ||
  isProducersSectionMetadata(node) ||
  isProducerMetadata(node) ||
  isProducerMetadataVersionedName(node) ||
  isLoopInstruction(node) ||
  isInstr(node) ||
  isIfInstruction(node) ||
  isStringLiteral(node) ||
  isNumberLiteral(node) ||
  isLongNumberLiteral(node) ||
  isFloatLiteral(node) ||
  isElem(node) ||
  isIndexInFuncSection(node) ||
  isValtypeLiteral(node) ||
  isTypeInstruction(node) ||
  isStart(node) ||
  isGlobalType(node) ||
  isLeadingComment(node) ||
  isBlockComment(node) ||
  isData(node) ||
  isGlobal(node) ||
  isTable(node) ||
  isMemory(node) ||
  isFuncImportDescr(node) ||
  isModuleImport(node) ||
  isModuleExportDescr(node) ||
  isModuleExport(node) ||
  isLimit(node) ||
  isSignature(node) ||
  isProgram(node) ||
  isIdentifier(node) ||
  isBlockInstruction(node) ||
  isCallInstruction(node) ||
  isCallIndirectInstruction(node) ||
  isByteArray(node) ||
  isFunc(node) ||
  isInternalBrUnless(node) ||
  isInternalGoto(node) ||
  isInternalCallExtern(node) ||
  isInternalEndAndReturn(node);

export const isBlock = (node: Node): boolean =>
  isLoopInstruction(node) || isBlockInstruction(node) || isFunc(node);

export const isInstruction = (node: Node): boolean =>
  isLoopInstruction(node) ||
  isInstr(node) ||
  isIfInstruction(node) ||
  isTypeInstruction(node) ||
  isBlockInstruction(node) ||
  isCallInstruction(node) ||
  isCallIndirectInstruction(node);

export const isExpression = (node: Node): boolean =>
  isInstr(node) ||
  isStringLiteral(node) ||
  isNumberLiteral(node) ||
  isLongNumberLiteral(node) ||
  isFloatLiteral(node) ||
  isValtypeLiteral(node) ||
  isIdentifier(node);

export const isNumericLiteral = (node: Node): boolean =>
  isNumberLiteral(node) || isLongNumberLiteral(node) || isFloatLiteral(node);

export const isImportDescr = (node: Node): boolean =>
  isGlobalType(node) ||
  isTable(node) ||
  isMemory(node) ||
  isFuncImportDescr(node);

export const isIntrinsic = (node: Node): boolean =>
  isInternalBrUnless(node) ||
  isInternalGoto(node) ||
  isInternalCallExtern(node) ||
  isInternalEndAndReturn(node);

export const assertModule: (n: Node) => void = assertTypeOf("Module");

export const assertModuleMetadata: (n: Node) => void =
  assertTypeOf("ModuleMetadata");

export const assertModuleNameMetadata: (n: Node) => void =
  assertTypeOf("ModuleNameMetadata");

export const assertFunctionNameMetadata: (n: Node) => void = assertTypeOf(
  "FunctionNameMetadata"
);

export const assertLocalNameMetadata: (n: Node) => void =
  assertTypeOf("LocalNameMetadata");

export const assertBinaryModule: (n: Node) => void =
  assertTypeOf("BinaryModule");

export const assertQuoteModule: (n: Node) => void = assertTypeOf("QuoteModule");

export const assertSectionMetadata: (n: Node) => void =
  assertTypeOf("SectionMetadata");

export const assertProducersSectionMetadata: (n: Node) => void = assertTypeOf(
  "ProducersSectionMetadata"
);

export const assertProducerMetadata: (n: Node) => void =
  assertTypeOf("ProducerMetadata");

export const assertProducerMetadataVersionedName: (n: Node) => void =
  assertTypeOf("ProducerMetadataVersionedName");

export const assertLoopInstruction: (n: Node) => void =
  assertTypeOf("LoopInstruction");

export const assertInstr: (n: Node) => void = assertTypeOf("Instr");

export const assertIfInstruction: (n: Node) => void =
  assertTypeOf("IfInstruction");

export const assertStringLiteral: (n: Node) => void =
  assertTypeOf("StringLiteral");

export const assertNumberLiteral: (n: Node) => void =
  assertTypeOf("NumberLiteral");

export const assertLongNumberLiteral: (n: Node) => void =
  assertTypeOf("LongNumberLiteral");

export const assertFloatLiteral: (n: Node) => void =
  assertTypeOf("FloatLiteral");

export const assertElem: (n: Node) => void = assertTypeOf("Elem");

export const assertIndexInFuncSection: (n: Node) => void =
  assertTypeOf("IndexInFuncSection");

export const assertValtypeLiteral: (n: Node) => void =
  assertTypeOf("ValtypeLiteral");

export const assertTypeInstruction: (n: Node) => void =
  assertTypeOf("TypeInstruction");

export const assertStart: (n: Node) => void = assertTypeOf("Start");

export const assertGlobalType: (n: Node) => void = assertTypeOf("GlobalType");

export const assertLeadingComment: (n: Node) => void =
  assertTypeOf("LeadingComment");

export const assertBlockComment: (n: Node) => void =
  assertTypeOf("BlockComment");

export const assertData: (n: Node) => void = assertTypeOf("Data");

export const assertGlobal: (n: Node) => void = assertTypeOf("Global");

export const assertTable: (n: Node) => void = assertTypeOf("Table");

export const assertMemory: (n: Node) => void = assertTypeOf("Memory");

export const assertFuncImportDescr: (n: Node) => void =
  assertTypeOf("FuncImportDescr");

export const assertModuleImport: (n: Node) => void =
  assertTypeOf("ModuleImport");

export const assertModuleExportDescr: (n: Node) => void =
  assertTypeOf("ModuleExportDescr");

export const assertModuleExport: (n: Node) => void =
  assertTypeOf("ModuleExport");

export const assertLimit: (n: Node) => void = assertTypeOf("Limit");

export const assertSignature: (n: Node) => void = assertTypeOf("Signature");

export const assertProgram: (n: Node) => void = assertTypeOf("Program");

export const assertIdentifier: (n: Node) => void = assertTypeOf("Identifier");

export const assertBlockInstruction: (n: Node) => void =
  assertTypeOf("BlockInstruction");

export const assertCallInstruction: (n: Node) => void =
  assertTypeOf("CallInstruction");

export const assertCallIndirectInstruction: (n: Node) => void = assertTypeOf(
  "CallIndirectInstruction"
);

export const assertByteArray: (n: Node) => void = assertTypeOf("ByteArray");

export const assertFunc: (n: Node) => void = assertTypeOf("Func");

export const assertInternalBrUnless: (n: Node) => void =
  assertTypeOf("InternalBrUnless");

export const assertInternalGoto: (n: Node) => void =
  assertTypeOf("InternalGoto");

export const assertInternalCallExtern: (n: Node) => void =
  assertTypeOf("InternalCallExtern");

export const assertInternalEndAndReturn: (n: Node) => void = assertTypeOf(
  "InternalEndAndReturn"
);

export const unionTypesMap = {
  Module: ["Node"],
  ModuleMetadata: ["Node"],
  ModuleNameMetadata: ["Node"],
  FunctionNameMetadata: ["Node"],
  LocalNameMetadata: ["Node"],
  BinaryModule: ["Node"],
  QuoteModule: ["Node"],
  SectionMetadata: ["Node"],
  ProducersSectionMetadata: ["Node"],
  ProducerMetadata: ["Node"],
  ProducerMetadataVersionedName: ["Node"],
  LoopInstruction: ["Node", "Block", "Instruction"],
  Instr: ["Node", "Expression", "Instruction"],
  IfInstruction: ["Node", "Instruction"],
  StringLiteral: ["Node", "Expression"],
  NumberLiteral: ["Node", "NumericLiteral", "Expression"],
  LongNumberLiteral: ["Node", "NumericLiteral", "Expression"],
  FloatLiteral: ["Node", "NumericLiteral", "Expression"],
  Elem: ["Node"],
  IndexInFuncSection: ["Node"],
  ValtypeLiteral: ["Node", "Expression"],
  TypeInstruction: ["Node", "Instruction"],
  Start: ["Node"],
  GlobalType: ["Node", "ImportDescr"],
  LeadingComment: ["Node"],
  BlockComment: ["Node"],
  Data: ["Node"],
  Global: ["Node"],
  Table: ["Node", "ImportDescr"],
  Memory: ["Node", "ImportDescr"],
  FuncImportDescr: ["Node", "ImportDescr"],
  ModuleImport: ["Node"],
  ModuleExportDescr: ["Node"],
  ModuleExport: ["Node"],
  Limit: ["Node"],
  Signature: ["Node"],
  Program: ["Node"],
  Identifier: ["Node", "Expression"],
  BlockInstruction: ["Node", "Block", "Instruction"],
  CallInstruction: ["Node", "Instruction"],
  CallIndirectInstruction: ["Node", "Instruction"],
  ByteArray: ["Node"],
  Func: ["Node", "Block"],
  InternalBrUnless: ["Node", "Intrinsic"],
  InternalGoto: ["Node", "Intrinsic"],
  InternalCallExtern: ["Node", "Intrinsic"],
  InternalEndAndReturn: ["Node", "Intrinsic"],
};

export const nodeAndUnionTypes = [
  "Module",
  "ModuleMetadata",
  "ModuleNameMetadata",
  "FunctionNameMetadata",
  "LocalNameMetadata",
  "BinaryModule",
  "QuoteModule",
  "SectionMetadata",
  "ProducersSectionMetadata",
  "ProducerMetadata",
  "ProducerMetadataVersionedName",
  "LoopInstruction",
  "Instr",
  "IfInstruction",
  "StringLiteral",
  "NumberLiteral",
  "LongNumberLiteral",
  "FloatLiteral",
  "Elem",
  "IndexInFuncSection",
  "ValtypeLiteral",
  "TypeInstruction",
  "Start",
  "GlobalType",
  "LeadingComment",
  "BlockComment",
  "Data",
  "Global",
  "Table",
  "Memory",
  "FuncImportDescr",
  "ModuleImport",
  "ModuleExportDescr",
  "ModuleExport",
  "Limit",
  "Signature",
  "Program",
  "Identifier",
  "BlockInstruction",
  "CallInstruction",
  "CallIndirectInstruction",
  "ByteArray",
  "Func",
  "InternalBrUnless",
  "InternalGoto",
  "InternalCallExtern",
  "InternalEndAndReturn",
  "Node",
  "Block",
  "Instruction",
  "Expression",
  "NumericLiteral",
  "ImportDescr",
  "Intrinsic",
];
