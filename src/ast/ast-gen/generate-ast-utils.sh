#!/usr/bin/env bash
set -e

SCRIPT_DIR=$($(cd $(dirname $0));pwd -P)

CUR_DIR=`pwd`
GEN_DIR=${CUR_DIR}/dist
AST_DIR=${SCRIPT_DIR}/..

if [ ! -d ${GEN_DIR}/types ];then
  mkdir -p ${GEN_DIR}/types
fi

node ${AST_DIR}/ast-gen/generateTypeDefinitions.js > ${GEN_DIR}/types/nodes.d.ts
node ${AST_DIR}/ast-gen/generateNodeUtils.js > ${GEN_DIR}/nodes.ts

npx prettier --write ${GEN_DIR}/types/nodes.d.ts
npx prettier --write ${GEN_DIR}/nodes.ts
