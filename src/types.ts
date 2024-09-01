import type { ElementContent } from 'hast';
import { Data, Parent } from 'unist';

export interface ToMarkdownOptions {
  aliasDivider?: string;
}

export interface FromMarkdownOptions {
  permalinks?: string[];
  pageResolver?: (name: string) => string[];
  newClassName?: string;
  wikiLinkClassName?: string;
  hrefTemplate?: (permalink: string) => string;
}

type WikiLinkElementContent = ElementContent & {
  value: string;
};

interface WikiLinkHProperties {
  className: string;
  href: string;
  [key: string]: unknown;
}

interface WikiLinkData extends Data {
  exists: boolean | null;
  permalink: string;
  alias: string;
  hName?: string;
  hProperties?: WikiLinkHProperties;
  hChildren?: WikiLinkElementContent[];
}

export interface WikiLinkNode extends Parent {
  type: 'wikiLink';
  data: WikiLinkData;
  value: string;
}

