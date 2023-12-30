import React from 'react';
import { test, expect } from './custom-ct';
import Counter from './Component.tsx';

test.only('increment for a html elements', async ({ page, mount }) => {
  await page.pause();

  const component = await mount(
    <div>
      <button>4444</button>
    </div>
  );

  await expect(component).toContainText('4444');
});

test('increment for a component', async ({ page, mount }) => {
  await page.pause();

  const component = await mount(
    <div>
      <Counter />
    </div>
  );

  await expect(component).toContainText('0');

  await component.getByRole('button').click();

  await expect(component).toContainText('1');
});

test('two counter buttons', async ({ mount, page }) => {
  const component = await mount(
    <div>
      <Counter id='button1' />
      <Counter id='button2' />
    </div>
  );

  await page.pause();

  await expect(component).toContainText('0');

  await component.getByTestId('button1').click();

  await expect(component.getByTestId('button1')).toContainText('1');
});
