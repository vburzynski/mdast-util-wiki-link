import { Context, Handle } from 'mdast-util-to-markdown';
import safe from 'mdast-util-to-markdown/lib/util/safe.js';
import {Node, Parent} from 'unist'
import { WikiLinkNode } from './from-markdown.js';

interface ToMarkdownOptions {
  aliasDivider?: string;
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

  const handler: Handle = function handler(node: Node, _parent: Parent | null | undefined, context: Context) {
    const exit = context.enter('wikiLink');

    const wikiLink = node as WikiLinkNode;
    const nodeValue = safe(context, wikiLink.value, { before: '[', after: ']' });
    const nodeAlias = safe(context, wikiLink.data.alias, { before: '[', after: ']' });

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
