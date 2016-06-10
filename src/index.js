/* eslint no-use-before-define: [0], no-case-declarations: [0], no-param-reassign: [0] */

import { castArray, some, includes, reject, trim } from 'lodash/fp';
import postcss from 'postcss';
import parser from 'postcss-selector-parser';

const nodesAreEmpty = node => node.nodes.length === 0;

export const removeClasses = (classes, selector) => {
  const parseNode = node => {
    switch (node.type) {
      case 'root':
        node.nodes = reject(parseNode, node.nodes);
        return null;
      case 'selector':
        const didRemoveNodes = some(parseNode, node.nodes);
        if (didRemoveNodes) {
          node.empty();
        }
        return didRemoveNodes;
      case 'class':
        const shouldRemoveNode = includes(node.value, classes);
        return shouldRemoveNode;
      case 'pseudo':
        node.nodes = reject(parseNode, node.nodes);

        const argumentsIsEmpty = nodesAreEmpty(node);
        if (node.value === ':matches' || node.value === ':has') {
          return argumentsIsEmpty;
        } else if (node.value === ':not' && argumentsIsEmpty) {
          node.remove();
        }
        return false;
      case 'attribute':
      case 'combinator':
      case 'comment':
      case 'id':
      case 'nesting':
      case 'string':
      case 'tag':
      case 'universal':
        return false;
      default:
        throw new Error(`Unhandled type: ${node.type}`);
    }
  };

  const ast = parser(parseNode).process(selector).result;

  return trim(String(ast));
};

export default postcss.plugin('remove-classes', classes => root => {
  root.walkRules(rule => {
    const newSelector = removeClasses(castArray(classes), rule.selector);
    if (!newSelector) {
      rule.remove();
    } else if (newSelector !== rule.selector) {
      rule.selector = newSelector;
    }
  });
});
