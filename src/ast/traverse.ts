// Copyright (c) 2023 Webassembly Runtime. All rights reserved.
import { createPath } from "./node-path";
import { unionTypesMap, nodeAndUnionTypes } from "./nodes";
import { debug, warn } from "../utils/logging/log";

// recursively walks the AST starting at the given node. The callback is invoked for
// and object that has a 'type' property.

function walk(context: NodePathContext<Node>, callback: TraverseCallback) {
  let stop = false;

  function innerWalk(
    context: NodePathContext<Node>,
    callback: TraverseCallback
  ) {
    if (stop) {
      debug("innerWalk stop")
      return;
    }

    const node = context.node;

    if (node === undefined) {
      warn("traversing with an empty context");
      return;
    }

    if (node._deleted === true) {
      return;
    }

    const path = createPath(context);
    callback(node.type, path);
    if (path.shouldStop) {
      stop = true;
      return;
    }

    Object.keys(node).forEach((prop: string) => {
      const value = node[prop];
      if (value === null || value === undefined) {
        return;
      }
      const valueAsArray = Array.isArray(value) ? value : [value];
      valueAsArray.forEach((childNode) => {
        if (typeof childNode.type === "string") {
          const childContext = {
            node: childNode,
            parentKey: prop,
            parentPath: path,
            shouldStop: false,
            inList: Array.isArray(value),
          };
          innerWalk(childContext, callback);
        }
      });
    });
  }

  innerWalk(context, callback);
}

const noop = () => {};

export function traverse(
  node: Node,
  visitors: Object,
  before: TraverseCallback = noop,
  after: TraverseCallback = noop
) {
  Object.keys(visitors).forEach((visitor) => {
    if (!nodeAndUnionTypes.includes(visitor)) {
      throw new Error(`Unexpected visitor ${visitor}`);
    }
  });

  const context: NodePathContext<Node> = {
    node,
    inList: false,
    shouldStop: false,
    parentPath: undefined,
    parentKey: undefined,
  };

  walk(context, (type: string, path: NodePath<Node>) => {
    if (typeof visitors[type] === "function") {
      before(type, path);
      // debug("walk type = " + type);
      visitors[type](path);
      after(type, path);
    }

    const unionTypes = unionTypesMap[type];
    if (!unionTypes) {
      throw new Error(`Unexpected node type ${type}`);
    }
    unionTypes.forEach((unionType : string) => {
      if (typeof visitors[unionType] === "function") {
        before(unionType, path);
        // debug("walk type = " + type + " -> unionTypes = " + unionType);
        visitors[unionType](path);
        after(unionType, path);
      }
    });
  });
}
