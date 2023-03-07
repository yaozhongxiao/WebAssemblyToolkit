// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

/* eslint no-unused-vars: off */

type Byte = number;

type VariableLengthValue = {
  value: number,
  nextIndex: number,
  inf?: boolean,
  nan?: boolean,
};

interface Type {
  value: number;
  nextIndex: number;
}

type Decoded32 = VariableLengthValue;
type Decoded64 = {
  value: LongNumber,
  nextIndex: number,
};
type DecodedF32 = VariableLengthValue;
type DecodedF64 = VariableLengthValue;

type DecodedUTF8String = {
  value: string,
  nextIndex: number,
};

type DecodedSymbol = {
  name: string,
  object?: Valtype,
  numberOfArgs: number,
};

/**
 * Data structures used in decoder's state
 */
type FuncSig = {
  params: Array<FuncParam>,
  result: Array<Valtype>,
};

type FuncType = {
  id: Identifier,
  signature: FuncSig,
  isExternal: boolean,
};

type DecodedElementInExportSection = {
  name: string,
  type: ModuleExportDescr,
  signature?: FuncSig,
  id: Index,
  index: number,

  startLoc: Position,
  endLoc: Position,
};

type FuncBody = {
  code: Array<Instruction>,
  locals: Array<Valtype>,
  bodySize: number,
}

type DecodedElementInCodeSection = {
  startLoc: Position,
  endLoc: Position,
  bodySize: number,
  code: Array<Instruction>,
  locals: Array<Valtype>,
};

type DecodedModuleMemory = Memory;
type DecodedModuleTable = Table;
type DecodedModuleGlobal = Global;

type State = {
  typesInModule: Array<FuncSig>,
  functionsInModule: Array<FuncType>,
  tablesInModule: Array<Table>,
  memoriesInModule: Array<Memory>,
  globalsInModule: Array<type>,

  funcBodiesInModule : Array<FuncBody>,
  exportsInModule: Array<ModuleExport>,

  elementsInExportSection: Array<DecodedElementInExportSection>,
  elementsInCodeSection: Array<DecodedElementInCodeSection>,
};

type DecoderOpts = {
  dump: boolean,
  ignoreDataSection: boolean,
  ignoreCodeSection: boolean,
  ignoreCustomNameSection: boolean,
  errorOnUnknownSection?: boolean,
};
