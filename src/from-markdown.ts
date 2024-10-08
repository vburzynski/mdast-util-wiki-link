import type { CompileContext, Token, Extension } from 'mdast-util-from-markdown';
import { FromMarkdownOptions, WikiLinkNode } from './types.js';
declare module 'mdast' {
  interface RootContentMap {
    wikiLink: WikiLinkNode;
  }

  interface PhrasingContentMap {
    wikiLink: WikiLinkNode;
  }
}

function fromMarkdown(opts: FromMarkdownOptions = {}): Extension {
  const permalinks = opts.permalinks ?? [];
  const defaultPageResolver = (name: string) => [name.replace(/ /g, '_').toLowerCase()];
  const pageResolver = opts.pageResolver ?? defaultPageResolver;
  const newClassName = opts.newClassName ?? 'new';
  const wikiLinkClassName = opts.wikiLinkClassName ?? 'internal';
  const defaultHrefTemplate = (permalink: string) => `#/page/${permalink}`;
  const hrefTemplate = opts.hrefTemplate ?? defaultHrefTemplate;
  let node: WikiLinkNode;

  function enterWikiLink(this: CompileContext, token: Token) {
    node = {
      type: 'wikiLink',
      value: '',
      data: {
        alias: '',
        permalink: '',
        exists: null,
      },
      children: [],
    };
    this.enter(node, token);
  }

  function exitWikiLinkAlias(this: CompileContext, token: Token) {
    const alias = this.sliceSerialize(token);
    const current = this.stack[this.stack.length - 1];
    (current as WikiLinkNode).data.alias = alias;
  }

  function exitWikiLinkTarget(this: CompileContext, token: Token) {
    const target = this.sliceSerialize(token);
    const current = this.stack[this.stack.length - 1];
    (current as WikiLinkNode).value = target;
  }

  function exitWikiLink(this: CompileContext, token: Token) {
    this.exit(token);
    const wikiLink = node;

    const pagePermalinks = pageResolver(wikiLink.value);
    const target = pagePermalinks.find((p) => permalinks.includes(p));
    const exists = target !== undefined;

    let permalink: string;
    if (exists) {
      permalink = target;
    } else {
      permalink = pagePermalinks[0] || '';
    }

    let displayName = wikiLink.value;
    if (wikiLink.data.alias) {
      displayName = wikiLink.data.alias;
    }

    let classNames = wikiLinkClassName;
    if (!exists) {
      classNames += ' ' + newClassName;
    }

    wikiLink.data.alias = displayName;
    wikiLink.data.permalink = permalink;
    wikiLink.data.exists = exists;

    wikiLink.data.hName = 'a';
    wikiLink.data.hProperties = {
      className: classNames,
      href: hrefTemplate(permalink),
    };
    wikiLink.data.hChildren = [
      {
        type: 'text',
        value: displayName,
      },
    ];
  }

  return {
    enter: {
      wikiLink: enterWikiLink,
    },
    exit: {
      wikiLinkTarget: exitWikiLinkTarget,
      wikiLinkAlias: exitWikiLinkAlias,
      wikiLink: exitWikiLink,
    },
  } as Extension;
}

export { fromMarkdown };
