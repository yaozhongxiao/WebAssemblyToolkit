// Copyright (c) 2023 WebAssembly Toolkit. All rights reserved.

#ifndef VMRUNTIME_UTILS_H_
#define VMRUNTIME_UTILS_H_

#ifdef __cplusplus
#define EXTERN_C extern "C"
#define EXTERN_C_BEGIN extern "C" {
#define EXTERN_C_END }
#else
#define EXTERN_C       /* Nothing */
#define EXTERN_C_BEGIN /* Nothing */
#define EXTERN_C_END   /* Nothing */
#endif

#define WASM_KEEPALIVE __attribute__((used))
#define WASM_EXPORT(name) EXTERN_C __attribute__((export_name(name)))
#define WASM_IMPORT(mod, name) \
  __attribute__((import_module(mod), import_name(name)))

#endif  // VMRUNTIME_UTILS_H_
