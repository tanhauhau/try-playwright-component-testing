import fs from 'node:fs/promises';
import path from 'node:path';
import { parseAsync } from '@babel/core';
import traverse from '@babel/traverse';
import { createRequire } from 'node:module';

const testFile = path.join(__dirname, '../Component.test.tsx');
const require = createRequire(testFile);

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
  const result = {};
  for (const key in importMap) {
    if (set.has(key)) {
      result[key] = require.resolve(importMap[key]);
    }
  }
  console.log(result);
}

parse();
