# WARuntime (WebAssembly Runtime)

WARuntime aims to provides the webassembly toolkit, which includes
interpreter, binary dump, ast(abstract syntax tree) dump, ir() dump,
and others features.

## 1. WARuntime Integration
WARuntime can be integrated into your project easily by npm dependency.

TODO(zhongxiao.yzx): add integration tutorial later

## 2. CLI
The project can be downloaded and installed with the following command beforehand.
```
git clone git@github.com:yaozhongxiao/WebAssemblyToolkit.git

cd `pwd`/WebAssemblyToolkit

npm install
```

### wasmdump 
wasmdump used for WebAssembly binary format parsing and dumping
```
cd ${Project Root Directory}

npx ts-node src/cli/bin/wasmdump.ts test/wasm/hello-world.wasm

npx ts-node src/cli/bin/wasmdump.ts test/wasm/add.wasm
```

### astdump
astdump used for ast(abstract syntax tree) dumping for WebAssembly binary format and text format
```
cd ${Project Root Directory}

npx ts-node src/cli/bin/astdump.ts test/wasm/hello-world.wasm

npx ts-node src/cli/bin/astdump.ts test/wasm/add.wasm
```

### wasmrun 
wasmrun used for WebAssembly binary format parsing and execution.
```
cd ${Project Root Directory}

npx ts-node src/cli/bin/wasmrun.ts test/wasm/hello-world.wasm main 1
npx ts-node src/cli/bin/wasmrun.ts test/wasm/hello-world.wasm main 2

npx ts-node src/cli/bin/wasmrun.ts test/wasm/add.wasm add 12 21
```

### validate 
validate used for WebAssembly binary format validation
```
cd ${Project Root Directory}

npx ts-node src/cli/bin/validate.ts test/wasm/hello-world.wasm

npx ts-node src/cli/bin/validate.ts test/wasm/add.wasm
```


# Reference
[1].
[WebAssemblyToolkit : https://github.com/yaozhongxiao/WebAssemblyToolkit](https://github.com/yaozhongxiao/WebAssemblyToolkit)