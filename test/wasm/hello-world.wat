(module
  (type (;0;) (func (param i32)))
  (type (;1;) (func))
  (type (;2;) (func (param i32) (result i32)))
  (type (;3;) (func (param i32 i32) (result i32)))
  (import "env" "printstr" (func $printstr (type 2)))
  (func $iadd (type 3) (param i32 i32) (result i32)
    local.get 0
    local.get 1
    i32.add)
  (func $hello (type 2) (param i32) (result i32)
    (local i32)
    i32.const 1
    local.set 1
    block  ;; label = @1
      block  ;; label = @2
        local.get 0
        local.get 1
        i32.eq
        br_if 0 (;@2;)
        i32.const 1037
        local.set 1
        local.get 1
        call $printstr
        br 1 (;@1;)
        drop
      end
      i32.const 1024
      local.set 1
      local.get 1
      call $printstr
      drop
    end
    local.get 0
    i32.const 100
    call $iadd
    return)
  (memory (;0;) 1)
  (global $__stack_pointer (mut i32) (i32.const 2064))
  (export "memory" (memory 0))
  (export "main" (func $hello))
  (export "iadd" (func $iadd))
  (export "stack_pointer" (global $__stack_pointer))
  (data $.rodata (i32.const 1024) "hello world!\00see you again!\00"))
