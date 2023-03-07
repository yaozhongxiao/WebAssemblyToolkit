// Copyright (c) 2023 Webassembly Toolkit. All rights reserved.

/* eslint no-unused-vars: off */

type Byte = number;

type U32Literal = NumberLiteral;
type Typeidx = U32Literal;
type Funcidx = U32Literal;
type Tableidx = U32Literal;
type Memidx = U32Literal;
type Globalidx = U32Literal;
type Localidx = U32Literal;
type Labelidx = U32Literal;

type Index =
  | Typeidx
  | Funcidx
  | Tableidx
  | Memidx
  | Globalidx
  | Localidx
  | Labelidx
  | Identifier; // WAST shorthand

type SignatureOrTypeRef = Index | Signature;

type LongNumber = {
  high: number,
  low: number,
};

type Position = {
  line: number,
  column: number,
};

type SourceLocation = {
  start: Position,
  end?: Position,
};
