import assert from 'assert';
import { describe, test } from 'mocha';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toMarkdown } from 'mdast-util-to-markdown';
import { visit } from 'unist-util-visit';
import { syntax } from 'micromark-extension-wiki-link';

import * as wikiLink from '../src/index.js';
import { WikiLinkNode } from '../src/from-markdown.js';

describe('mdast-util-wiki-link', () => {
  describe('fromMarkdown', () => {
    test('parses a wiki link that has a matching permalink', () => {
      const ast = fromMarkdown('[[Wiki Link]]', {
        extensions: [syntax()],
        mdastExtensions: [
          wikiLink.fromMarkdown({
            permalinks: ['wiki_link'],
          }),
        ],
      });

      let visited = false;
      visit(ast, 'wikiLink', (node: WikiLinkNode) => {
        visited = true;
        assert.equal(node.data.exists, true);
        assert.equal(node.data.permalink, 'wiki_link');
        assert.equal(node.data.hName, 'a');
        assert.equal(node.data.hProperties?.className, 'internal');
        assert.equal(node.data.hProperties?.href, '#/page/wiki_link');
        assert.equal(node.data.hChildren?.[0].value, 'Wiki Link');
      });
      assert.equal(visited, true);
    });

    test('parses a wiki link that has no matching permalink', () => {
      const ast = fromMarkdown('[[New Page]]', {
        extensions: [syntax()],
        mdastExtensions: [
          wikiLink.fromMarkdown({
            permalinks: [],
          }),
        ],
      });

      let visited = false
      visit(ast, 'wikiLink', (node: WikiLinkNode) => {
        visited = true;
        assert.equal(node.data.exists, false);
        assert.equal(node.data.permalink, 'new_page');
        assert.equal(node.data.hName, 'a');
        assert.equal(node.data.hProperties?.className, 'internal new');
        assert.equal(node.data.hProperties?.href, '#/page/new_page');
        assert.equal(node.data.hChildren?.[0].value, 'New Page');
      });
      assert.equal(visited, true);
    });

    test('handles wiki links with aliases', () => {
      const ast = fromMarkdown('[[Real Page:Page Alias]]', {
        extensions: [syntax()],
        mdastExtensions: [
          wikiLink.fromMarkdown({
            permalinks: [],
          }),
        ],
      });

      let visited = false;
      visit(ast, 'wikiLink', (node: WikiLinkNode) => {
        visited = true;
        assert.equal(node.data.exists, false);
        assert.equal(node.data.permalink, 'real_page');
        assert.equal(node.data.hName, 'a');
        assert.equal(node.data.alias, 'Page Alias');
        assert.equal(node.value, 'Real Page');
        assert.equal(node.data.hProperties?.className, 'internal new');
        assert.equal(node.data.hProperties?.href, '#/page/real_page');
        assert.equal(node.data.hChildren?.[0].value, 'Page Alias');
      });
      assert.equal(visited, true);
    });

    describe('configuration options', () => {
      test('uses pageResolver', () => {
        const identity = (name: string) => [name];

        const ast = fromMarkdown('[[A Page]]', {
          extensions: [syntax()],
          mdastExtensions: [
            wikiLink.fromMarkdown({
              pageResolver: identity,
              permalinks: ['A Page'],
            }),
          ],
        });

        let visited = false;
        visit(ast, 'wikiLink', (node: WikiLinkNode) => {
          visited = true;
          assert.equal(node.data.exists, true);
          assert.equal(node.data.permalink, 'A Page');
          assert.equal(node.data.hProperties?.href, '#/page/A Page');
        });
        assert.equal(visited, true);
      });

      test('uses newClassName', () => {
        const ast = fromMarkdown('[[A Page]]', {
          extensions: [syntax()],
          mdastExtensions: [
            wikiLink.fromMarkdown({
              newClassName: 'new_page',
            }),
          ],
        });

        let visited = false;
        visit(ast, 'wikiLink', (node: WikiLinkNode) => {
          visited = true;
          assert.equal(node.data.hProperties?.className, 'internal new_page');
        });
        assert.equal(visited, true);
      });

      test('uses hrefTemplate', () => {
        const ast = fromMarkdown('[[A Page]]', {
          extensions: [syntax()],
          mdastExtensions: [
            wikiLink.fromMarkdown({
              hrefTemplate: (permalink: string | undefined) => permalink ?? '',
            }),
          ],
        });

        let visited = false;
        visit(ast, 'wikiLink', (node: WikiLinkNode) => {
          visited = true;
          assert.equal(node.data.hProperties?.href, 'a_page');
        });
        assert.equal(visited, true);
      });

      test('uses wikiLinkClassName', () => {
        const ast = fromMarkdown('[[A Page]]', {
          extensions: [syntax()],
          mdastExtensions: [
            wikiLink.fromMarkdown({
              wikiLinkClassName: 'wiki_link',
              permalinks: ['a_page'],
            }),
          ],
        });

        let visited = false;
        visit(ast, 'wikiLink', (node: WikiLinkNode) => {
          visited = true;
          assert.equal(node.data.hProperties?.className, 'wiki_link');
        });
        assert.equal(visited, true);
      });
    });
  });

  describe('toMarkdown', () => {
    test('stringifies wiki links', () => {
      const ast = fromMarkdown('[[Wiki Link]]', {
        extensions: [syntax()],
        mdastExtensions: [wikiLink.fromMarkdown()],
      });

      const stringified = toMarkdown(ast, { extensions: [wikiLink.toMarkdown()] }).trim();

      assert.equal(stringified, '[[Wiki Link]]');
    });

    test('stringifies aliased wiki links', () => {
      const ast = fromMarkdown('[[Real Page:Page Alias]]', {
        extensions: [syntax()],
        mdastExtensions: [wikiLink.fromMarkdown()],
      });

      const stringified = toMarkdown(ast, { extensions: [wikiLink.toMarkdown()] }).trim();

      assert.equal(stringified, '[[Real Page:Page Alias]]');
    });

    describe('configuration options', () => {
      test('uses aliasDivider', () => {
        const ast = fromMarkdown('[[Real Page:Page Alias]]', {
          extensions: [syntax()],
          mdastExtensions: [wikiLink.fromMarkdown()],
        });

        const stringified = toMarkdown(ast, {
          extensions: [wikiLink.toMarkdown({ aliasDivider: '|' })],
        }).trim();

        assert.equal(stringified, '[[Real Page|Page Alias]]');
      });
    });
  });
});
