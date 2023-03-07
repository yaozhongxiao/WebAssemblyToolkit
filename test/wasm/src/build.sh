
#!/bin/bash
# Copyright 2023. All rights reserved.
set -e

SCRIPT_DIR=$(cd "$(dirname "$0")"; pwd -P)

SRC_FILE=$1
if [ -z "${SRC_FILE}" ];then
  echo "missing source file to built!"
  exit -1
fi

FILE_NAME=${SRC_FILE%.*}
FILE_NAME=${FILE_NAME##*/}

clang $(< ${SCRIPT_DIR}/flags) ${SRC_FILE} -o ${FILE_NAME}.wasm 2>&1

wasm2wat ${FILE_NAME}.wasm -o ${FILE_NAME}.wat
