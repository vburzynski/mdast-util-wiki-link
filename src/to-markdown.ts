import { State, Handle, Options, Unsafe, ConstructName } from 'mdast-util-to-markdown';
import {Node, Parent} from 'unist'
import { WikiLinkNode } from './types.js';
import { ToMarkdownOptions } from './types.js';

declare module 'mdast-util-to-markdown' {
  interface ConstructNameMap {
    wikiLink: 'wikiLink'
  }
}

function toMarkdown(opts: ToMarkdownOptions = {}) : Options {
  const aliasDivider = opts.aliasDivider ?? ':';

  const unsafe = [
    {
      character: '[',
      inConstruct: ['phrasing', 'label', 'reference'] as ConstructName[],
    },
    {
      character: ']',
      inConstruct: ['label', 'reference'] as ConstructName[],
    },
  ] satisfies Unsafe[];

  const handler: Handle = function handler(node: Node, _parent: Parent | null | undefined, state: State) {
    const exit = state.enter('wikiLink' as ConstructName);

    const wikiLink = node as WikiLinkNode;
    const nodeValue = state.safe(wikiLink.value, { before: '[', after: ']' });
    const nodeAlias = state.safe(wikiLink.data.alias, { before: '[', after: ']' });

    let value;
    if (nodeAlias !== nodeValue) {
      value = `[[${nodeValue}${aliasDivider}${nodeAlias}]]`;
    } else {
      value = `[[${nodeValue}]]`;
    }

    exit();

    return value;
  }

  return {
    unsafe: unsafe,
    handlers: {
      wikiLink: handler,
    },
  };
}

export { toMarkdown };
