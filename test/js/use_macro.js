const { define, assert } = require("./macro");

// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

var LABEL_POP;

define(
  LABEL_POP,
  () => `
    console.log(xxx);
  `
);
