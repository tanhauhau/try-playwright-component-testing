import { createServer } from 'vite';
import path from 'node:path';
import fs from 'fs/promises';
import component from './component';

async function init({ ctPort }) {
  const rootFolder = path.join(__dirname, '../playwright');
  const entryFilePath = path.join(rootFolder, 'index.tsx');
  const initFilePath = path.join(__dirname, 'init.ts');

  const server = await createServer({
    // any valid user config options, plus `mode` and `configFile`
    configFile: false,
    root: rootFolder,
    server: {
      port: ctPort,
    },
    plugins: [
      {
        name: 'custom-component-testing-vite-plugin',
        async load(id) {
          if (id === entryFilePath) {
            const code = await fs.readFile(id, 'utf-8');
            return `import "${initFilePath}"` + code;
          }
          return null;
        },
      },
    ],
  });
  await server.listen();

  let i = 0;
  setInterval(() => {
    server.ws.send('custom-ct:mount', {
      data: prepareForSerialisation(component),
    });
  }, 1000);
}

init({ ctPort: 3100 });

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
