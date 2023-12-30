import { jsx } from 'react/jsx-runtime';
import { createRoot } from 'react-dom/client';

let componentLoaderMapping;

window.setComponentLoaderMapping = function (mapping) {
  componentLoaderMapping = mapping;
}

// const componentLoaderMapping = {
//   Counter: async () => (await import('../Component')).default,
// }
const componentMapping = {};

const root = createRoot(document.querySelector('#root'));

if (import.meta.hot) {
  import.meta.hot.on('custom-ct:mount', (data) => {
    console.log(data.data);
    handleMount(data.data);
  })
}

async function handleMount(reactNode) {
  await loadComponentNeeded(reactNode);
  const cleanedNode = cleanupNode(reactNode);
  root.render(cleanedNode);
}

async function loadComponentNeeded(reactNode) {
  if (typeof reactNode !== 'object') return reactNode;
  let { type, props } = reactNode;
  if (type.startsWith('Component:')) {
    const componentName = type.slice('Component:'.length);
    componentMapping[componentName] = await componentLoaderMapping[componentName]();
  }

  if (Array.isArray(props.children)) {
    await Promise.all(props.children.map(node => loadComponentNeeded(node)));
  } else {
    await loadComponentNeeded(props.children);
  }
}

function cleanupNode(reactNode) {
  if (typeof reactNode !== 'object') return reactNode;

  let { type, props } = reactNode;
  if (type.startsWith('Component:')) {
    const componentName = type.slice('Component:'.length);
    type = componentMapping[componentName];
  }

  if (Array.isArray(props.children)) {
    props.children = props.children.map(node => cleanupNode(node));
  } else {
    props.children = cleanupNode(props.children);
  }
  return jsx(type, props);
}