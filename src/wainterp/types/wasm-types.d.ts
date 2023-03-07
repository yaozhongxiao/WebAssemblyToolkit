// Copyright (c) 2023 Webassembly Toolkit. All rights reserved.

/* eslint no-unused-vars: off */

// import { type CompiledModule } from "../compile/module";
declare class CompiledModule {
  _ir: IR;
  _ast: Program; // FIXME(): do we still need the AST here?

  exports: Array<CompiledModuleExportDescr>;
  imports: Array<CompiledModuleImportDescr>;
}

// import { type Instance } from "../instance";
declare class Instance {
  exports: { [key: string]: any };
  executeStartFunc: (ir: IR, offset: number) => void;
}

type CompiledModuleExportDescr = {
  name: string,
  kind: string,
};

type CompiledModuleImportDescr = {
  module: string,
  name: string,
  kind: string,
};

type MemoryDescriptor = {
  initial: number,
  maximum?: number,
};

interface MemoryInstance {
  buffer: ArrayBuffer;
}

type TableDescriptor = {
  element: string,
  initial: number,
  maximum?: number,
};

type ImportObject = {
  __internalInstanceOptions: InternalInstanceOptions,
};

type InstansitatedInstanceAndModule = {
  instance: Instance,
  module: CompiledModule,
};

type InternalInstanceOptions = {
  checkForI64InSignature: boolean,
  returnStackLocal: boolean,
};
