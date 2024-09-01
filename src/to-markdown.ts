import { State, Handle } from 'mdast-util-to-markdown';
import {Node, Parent} from 'unist'
import { WikiLinkNode } from './from-markdown.js';

interface ToMarkdownOptions {
  aliasDivider?: string;
}

declare module 'mdast-util-to-markdown' {
  interface ConstructNameMap {
    wikiLink: 'wikiLink'
  }
}

function toMarkdown(opts: ToMarkdownOptions = {}) {
  const aliasDivider = opts.aliasDivider ?? ':';

  const unsafe = [
    {
      character: '[',
      inConstruct: ['phrasing', 'label', 'reference'],
    },
    {
      character: ']',
      inConstruct: ['label', 'reference'],
    },
  ];

  const handler: Handle = function handler(node: Node, _parent: Parent | null | undefined, state: State) {
    const exit = state.enter('wikiLink');

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
