import React from 'react';
import { test as baseTest, expect as baseExpect } from '@playwright/test';
import { Locator } from 'playwright';
import { createServer } from 'vite'
import path from 'node:path';
import fs from 'fs/promises';
import { parseAsync } from '@babel/core';
import traverse from '@babel/traverse';
import { createRequire } from 'node:module';

const testFile = path.join(__dirname, '../Component.test.tsx');
const require = createRequire(testFile);

type Option = {
  ctPort?: number;
  // ctTemplateDir?: string;
  // ctCacheDir?: string;
  // ctViteConfig?: InlineConfig | (() => Promise<InlineConfig>);
}

export const test = baseTest.extend<Option & {
  mount: (node: React.ReactNode) => Promise<Locator>
}>({
  ctPort: [8000, { option: true }],
  mount: async ({ page, ctPort }, use) => {
    const componentMapping = await parse();

    const rootFolder = path.join(__dirname, '../playwright');
    const entryFilePath = path.join(rootFolder, 'index.tsx');
    const initFilePath = path.join(__dirname, 'init.ts');

    // factory method on create mount fixture
    // setup
    // TODO:
    // - setup vite dev server
    // - visit the page
    const server = await createServer({
      // any valid user config options, plus `mode` and `configFile`
      configFile: false,
      root: path.join(__dirname, '../playwright'),
      server: {
        port: ctPort,
      },
      plugins: [{
        name: 'custom-component-testing-vite-plugin',
        async load(id) {
          if (id === entryFilePath) {
            const code = await fs.readFile(id, 'utf-8');
            return `import "${initFilePath}";` +
              `window.setComponentLoaderMapping(${componentMapping});`
              + code;
          }
          return null;
        }
      }]
    })
    await server.listen()
    await page.goto(`http://localhost:${ctPort}`);

    async function mount(node: React.ReactNode) {
      // TODO:
      // - serialise the node to a json
      // - send the node over to the web page
      // - // when the page receives, it should mount it on the id="root" element
      // return a locator
      server.ws.send('custom-ct:mount', { data: prepareForSerialisation(node) });

      return page.locator('#root');
    }
    await use(mount);
    // cleanup

    // TODO:
    // - unmount the node from the page

    await server.close();
  },
});

async function parse() {
  const content = await fs.readFile(testFile, 'utf-8');
  const ast = await parseAsync(content, {
    filename: testFile,
    parserOpts: {
      plugins: ['jsx', 'typescript'],
    },
  });
  const importMap = {};
  const set = new Set();
  traverse(ast, {
    ImportDefaultSpecifier(path) {
      const name = path.node.local.name;
      const sourcePath = path.parentPath.node.source.value;
      importMap[name] = sourcePath;
    },
    JSXIdentifier(path) {
      set.add(path.node.name);
    }
  });
  let result = '{';
  for (const key in importMap) {
    if (set.has(key)) {
      result += `"${key}": async () => (await import("${require.resolve(importMap[key])}")).default,`;
    }
  }
  result += '}';
  return result;
}

function prepareForSerialisation(component) {
  if (typeof component !== 'object') return component;

  let { type, props } = component;
  props = { ...props };

  if (typeof type !== 'string') {
    // DO something
    type = `Component:${type.name}`
  }
  if (Array.isArray(props.children)) {
    props.children = props.children.map((node) =>
      prepareForSerialisation(node)
    );
  } else {
    props.children = prepareForSerialisation(
      props.children
    );
  }
  return { type, props };
}


export const expect = baseExpect;
