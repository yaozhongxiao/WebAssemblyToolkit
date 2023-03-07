(module
  (type (;0;) (func (param i32 i32) (result i32)))
  (func (;0;) (type 0) (param i32 i32) (result i32)
    local.get 0
    local.get 1
    call $inner_add)
  (func $inner_add (type 0) (param i32 i32) (result i32)
    local.get 0
    local.get 1
    i32.const 10
    drop
    i32.add)
  (export "add" (func 0)))
