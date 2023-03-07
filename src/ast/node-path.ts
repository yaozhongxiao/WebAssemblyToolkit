// Copyright (c) 2023 Webassembly Runtime. All rights reserved.

// import { assert } from "mamacro";
import {assert} from "../utils/macro/assert"

function findParent(
  { parentPath }: NodePathContext<Node>,
  cb: NodePathMatcher
): Node | undefined {
  if (parentPath == null || parentPath == undefined) {
    throw new Error("node is root");
  }

  let currentPath = parentPath;

  while (cb(currentPath) !== false) {
    // Hit the root node, stop
    if (currentPath.parentPath == null || currentPath.parentPath == undefined) {
      return undefined;
    }
    currentPath = currentPath.parentPath;
  }
  return currentPath.node;
}

function insertBefore(context: NodePathContext<Node>, newNode : Node) {
  return insert(context, newNode);
}

function insertAfter(context: NodePathContext<Node>, newNode : Node) {
  return insert(context, newNode, 1);
}

function insert(
  { node, inList, parentPath, parentKey }: NodePathContext<Node>,
  newNode: Node,
  indexOffset: number = 0
) {
  assert(inList, "insert can only be used for nodes that are within lists");
  assert(parentPath != null, "Can not remove root node");

  const parentList = parentPath?.node[parentKey as string];
  const indexInList = parentList.findIndex((n : Node) => n === node);
  parentList.splice(indexInList + indexOffset, 0, newNode);
}

function remove({ node, parentKey, parentPath }: NodePathContext<Node>) {
  assert(parentPath != null, "Can not remove root node");

  const parentNode: Node = parentPath!.node;
  const parentProperty = parentNode[parentKey as string];
  if (Array.isArray(parentProperty)) {
    parentNode[parentKey as string] = parentProperty.filter((n) => n !== node);
  } else {
    delete parentNode[parentKey as string];
  }

  node._deleted = true;
}

function stop(context: NodePathContext<Node>) {
  context.shouldStop = true;
}

function replaceWith(context: NodePathContext<Node>, newNode: Node) {
  assert(context.parentPath != undefined, "Can not replaceWith root node");

  const parentNode = context.parentPath!.node;
  const parentProperty = parentNode[context.parentKey as string];
  if (Array.isArray(parentProperty)) {
    const indexInList = parentProperty.findIndex((n) => n === context.node);
    parentProperty.splice(indexInList, 1, newNode);
  } else {
    parentNode[context.parentKey as string] = newNode;
  }
  context.node._deleted = true;
  context.node = newNode;
}

// bind the context to the first argument of node operations
function bindNodeOperations(
  operations: Object,
  context: NodePathContext<Node>
) : NodePathOperations {
  const keys = Object.keys(operations);
  const boundOperations = {} as NodePathOperations;
  keys.forEach((key) => {
    boundOperations[key] = operations[key].bind(null, context);
  });
  return boundOperations;
}

function createPathOperations(
  context: NodePathContext<Node>
): NodePathOperations {
  return bindNodeOperations(
    {
      findParent,
      replaceWith,
      remove,
      insertBefore,
      insertAfter,
      stop,
    },
    context
  );
}

export function createPath(context: NodePathContext<Node>): NodePath<Node> {
  const path = {
    ...context,
  };
  Object.assign(path, createPathOperations(path));
  return path as NodePath<Node>;
}
