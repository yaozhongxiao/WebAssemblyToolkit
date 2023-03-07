#!/bin/bash
# Copyright (c) 2023 Webassembly Runtime. All rights reserved.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")"; pwd -P)"
WARUNIME_HOME=${SCRIPT_DIR}/..
TESTING_HOME=${WARUNIME_HOME}/test

cd ${WARUNIME_HOME}

npm run build
npx ts-node src/cli/bin/wasmrun.ts test/wasm/hello-world.wasm main 1
npx ts-node src/cli/bin/wasmrun.ts test/wasm/hello-world.wasm main 2
npx ts-node src/cli/bin/astdump.ts test/wasm/hello-world.wasm
npx ts-node src/cli/bin/validate.ts test/wasm/hello-world.wasm
npx ts-node src/cli/bin/wasmdump.ts test/wasm/hello-world.wasm

npx ts-node src/cli/bin/wasmrun.ts test/wasm/add.wasm add 12 21
npx ts-node src/cli/bin/astdump.ts test/wasm/add.wasm
npx ts-node src/cli/bin/validate.ts test/wasm/add.wasm
npx ts-node src/cli/bin/wasmdump.ts test/wasm/add.wasm

echo ""
echo "all tests has passed!"